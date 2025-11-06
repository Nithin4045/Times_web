// app/<your-route>/api/get-study-resources/route.ts
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs'; // keep Node.js runtime

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const rawType = form.get('type');
    const rawCourseId = form.get('course_id');

    if (!rawType || !rawCourseId) {
      console.warn("⚠️ Missing input fields", { rawType, rawCourseId });
      return NextResponse.json(
        { ok: false, error: "Missing required fields 'type' and/or 'course_id'." },
        { status: 400 }
      );
    }

    const p_type = String(rawType);
    const p_course_id = parseInt(String(rawCourseId), 10); // force integer

    // ✅ Log normalized input
    console.log("📥 Received inputs for get-study-resources:", {
      type: p_type,
      course_id: p_course_id,
    });

    if (Number.isNaN(p_course_id)) {
      console.error("❌ Invalid course_id (not a number):", rawCourseId);
      return NextResponse.json(
        { ok: false, error: "'course_id' must be a valid integer." },
        { status: 400 }
      );
    }

    // ✅ Cast to int explicitly inside SQL
    const rows: Array<{ result: any }> = await prisma.$queryRawUnsafe(
      `SELECT public.get_study_resources_by_type_and_course($1, $2::int) AS result`,
      p_type,
      p_course_id
    );

    const dbResult = rows?.[0]?.result ?? null;

    if (!dbResult) {
      console.log("ℹ️ No results returned for:", { type: p_type, course_id: p_course_id });
      return NextResponse.json(
        { ok: true, count: 0, items: [], note: 'No data returned from function.' },
        { status: 200 }
      );
    }

    let payload: any = dbResult;
    if (typeof dbResult === 'string') {
      try {
        payload = JSON.parse(dbResult);
      } catch {
        console.warn("⚠️ Could not parse DB result as JSON, returning raw string.");
      }
    }

    console.log("✅ Study Resource Query Success:", {
      type: p_type,
      course_id: p_course_id,
      items: Array.isArray(payload) ? payload.length : 1,
    });

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error('💥 Error in /api/get-study-resources:', err);
    return NextResponse.json(
      { ok: false, error: 'Internal server error', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
