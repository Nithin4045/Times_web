// src/app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Normalize row: BigInt -> number, Date -> ISO string
 */
function normalizeRow(row: any) {
  const r: any = { ...row };
  if (typeof r.id === "bigint") r.id = Number(r.id);
  if (r.created_at instanceof Date) r.created_at = r.created_at.toISOString();
  if (r.updated_at instanceof Date) r.updated_at = r.updated_at.toISOString();
  // If other bigint columns exist, convert here as needed
  return r;
}

export async function POST(req: Request) {
  const now = new Date().toISOString();

  try {
    // Read form-data (your client sends a FormData body)
    const fd = await req.formData();
    const id_cardno = fd.get("id_cardno")?.toString() ?? "";
    const limitRaw = fd.get("limit")?.toString();

    // limit: if numeric -> number, otherwise null => request "all"
    const limit = limitRaw && !isNaN(Number(limitRaw)) ? Number(limitRaw) : null;

    console.log(
      `[API][NOTIF][${now}] POST /api/notifications — id_cardno=${id_cardno || "none"} limit=${limit ?? "ALL"}`
    );

    if (!id_cardno) {
      return NextResponse.json(
        { success: false, error: "id_cardno is required" },
        { status: 400 }
      );
    }

    // Call Postgres function with explicit casts.
    // IMPORTANT:
    //  - use $1::text to ensure first arg is text
    //  - use $2::int to ensure second arg is int. If your PG function expects bigint, change to $2::bigint
    //
    // When `limit` is null we pass null — the call will be get_notifications(id_cardno::text, NULL::int).
    const sql = `SELECT * FROM get_notifications($1::text, $2::int)`;

    // Use parameterized call (safe). prisma will pass `null` if limit === null.
    const rows = await prisma.$queryRawUnsafe<any[]>(
      sql,
      id_cardno,
      limit
    );

    // Log raw rows for debugging
    console.log(`[API][NOTIF][${now}] Raw rows from DB:`, rows?.length ?? 0);
    if (Array.isArray(rows) && rows.length > 0) {
      // Optionally log first few rows (safe for dev)
      console.log(`[API][NOTIF][${now}] First row preview:`, rows[0]);
    }

    const normalized = (Array.isArray(rows) ? rows : []).map(normalizeRow);

    console.log(
      `[API][NOTIF][${now}] Returning ${normalized.length} normalized notification(s)`
    );

    return NextResponse.json(
      { success: true, data: normalized },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[API][NOTIF][${now}] Error:`, err);
    // If Postgres complains about function not found, include the message in logs (avoid leaking to client)
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
