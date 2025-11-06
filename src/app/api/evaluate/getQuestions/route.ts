// // app/api/evaluate/getQuestions/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const subjectId = searchParams.get("subjectId");
//     const topicId = searchParams.get("topicId");

//     if (!subjectId || !topicId) {
//       return NextResponse.json(
//         { error: "Missing subject or topic ID" },
//         { status: 400 }
//       );
//     }
//     console.log('GET /getQuestions with:', { subjectId, topicId });

//     // Single SQL to shape + join everything and return UPPER_CASE keys the table uses
//     const rows = await prisma.$queryRaw<Array<Record<string, any>>>`
//       SELECT
//         eq.question_id                         AS "QUESTION_ID",
//         eq.subject_id                          AS "SUBJECT_ID",
//         eq.topic_id                            AS "TOPIC_ID",

//         s.subject_description                  AS "subject_description",
//         t.topic_description                    AS "topic_description",

//         eq.question_number                     AS "QUESTION_NUMBER",
//         eq.question                            AS "QUESTION",

//         eq.choice1                             AS "CHOICE1",
//         eq.choice2                             AS "CHOICE2",
//         eq.choice3                             AS "CHOICE3",
//         eq.choice4                             AS "CHOICE4",

//         eq.answer                              AS "ANSWER",
//         eq.complexity                          AS "COMPLEXITY",
//         eq.question_source                     AS "QUESTION_SOURCE",
//         eq.link                                AS "LINK",

//         eq.created_by                          AS "CREATED_BY",
//         eq.created_date                        AS "CREATED_DATE",
//         eq.modified_by                         AS "MODIFIED_BY",
//         eq.modified_date                       AS "MODIFIED_DATE",

//         eq.question_type                       AS "QUESTION_TYPE",
//         eq.parent_question_number              AS "PARENT_QUESTION_NUMBER",
//         eq.help_text                           AS "Help_text",
//         eq.help_files                          AS "HELP_FILES",
//         eq.options                             AS "OPTIONS",
//         eq.negative_marks                      AS "negative_marks",

//         -- Friendly display names for UI
//         CONCAT_WS(' ', u1.firstname, u1.lastname) AS "CREATED_BY_NAME",
//         CONCAT_WS(' ', u2.firstname, u2.lastname) AS "MODIFIED_BY_NAME"
//       FROM eval_questions eq
//       LEFT JOIN subjects s ON s.subject_id = eq.subject_id
//       LEFT JOIN topics   t ON t.topic_id   = eq.topic_id
//       LEFT JOIN users   u1 ON u1.id        = eq.created_by
//       LEFT JOIN users   u2 ON u2.id        = eq.modified_by
//       WHERE eq.subject_id = ${Number(subjectId)}
//         AND eq.topic_id   = ${Number(topicId)}
//       ORDER BY eq.question_number ASC, eq.question_id ASC
//     `;
//     console.log('fetched questions:',rows);
//     return NextResponse.json(rows, { status: 200 });
//   } catch (error: any) {
//     console.error("Error fetching questions:", error);
//     return NextResponse.json(
//       { error: "Error fetching questions", detail: String(error?.message ?? error) },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();

//     // ---- Coercions ----
//     const SUBJECT_ID = Number(body.SUBJECT_ID);
//     const TOPIC_ID = Number(body.TOPIC_ID);
//     const QUESTION_NUMBER = body.QUESTION_NUMBER?.toString?.() ?? body.QUESTION_NUMBER;

//     const CREATED_BY =
//       body.CREATED_BY === null || body.CREATED_BY === undefined || body.CREATED_BY === ""
//         ? null
//         : Number(body.CREATED_BY);

//     const COMPLEXITY =
//       body.COMPLEXITY === null || body.COMPLEXITY === undefined || body.COMPLEXITY === ""
//         ? null
//         : Number(body.COMPLEXITY);

