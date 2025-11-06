import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/palms/list/replication
// Query params:
//   by=job -> return distinct job_id with created_at timestamps and paper_id
//   default -> return distinct paper_id with created_at timestamps (legacy)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const by = searchParams.get("by");

    if (by === "job") {
      // Get the earliest created_at for each job_id along with paper_id
      const rows = await prisma.replicated_questions.groupBy({
        by: ['job_id', 'paper_id'],
        where: { deleted: 0, parent_id: null },
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
        job_id: String(r.job_id),
        paper_id: r.paper_id,
        created_at: r._min.created_at,
      })));
    }

    // Default: group by paper_id (legacy behavior)
    const rows = await prisma.replicated_questions.groupBy({
      by: ['paper_id'],
      where: { deleted: 0, parent_id: null },
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
    console.error("/api/palms/list/replication failed", e);
    return new NextResponse("Server error", { status: 500 });
  }
}


