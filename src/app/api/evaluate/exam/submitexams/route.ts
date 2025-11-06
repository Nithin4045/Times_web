// app/api/evaluate/exam/submitexams/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Answer {
  question_number: string | number;
  user_answer?: string;
  // ...other fields allowed but not required for DB update
  [k: string]: any;
}

interface RequestBody {
  test_id: string;
  subject_id: string | number;
  answers: Answer[];
  user_test_id: string;
  timer_value: string;
  user_id?: number | null;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { test_id, subject_id, answers, user_test_id, timer_value, user_id } = body;



    // Basic validation (same as your MSSQL route)
    if (!test_id || !subject_id || !answers || !user_test_id || !timer_value) {
      return NextResponse.json({ message: "Missing required parameters" }, { status: 400 });
    }

    console.log("[submitexams] received:", { test_id, subject_id, answers: answers, answersLength: Array.isArray(answers) ? answers.length : 0, user_test_id, timer_value, user_id });
    // Convert answers array to a JSON string for storage in answer_data.
    // In MSSQL you replaced some chars; in Postgres you can store proper JSON text.
    const answerData = JSON.stringify(answers);
    console.log("answerData:", answerData);

    // Call the Postgres function created above
    // Use prisma.$queryRaw with parameter interpolation (safe)
    const result = (await prisma.$queryRaw`
      SELECT submit_exam_answers(
        ${Number(test_id)}::int,
        ${Number(subject_id)}::int,
        ${Number(user_test_id)}::int,
        ${answerData}::jsonb,
        ${timer_value}::text,
        ${user_id ?? null}::int
      ) AS message
    `) as Array<{ message: string }>;

    const message = result[0]?.message ?? "No response from DB";

    return NextResponse.json({ message }, { status: 200 });
  } catch (err: any) {
    console.error("Error in submitexams POST:", err);
    const msg = err?.message ?? "Error submitting exam answers";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
