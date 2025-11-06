// src/app/api/study_practice/tests/attempt/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const id_card_no = (form.get("id_card_no") ?? "").toString().trim();
    const testIdRaw = form.get("testId");
    const testId = testIdRaw != null ? Number(testIdRaw) : NaN;

    if (!id_card_no || !Number.isFinite(testId)) {
      console.warn("⚠️ Missing parameters for test attempt", {
        id_card_no,
        testIdRaw,
      });
      return NextResponse.json(
        { success: false, error: "Missing or invalid id_card_no / testId" },
        { status: 400 }
      );
    }

    // Insert into test_attempts with status STARTED
    await prisma.test_attempts.create({
      data: {
        id_card_no,
        test_id: testId,
        status: "STARTED",
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error creating test attempt:", error);
    return NextResponse.json(
      { success: false, error: "Failed to start test" },
      { status: 500 }
    );
  }
}
