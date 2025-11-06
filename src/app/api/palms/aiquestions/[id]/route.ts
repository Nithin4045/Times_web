// src/app/api/palms/aiquestions/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";           // Prisma => Node runtime
export const dynamic = "force-dynamic";    // this route is dynamic
export const revalidate = 0;               // no caching
export const fetchCache = "force-no-store";
export const dynamicParams = true;

// In Next.js 15 (and some 14 canaries), `params` is async.
type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: Params) {
  try {
    // ✅ await params before using its properties
    const { id: idStr } = await context.params;

    if (!/^\d+$/.test(idStr)) {
      return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
    }
    const idNum = Number(idStr);

    const body = await req.json().catch(() => ({} as any));
    const {
      question,
      options,          // string[]
      correctIndex,     // 0..3
      correct_ans,      // string
      status,
      changes,
    }: {
      question?: string;
      options?: string[];
      correctIndex?: number;
      correct_ans?: string;
      status?: number;
      changes?: string;
    } = body ?? {};

    // --- fetch current to validate ---
    const existing = await prisma.replicated_questions.findUnique({
      where: { id: idNum },
      select: { id: true, options: true, correct_ans: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // parse existing options (stored as JSON string)
    let currentOptions: string[] = [];
    try {
      const parsed = JSON.parse(existing.options ?? "[]");
      currentOptions = Array.isArray(parsed) ? parsed : [];
    } catch {
      currentOptions = [];
    }

    // validate new options (exactly 4, non-empty)
    let finalOptions = currentOptions;
    if (options !== undefined) {
      if (!Array.isArray(options) || options.length !== 4) {
        return NextResponse.json(
          { error: "options must be an array of exactly 4 strings" },
          { status: 400 }
        );
      }
      const trimmed = options.map((o) => (typeof o === "string" ? o.trim() : ""));
      if (trimmed.some((o) => !o)) {
        return NextResponse.json(
          { error: "All 4 options must be non-empty" },
          { status: 400 }
        );
      }
      finalOptions = trimmed;
    }

    // resolve correct answer
    let finalCorrectAns = existing.correct_ans ?? "";
    const hasCI = typeof correctIndex === "number";
    const hasCA = typeof correct_ans === "string" && correct_ans.length > 0;

    if (hasCI && hasCA) {
      if (correctIndex! < 0 || correctIndex! > 3) {
        return NextResponse.json({ error: "correctIndex must be 0..3" }, { status: 400 });
      }
      if (finalOptions[correctIndex!] !== correct_ans) {
        return NextResponse.json(
          { error: "correctIndex and correct_ans conflict" },
          { status: 400 }
        );
      }
      finalCorrectAns = correct_ans!;
    } else if (hasCI) {
      if (correctIndex! < 0 || correctIndex! > 3) {
        return NextResponse.json({ error: "correctIndex must be 0..3" }, { status: 400 });
      }
      finalCorrectAns = finalOptions[correctIndex!];
    } else if (hasCA) {
      if (!finalOptions.includes(correct_ans!)) {
        return NextResponse.json(
          { error: "correct_ans must be one of the 4 options" },
          { status: 400 }
        );
      }
      finalCorrectAns = correct_ans!;
    } else if (options !== undefined && !finalOptions.includes(finalCorrectAns)) {
      return NextResponse.json(
        {
          error:
            "Existing correct answer is not in the new options. Provide correctIndex or correct_ans.",
        },
        { status: 400 }
      );
    }

    const dataToUpdate: any = { updated_at: new Date() };
    if (typeof question === "string") {
      const qTrim = question.trim();
      if (!qTrim) return NextResponse.json({ error: "question cannot be empty" }, { status: 400 });
      dataToUpdate.question = qTrim;
    }
    if (options !== undefined) dataToUpdate.options = JSON.stringify(finalOptions);
    if (hasCI || hasCA || options !== undefined) dataToUpdate.correct_ans = finalCorrectAns;
    if (typeof changes === "string") dataToUpdate.applied_edits = changes;

    if (Object.keys(dataToUpdate).length === 1) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const updated = await prisma.replicated_questions.update({
      where: { id: idNum },
      data: dataToUpdate,
    });

    return NextResponse.json(
      {
        success: true,
        id: updated.id,
        question: updated.question,
        options: updated.options,
        correct_ans: updated.correct_ans,
        updated_at: updated.updated_at,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PATCH /api/palms/aiquestions/[id] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
