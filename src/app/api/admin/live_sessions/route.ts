// src/app/api/admin/live_sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ---------- GET (already present) ----------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageSize = Math.max(parseInt(searchParams.get("pageSize") || "10", 10), 1);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const offset = (page - 1) * pageSize;

    const totalRows = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM live_sessions ls
      WHERE ls.end_date_time IS NOT NULL
        AND ls.end_date_time >= NOW()
    `;
    const total = totalRows?.[0]?.count ?? 0;

    const rows = await prisma.$queryRaw<
      Array<{
        id: number;
        name: string | null;
        description: string | null;
        session_link: string;
        start_date_time: Date | null;
        end_date_time: Date | null;
        batch_codes: string[] | null;
        city_names: string[] | null;
        center_names: string[] | null;
      }>
    >`
      SELECT
        ls.id,
        ls.name,
        ls.description,
        ls.session_link,
        ls.start_date_time,
        ls.end_date_time,
        COALESCE((
          SELECT array_agg(b.batch_code ORDER BY b.batch_code)
          FROM batches b
          WHERE b.id = ANY (ls.batch_id)
        ), '{}') AS batch_codes,
        COALESCE((
          SELECT array_agg(c.city ORDER BY c.city)
          FROM city c
          WHERE c.id = ANY (ls.city_id)
        ), '{}') AS city_names,
        COALESCE((
          SELECT array_agg(ce.center ORDER BY ce.center)
          FROM centers ce
          WHERE ce.id = ANY (ls.center_id)
        ), '{}') AS center_names
      FROM live_sessions ls
      WHERE ls.end_date_time IS NOT NULL
        AND ls.end_date_time >= NOW()
      ORDER BY COALESCE(ls.start_date_time, ls.end_date_time) ASC
      LIMIT ${pageSize} OFFSET ${offset};
    `;
    return NextResponse.json({ success: true, page, pageSize, total, data: rows }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/admin/live_sessions error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ---------- POST (FIXED to include course_id) ----------
export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await req.json().catch(() => ({})) : {};

    const name = (body.name ?? "").toString().trim() || null;
    const description = (body.description ?? "").toString().trim() || null;
    const session_link = (body.session_link ?? "").toString().trim();
    const startISO = body.start_date_time ? new Date(body.start_date_time) : null;
    const endISO = body.end_date_time ? new Date(body.end_date_time) : null;

    // arrays of ids
    const batch_id  = Array.isArray(body.batch_id)  ? body.batch_id.map((n: any) => Number(n)).filter(Number.isFinite) : [];
    const city_id   = Array.isArray(body.city_id)   ? body.city_id.map((n: any) => Number(n)).filter(Number.isFinite) : [];
    const center_id = Array.isArray(body.center_id) ? body.center_id.map((n: any) => Number(n)).filter(Number.isFinite) : [];
    const course_id = Array.isArray(body.course_id) ? body.course_id.map((n: any) => Number(n)).filter(Number.isFinite) : []; // ✅ ADDED

    if (!session_link) {
      return NextResponse.json({ success: false, error: "session_link is required" }, { status: 400 });
    }
    if (!endISO || Number.isNaN(endISO.getTime())) {
      return NextResponse.json({ success: false, error: "Valid end_date_time is required" }, { status: 400 });
    }
    if (startISO && endISO && startISO > endISO) {
      return NextResponse.json({ success: false, error: "start_date_time cannot be after end_date_time" }, { status: 400 });
    }

    // Optional: validate ids exist if you want strict referential checks

    const created = await prisma.live_sessions.create({
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        session_link,
        start_date_time: startISO ?? undefined,
        end_date_time: endISO ?? undefined,
        batch_id,
        city_id,
        center_id,
        course_id, // ✅ ADDED — this actually saves the selected courses
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/live_sessions error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
