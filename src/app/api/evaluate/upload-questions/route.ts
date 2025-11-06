  // import { NextResponse, NextRequest } from "next/server";
  // import { prisma } from "@/lib/prisma";

  // export async function POST(req: NextRequest) {
  //   try {
  //     const body = await req.json();

  //     if (!Array.isArray(body) || body.length === 0) {
  //       return NextResponse.json({ error: "Invalid or empty data" }, { status: 400 });
  //     }

  //     const skipped: string[] = [];
  //     const inserted: string[] = [];

  //     for (const question of body) {
  //       const subjectId = parseInt(question.SUBJECT_ID || 0);
  //       const topicId = parseInt(question.TOPIC_ID || 0);
  //       const questionNumber = question.QUESTION_NUMBER;

  //       // Check for duplicates using Prisma
  //       const duplicateCheck = await prisma.$queryRaw`
  //         SELECT 1 FROM EVAL_QUESTIONS 
  //         WHERE SUBJECT_ID = ${subjectId} AND TOPIC_ID = ${topicId} 
  //           AND QUESTION_NUMBER = ${questionNumber}
  //       `;

  //       if ((duplicateCheck as any[]).length > 0) {
  //         skipped.push(questionNumber);
  //         continue;
  //       }

  //       // Insert question using Prisma
  //       await prisma.$executeRaw`
  //         INSERT INTO EVAL_QUESTIONS (
  //           SUBJECT_ID, TOPIC_ID, QUESTION_NUMBER,
  //           CHOICE1, CHOICE2, CHOICE3, CHOICE4,
  //           ANSWER, COMPLEXITY, QUESTION_SOURCE, LINK,
  //           CREATED_DATE, CREATED_BY, MODIFIED_DATE, MODIFIED_BY,
  //           QUESTION_TYPE, PARENT_QUESTION_NUMBER, QUESTION, Help_text,
  //           HELP_FILES, OPTIONS, negative_marks
  //         )
  //         VALUES (
  //           ${subjectId}, ${topicId}, ${questionNumber},
  //           ${String(question.CHOICE1)}, ${String(question.CHOICE2)}, ${String(question.CHOICE3)}, ${String(question.CHOICE4)},
  //           ${question.ANSWER}, ${parseInt(question.COMPLEXITY || 0)}, ${question.QUESTION_SOURCE || null}, ${question.LINK || null},
  //           ${new Date()}, ${question.CREATED_BY}, ${null}, ${null},
  //           ${question.QUESTION_TYPE}, ${question.PARENT_QUESTION_NUMBER || null}, ${question.QUESTION}, ${question.Help_text || null},
  //           ${question.HELP_FILES || null}, ${question.OPTIONS || null}, ${question.negative_marks ? parseFloat(question.negative_marks) : null}
  //         )
  //       `;

  //       inserted.push(questionNumber);
  //     }

  //     if (inserted.length === 0) {
  //       return NextResponse.json({
  //         message: "All questions already exist. No new records inserted.",
  //         skippedCount: skipped.length,
  //         skippedQuestions: skipped
  //       }, { status: 409 });
  //     }

  //     return NextResponse.json({
  //       message: "Upload completed",
  //       insertedCount: inserted.length,
  //       skippedCount: skipped.length,
  //       skippedQuestions: skipped,
  //     });
  //   } catch (error) {
  //     console.error("Error inserting questions:", error);
  //     return NextResponse.json({ message: "Error inserting questions" }, { status: 500 });
  //   }
  // }











  import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeAnswerForServer(raw: any): string | null {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) {
    const arr = raw.map((x) => String(x).trim().toUpperCase()).filter(Boolean);
    return arr.length ? Array.from(new Set(arr)).join(",") : null;
  }
  const s = String(raw).trim();
  if (s === "") return null;
  const parts = s.split(/[\s,;|]+/).map((p) => p.trim().toUpperCase()).filter(Boolean);
  if (!parts.length) return null;
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const p of parts) {
    if (!seen.has(p)) {
      seen.add(p);
      deduped.push(p);
    }
  }
  return deduped.join(",");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: "Invalid or empty data" }, { status: 400 });
    }

    const skipped: string[] = [];
    const inserted: string[] = [];

    for (const question of body) {
      const subjectId = parseInt(question.SUBJECT_ID || 0);
      const topicId = parseInt(question.TOPIC_ID || 0);
      const questionNumber = question.QUESTION_NUMBER;

      // Normalize the answer before duplicate check / insert
      const normalizedAnswer = normalizeAnswerForServer(question.ANSWER);

      // Check for duplicates using Prisma
      const duplicateCheck = await prisma.$queryRaw`
        SELECT 1 FROM EVAL_QUESTIONS 
        WHERE SUBJECT_ID = ${subjectId} AND TOPIC_ID = ${topicId} 
          AND QUESTION_NUMBER = ${questionNumber}
      `;

      if ((duplicateCheck as any[]).length > 0) {
        skipped.push(questionNumber);
        continue;
      }

      // Insert question using Prisma raw - include normalizedAnswer
      await prisma.$executeRaw`
        INSERT INTO EVAL_QUESTIONS (
          SUBJECT_ID, TOPIC_ID, QUESTION_NUMBER,
          CHOICE1, CHOICE2, CHOICE3, CHOICE4,
          ANSWER, COMPLEXITY, QUESTION_SOURCE, LINK,
          CREATED_DATE, CREATED_BY, MODIFIED_DATE, MODIFIED_BY,
          QUESTION_TYPE, PARENT_QUESTION_NUMBER, QUESTION, Help_text,
          HELP_FILES, OPTIONS, negative_marks
        )
        VALUES (
          ${subjectId}, ${topicId}, ${questionNumber},
          ${String(question.CHOICE1)}, ${String(question.CHOICE2)}, ${String(question.CHOICE3)}, ${String(question.CHOICE4)},
          ${normalizedAnswer}, ${parseInt(question.COMPLEXITY || 0)}, ${question.QUESTION_SOURCE || null}, ${question.LINK || null},
          ${new Date()}, ${question.CREATED_BY}, ${null}, ${null},
          ${question.QUESTION_TYPE}, ${question.PARENT_QUESTION_NUMBER || null}, ${question.QUESTION}, ${question.Help_text || null},
          ${question.HELP_FILES || null}, ${question.OPTIONS || null}, ${question.negative_marks ? parseFloat(question.negative_marks) : null}
        )
      `;

      inserted.push(questionNumber);
    }

    if (inserted.length === 0) {
      return NextResponse.json({
        message: "All questions already exist. No new records inserted.",
        skippedCount: skipped.length,
        skippedQuestions: skipped
      }, { status: 409 });
    }

    return NextResponse.json({
      message: "Upload completed",
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      skippedQuestions: skipped,
    });
  } catch (error) {
    console.error("Error inserting questions:", error);
    return NextResponse.json({ message: "Error inserting questions" }, { status: 500 });
  }
}
