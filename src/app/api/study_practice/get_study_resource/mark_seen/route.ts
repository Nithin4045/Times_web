// app/api/study_practice/study_resources/mark_seen/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const idCardNo = form.get("id_card_no")?.toString().trim() ?? "";
    const srIdRaw = form.get("study_resource_id")?.toString().trim() ?? "";
    const courseIdRaw = form.get("course_id")?.toString().trim() ?? "";

    const studyResourceId = Number(srIdRaw);
    const courseId = courseIdRaw && !Number.isNaN(Number(courseIdRaw))
      ? Number(courseIdRaw)
      : undefined;

    if (!idCardNo || Number.isNaN(studyResourceId)) {
      return NextResponse.json(
        { success: false, error: "id_card_no and valid study_resource_id are required" },
        { status: 400 }
      );
    }

    // Note: users_courses has no course_id column. We log but can’t filter by course here.
    if (courseId !== undefined) {
      console.warn(
        "[study_resources.mark_seen] course_id was provided but users_courses has no course_id column; ignoring filter.",
        { course_id: courseId }
      );
    }

    // 1) Find the most recent users_courses row for this user
    const userCourse = await prisma.users_courses.findFirst({
      where: { id_card_no: idCardNo },
      orderBy: { updated_at: "desc" },
      select: {
        id: true,
        completed_study_resources: true, // number[]
      },
    });

    if (!userCourse) {
      return NextResponse.json(
        { success: false, error: "No users_courses row found for this id_card_no" },
        { status: 404 }
      );
    }

    // 2) Work with the existing Int[] array
    const currentArr: number[] = Array.isArray(userCourse.completed_study_resources)
      ? userCourse.completed_study_resources
      : [];

    const set = new Set<number>(currentArr);
    const beforeSize = set.size;
    set.add(studyResourceId);

    const updatedArray = Array.from(set).sort((a, b) => a - b);
    const changed = set.size !== beforeSize;

    if (changed) {
      // 3) Persist back as Int[] using Prisma's set
      await prisma.users_courses.update({
        where: { id: userCourse.id },
        data: {
          completed_study_resources: { set: updatedArray },
          updated_at: new Date(),
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        id_card_no: idCardNo,
        users_courses_id: userCourse.id,
        marked_id: studyResourceId,
        updated: changed,
        // If you want to return the whole list (optional):
        // completed_study_resources: updatedArray,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const e = err as { message?: string; stack?: string };
    console.error("[study_resources.mark_seen][POST] error", {
      message: e?.message,
      stack: e?.stack,
    });
    return NextResponse.json(
      { success: false, error: "Server error", hint: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
