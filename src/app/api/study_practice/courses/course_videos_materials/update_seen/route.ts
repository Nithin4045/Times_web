// app/api/courses/mark_topic_completed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust if needed

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const id_card_no = String(form.get("id_card_no") ?? "").trim();
    const batch_id_val = form.get("batch_id");
    const topic_id_val = form.get("topic_id");

    const batch_id = batch_id_val != null ? Number(batch_id_val) : NaN;
    const topic_id = topic_id_val != null ? Number(topic_id_val) : NaN;

    // Basic validation
    if (!id_card_no) {
      return NextResponse.json(
        { success: false, error: "MISSING_ID_CARD_NO" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(batch_id)) {
      return NextResponse.json(
        { success: false, error: "MISSING_OR_INVALID_BATCH_ID" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(topic_id)) {
      return NextResponse.json(
        { success: false, error: "MISSING_OR_INVALID_TOPIC_ID" },
        { status: 400 }
      );
    }

    // Ensure the batch exists (also to fetch course_id for the response)
    const batch = await prisma.batches.findUnique({
      where: { id: batch_id },
      select: { id: true, course_id: true },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "BATCH_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Find the most recent enrollment row for this id_card_no + batch_id
    const enrollment = await prisma.users_courses.findFirst({
      where: {
        id_card_no,
        batch_id: batch_id,
      },
      orderBy: { updated_at: "desc" },
      select: {
        id: true,
        id_card_no: true,
        batch_id: true,
        completed_topics: true, // Int[]
        updated_at: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: "ENROLLMENT_NOT_FOUND",
          message: "id_card_no and batch_id do not match any enrollment",
        },
        { status: 404 }
      );
    }

    // Work with Int[] (NOT a comma-separated string)
    const existing: number[] = Array.isArray(enrollment.completed_topics)
      ? [...enrollment.completed_topics]
      : [];

    if (!existing.includes(topic_id)) existing.push(topic_id);
    // sort ascending & dedupe (Set is defensive)
    const newCompleted = Array.from(new Set(existing)).sort((a, b) => a - b);

    // Update array in Postgres via Prisma: use { set: [...] }
    const updated = await prisma.users_courses.update({
      where: { id: enrollment.id },
      data: {
        completed_topics: { set: newCompleted },
        updated_at: new Date(),
      },
      select: {
        id: true,
        id_card_no: true,
        batch_id: true,
        completed_topics: true,
        updated_at: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Topic marked as completed",
        data: {
          id: updated.id,
          id_card_no: updated.id_card_no,
          batch_id: updated.batch_id,
          course_id: batch.course_id ?? null, // from batches table
          completed_topics: updated.completed_topics, // number[]
          updated_datetime: updated.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[mark_topic_completed] error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
