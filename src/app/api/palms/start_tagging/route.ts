import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API Route to start the AI tagging process
 * Fetches questions from replicated_questions and sends to Python for tagging
 */
export async function POST(request: NextRequest) {
  let paper_id: string | undefined;
  
  try {
    const body = await request.json();
    paper_id = body.paper_id;
    const user_id = body.user_id;

    if (!paper_id) {
      return NextResponse.json(
        {
          success: false,
          error: "paper_id is required",
        },
        { status: 400 }
      );
    }

    console.log(`[START_TAGGING] Initiating tagging for paper: ${paper_id}, user: ${user_id}`);

    let questions: { question_id: string; question_text: string }[] = [];
    if (Array.isArray(body.questions) && body.questions.length > 0) {
      questions = body.questions
        .map((item: any) => {
          const qid = item?.question_id ? String(item.question_id).trim() : "";
          const text = item?.question_text ?? item?.question ?? "";
          return qid && text
            ? { question_id: qid, question_text: String(text) }
            : null;
        })
        .filter((item:any): item is { question_id: string; question_text: string } => Boolean(item));

      console.log(`[START_TAGGING] Using ${questions.length} questions provided by client request`);
    }

    if (questions.length === 0) {
      const dbQuestions = await prisma.replicated_questions.findMany({
        where: {
          paper_id,
          deleted: 0,
        },
        select: {
          question_id: true,
          question: true,
        },
        orderBy: {
          question_id: 'asc',
        },
      });

      console.log(`[START_TAGGING] Query result: Found ${dbQuestions.length} questions for paper ${paper_id}`);

      if (dbQuestions.length === 0) {
        const totalQuestions = await prisma.replicated_questions.count({
          where: { paper_id },
        });

        console.log(`[START_TAGGING] Total questions (including deleted): ${totalQuestions}`);

        return NextResponse.json(
          {
            success: false,
            error: totalQuestions > 0 
              ? `Found ${totalQuestions} questions but all are marked as deleted. Please restore or regenerate questions first.`
              : `No questions found in replicated_questions table for paper ${paper_id}. Please generate/replicate questions first before tagging.`,
            paper_id,
            total_questions: totalQuestions,
          },
          { status: 404 }
        );
      }

      questions = dbQuestions
        .map((q) => ({
          question_id: q.question_id,
          question_text: q.question,
        }))
        .filter((q) => q.question_id && q.question_text);
    }

    console.log(`[START_TAGGING] Using ${questions.length} questions for tagging`);

    // Create a job entry in generate_jobs table
    const jobEntry = await prisma.generate_jobs.create({
      data: {
        fileName: `tagging_${paper_id}`,
        user_id: user_id ? parseInt(user_id) : 0,
        input_type: "tagging",
        request_data: JSON.stringify({
          paper_id,
          total_questions: questions.length,
        }),
        status: "processing",
        api_endpoint: "/api/palms/start_tagging",
        percentage: 0,
      },
    });

    const job_id = jobEntry.id;
    console.log(`[START_TAGGING] Created job entry with ID: ${job_id}`);

    // Send to Python API for AI tagging
    const pythonApiUrl = process.env.PYTHON_PALMS_URL || "http://localhost:8000";
    
    console.log(`[START_TAGGING] Sending to Python API: ${pythonApiUrl}/tagging/tag_questions`);

    const pythonPayload = {
      paper_id,
      job_id,
      user_id: user_id ? parseInt(user_id) : null,
      questions,
      nextjs_api_url: process.env.NEXTJS_API_URL || "http://localhost:3000",
    };

    console.log(`[START_TAGGING] Payload summary: paper_id=${paper_id}, job_id=${job_id}, questions=${questions.length}, user_id=${pythonPayload.user_id}`);

    const pythonResponse = await fetch(`${pythonApiUrl}/tagging/tag_questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pythonPayload),
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error(`[START_TAGGING] Python API error: ${pythonResponse.status} - ${errorText}`);
      return NextResponse.json(
        {
          success: false,
          error: `Python API failed: ${pythonResponse.status}`,
          details: errorText,
        },
        { status: pythonResponse.status }
      );
    }

    const pythonResult = await pythonResponse.json();

    console.log(`[START_TAGGING] ✅ Python tagging completed`);
    console.log(`[START_TAGGING] Stats:`, pythonResult.stats);

    // Update job status to completed
    await prisma.generate_jobs.update({
      where: { id: job_id },
      data: {
        status: "completed",
        response_data: JSON.stringify(pythonResult),
        response_time: new Date(),
        percentage: 100,
        updatedAt: new Date(),
      },
    });

    console.log(`[START_TAGGING] ✅ Updated job ${job_id} status to completed`);

    return NextResponse.json({
      success: true,
      message: "Tagging process completed",
      paper_id,
      job_id,
      total_questions: questions.length,
      result: pythonResult,
    });
  } catch (error) {
    console.error("[START_TAGGING] Error:", error);
    
    // Try to update job status to failed if job was created
    try {
      if (paper_id) {
        const errorJobId = await prisma.generate_jobs.findFirst({
          where: {
            fileName: `tagging_${paper_id}`,
            status: "processing",
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (errorJobId) {
          await prisma.generate_jobs.update({
            where: { id: errorJobId.id },
            data: {
              status: "failed",
              response_data: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
              response_time: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }
    } catch (updateError) {
      console.error("[START_TAGGING] Failed to update job status:", updateError);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to start tagging process",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Check tagging progress/status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paper_id = searchParams.get("paper_id");
    const job_id = searchParams.get("job_id");

    if (!paper_id) {
      return NextResponse.json(
        {
          success: false,
          error: "paper_id is required",
        },
        { status: 400 }
      );
    }

    const where: any = {
      paper_id,
      deleted: 0,
    };

    if (job_id) {
      where.job_id = parseInt(job_id);
    }

    // Get total questions from replicated_questions
    const totalQuestions = await prisma.replicated_questions.count({
      where: {
        paper_id,
        deleted: 0,
      },
    });

    // Get tagging results
    const taggedResults = await prisma.tagging_questions.findMany({
      where,
      select: {
        question_id: true,
        area: true,
        sub_area: true,
        topic: true,
        sub_topic: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Calculate statistics
    const stats = {
      total_questions: totalQuestions,
      processed: taggedResults.length,
      tagged: taggedResults.filter(r => r.area && r.sub_area && r.topic && r.sub_topic).length,
      untagged: taggedResults.filter(r => !r.area || !r.sub_area || !r.topic || !r.sub_topic).length,
      pending: totalQuestions - taggedResults.length,
      completion_percentage: totalQuestions > 0 
        ? Math.round((taggedResults.length / totalQuestions) * 100) 
        : 0,
    };

    return NextResponse.json({
      success: true,
      paper_id,
      job_id,
      stats,
      results: taggedResults,
    });
  } catch (error) {
    console.error("[START_TAGGING] Error checking status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check tagging status",
      },
      { status: 500 }
    );
  }
}