//     // Decimal: pass as string (Prisma accepts string for Decimal columns)
//     const NEGATIVE_MARKS =
//       body.negative_marks === null || body.negative_marks === undefined || body.negative_marks === ""
//         ? null
//         : String(body.negative_marks);

//     if (!Number.isFinite(SUBJECT_ID) || !Number.isFinite(TOPIC_ID) || !QUESTION_NUMBER) {
//       return NextResponse.json(
//         { message: "SUBJECT_ID, TOPIC_ID, and QUESTION_NUMBER are required and must be valid" },
//         { status: 400 }
//       );
//     }
//     if (CREATED_BY !== null && !Number.isFinite(CREATED_BY)) {
//       return NextResponse.json(
//         { message: "CREATED_BY must be a number or null" },
//         { status: 400 }
//       );
//     }
//     if (COMPLEXITY !== null && !Number.isFinite(COMPLEXITY)) {
//       return NextResponse.json(
//         { message: "COMPLEXITY must be a number or null" },
//         { status: 400 }
//       );
//     }

//     // Duplicate check by (subject_id, topic_id, question_number)
//     const duplicate = await prisma.eval_questions.findFirst({
//       where: {
//         subject_id: SUBJECT_ID,
//         topic_id: TOPIC_ID,
//         question_number: QUESTION_NUMBER,
//       },
//     });

//     if (duplicate) {
//       return NextResponse.json(
//         { message: "Duplicate question number for selected subject and topic" },
//         { status: 409 }
//       );
//     }

//     const question = await prisma.eval_questions.create({
//       data: {
//         subject_id: SUBJECT_ID,
//         topic_id: TOPIC_ID,
//         question_number: QUESTION_NUMBER,
//         question: body.QUESTION ?? null,
//         choice1: body.CHOICE1 ?? null,
//         choice2: body.CHOICE2 ?? null,
//         choice3: body.CHOICE3 ?? null,
//         choice4: body.CHOICE4 ?? null,
//         answer: body.ANSWER ?? null,
//         complexity: COMPLEXITY,
//         question_source: body.QUESTION_SOURCE ?? null,
//         link: body.LINK ?? null,
//         created_date: new Date(),
//         created_by: CREATED_BY,
//         question_type: body.QUESTION_TYPE ?? null,
//         parent_question_number: body.PARENT_QUESTION_NUMBER ?? null,
//         help_text: body.Help_text ?? null,
//         help_files: body.HELP_FILES ?? null,
//         options: body.OPTIONS ?? null,
//         negative_marks: NEGATIVE_MARKS, // string or null
//       },
//     });

//     return NextResponse.json(
//       { message: "Question inserted successfully", question },
//       { status: 200 }
//     );
//   } catch (error: any) {
//     console.error("Add Question Error:", error);
//     return NextResponse.json(
//       { message: "Failed to insert question", detail: String(error?.message ?? error) },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(req: NextRequest) {
//   try {
//     const body = await req.json();

//     // ---- Coercions ----
//     const QUESTION_ID = Number(body.QUESTION_ID);
//     const SUBJECT_ID = Number(body.SUBJECT_ID);
//     const TOPIC_ID = Number(body.TOPIC_ID);
//     const QUESTION_NUMBER = body.QUESTION_NUMBER?.toString?.() ?? body.QUESTION_NUMBER;

//     const MODIFIED_BY =
//       body.MODIFIED_BY === null || body.MODIFIED_BY === undefined || body.MODIFIED_BY === ""
//         ? null
//         : Number(body.MODIFIED_BY);

//     const COMPLEXITY =
//       body.COMPLEXITY === null || body.COMPLEXITY === undefined || body.COMPLEXITY === ""
//         ? null
//         : Number(body.COMPLEXITY);

//     const NEGATIVE_MARKS =
//       body.negative_marks === null || body.negative_marks === undefined || body.negative_marks === ""
//         ? null
//         : String(body.negative_marks);

