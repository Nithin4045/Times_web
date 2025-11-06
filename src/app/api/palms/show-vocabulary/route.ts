// app/src/app/api/vocabulary/route.ts

import { NextResponse,NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1) Connect to database
    const host = req.headers.get('host'); // Get host from headers
            
                if (!host) {
                  return NextResponse.json({ error: 'Host header is missing' }, { status: 400 });
                }

    // 2) Query to join VOCABUALARY, Question, and Answer
    const query = `
      SELECT
        v.id                AS vocabId,
        v.CONTENT           AS content,
        v.WORD              AS word,
        v.CONTEXT           AS context,
        q.id                AS questionId,
        q.questionName      AS questionName,
        a.answerId          AS answerId,
        a.answerName        AS answerName,
        a.correctAns        AS correctAns
      FROM VOCABUALARY v
      JOIN Question q
        ON v.QUESTION_ID = q.id
      JOIN Answer a
        ON a.questionId = q.id
      ORDER BY v.id, a.answerId;
    `;

    const result = await prisma.$queryRawUnsafe(query);
    // result is an array of rows, each row has one answer

    // 3) Transform into grouped structure:
    type RawRow = {
      vocabId: number;
      content: string;
      word: string;
      context: string;
      questionId: number;
      questionName: string;
      answerId: number;
      answerName: string;
      correctAns: number;
    };

    const rows = result as RawRow[];

    const grouped: {
      [vocabId: number]: {
        vocabId: number;
        content: string;
        word: string;
        context: string;
        question: {
          id: number;
          questionName: string;
        };
        options: {
          answerId: number;
          answerName: string;
          correctAns: boolean;
        }[];
      };
    } = {};

    for (const row of rows) {
      if (!grouped[row.vocabId]) {
        grouped[row.vocabId] = {
          vocabId: row.vocabId,
          content: row.content || '',
          word: row.word || '',
          context: row.context || '',
          question: {
            id: row.questionId,
            questionName: row.questionName || '',
          },
          options: [],
        };
      }
      grouped[row.vocabId].options.push({
        answerId: row.answerId,
        answerName: row.answerName || '',
        correctAns: row.correctAns === 1,
      });
    }

    // 4) Convert to array
    const responseArray = Object.values(grouped);

    return NextResponse.json(responseArray);
  } catch (e: any) {
    console.error("Error fetching vocabulary data:", e);
    return NextResponse.json(
      { error: "Internal Server Error", details: e.message },
      { status: 500 }
    );
  }
}
