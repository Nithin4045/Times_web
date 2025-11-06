// app/api/study_practice/courses/course_materials/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST endpoint: expects formData { id_card_no, course_id, type }
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const idCardNo = form.get("id_card_no")?.toString().trim() || "";
    const courseIdStr = form.get("course_id")?.toString().trim();
    const typeStr = form.get("type")?.toString().trim();

    if (!idCardNo || !courseIdStr || !typeStr) {
      return NextResponse.json(
        { error: "id_card_no, course_id and type are required" },
        { status: 400 }
      );
    }

    const courseId = Number(courseIdStr);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return NextResponse.json({ error: "Invalid course_id" }, { status: 400 });
    }

    console.log("idcardno: ",idCardNo," courseid: ",courseId," typestr: ",typeStr)
    // Call: public.get_course_materials(_id_card_no text, _course_id int, _type "MaterialType")
    const rows = await prisma.$queryRaw<{ get_course_materials: any }[]>`
      SELECT public.get_course_materials(
        ${idCardNo}::text,
        ${courseId}::int,
        ${typeStr}::"MaterialType"
      ) AS get_course_materials
    `;

    const materials = Array.isArray(rows?.[0]?.get_course_materials)
      ? rows[0]!.get_course_materials
      : [];

    return NextResponse.json(
      { id_card_no: idCardNo, course_id: courseId, type: typeStr, materials },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[get_course_materials][POST] DB error", {
      message: err?.message,
      code: err?.code,
      meta: err?.meta,
      stack: err?.stack,
    });

    const hint =
      process.env.NODE_ENV !== "production"
        ? "Verify public.get_course_materials(text,int,MaterialType) signature and enum."
        : undefined;

    return NextResponse.json({ error: "Server error", hint }, { status: 500 });
  }
}
