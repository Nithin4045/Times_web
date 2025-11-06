import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prismaWordDb } from "@/lib/prismaWordDb";
import { Prisma } from "@/generated/prisma";

/**
 * API Route to update tagging_questions table
 * Called by Python script after AI tagging
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paper_id,
      question_id,
      job_id,
      area,
      sub_area,
      topic,
      sub_topic,
      user_id,
    } = body;

    // Validate required fields
    if (!paper_id || !question_id || job_id === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: paper_id, question_id, and job_id are required",
        },
        { status: 400 }
      );
    }

    // Ensure job_id fits in INT4 (PostgreSQL integer range: -2,147,483,648 to 2,147,483,647)
    const parsedJobId = parseInt(job_id);
    if (parsedJobId > 2147483647 || parsedJobId < -2147483648) {
      return NextResponse.json(
        {
          success: false,
          error: `job_id ${parsedJobId} is out of range for INT4. Must be between -2,147,483,648 and 2,147,483,647`,
        },
        { status: 400 }
      );
    }

    console.log(`[TAGGING] Updating tags for question ${question_id} in paper ${paper_id}`);

    // Check if entry already exists
    const existing = await prisma.tagging_questions.findFirst({
      where: {
        paper_id,
        question_id,
        job_id: parsedJobId,
      },
    });

    let result;

    if (existing) {
      // Update existing entry
      result = await prisma.tagging_questions.update({
        where: { id: existing.id },
        data: {
          area: area || null,
          sub_area: sub_area || null,
          topic: topic || null,
          sub_topic: sub_topic || null,
          user_id: user_id ? parseInt(user_id) : null,
          updated_at: new Date(),
          deleted: 0,
        },
      });

      console.log(`[TAGGING] ✅ Updated existing entry ID: ${existing.id}`);
    } else {
      // Create new entry
      result = await prisma.tagging_questions.create({
        data: {
          paper_id,
          question_id,
          job_id: parseInt(job_id),
          area: area || null,
          sub_area: sub_area || null,
          topic: topic || null,
          sub_topic: sub_topic || null,
          user_id: user_id ? parseInt(user_id) : null,
          deleted: 0,
        },
      });

      console.log(`[TAGGING] ✅ Created new entry ID: ${result.id}`);
    }

    // Log tagging status
    const tagged = area && sub_area && topic && sub_topic;
    if (tagged) {
      console.log(`[TAGGING] 🏷️ Tagged as: ${area} → ${sub_area} → ${topic} → ${sub_topic}`);
    } else {
      console.log(`[TAGGING] ⚠️ No tags assigned (kept null)`);
    }

    return NextResponse.json({
      success: true,
      data: result,
      tagged,
      message: existing ? "Entry updated successfully" : "Entry created successfully",
    });
  } catch (error) {
    console.error("[TAGGING] Error updating question tags:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update question tags",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch tagging results for a specific paper or question
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paper_id = searchParams.get("paper_id");
    const question_id = searchParams.get("question_id");
    const job_id = searchParams.get("job_id");

    if (!paper_id && !question_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Either paper_id or question_id is required",
        },
        { status: 400 }
      );
    }

    const where: any = {
      deleted: 0,
    };

    if (paper_id) where.paper_id = paper_id;
    if (question_id) where.question_id = question_id;
    if (job_id) where.job_id = parseInt(job_id);

    const results = await prisma.tagging_questions.findMany({
      where,
      orderBy: [
        { created_at: 'desc' },
      ],
    });

    const questionMap = new Map<
      string,
      {
        question: string | null;
        direction: string | null;
        passage: string | null;
        notes: string | null;
        question_number: number | null;
        options: unknown;
        tags: string | null;
      }
    >();

    const paperIds = Array.from(
      new Set(
        results
          .map((row) => row.paper_id)
          .filter((pid): pid is string => typeof pid === "string" && pid.trim().length > 0)
      )
    );

    const extractorModel = (prismaWordDb as any)?.extractor_question;
    await Promise.all(
      paperIds.map(async (pid) => {
        try {
          let rows: any[] = [];
          if (extractorModel?.findMany) {
            rows = await extractorModel.findMany({
              where: { paper_id: pid },
              select: {
                question_id: true,
                question_text: true,
                direction: true,
                passage: true,
                notes: true,
                question_number: true,
                options: true,
                tags: true,
              },
            });
          } else {
            rows = await prismaWordDb.$queryRaw<
              Array<{
                question_id: string;
                question_text: string | null;
                direction: string | null;
                passage: string | null;
                notes: string | null;
                question_number: number | null;
                options: unknown;
                tags: string | null;
              }>
            >(Prisma.sql`
              SELECT
                question_id,
                question_text,
                direction,
                passage,
                notes,
                question_number,
                options,
                tags
              FROM extractor_question
              WHERE paper_id = ${pid}
            `);
          }

          rows.forEach((row: any) => {
            if (!row?.question_id) return;
            questionMap.set(String(row.question_id), {
              question: row.question_text ?? null,
              direction: row.direction ?? null,
              passage: row.passage ?? null,
              notes: row.notes ?? null,
              question_number: row.question_number ?? null,
              options: row.options ?? null,
              tags: row.tags ?? null,
            });
          });
        } catch (err) {
          console.warn(`[TAGGING] Failed to enrich extractor data for paper ${pid}:`, err);
        }
      })
    );

    const enrichedResults = results.map((row) => {
      const meta = questionMap.get(String(row.question_id ?? ""));
      let parsedOptions: string[] = [];
      if (meta?.options) {
        if (Array.isArray(meta.options)) parsedOptions = meta.options as string[];
        else if (typeof meta.options === "string") {
          try {
            const parsed = JSON.parse(meta.options);
            if (Array.isArray(parsed)) parsedOptions = parsed;
          } catch {
            parsedOptions = [];
          }
        }
      }
      return {
        ...row,
        question: meta?.question ?? null,
        direction: meta?.direction ?? null,
        passage: meta?.passage ?? null,
        notes: meta?.notes ?? null,
        question_number: meta?.question_number ?? null,
        options: parsedOptions,
        tags: meta?.tags ?? null,
      };
    });

    // Calculate statistics
    const stats = {
      total: results.length,
      tagged: results.filter(r => r.area && r.sub_area && r.topic && r.sub_topic).length,
      untagged: results.filter(r => !r.area || !r.sub_area || !r.topic || !r.sub_topic).length,
    };

    return NextResponse.json({
      success: true,
      data: enrichedResults,
      stats,
      count: results.length,
    });
  } catch (error) {
    console.error("[TAGGING] Error fetching question tags:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch question tags",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove tagging entry (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID is required",
        },
        { status: 400 }
      );
    }

    const result = await prisma.tagging_questions.update({
      where: { id: parseInt(id) },
      data: {
        deleted: 1,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Tagging entry deleted successfully",
    });
  } catch (error) {
    console.error("[TAGGING] Error deleting question tags:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete question tags",
      },
      { status: 500 }
    );
  }
}

