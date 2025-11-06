// server/api/evaluate/instructions/route.ts (or wherever your file is)
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type TestSummaryRow = {
  Time: number;
  subject: string;
  totalQuestions: number;
  totalScore: number;
  topicNames: string[]; // <-- changed to names
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const testIdParam = url.searchParams.get("testId");

  if (!testIdParam) {
    return NextResponse.json({ message: "Missing required parameter" }, { status: 400 });
  }
  const testId = Number(testIdParam);
  console.log("Fetching test summary for testId in instructions/route.ts:", testId);

  try {
    const test = await prisma.test_repository.findUnique({
      where: { test_id: testId },
      select: { test_id: true },
    });
    if (!test) {
      return NextResponse.json({ message: "No test details found" }, { status: 404 });
    }

    const slices = await prisma.test_repository_details.findMany({
      where: { test_id: testId },
      select: {
        subject_id: true,
        question_count: true,
        duration_min: true,
        topic_id: true,
        subject_marks: true,
      },
    });
    console.log("slices data" ,slices);

    if (!slices.length) {
      return NextResponse.json({
        summary: { totalQuestions: 0, totalScore: 0 },
        details: [] as TestSummaryRow[],
      });
    }

    // Subject names
    const subjectIds = Array.from(
      new Set(slices.map(s => s.subject_id).filter((v): v is number => v != null))
    );

    const subjects = await prisma.subjects.findMany({
      where: { subject_id: { in: subjectIds } },
      select: { subject_id: true, subject_description: true },
    });

    const subjectName = new Map<number, string>(
      subjects.map(s => [s.subject_id, s.subject_description ?? "Unknown Subject"])
    );

    // Aggregate per subject (sum question_count, sum subject_marks, collect topic ids)
    type Acc = {
      subject: string;
      totalQuestions: number;
      totalScore: number;
      topicIds: number[];
      durationMin: number;
    };
    const bySubject = new Map<number, Acc>();

    for (const s of slices) {
      if (s.subject_id == null) continue;
      const current = bySubject.get(s.subject_id) ?? {
        subject: subjectName.get(s.subject_id) ?? "Unknown Subject",
        totalQuestions: 0,
        totalScore: 0,
        topicIds: [],
        durationMin: 0,
      };

      current.totalQuestions += s.question_count ?? 0;
      current.totalScore += s.subject_marks ?? 0;
      current.durationMin += s.duration_min ?? 0;

      if (s.topic_id != null && !current.topicIds.includes(s.topic_id)) {
        current.topicIds.push(s.topic_id);
      }

      bySubject.set(s.subject_id, current);
    }

    // Resolve all topic IDs to names
    const allTopicIds = Array.from(
      new Set(Array.from(bySubject.values()).flatMap(v => v.topicIds))
    );

    let topicIdToName = new Map<number, string>();
    if (allTopicIds.length) {
      const topics = await prisma.topics.findMany({
        where: { topic_id: { in: allTopicIds } },
        select: { topic_id: true, topic_description: true },
      });
      topicIdToName = new Map(topics.map(t => [t.topic_id, t.topic_description ?? "Unknown Topic"]));
    }

    // Build details: use per-subject duration (recommended) and topic names
    const details: TestSummaryRow[] = Array.from(bySubject.values()).map(row => ({
      Time: row.durationMin,
      subject: row.subject,
      totalQuestions: row.totalQuestions,
      totalScore: row.totalScore,
      topicNames: row.topicIds.map(id => topicIdToName.get(id) ?? `Topic #${id}`),
    }));

    const summary = {
      totalQuestions: details.reduce((a, r) => a + r.totalQuestions, 0),
      totalScore: details.reduce((a, r) => a + r.totalScore, 0),
      totalDuration: details.reduce((a, r) => a + r.Time, 0),
    };

    console.log("Test summary:", summary, "Details:", details);
    return NextResponse.json({ summary, details });
  } catch (err) {
    console.error("[/api/evaluate/instructions][GET] error:", err);
    return NextResponse.json({ message: "Error fetching test data" }, { status: 500 });
  }
}
