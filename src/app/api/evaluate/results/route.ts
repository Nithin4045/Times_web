import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const testId = url.searchParams.get("testId");
  const userTestId = url.searchParams.get("userTestId");

  if (!testId || !userTestId) {
    return NextResponse.json({ message: "Missing required parameters" }, { status: 400 });
  }

  try {
    const tId = Number(testId);
    const utId = Number(userTestId);

    // Pull all details rows
    const userTestRecords = await prisma.user_test_details.findMany({
      where: { test_id: tId, user_test_id: utId },
      select: {
        subject_id: true,
        marks: true,
        answer_data: true,
      },
    });

    if (!userTestRecords.length) {
      return NextResponse.json({ message: "No test details found" }, { status: 404 });
    }

    // Collect unique subject ids for names
    const subjectIds = Array.from(
      new Set(userTestRecords.map(r => r.subject_id ?? 0).filter(id => id !== 0))
    );

    let subjectMap = new Map<number, string>();
    if (subjectIds.length) {
      const subjects = await prisma.subjects.findMany({
        where: { subject_id: { in: subjectIds } },
        select: { subject_id: true, subject_description: true },
      });
      subjectMap = new Map(subjects.map(s => [s.subject_id, s.subject_description ?? `Subject ${s.subject_id}`]));
    }

    // Group + aggregate
    const subjectGroups: Record<number, {
      totalQuestions: number;
      totalScore: number;    // possible marks (we’ll derive from correct/marks if needed)
      scoredMarks: number;   // user scored (sum of marks)
      answerData: Array<{ user_answer?: string; correct_answer?: string; ANSWER?: string }>;
    }> = {};

    for (const record of userTestRecords) {
      const subjectId = record.subject_id ?? 0;
      if (!subjectGroups[subjectId]) {
        subjectGroups[subjectId] = {
          totalQuestions: 0,
          totalScore: 0,
          scoredMarks: 0,
          answerData: [],
        };
      }

      subjectGroups[subjectId].totalQuestions += 1;
      // scored marks: sum of marks (nullable)
      subjectGroups[subjectId].scoredMarks += Number(record.marks ?? 0);

      if (record.answer_data) {
        try {
          // Your stored format: array of { user_answer, correct_answer/ANSWER, ... }
          const parsed = JSON.parse(record.answer_data);
          if (Array.isArray(parsed)) {
            subjectGroups[subjectId].answerData.push(...parsed);
          }
        } catch {
          // ignore bad JSON
        }
      }
    }

    // If you want "totalScore" per subject to be the possible marks for that subject,
    // you can sum test_repository_details.subject_marks for this test+subject:
    const possibleMarksRows = await prisma.test_repository_details.findMany({
      where: { test_id: tId, subject_id: { in: subjectIds.length ? subjectIds : undefined } },
      select: { subject_id: true, subject_marks: true },
    });
    const possibleMarksMap = new Map<number, number>();
    for (const r of possibleMarksRows) {
      const sid = r.subject_id ?? 0;
      possibleMarksMap.set(sid, (possibleMarksMap.get(sid) ?? 0) + Number(r.subject_marks ?? 0));
    }

    const results = Object.entries(subjectGroups).map(([sid, group]) => {
      const subjectId = Number(sid);
      const answered = group.answerData.filter(a => (a.user_answer ?? "") !== "").length;
      const unanswered = group.totalQuestions - answered;

      // correct answer key may be either `ANSWER` or `correct_answer`
      const wronganswers = group.answerData.filter(a => {
        const correct = (a.correct_answer ?? a.ANSWER ?? "").toString().trim();
        const user = (a.user_answer ?? "").toString().trim();
        return user !== "" && user !== correct;
      }).length;

      const totalScore = possibleMarksMap.get(subjectId) ?? 0;

      return {
        subjectId,
        subject: subjectMap.get(subjectId) ?? (subjectId === 0 ? "General" : `Subject ${subjectId}`),
        totalQuestions: group.totalQuestions,
        totalScore,
        scoredMarks: group.scoredMarks,
        answered,
        unanswered,
        wronganswers,
      };
    });

    // Overall summary
    const totalScoredMarks = results.reduce((sum, r) => sum + Number(r.scoredMarks ?? 0), 0);
    const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
    const totalAnswered = results.reduce((sum, r) => sum + r.answered, 0);
    const totalWrongAnswers = results.reduce((sum, r) => sum + r.wronganswers, 0);
    const totalUnanswered = totalQuestions - totalAnswered;

    return NextResponse.json({
      summary: { totalScoredMarks, totalQuestions, totalAnswered, totalUnanswered, totalWrongAnswers },
      details: results,
    });
  } catch (error) {
    logger.error(`Error fetching data: ${error}`);
    return NextResponse.json({ message: "Error fetching data" }, { status: 500 });
  }
}