//     if (!Number.isFinite(QUESTION_ID)) {
//       return NextResponse.json({ message: "Invalid QUESTION_ID" }, { status: 400 });
//     }

//     // Duplicate check for update
//     const duplicate = await prisma.eval_questions.findFirst({
//       where: {
//         subject_id: SUBJECT_ID,
//         topic_id: TOPIC_ID,
//         question_number: QUESTION_NUMBER,
//         NOT: { question_id: QUESTION_ID },
//       },
//     });

//     if (duplicate) {
//       return NextResponse.json(
//         { message: "Duplicate question number for selected subject and topic" },
//         { status: 409 }
//       );
//     }

//     const updated = await prisma.eval_questions.update({
//       where: { question_id: QUESTION_ID },
//       data: {
//         question_number: QUESTION_NUMBER,
//         subject_id: SUBJECT_ID,
//         topic_id: TOPIC_ID,
//         question: body.QUESTION ?? null,
//         choice1: body.CHOICE1 ?? null,
//         choice2: body.CHOICE2 ?? null,
//         choice3: body.CHOICE3 ?? null,
//         choice4: body.CHOICE4 ?? null,
//         answer: body.ANSWER ?? null,
//         modified_date: new Date(),
//         modified_by: MODIFIED_BY,
//         complexity: COMPLEXITY,
//         question_source: body.QUESTION_SOURCE ?? null,
//         link: body.LINK ?? null,
//         question_type: body.QUESTION_TYPE ?? null,
//         parent_question_number: body.PARENT_QUESTION_NUMBER ?? null,
//         help_text: body.Help_text ?? null,
//         help_files: body.HELP_FILES ?? null,
//         options: body.OPTIONS ?? null,
//         negative_marks: NEGATIVE_MARKS, // string or null
//       },
//     });

//     return NextResponse.json(
//       { message: "Question updated successfully", updated },
//       { status: 200 }
//     );
//   } catch (error: any) {
//     console.error("Update failed:", error);
//     return NextResponse.json(
//       { message: "Update failed", detail: String(error?.message ?? error) },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const questionId = searchParams.get("id");

//     if (!questionId) {
//       return NextResponse.json(
//         { error: "Missing QUESTION_ID" },
//         { status: 400 }
//       );
//     }

//     await prisma.eval_questions.delete({
//       where: { question_id: Number(questionId) },
//     });

//     return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
//   } catch (error: any) {
//     console.error("Deletion error:", error);
//     return NextResponse.json(
//       { error: "Failed to delete question", detail: String(error?.message ?? error) },
//       { status: 500 }
//     );
//   }
// }






