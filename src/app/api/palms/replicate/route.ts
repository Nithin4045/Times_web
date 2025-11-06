import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const config = {
  api: { bodyParser: false },
};

function safeStringify(v: unknown) {
  try { return JSON.stringify(v); } catch { return String(v); }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const dynamicParams = true;

export async function POST(request: NextRequest) {
  const apiStartTime = performance.now();
  const apiStartTimestamp = new Date().toISOString().split('T')[1].split('.')[0] + '.' + 
                           new Date().getMilliseconds().toString().padStart(3, '0');
  
  console.log(`🕐 [replicate] API START: ${apiStartTimestamp}`);

  let job_id: number | null = null;

  try {
    // Check content type and parse accordingly
    const contentType = request.headers.get('content-type') || '';
    console.log("[replicate] Content-Type:", contentType);

    let input_type = "";
    let user_id_str = "";
    let field_map_str = "";
    let paper_id_str = "";
    let mcq_s_str = "";

    if (contentType.includes('application/json')) {
      // Handle JSON body
      const body = await request.json();
      console.log("[replicate] Received JSON body");
      input_type = body.input_type || "";
      user_id_str = String(body.user_id || "");
      field_map_str = typeof body.field_map === 'string' ? body.field_map : JSON.stringify(body.field_map || {});
      paper_id_str = body.paper_id || "";
      mcq_s_str = body.mcq_s || "";
    } else {
      // Handle FormData
      const formData = await request.formData();
      console.log("[replicate] Received FormData");
      input_type = (formData.get("input_type") as string) || "";
      user_id_str = (formData.get("user_id") as string) || "";
      field_map_str = (formData.get("field_map") as string) || "";
      paper_id_str = (formData.get("paper_id") as string) || "";
      mcq_s_str = (formData.get("mcq_s") as string) || "";
    }

    console.log("[replicate] 📥 Received data:");
    console.log("  - input_type:", input_type);
    console.log("  - user_id:", user_id_str);
    console.log("  - paper_id:", paper_id_str);

    if (!input_type || !user_id_str || !field_map_str) {
      console.log("[replicate] ❌ Missing required fields");
      return NextResponse.json({ error: "Missing input data" }, { status: 400 });
    }

    const user_id = Number(user_id_str);
    if (!Number.isFinite(user_id)) {
      return NextResponse.json({ error: "Invalid user_id" }, { status: 400 });
    }

    const base = process.env.PYTHON_SERVER || "";
    if (!base || !/^https?:\/\//i.test(base)) {
      const msg = "PYTHON_SERVER env is missing or invalid (must be absolute URL)";
      console.error("[replicate]", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const pythonURL = `${base.replace(/\/+$/, "")}/process/process`;
    console.log("[replicate] Python URL:", pythonURL);

    const initial_request_data = {
      input_type,
      user_id,
      paper_id: paper_id_str,
      source: "replicate-ui",
    };

    const created = await prisma.generate_jobs.create({
      data: {
        fileName: paper_id_str || "",
        user_id,
        input_type,
        request_data: safeStringify(initial_request_data),
        response_data: "",
        status: "started",
        api_endpoint: "/api/palms/replicate",
      },
    });
    job_id = created.id;

    const request_data_with_job = {
      ...initial_request_data,
      job_id,
    };

    await prisma.generate_jobs.update({
      where: { id: job_id },
      data: { request_data: safeStringify(request_data_with_job) },
    });

    const pyForm = new FormData();
    pyForm.append("input_type", input_type);
    pyForm.append("user_id", String(user_id));
    pyForm.append("field_map", field_map_str);
    pyForm.append("job_id", String(job_id));
    if (paper_id_str) pyForm.append("paper_id", paper_id_str);
    if (mcq_s_str) pyForm.append("mcq_s", mcq_s_str);

    console.log("[replicate] 📤 Sending to Python server:", pythonURL);
    
    const pythonCallStartTime = performance.now();
    const pythonCallStartTimestamp = new Date().toISOString().split('T')[1].split('.')[0] + '.' + 
                                    new Date().getMilliseconds().toString().padStart(3, '0');

    fetch(pythonURL, { method: "POST", body: pyForm })
      .then(async (r) => {
        const pythonCallEndTime = performance.now();
        const pythonCallEndTimestamp = new Date().toISOString().split('T')[1].split('.')[0] + '.' + 
                                      new Date().getMilliseconds().toString().padStart(3, '0');
        const pythonCallDuration = pythonCallEndTime - pythonCallStartTime;
        
        console.log(`🕐 [replicate] PYTHON CALL START: ${pythonCallStartTimestamp}`);
        console.log(`🕐 [replicate] PYTHON CALL END: ${pythonCallEndTimestamp} - Duration: ${pythonCallDuration.toFixed(2)} ms`);
        
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          throw new Error(`Python kickoff failed ${r.status}: ${text || r.statusText}`);
        }
      })
      .catch(async (netErr) => {
        const pythonCallEndTime = performance.now();
        const pythonCallDuration = pythonCallEndTime - pythonCallStartTime;
        console.error(`🕐 [replicate] PYTHON CALL FAILED: Duration: ${pythonCallDuration.toFixed(2)} ms`);
        console.error("[replicate] Python kickoff failed:", netErr?.message || netErr);
      });

    const apiEndTime = performance.now();
    const apiEndTimestamp = new Date().toISOString().split('T')[1].split('.')[0] + '.' + 
                           new Date().getMilliseconds().toString().padStart(3, '0');
    const apiDuration = apiEndTime - apiStartTime;
    
    console.log(`🕐 [replicate] API END: ${apiEndTimestamp} - Duration: ${apiDuration.toFixed(2)} ms`);

    return NextResponse.json(
      { success: true, message: "Job started", job_id },
      { 
        status: 202,
        headers: {
          "x-api-duration-ms": apiDuration.toFixed(2)
        }
      }
    );
  } catch (err: any) {
    console.error("[replicate] Route exception:", err);

    if (job_id) {
      try {
        await prisma.generate_jobs.update({
          where: { id: job_id },
          data: {
            status: "error",
            response_data: safeStringify({
              error: "Route setup exception",
              detail: String(err?.message || err),
            }),
          },
        });
      } catch {}
    }

    return NextResponse.json(
      { error: "Failed to start job", detail: String(err?.message || err), job_id },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("user_id");
    const q = (searchParams.get("q") || "").trim(); // optional search query

    const userId =
      userIdParam !== null && userIdParam.trim() !== ""
        ? Number(userIdParam)
        : null;

    if (userId === null || Number.isNaN(userId)) {
      return new NextResponse("Missing or invalid user_id", { status: 400 });
    }

    console.log(`📥 Incoming request for user_id=${userId} (q='${q}')`);

    // Fetch all non-deleted questions for user from replicated_questions table
    const allQuestions = await prisma.replicated_questions.findMany({
      where: { user_id: userId, deleted: 0 },
      orderBy: [{ job_id: "desc" }, { id: "asc" }],
      select: {
        id: true,
        parent_id: true,
        paper_id: true,
        question_id: true,
        question: true,
        options: true,
        correct_ans: true,
        applied_edits: true,
        solution: true,
        prompt: true,
        job_id: true,
        created_at: true,
      },
    });

    console.log(`🔎 Fetched ${allQuestions.length} total question rows from replicated_questions for user ${userId}`);

    // Group by job_id
    const groupedByJob = new Map<number, any[]>();
    for (const row of allQuestions) {
      const jobId = row.job_id;
      if (!groupedByJob.has(jobId)) {
        groupedByJob.set(jobId, []);
      }
      groupedByJob.get(jobId)!.push(row);
    }

    console.log(`📊 Grouped into ${groupedByJob.size} jobs`);

    // Process each job group
    const result: any[] = [];

    for (const [jobId, questions] of groupedByJob) {
      // Build map by id for this job
      const nodeMap: Record<number, any> = {};
      for (const row of questions) {
        nodeMap[row.id] = {
          ...row,
          id: row.id,
          parent_id: row.parent_id,
          children: [],
        };
      }

      // Attach nodes to parents within this job
      for (const key of Object.keys(nodeMap)) {
        const n = nodeMap[Number(key)];
        if (n.parent_id !== null && n.parent_id in nodeMap) {
          nodeMap[n.parent_id].children.push(n);
        }
      }

      // Collect root nodes (parent_id == null) for this job
      const roots = Object.values(nodeMap).filter((n: any) => n.parent_id === null);

      // Normalizer that converts options & applied_edits
      function normalizeNode(n: any): any {
        const clone: any = {
          id: n.id,
          parent_id: n.parent_id,
          paper_id: n.paper_id,
          question_id: n.question_id,
          question: n.question,
          options: n.options,
          correct_ans: n.correct_ans,
          applied_edits: n.applied_edits ?? null,
          solution: n.solution ?? null,
          prompt: n.prompt ?? null,
          job_id: n.job_id,
          created_at: n.created_at,
          children: [],
        };

        // Ensure options is an array (if stored as JSON string)
        if (typeof clone.options === "string") {
          try {
            const parsed = JSON.parse(clone.options || "[]");
            clone.options = Array.isArray(parsed) ? parsed : clone.options;
          } catch {
            // leave as-is
          }
        }

        // Normalize applied_edits to an array if it is a JSON-string or comma string
        if (clone.applied_edits && typeof clone.applied_edits === "string") {
          try {
            const parsed = JSON.parse(clone.applied_edits);
            if (Array.isArray(parsed)) clone.applied_edits = parsed.map(String);
            else clone.applied_edits = String(clone.applied_edits).split(",").map(s => s.trim()).filter(Boolean);
          } catch {
            clone.applied_edits = String(clone.applied_edits).split(",").map(s => s.trim()).filter(Boolean);
          }
        }

        // recursively normalize children
        if (Array.isArray(n.children) && n.children.length > 0) {
          clone.children = n.children.map((c: any) => normalizeNode(c));
        } else {
          clone.children = [];
        }

        return clone;
      }

      // Normalize all root questions for this job
      const normalizedRoots = roots.map((r: any) => normalizeNode(r));
      
      // Add to result - each root becomes a separate entry with job_id
      for (const root of normalizedRoots) {
        result.push(root);
      }
    }

    console.log(`✅ Returning ${result.length} root questions across ${groupedByJob.size} jobs`);

    return NextResponse.json(result);

  } catch (err) {
    console.error("❌ Error fetching AI questions:", err);
    return new NextResponse("Error fetching data", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { isTransformation, questionId, changes, statusOnly, id, status } = body;

    console.log("🛠️ PATCH updating question");

    // Validate changes object
    if (!changes || typeof changes !== 'object') {
      return new NextResponse("Invalid request: 'changes' is missing or malformed", { status: 400 });
    }

    // Build update data
    const updateData: any = {
      question: changes.question || '',
      options: typeof changes.options === 'string'
        ? changes.options
        : JSON.stringify(changes.options || []),
      correct_ans: changes.correct_ans || '',
    };

    if (isTransformation) {
      updateData.applied_edits = changes.changes || changes.CHANGES || '';
      await prisma.replicated_questions.update({
        where: { id: changes.ID },
        data: updateData,
      });
    } else {
      await prisma.replicated_questions.update({
        where: { id: questionId },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ PATCH error:", err);
    return new NextResponse("Update failed: " + err.message, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) return new NextResponse("Missing ID", { status: 400 });

    await prisma.replicated_questions.update({
      where: { id },
      data: { deleted: 1 },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE error:", err);
    return new NextResponse("Delete failed", { status: 500 });
  }
}
