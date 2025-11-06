// src/app/api/study_practice/courses/course_materials/mark_read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Expecting JSON: { id_card_no: string, material_id: number }
    const body = await req.json().catch((e) => {
      console.error("[mark_read] Failed to parse JSON body", e);
      return null;
    });

    console.log("[mark_read] Incoming body:", body);

    const idCardNo = (body?.id_card_no ?? "").toString().trim();
    const materialId = Number(body?.material_id);

    console.log("[mark_read] Parsed:", { idCardNo, materialId });

    // Validate inputs (materialId must be a positive integer)
    if (!idCardNo || !Number.isInteger(materialId) || materialId <= 0) {
      console.warn("[mark_read] Validation failed", { idCardNo, materialId });
      return NextResponse.json(
        { error: "id_card_no (string) and material_id (positive integer) are required" },
        { status: 400 }
      );
    }

    // Get the most recent users_courses row for this user
    const userCourse = await prisma.users_courses.findFirst({
      where: { id_card_no: idCardNo },
      orderBy: { updated_at: "desc" },
      select: { id: true, completed_materials: true },
    });

    console.log("[mark_read] Found userCourse:", userCourse);

    if (!userCourse) {
      return NextResponse.json(
        { error: "No users_courses row found for this id_card_no" },
        { status: 404 }
      );
    }

    // completed_materials is Int[] per your Prisma schema
    const currentArr: number[] = Array.isArray(userCourse.completed_materials)
      ? [...userCourse.completed_materials]
      : [];

    // Add if missing (dedupe)
    if (!currentArr.includes(materialId)) {
      currentArr.push(materialId);
    }

    // Optional: keep sorted for readability (ascending)
    currentArr.sort((a, b) => a - b);

    console.log("[mark_read] Updating completed_materials:", currentArr);

    await prisma.users_courses.update({
      where: { id: userCourse.id },
      data: { completed_materials: currentArr },
    });

    return NextResponse.json(
      {
        id_card_no: idCardNo,
        updated: true,
        completed_materials: currentArr,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[mark_material_as_read][POST] DB error", {
      message: err?.message,
      stack: err?.stack,
    });

    return NextResponse.json(
      { error: "Server error", hint: err?.message },
      { status: 500 }
    );
  }
}
