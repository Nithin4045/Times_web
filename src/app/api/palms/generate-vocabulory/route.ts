import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const words = formData.get("words")?.toString() || "";
    const hobby = formData.get("hobby")?.toString() || "";
    const num_questions = parseInt(formData.get("num_questions")?.toString() || "5");
    const user_id = parseInt(formData.get("user_id")?.toString() || "1234");

    const payload = { words, hobby, num_questions };

    const FASTAPI_URL = `${process.env.NEXT_PUBLIC_PYTHON_SERVER || "http://localhost:8000/"}vocabulary/generate`;

    const fetchResponse = await fetch(FASTAPI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await fetchResponse.json();
    console.log("✅ Vocabulary JSON received:", data);

    if (data?.error) {
      console.error("❌ FastAPI logic error:", data.error);
      return NextResponse.json(
        { error: "FastAPI logic failed", details: data.error },
        { status: 400 }
      );
    }

    const { paragraph, questions } = data;

    if (!paragraph || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty response from FastAPI", raw: data },
        { status: 400 }
      );
    }

    const vocabPaperId = `VOCAB_${Date.now()}`;
    
    // Save all questions to replicated_questions as main questions
    const insertPromises = questions.map((q, idx) =>
      prisma.replicated_questions.create({
        data: {
          paper_id: vocabPaperId,
          question_id: `VOC${idx + 1}`,
          job_id: 0,
          parent_id: null, // Main questions from vocabulary generation
          question: q.question,
          options: JSON.stringify(q.options || []),
          correct_ans: q.correct_answer,
          solution: null,
          applied_edits: null, // No transformations for main questions
          prompt: null,
          user_id,
          deleted: 0,
        },
      })
    );

    const savedQuestions = await prisma.$transaction(insertPromises);

    return NextResponse.json({
      message: "Vocabulary questions saved successfully",
      question_id: savedQuestions[0]?.id,
      paper_id: vocabPaperId,
      paragraph,
      questions,
    });

  } catch (error: any) {
    console.error("❌ Error in Next.js route:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
