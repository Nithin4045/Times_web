import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toNullableInt(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toNullableText(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

export async function POST(req: NextRequest) {
  const rid = Math.random().toString(36).slice(2, 8);
  console.log(`\n==============================`);
  console.log(`[NAV_CONTENTS:${rid}] START`);

  try {
    const ct = req.headers.get("content-type") || "";
    console.log(`[NAV_CONTENTS:${rid}] Content-Type:`, ct);

    if (!ct.toLowerCase().includes("multipart/form-data")) {
      console.warn(`[NAV_CONTENTS:${rid}] Invalid content-type.`);
      console.log(`[NAV_CONTENTS:${rid}] END (400 - Invalid Content-Type)`);
      return NextResponse.json(
        { success: false, error: "Use multipart/form-data." },
        { status: 400 }
      );
    }

    const fd = await req.formData();

    const p_id_card_no = toNullableText(fd.get("id_card_no"));
    const p_batch_id = toNullableInt(fd.get("batch_id"));

    // Optional values for context
    const p_center_id = toNullableInt(fd.get("center_id"));
    const p_city_id = toNullableInt(fd.get("city_id"));
    const p_course_id = toNullableInt(fd.get("course_id"));

    console.log(`[NAV_CONTENTS:${rid}] Input Params`, {
      id_card_no: p_id_card_no,
      batch_id: p_batch_id,
      center_id: p_center_id,
      city_id: p_city_id,
      course_id: p_course_id,
    });

    // ✅ Call the 2-arg function; NO trailing comma
    console.log(`[NAV_CONTENTS:${rid}] Executing query...`);
    const rows = await prisma.$queryRaw<Array<{ data: any }>>`
      SELECT public.get_nav_contents_grouped(
        ${p_id_card_no}::text,
        ${p_batch_id}::int
      ) AS data
    `;

    const data = rows?.[0]?.data ?? null;

    console.log(`[NAV_CONTENTS:${rid}] END (200 - Success)`);
    console.log(`==============================\n`);

    return NextResponse.json(
      {
        success: true,
        filters: {
          id_card_no: p_id_card_no,
          batch_id: p_batch_id,
          center_id: p_center_id,
          city_id: p_city_id,
          course_id: p_course_id,
        },
        result:
          data ?? {
            general_info: [],
            tests: [],
            buttons: [],
            accordion: [],
          },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[NAV_CONTENTS:${rid}] ERROR`, {
      message: err?.message,
      code: err?.code,
      meta: err?.meta,
      stack: err?.stack,
    });
    console.log(`[NAV_CONTENTS:${rid}] END (500 - Error)`);
    console.log(`==============================\n`);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
