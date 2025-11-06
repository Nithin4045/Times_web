// app/api/get_users_course_details/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const rid = Math.random().toString(36).slice(2, 8);
  console.log(`\n==============================`);
  console.log(`[COURSE_DETAILS:${rid}] START`);

  try {
    const ct = req.headers.get("content-type") || "";
    console.log(`[COURSE_DETAILS:${rid}] Content-Type:`, ct);

    if (!ct.toLowerCase().includes("multipart/form-data")) {
      console.warn(`[COURSE_DETAILS:${rid}] Bad content-type:`, ct);
      console.log(`[COURSE_DETAILS:${rid}] END (400 - Invalid Content-Type)`);
      return NextResponse.json(
        { success: false, error: "Use multipart/form-data with field 'id_card_no'." },
        { status: 400 }
      );
    }

    const fd = await req.formData();
    console.log(`[COURSE_DETAILS:${rid}] Raw FormData:`, Object.fromEntries(fd.entries()));

    const idCardNo = (fd.get("id_card_no") as string | null)?.trim() ?? "";
    console.log(`[COURSE_DETAILS:${rid}] id_card_no:`, idCardNo);

    if (!idCardNo) {
      console.warn(`[COURSE_DETAILS:${rid}] Missing id_card_no`);
      console.log(`[COURSE_DETAILS:${rid}] END (400 - Missing id_card_no)`);
      return NextResponse.json(
        { success: false, error: "id_card_no is required" },
        { status: 400 }
      );
    }

    // console.log(`[COURSE_DETAILS:${rid}] Querying database for id_card_no='${idCardNo}'`);

    const rows = await prisma.$queryRaw<Array<{ data: any }>>`
      SELECT public.get_user_courses_upcoming_class(${idCardNo}::text)::jsonb AS data
    `;

    const db = rows?.[0]?.data ?? null;

    if (!db) {
      // console.warn(`[COURSE_DETAILS:${rid}] No data returned from DB function`);
      // console.log(`[COURSE_DETAILS:${rid}] END (200 - Empty result)`);
      return NextResponse.json(
        { success: true, id_card_no: idCardNo, courses_count: 0, courses: [], next_class: null },
        { status: 200 }
      );
    }

    // console.log(`[COURSE_DETAILS:${rid}] Raw function output:`, JSON.stringify(db, null, 2));

    const coursesCount =
      typeof db.courses_count === "number"
        ? db.courses_count
        : Array.isArray(db.courses)
        ? db.courses.length
        : 0;

    const payload = {
      success: true,
      ...db,
      courses_count: coursesCount,
      next_class: db.next_class ?? null,
    };

    // console.log(`[COURSE_DETAILS:${rid}] Computed courses_count:`, coursesCount);
    // console.log(`[COURSE_DETAILS:${rid}] Final payload:`, JSON.stringify(payload, null, 2));

    // console.log(`[COURSE_DETAILS:${rid}] END (200 - Success)`);
    // console.log(`==============================\n`);

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error(`[COURSE_DETAILS:${rid}] ERROR:`, err);
    console.error(`[COURSE_DETAILS:${rid}] Stack Trace:`, err?.stack);

    const hint =
      process.env.NODE_ENV !== "production"
        ? "Verify get_user_courses_upcoming_class(text) builds 'next_class' and minimal 'courses'."
        : undefined;

    console.log(`[COURSE_DETAILS:${rid}] END (500 - Server error)`);
    console.log(`==============================\n`);

    return NextResponse.json(
      { success: false, error: "Server error", hint, details: err?.message },
      { status: 500 }
    );
  }
}
