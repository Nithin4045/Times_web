import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subject_id");

    if (!subjectId) {
      return NextResponse.json({ error: "Missing subject_id" }, { status: 400 });
    }

    // 1) Get distinct topic_ids from eval_questions for this subject
    const topicRows = await prisma.eval_questions.findMany({
      where: { subject_id: Number(subjectId) },
      distinct: ["topic_id"],
      select: { topic_id: true },
    });

    // 2) Extract non-null topic ids
    const topicIds = topicRows
      .map(r => r.topic_id);
      
    if (topicIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // 3) Fetch topics
    const topics = await prisma.topics.findMany({
      where: { topic_id: { in: topicIds as any[] } }, // cast if your topic_id is mixed type
      orderBy: { topic_id: "desc" },
    });

    return NextResponse.json(topics, { status: 200 });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json({ message: "Error fetching topics" }, { status: 500 });
  }
}