// app/api/evaluate/getQuestions/route.ts
import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const topicId = searchParams.get("topicId");

    if (!subjectId || !topicId) {
      return NextResponse.json(
        { error: "Missing subject or topic ID" },
        { status: 400 }
      );
    }
    console.log('GET /getQuestions with:', { subjectId, topicId });

    const rows = await prisma.$queryRaw<Array<Record<string, any>>>`
      SELECT
        eq.question_id                         AS "QUESTION_ID",
        eq.subject_id                          AS "SUBJECT_ID",
        eq.topic_id                            AS "TOPIC_ID",

        s.subject_description                  AS "subject_description",
        t.topic_description                    AS "topic_description",

        eq.question_number                     AS "QUESTION_NUMBER",
        eq.question                            AS "QUESTION",

        eq.choice1                             AS "CHOICE1",
        eq.choice2                             AS "CHOICE2",
        eq.choice3                             AS "CHOICE3",
        eq.choice4                             AS "CHOICE4",

        eq.answer                              AS "ANSWER",
        eq.complexity                          AS "COMPLEXITY",
        eq.question_source                     AS "QUESTION_SOURCE",
        eq.link                                AS "LINK",

        eq.created_by                          AS "CREATED_BY",
        eq.created_date                        AS "CREATED_DATE",
        eq.modified_by                         AS "MODIFIED_BY",
        eq.modified_date                       AS "MODIFIED_DATE",

        eq.question_type                       AS "QUESTION_TYPE",
        eq.parent_question_number              AS "PARENT_QUESTION_NUMBER",
        eq.help_text                           AS "Help_text",
        eq.help_files                          AS "HELP_FILES",
        eq.options                             AS "OPTIONS",
        eq.negative_marks                      AS "negative_marks",

        CONCAT_WS(' ', u1.firstname, u1.lastname) AS "CREATED_BY_NAME",
        CONCAT_WS(' ', u2.firstname, u2.lastname) AS "MODIFIED_BY_NAME"
      FROM eval_questions eq
      LEFT JOIN subjects s ON s.subject_id = eq.subject_id
      LEFT JOIN topics   t ON t.topic_id   = eq.topic_id
      LEFT JOIN users   u1 ON u1.id        = eq.created_by
      LEFT JOIN users   u2 ON u2.id        = eq.modified_by
      WHERE eq.subject_id = ${Number(subjectId)}
        AND eq.topic_id   = ${Number(topicId)}
      ORDER BY eq.question_number ASC, eq.question_id ASC
    `;
    console.log('fetched questions:',rows);
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Error fetching questions", detail: String(error?.message ?? error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ---- Coercions ----
    const SUBJECT_ID = Number(body.SUBJECT_ID);
    const TOPIC_ID = Number(body.TOPIC_ID);
    const QUESTION_NUMBER = body.QUESTION_NUMBER?.toString?.() ?? body.QUESTION_NUMBER;

    const CREATED_BY =
      body.CREATED_BY === null || body.CREATED_BY === undefined || body.CREATED_BY === ""
        ? null
        : Number(body.CREATED_BY);

    const COMPLEXITY =
      body.COMPLEXITY === null || body.COMPLEXITY === undefined || body.COMPLEXITY === ""
        ? null
        : Number(body.COMPLEXITY);

    const NEGATIVE_MARKS =
      body.negative_marks === null || body.negative_marks === undefined || body.negative_marks === ""
        ? null
        : String(body.negative_marks);

    if (!Number.isFinite(SUBJECT_ID) || !Number.isFinite(TOPIC_ID) || !QUESTION_NUMBER) {
      return NextResponse.json(
        { message: "SUBJECT_ID, TOPIC_ID, and QUESTION_NUMBER are required and must be valid" },
        { status: 400 }
      );
    }
    if (CREATED_BY !== null && !Number.isFinite(CREATED_BY)) {
      return NextResponse.json(
        { message: "CREATED_BY must be a number or null" },
        { status: 400 }
      );
    }
    if (COMPLEXITY !== null && !Number.isFinite(COMPLEXITY)) {
      return NextResponse.json(
        { message: "COMPLEXITY must be a number or null" },
        { status: 400 }
      );
    }

    // Duplicate check by (subject_id, topic_id, question_number)
    const duplicate = await prisma.eval_questions.findFirst({
      where: {
        subject_id: SUBJECT_ID,
        topic_id: TOPIC_ID,
        question_number: QUESTION_NUMBER,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { message: "Duplicate question number for selected subject and topic" },
        { status: 409 }
      );
    }

    // Normalize ANSWER before insert (support multi-correct comma-separated)
    const normalizedAnswer = normalizeAnswerForServer(body.ANSWER);

    const question = await prisma.eval_questions.create({
      data: {
        subject_id: SUBJECT_ID,
        topic_id: TOPIC_ID,
        question_number: QUESTION_NUMBER,
        question: body.QUESTION ?? null,
        choice1: body.CHOICE1 ?? null,
        choice2: body.CHOICE2 ?? null,
        choice3: body.CHOICE3 ?? null,
        choice4: body.CHOICE4 ?? null,
        answer: normalizedAnswer ?? null,
        complexity: COMPLEXITY,
        question_source: body.QUESTION_SOURCE ?? null,
        link: body.LINK ?? null,
        created_date: new Date(),
        created_by: CREATED_BY,
        question_type: body.QUESTION_TYPE ?? null,
        parent_question_number: body.PARENT_QUESTION_NUMBER ?? null,
        help_text: body.Help_text ?? null,
        help_files: body.HELP_FILES ?? null,
        options: body.OPTIONS ?? null,
        negative_marks: NEGATIVE_MARKS, // string or null
      },
    });

    return NextResponse.json(
      { message: "Question inserted successfully", question },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Add Question Error:", error);
    return NextResponse.json(
      { message: "Failed to insert question", detail: String(error?.message ?? error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // ---- Coercions ----
    const QUESTION_ID = Number(body.QUESTION_ID);
    const SUBJECT_ID = Number(body.SUBJECT_ID);
    const TOPIC_ID = Number(body.TOPIC_ID);
    const QUESTION_NUMBER = body.QUESTION_NUMBER?.toString?.() ?? body.QUESTION_NUMBER;

    const MODIFIED_BY =
      body.MODIFIED_BY === null || body.MODIFIED_BY === undefined || body.MODIFIED_BY === ""
        ? null
        : Number(body.MODIFIED_BY);

    const COMPLEXITY =
      body.COMPLEXITY === null || body.COMPLEXITY === undefined || body.COMPLEXITY === ""
        ? null
        : Number(body.COMPLEXITY);

    const NEGATIVE_MARKS =
      body.negative_marks === null || body.negative_marks === undefined || body.negative_marks === ""
        ? null
        : String(body.negative_marks);

    if (!Number.isFinite(QUESTION_ID)) {
      return NextResponse.json({ message: "Invalid QUESTION_ID" }, { status: 400 });
    }

    // Duplicate check for update
    const duplicate = await prisma.eval_questions.findFirst({
      where: {
        subject_id: SUBJECT_ID,
        topic_id: TOPIC_ID,
        question_number: QUESTION_NUMBER,
        NOT: { question_id: QUESTION_ID },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { message: "Duplicate question number for selected subject and topic" },
        { status: 409 }
      );
    }

    // Normalize ANSWER before update
    const normalizedAnswer = normalizeAnswerForServer(body.ANSWER);

    const updated = await prisma.eval_questions.update({
      where: { question_id: QUESTION_ID },
      data: {
        question_number: QUESTION_NUMBER,
        subject_id: SUBJECT_ID,
        topic_id: TOPIC_ID,
        question: body.QUESTION ?? null,
        choice1: body.CHOICE1 ?? null,
        choice2: body.CHOICE2 ?? null,
        choice3: body.CHOICE3 ?? null,
        choice4: body.CHOICE4 ?? null,
        answer: normalizedAnswer ?? null,
        modified_date: new Date(),
        modified_by: MODIFIED_BY,
        complexity: COMPLEXITY,
        question_source: body.QUESTION_SOURCE ?? null,
        link: body.LINK ?? null,
        question_type: body.QUESTION_TYPE ?? null,
        parent_question_number: body.PARENT_QUESTION_NUMBER ?? null,
        help_text: body.Help_text ?? null,
        help_files: body.HELP_FILES ?? null,
        options: body.OPTIONS ?? null,
        negative_marks: NEGATIVE_MARKS, // string or null
      },
    });

    return NextResponse.json(
      { message: "Question updated successfully", updated },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update failed:", error);
    return NextResponse.json(
      { message: "Update failed", detail: String(error?.message ?? error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("id");

    if (!questionId) {
      return NextResponse.json(
        { error: "Missing QUESTION_ID" },
        { status: 400 }
      );
    }

    await prisma.eval_questions.delete({
      where: { question_id: Number(questionId) },
    });

    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete question", detail: String(error?.message ?? error) },
      { status: 500 }
    );
  }
}
