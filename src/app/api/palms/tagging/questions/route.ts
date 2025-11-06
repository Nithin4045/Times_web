import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paper_id = searchParams.get("paper_id");
    const job_id = searchParams.get("job_id");
    if (!paper_id && !job_id) return NextResponse.json([], { status: 200 });

    // Return ONLY from tagged_questions (no joins)
    const whereClause: any = { deleted: 0 };
    if (paper_id) whereClause.paper_id = paper_id;
    if (job_id) whereClause.job_id = Number(job_id);

    const tags = await prisma.tagged_questions.findMany({
      where: whereClause,
      orderBy: [{ id: "asc" }],
      select: {
        id: true,
        question_id: true,
        job_id: true,
        paper_id: true,
        area: true,
        sub_area: true,
        topic: true,
        sub_topic: true,
      },
    });

    return NextResponse.json(tags);
  } catch (e) {
    console.error("/api/palms/tagging/questions GET failed", e);
    return new NextResponse("Server error", { status: 500 });
  }
}


