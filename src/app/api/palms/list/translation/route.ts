import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/palms/list/translation
// Returns distinct paper_id values with created_at timestamps
export async function GET(_req: NextRequest) {
  try {
    // Get the earliest created_at for each paper_id
    const rows = await prisma.translated_questions.groupBy({
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
    console.error("/api/palms/list/translation failed", e);
    return new NextResponse("Server error", { status: 500 });
  }
}


