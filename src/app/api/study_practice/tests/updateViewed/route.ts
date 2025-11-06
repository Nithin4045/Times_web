// src/app/api/study_practice/tests/updateViewed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const id_card_no = (form.get("id_card_no") ?? "").toString().trim();
    // Accept either "test_id" or "testId" from the client
    const testRaw = form.get("test_id") ?? form.get("testId");
    const testId = testRaw != null ? Number(testRaw) : NaN;

    if (!id_card_no || !Number.isFinite(testId)) {
      return NextResponse.json(
        { success: false, error: "id_card_no and testId/test_id are required" },
        { status: 400 }
      );
    }

    console.log("[updateViewed] input =", { id_card_no, testId });

    // NOTE: If your Prisma model uses snake_case (test_id), change `testId` below to `test_id`.
    const attempt = await prisma.test_attempts.updateMany({
      where: {
        id_card_no,
        test_id:testId,                // <-- change to `test_id: testId` if your Prisma field is snake_case
      },
      data: {
        viewed_report: true,   // correct column name
      },
    });

    if (attempt.count === 0) {
      return NextResponse.json(
        { success: false, error: "No matching test attempt found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, updated: attempt.count });
  } catch (error: any) {
    console.error("❌ Error updating viewed_report:", {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { success: false, error: "Failed to update viewed_report" },
      { status: 500 }
    );
  }
}
