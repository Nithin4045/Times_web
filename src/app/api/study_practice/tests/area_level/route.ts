// app/api/study_practice/tests/area_level/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const getStr = (fd: FormData, key: string): string | null => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : null;
};
const toInt = (v: string | null): number | null => {
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};

export async function POST(req: NextRequest) {
  const rid = Math.random().toString(36).slice(2, 8);

  try {
    const fd = await req.formData();

    const test_type_id = toInt(getStr(fd, "test_type_id"));
    const course_id    = toInt(getStr(fd, "course_id"));
    const city_id      = toInt(getStr(fd, "city_id"));
    const center_id    = toInt(getStr(fd, "center_id"));
    const batch_id     = toInt(getStr(fd, "batch_id"));
    const id_card_no   = getStr(fd, "id_card_no") || null;

    console.log("POST /tests/area_level → area_level:", {
      test_type_id, course_id, batch_id
    });

    // Call the SQL function with explicit casts to match:
    // get_tests_area_level(INT, INT, INT, INT, INT, TEXT)
    const rows = await prisma.$queryRaw<Array<{ data: any }>>`
      SELECT public.get_tests_area_level(
        CAST(${test_type_id} AS INT),
        CAST(${course_id}    AS INT),
        CAST(${city_id}      AS INT),
        CAST(${center_id}    AS INT),
        CAST(${batch_id}     AS INT),
        CAST(${id_card_no}   AS TEXT)
      )::jsonb AS data
    `;

    const data = rows?.[0]?.data ?? null;

    console.log("POST /tests/area_level → data from function:", JSON.stringify(data, null, 2));

    if (!data) {
      // console.log(`[tests/area_level:${rid}] function returned null`);
      return NextResponse.json(
        { success: true, matched_count: 0, areas: [], levels: [] },
        { status: 200 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error(`POST /tests/area_level error [${rid}]:`, {
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
    });
    const hint =
      process.env.NODE_ENV !== "production"
        ? "Make sure get_tests_area_level(_test_type_id INT, _course_id INT, _city_id INT, _center_id INT, _batch_id INT, _id_card_no TEXT) exists, and we CAST each arg to the correct type."
        : undefined;

    return NextResponse.json({ success: false, error: "Server error", hint }, { status: 500 });
  }
}
