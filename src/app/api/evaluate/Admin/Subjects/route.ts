import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get distinct subject_ids directly from eval_questions
    const rows = await prisma.eval_questions.findMany({
      select: { subject_id: true },
      distinct: ["subject_id"],
    });

    // Filter out nulls and coerce to number[]
    const subjectIds: number[] = rows
      .map(r => r.subject_id)
      .filter((id): id is number => typeof id === "number");

    if (subjectIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const subjects = await prisma.subjects.findMany({
      where: { subject_id: { in: subjectIds } },
      orderBy: { subject_id: "desc" },
    });

    return NextResponse.json(subjects, { status: 200 });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ message: "Error fetching subjects" }, { status: 500 });
  }
}
