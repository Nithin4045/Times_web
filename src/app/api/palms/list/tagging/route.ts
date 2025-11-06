import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/palms/list/tagging
// Query params:
//   by=job -> return distinct job_id with created_at timestamps
//   default -> return distinct paper_id with created_at timestamps
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const by = searchParams.get("by");

    if (by === "job") {
      // Get the earliest created_at for each job_id
      const rows = await prisma.tagged_questions.groupBy({
        by: ['job_id'],
        where: { deleted: 0 },
        _min: {
          created_at: true,
        },
        orderBy: {
          job_id: 'desc',
        },
      });
      return NextResponse.json(rows.map((r) => ({
        job_id: String(r.job_id),
        created_at: r._min.created_at,
      })));
    }

    // Get the earliest created_at for each paper_id
    const rows = await prisma.tagged_questions.groupBy({
      by: ['paper_id'],
      where: { deleted: 0 },
      _min: {
        created_at: true,
      },
      orderBy: {
        _min: {
          created_at: 'desc',
        },
      },
    });
    return NextResponse.json(rows.map((r) => ({
      paper_id: r.paper_id,
      created_at: r._min.created_at,
    })));
  } catch (e) {
    console.error("/api/palms/list/tagging failed", e);
    return new NextResponse("Server error", { status: 500 });
  }
}


