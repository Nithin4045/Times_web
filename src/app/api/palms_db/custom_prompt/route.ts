import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FASTAPI_URL = (process.env.PYTHON_SERVER || "http://localhost:8000").replace(/\/$/, "");
const FASTAPI_PATH = "/custom_change/extend_with_prompt";

function toJSONOptions(v: unknown) {
  try {
    if (Array.isArray(v)) return JSON.stringify(v);
    return JSON.stringify([]);
  } catch {
    return JSON.stringify([]);
  }
}
function isNumberish(v: unknown) {
  return typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    console.log("[custom_prompt] incoming body:", body);
    if (!body) return NextResponse.json({ success: false, error: "Missing JSON body" }, { status: 400 });

    // parent_id required
    const parentIdRaw = body.parent_id ?? body.question_id;
    const parent_id = Number(parentIdRaw) || 0;
    if (!parent_id) {
      return NextResponse.json({ success: false, error: "parent_id (numeric) is required" }, { status: 400 });
    }

    // Validate forwarded fields
    const question = typeof body.question === "string" ? body.question : "";
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const count = Number.isFinite(Number(body.count)) ? Number(body.count) : 1;
    const paper_id = typeof body.paper_id === "string" ? body.paper_id : "";
    const original_question_id = typeof body.original_question_id === "string" ? body.original_question_id : String(parent_id);

    if (!question || !prompt) {
      return NextResponse.json({ success: false, error: "Both 'question' and 'prompt' are required" }, { status: 400 });
    }

    // Build payload for Python (match custom_change.py input)
    const forwardPayload: Record<string, unknown> = {
      question_id: typeof body.question_id === "string" ? body.question_id : String(parent_id),
      question,
      count,
      prompt,
    };
    if (typeof body.change_key === "string") forwardPayload.change_key = body.change_key;
    if (isNumberish(body.user_id)) forwardPayload.user_id = Number(body.user_id);

    // Call Python FastAPI
    const target = `${FASTAPI_URL}${FASTAPI_PATH}`;
    console.log("[custom_prompt] forwarding to:", target);
    console.log("[custom_prompt] forward payload:", forwardPayload);
    const backendResp = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwardPayload),
    });

    console.log("[custom_prompt] backend status:", backendResp.status);
    const backendText = await backendResp.text().catch(() => "");
    console.log("[custom_prompt] backend raw text:", backendText?.slice(0, 1000));
    if (!backendResp.ok) {
      let parsed: unknown = backendText;
      try {
        parsed = JSON.parse(backendText);
      } catch {
        /* keep text */
      }
      console.error("[custom_prompt] backend error:", backendResp.status, parsed);
      return NextResponse.json({ success: false, error: "Python backend error", status: backendResp.status, backend: parsed }, { status: 502 });
    }

    // Parse backend JSON (must match your custom_change.py response)
    let backendJson: any;
    try {
      backendJson = JSON.parse(backendText);
    } catch (e) {
      console.error("[custom_prompt] backend invalid JSON:", backendText);
      return NextResponse.json({ success: false, error: "Python backend returned invalid JSON", details: backendText }, { status: 502 });
    }

    // Validate response shape
    if (!backendJson || !Array.isArray(backendJson.replications) || typeof backendJson.question_id !== "string") {
      console.error("[custom_prompt] unexpected backend shape:", backendJson);
      return NextResponse.json({ success: false, error: "Unexpected backend response shape", backend: backendJson }, { status: 502 });
    }

    // Determine user_id to use for DB inserts: backend.user_id > request.user_id > 0
    const user_id = isNumberish(backendJson.user_id) ? Number(backendJson.user_id) : (isNumberish(body.user_id) ? Number(body.user_id) : 0);

    // Insert returned replications into DB using a transaction
    const replications: any[] = backendJson.replications;
    console.log("[custom_prompt] inserting", Array.isArray(replications) ? replications.length : 0, "replications to DB");
    console.log("[custom_prompt] parent_id (aiQuestion.id):", parent_id);
    console.log("[custom_prompt] paper_id:", paper_id);
    console.log("[custom_prompt] original_question_id:", original_question_id);
    
    // Store the created database IDs to return to frontend
    const createdReplicationsWithIds: any[] = [];
    
    await prisma.$transaction(async (tx) => {

      // Also save to replicated_questions if paper_id is provided
      const createReplicated = async (payload: {
        parent_replicated_id: number;  // The replicated_questions.id of the clicked question
        question?: string;
        options?: any[];
        correct_ans?: string;
        solution?: string | null;
        applied_edits?: string | null;
        prompt?: string | null;
        user_id?: number;
      }) => {
        if (!paper_id) return null;
        
        // Fetch the clicked replicated_question row to get its question_id, paper_id, and job_id
        const clickedQuestion = await tx.replicated_questions.findUnique({
          where: { id: payload.parent_replicated_id },
          select: { question_id: true, paper_id: true, job_id: true, id: true }
        });
        
        if (!clickedQuestion) {
          console.error(`❌ Could not find replicated_question with id=${payload.parent_replicated_id}`);
          return null;
        }
        
        // Use the clicked question's question_id, job_id, and id
        const question_id = clickedQuestion.question_id;  // SAME question_id as clicked question
        const parent_id = clickedQuestion.id;             // Clicked question's id becomes parent_id
        const paper_id_to_use = clickedQuestion.paper_id;
        const job_id_to_use = clickedQuestion.job_id;     // SAME job_id as clicked question
        
        console.log(`✅ Found clicked question: id=${parent_id}, question_id=${question_id}, paper_id=${paper_id_to_use}, job_id=${job_id_to_use}`);
        console.log(`🔗 Will save new transformation with parent_id=${parent_id}, question_id=${question_id}, job_id=${job_id_to_use}`);
        
        const created = await tx.replicated_questions.create({
          data: {
            paper_id: paper_id_to_use,
            question_id: question_id,  // SAME as clicked question's question_id
            parent_id: parent_id,      // Clicked question's replicated_questions.id
            job_id: job_id_to_use,     // SAME as clicked question's job_id
            question: payload.question || "",
            options: toJSONOptions(payload.options || []),
            correct_ans: payload.correct_ans || "",
            solution: payload.solution ?? null,
            applied_edits: payload.applied_edits ?? null,
            prompt: payload.prompt ?? null,
            user_id: payload.user_id || 0,
          },
        });
        
        console.log(`✅ Created new transformation: id=${created.id}, parent_id=${created.parent_id}, question_id=${created.question_id}, job_id=${created.job_id}`);
        return created;
      };

      for (const rep of replications) {
        try {
          const repQuestion: string = rep?.question || "";
          const repOptions = Array.isArray(rep?.options) ? rep.options : [];
          const repCorrect: string = rep?.correct_ans || rep?.answer || "";
          const repSolution: string | null = rep?.solution ?? null;
          const repKey: string | null = typeof rep?.key === "string" ? rep.key : (typeof body?.change_key === "string" ? body.change_key : (rep?.field || rep?.type || null));
          const repPrompt: string | null = typeof rep?.prompt === "string" ? rep.prompt : (typeof body?.prompt === "string" ? body.prompt : null);

          // Save to replicated_questions only
          const replicatedRow = await createReplicated({
            parent_replicated_id: parent_id,  // The replicated_questions.id of the clicked question
            question: repQuestion,
            options: repOptions,
            correct_ans: repCorrect,
            solution: repSolution,
            applied_edits: repKey || null,
            prompt: repPrompt,
            user_id,
          });
          
          if (replicatedRow) {
            console.log(`✅ Saved to replicated_questions: id=${replicatedRow.id}, paper_id=${paper_id}, question_id=${replicatedRow.question_id}, parent_id=${replicatedRow.parent_id}`);
            
            // Store the created record with database ID
            createdReplicationsWithIds.push({
              ...rep,
              id: replicatedRow.id,  // Add the database ID
              db_parent_id: replicatedRow.parent_id,
              db_question_id: replicatedRow.question_id,
              db_paper_id: replicatedRow.paper_id,
            });
          }

          // nested replications - save only to replicated_questions
          const nested: any[] = Array.isArray(rep?.replications) ? rep.replications : [];
          for (const nestedRep of nested) {
            try {
              const nQuestion: string = nestedRep?.question || "";
              const nOptions = Array.isArray(nestedRep?.options) ? nestedRep.options : [];
              const nCorrect: string = nestedRep?.correct_ans || nestedRep?.answer || "";
              const nSolution: string | null = nestedRep?.solution ?? null;
              const nKey: string | null = typeof nestedRep?.key === "string" ? nestedRep.key : (nestedRep?.field || nestedRep?.type || null);
              const nPrompt: string | null = typeof nestedRep?.prompt === "string" ? nestedRep.prompt : null;

              // Save nested to replicated_questions only
              if (replicatedRow) {
                const nestedReplicated = await tx.replicated_questions.create({
                  data: {
                    paper_id: replicatedRow.paper_id,        // Same paper_id as parent
                    question_id: replicatedRow.question_id,  // Same question_id as parent
                    parent_id: replicatedRow.id,             // Points to the parent replication row
                    job_id: replicatedRow.job_id,            // Same job_id as parent
                    question: nQuestion,
                    options: toJSONOptions(nOptions || []),
                    correct_ans: nCorrect,
                    solution: nSolution,
                    applied_edits: nKey || null,
                    prompt: nPrompt,
                    user_id,
                  },
                });
                console.log(`✅ Saved nested transformation: id=${nestedReplicated.id}, parent_id=${replicatedRow.id}, question_id=${nestedReplicated.question_id}, job_id=${nestedReplicated.job_id}`);
              }
            } catch (nestedErr) {
              console.error("Failed to insert nested replication", nestedErr);
            }
          }
        } catch (repErr) {
          console.error("Failed to insert replication for parent_id", parent_id, repErr);
        }
      }
    });

    // Return the response with database IDs included
    const responseWithIds = {
      ...backendJson,
      replications: createdReplicationsWithIds.length > 0 ? createdReplicationsWithIds : backendJson.replications,
    };
    
    console.log("[custom_prompt] ✅ Success! Saved", createdReplicationsWithIds.length, "replications with IDs");
    console.log("[custom_prompt] Saved under question_id:", original_question_id, "in paper_id:", paper_id);
    return NextResponse.json(responseWithIds, { status: 200 });
  } catch (err: any) {
    console.error("[custom_prompt] generate_and_store failed:", err);
    return NextResponse.json({ success: false, error: "Server error", details: err?.message ?? String(err) }, { status: 500 });
  }
}
