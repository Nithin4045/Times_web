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
  console.log("[translation] Route called");

  let job_id: number | null = null;

  try {
    const contentType = request.headers.get('content-type') || '';
    console.log("[translation] Content-Type:", contentType);

    let input_type = "";
    let user_id_str = "";
    let paper_id_str = "";
    let languages_str = "";
    let local_words_str = "";
    let global_words_str = "";
    let mcq_s_str = "";

    if (contentType.includes('application/json')) {
      const body = await request.json();
      console.log("[translation] Received JSON body");
      input_type = body.input_type || "";
      user_id_str = String(body.user_id || "");
      paper_id_str = body.paper_id || "";
      languages_str = body.languages || "";
      local_words_str = body.local_words || "";
      global_words_str = body.global_words || "";
      mcq_s_str = body.mcq_s || "";
    } else {
      const formData = await request.formData();
      console.log("[translation] Received FormData");
      input_type = (formData.get("input_type") as string) || "";
      user_id_str = (formData.get("user_id") as string) || "";
      paper_id_str = (formData.get("paper_id") as string) || "";
      languages_str = (formData.get("languages") as string) || "";
      local_words_str = (formData.get("local_words") as string) || "";
      global_words_str = (formData.get("global_words") as string) || "";
      mcq_s_str = (formData.get("mcq_s") as string) || "";
    }

    console.log("[translation] Received data:");
    console.log("  - input_type:", input_type);
    console.log("  - user_id:", user_id_str);
    console.log("  - paper_id:", paper_id_str);
    console.log("  - languages:", languages_str);
    console.log("  - local_words length:", local_words_str?.length || 0);
    console.log("  - global_words length:", global_words_str?.length || 0);
    console.log("  - mcq_s length:", mcq_s_str?.length || 0);

    if (!input_type || !user_id_str || !paper_id_str || !languages_str || !mcq_s_str) {
      console.log("[translation] Missing required fields");
      return NextResponse.json({ error: "Missing input data" }, { status: 400 });
    }

    const user_id = Number(user_id_str);
    if (!Number.isFinite(user_id)) {
      return NextResponse.json({ error: "Invalid user_id" }, { status: 400 });
    }

    const base = process.env.PYTHON_SERVER || "";
    if (!base || !/^https?:\/\//i.test(base)) {
      const msg = "PYTHON_SERVER env is missing or invalid (must be absolute URL)";
      console.error("[translation]", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const pythonURL = `${base.replace(/\/+$/, "")}/process/translate`;
    console.log("[translation] Python URL:", pythonURL);

    const initial_request_data = {
      input_type,
      user_id,
      paper_id: paper_id_str,
      languages: languages_str,
      local_words: local_words_str,
      global_words: global_words_str,
      mcq_s: mcq_s_str,
      source: "translation-ui",
    };

    const created = await prisma.generate_jobs.create({
      data: {
        fileName: paper_id_str || "",
        user_id,
        input_type,
        request_data: safeStringify(initial_request_data),
        response_data: "",
        status: "started",
        api_endpoint: "/api/palms/translation",
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
    pyForm.append("paper_id", paper_id_str);
    pyForm.append("languages", languages_str);
    pyForm.append("local_words", local_words_str);
    pyForm.append("global_words", global_words_str);
    pyForm.append("mcq_s", mcq_s_str);
    pyForm.append("job_id", String(job_id));

    console.log("[translation] Sending to Python server");

    fetch(pythonURL, { method: "POST", body: pyForm })
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          throw new Error(`Python kickoff failed ${r.status}: ${text || r.statusText}`);
        }
      })
      .catch(async (netErr) => {
        console.error("[translation] Python kickoff failed:", netErr?.message || netErr);
      });

    return NextResponse.json(
      { success: true, message: "Translation job started", job_id },
      { status: 202 }
    );
  } catch (err: any) {
    console.error("[translation] Route exception:", err);

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log('[translation] Received callback from Python');

    const {
      job_id: raw_job_id,
      user_id: raw_user_id,
      paper_id,
      translations,
      local_words,
      global_words,
    } = body || {};

    const job_id = raw_job_id ? Number(raw_job_id) : null;
    const user_id = raw_user_id ? Number(raw_user_id) : null;

    if (!user_id || !paper_id || !translations) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`[translation] Processing ${Object.keys(translations).length} question translations`);
    console.log(`[translation] Paper ID: ${paper_id}, Job ID: ${job_id}, User ID: ${user_id}`);

    // Log the structure of translations received from Python
    console.log('[translation] Translation data structure:');
    let totalEntries = 0;
    for (const [question_id, lang_data] of Object.entries(translations as Record<string, any>)) {
      console.log(`  Question ID: ${question_id}`);
      if (typeof lang_data === 'object' && lang_data !== null) {
        for (const [lang_code, data] of Object.entries(lang_data as Record<string, any>)) {
          if (typeof data === 'object' && data !== null) {
            console.log(`    Language: ${lang_code}`);
            console.log(`      - Has question: ${'question' in data}`);
            console.log(`      - Has options: ${'options' in data}`);
            console.log(`      - Has solution: ${'solution' in data}`);
            if ((data as any).solution) {
              const solutionPreview = (data as any).solution.length > 100 
                ? (data as any).solution.substring(0, 100) + '...' 
                : (data as any).solution;
              console.log(`      - Solution preview: ${solutionPreview}`);
            } else {
              console.log(`      - Solution: None/empty`);
            }
            totalEntries++;
          }
        }
      }
    }
    console.log(`[translation] Total translation entries to save: ${totalEntries}`);

    let savedQuestions = 0;
    let updatedQuestions = 0;
    let createdQuestions = 0;

    await prisma.$transaction(async (tx) => {
      for (const [question_id, translation_data] of Object.entries(translations as Record<string, any>)) {
        console.log(`[translation] Processing question_id: ${question_id}`);
        
        if (typeof translation_data === 'object' && translation_data !== null) {
          console.log(`[translation] Translation data keys: ${Object.keys(translation_data as Record<string, any>)}`);
        }
        
        const whereFilter = { paper_id, question_id: question_id as string } as any;
        console.log(`[translation] Where filter: ${JSON.stringify(whereFilter)}`);

        try {
          // Check if row exists first
          const existingRecord = await tx.translated_questions.findFirst({
            where: whereFilter,
          });
          console.log(`[translation] Existing record found: ${existingRecord ? 'YES' : 'NO'}`);

          // Log what we're about to save
          console.log(`[translation] Saving translation_data for ${question_id}:`);
          if (typeof translation_data === 'object' && translation_data !== null) {
            for (const [lang, data] of Object.entries(translation_data as Record<string, any>)) {
              if (typeof data === 'object' && data !== null) {
                const dataObj = data as any;
                console.log(`    ${lang}: question=${!!dataObj.question}, options=${!!dataObj.options}, solution=${!!dataObj.solution}`);
              }
            }
          }

          // Try to update existing rows first
          const updateResult = await tx.translated_questions.updateMany({
            where: whereFilter,
            data: {
              translations: JSON.stringify(translation_data),
              local_words: local_words ? JSON.stringify(local_words) : null,
              global_words: global_words ? JSON.stringify(global_words) : null,
              user_id,
              job_id: job_id || undefined,
              updated_at: new Date(),
            },
          });

          console.log(`[translation] Update result: ${updateResult.count} rows updated`);

          if ((updateResult && (updateResult.count || (updateResult as any).affected)) && (updateResult.count > 0 || (updateResult as any).affected > 0)) {
            // updated existing row(s)
            updatedQuestions++;
            savedQuestions++;
            console.log(`[translation] Updated existing question: ${question_id}`);
            continue;
          }

          // No existing row updated; create a new row
          console.log(`[translation] Creating new record for question_id: ${question_id}`);
          const createResult = await tx.translated_questions.create({
            data: {
              paper_id,
              question_id: question_id as string,
              translations: JSON.stringify(translation_data),
              local_words: local_words ? JSON.stringify(local_words) : null,
              global_words: global_words ? JSON.stringify(global_words) : null,
              user_id,
              job_id: job_id || 0,
            },
          });
          createdQuestions++;
          savedQuestions++;
          console.log(`[translation] Created new record: ${createResult.id}`);
          
        } catch (dbError) {
          console.error(`[translation] Database error for question_id ${question_id}:`, dbError);
        }
      }
    });

    console.log(`[translation] Database operation completed:`);
    console.log(`[translation] - Total questions saved: ${savedQuestions}`);
    console.log(`[translation] - Updated: ${updatedQuestions}`);
    console.log(`[translation] - Created: ${createdQuestions}`);

    if (job_id) {
      await prisma.generate_jobs.update({
        where: { id: job_id },
        data: {
          status: 'success',
          response_data: safeStringify({
            success: true,
            message: 'Translations saved successfully',
            count: Object.keys(translations).length,
          }),
        },
      });
    }

    console.log('[translation] Translations saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Translations saved successfully',
    });
  } catch (err: any) {
    console.error("[translation] Callback error:", err);
    return NextResponse.json(
      { error: "Failed to save translations", detail: err?.message },
      { status: 500 }
    );
  }
}
