import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

function getSafeFilename(original: string): string {
  const ext = path.extname(original);
  const base = path.basename(original, ext).replace(/\s+/g, "_");
  return `${uuidv4()}_${base}${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    console.log("[LOG] Received POST /api/palms/question_tagging");

    const formData = await req.formData();
    const mcqfile = formData.get("mcqfile") as File;
    const conceptfile = formData.get("conceptfile") as File;
    const user_id = formData.get("user_id") as string;

    if (!mcqfile || !conceptfile) {
      return NextResponse.json({ error: "Both files are required." }, { status: 400 });
    }

    // Convert files to buffers
    const mcqBuffer = Buffer.from(await mcqfile.arrayBuffer());
    const conceptBuffer = Buffer.from(await conceptfile.arrayBuffer());

    // Send to Python API with correct parameter names
    const payload = new FormData();
    payload.append("mcqfile", mcqfile);
    payload.append("conceptfile", conceptfile);
    if (user_id) {
      payload.append("user_id", user_id);
    }

    console.log(`[LOG] Calling Python API: ${process.env.PYTHON_PALMS_URL}/seperateconcept`);
    
    const pythonRes = await fetch(`${process.env.PYTHON_PALMS_URL}/seperateconcept`, {
      method: "POST",
      body: payload,
    });

    if (!pythonRes.ok) {
      const errorText = await pythonRes.text();
      console.error("[ERROR] Python API failed:", pythonRes.status, errorText);
      return NextResponse.json({ 
        error: `Python API failed: ${pythonRes.status} - ${errorText}` 
      }, { status: pythonRes.status });
    }

    const responseData = await pythonRes.json();

    if (!responseData?.enriched_mcqs) {
      console.error("[ERROR] Unexpected response from Python server:", responseData);
      return NextResponse.json({ 
        error: "Unexpected response from Python server - no enriched_mcqs found" 
      }, { status: 500 });
    }

    const enrichedQuestions = responseData.enriched_mcqs;
    console.log("✅ Enriched Question Example:", enrichedQuestions[0]);

    // File saving setup
    const uploadDir = path.join(process.cwd(), "uploads", "palms");
    await mkdir(uploadDir, { recursive: true });

    const originalMcqName = mcqfile.name;
    const originalConceptName = conceptfile.name;

    const mcqSafeName = getSafeFilename(originalMcqName);
    const conceptSafeName = getSafeFilename(originalConceptName);

    await writeFile(path.join(uploadDir, mcqSafeName), mcqBuffer);
    await writeFile(path.join(uploadDir, conceptSafeName), conceptBuffer);

    const mcqPath = `uploads/palms/${mcqSafeName}`;
    const conceptPath = `uploads/palms/${conceptSafeName}`;

    // Insert into DB using Prisma - save to replicated_questions
    const taggingPaperId = `TAGGING_${Date.now()}`;
    
    await prisma.$transaction(async (tx) => {
      for (const [idx, q] of enrichedQuestions.entries()) {
        await tx.replicated_questions.create({
          data: {
            paper_id: taggingPaperId,
            question_id: `TAG${idx + 1}`,
            job_id: 0,
            question: q.question || "",
            options: JSON.stringify(q.options || []),
            correct_ans: typeof q.correct_answer === 'string' ? q.correct_answer : '',
            solution: null,
            applied_edits: `Area: ${q.Area || ''}, Topic: ${q.Topic || ''}, Concept: ${q.Concepts || ''}`,
            prompt: null,
            parent_id: null,
            user_id: parseInt(user_id),
            deleted: 0,
          }
        });
      }
    });

    return NextResponse.json({ 
      message: "Concept mapping completed successfully", 
      paper_id: taggingPaperId,
      mappedQuestions: enrichedQuestions 
    });

  } catch (err) {
    console.error("[FATAL ERROR] Route failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
