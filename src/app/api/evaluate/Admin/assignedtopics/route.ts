import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get("test_id");
    const subjectId = searchParams.get("subject_id");

    if (!testId || !subjectId) {
      return NextResponse.json({ error: "Missing test_id or subject_id" }, { status: 400 });
    }

    // Fetch assigned topics from PostgreSQL
    const result = await prisma.test_repository_details.findMany({
      where: {
        test_id: Number(testId),
        subject_id: Number(subjectId),
      },
      select: {
        topic_id: true,
        question_count: true,
        rendering_order: true,
        duration_min: true,
        complexity: true,
      },
      orderBy: {
        rendering_order: "asc",
      },
    });

    return NextResponse.json({ topics: result }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching assigned topics:", error);
    return NextResponse.json(
      { message: "Error fetching assigned topics", error: error.message },
      { status: 500 }
    );
  }
}
