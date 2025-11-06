// app/api/admin/courses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FORM_NAME = "courses_form";

const toFloat = (v: any) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
const toBool = (v: any) => {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  return null;
};
const toDate = (v: any) => {
  if (v == null || String(v).trim() === "") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

async function parseBody(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await req.json(); } catch { return {}; }
  }
  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const obj: Record<string, any> = {};
    for (const [k, v] of fd.entries()) obj[k] = typeof v === "string" ? v : "";
    return obj;
  }
  try { return await req.json(); } catch { return {}; }
}

export async function GET() {
  try {
    const [rows, formRow] = await Promise.all([
      prisma.courses.findMany({ orderBy: { created_at: "desc" } }),
      prisma.form_jsons.findUnique({ where: { name: FORM_NAME } }),
    ]);
    return NextResponse.json(
      { success: true, count: rows.length, data: rows, form_name: FORM_NAME, form: formRow?.formjson ?? null },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/admin/courses error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);

    const coursename = String(body.coursename ?? "").trim();
    const price_raw = body.price != null ? String(body.price).trim() : "";
    const image = String(body.image ?? "").trim() || null;
    const active_raw = body.active != null ? String(body.active).trim() : null;
    const offerendtime_raw = body.offerendtime != null ? String(body.offerendtime).trim() : null;
    const offerprice_raw = body.offerprice != null ? String(body.offerprice).trim() : null;
    const offerpercent_raw = body.offerpercent != null ? String(body.offerpercent).trim() : null;
    const type_raw = body.type != null ? String(body.type).trim() : "";

    if (!coursename || !price_raw) {
      return NextResponse.json({ success: false, error: "coursename and price are required" }, { status: 400 });
    }

    // Optional pre-check for duplicate name (case-insensitive)
    const dup = await prisma.courses.findFirst({
      where: { coursename: { equals: coursename, mode: "insensitive" } },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json({ success: false, error: "Course name already exists", field: "coursename" }, { status: 409 });
    }

    const price = toFloat(price_raw);
    if (price === null || Number.isNaN(price)) {
      return NextResponse.json({ success: false, error: "price must be a valid number" }, { status: 400 });
    }

    const active = toBool(active_raw);
    const offerendtime = toDate(offerendtime_raw);
    const offerprice = offerprice_raw ? toFloat(offerprice_raw) : null;
    const offerpercent = offerpercent_raw ? toFloat(offerpercent_raw) : null;
    if ((offerprice_raw && Number.isNaN(offerprice)) || (offerpercent_raw && Number.isNaN(offerpercent))) {
      return NextResponse.json({ success: false, error: "offerprice/offerpercent must be valid numbers" }, { status: 400 });
    }

    const type = type_raw && type_raw.length > 0 ? (type_raw as any) : undefined;

    const created = await prisma.courses.create({
      data: {
        coursename,
        price,
        image: image || undefined,
        active: active ?? undefined,
        offerendtime: offerendtime || undefined,
        offerprice: offerprice ?? undefined,
        offerpercent: offerpercent ?? undefined,
        type,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/courses error", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Duplicate value for a unique field (coursename)" },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await parseBody(req);

    const idRaw = String(body.id ?? "").trim();
    const id = Number(idRaw);
    if (!idRaw || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "Valid id is required" }, { status: 400 });
    }

    const data: any = {};

    if (body.coursename != null) {
      const name = String(body.coursename).trim();
      if (!name) return NextResponse.json({ success: false, error: "coursename cannot be empty" }, { status: 400 });
      // Duplicate name check excluding current id (case-insensitive)
      const dup = await prisma.courses.findFirst({
        where: { coursename: { equals: name, mode: "insensitive" }, NOT: { id } },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json({ success: false, error: "Course name already exists", field: "coursename" }, { status: 409 });
      }
      data.coursename = name;
    }

    if (body.price != null) {
      const price = toFloat(String(body.price));
      if (price === null || Number.isNaN(price)) {
        return NextResponse.json({ success: false, error: "price must be a valid number" }, { status: 400 });
      }
      data.price = price;
    }

    if (body.image != null) data.image = String(body.image).trim() || null;

    if (body.active != null) {
      const a = toBool(String(body.active));
      if (a === null) {
        return NextResponse.json({ success: false, error: "active must be true/false" }, { status: 400 });
      }
      data.active = a;
    }

    if (body.offerendtime !== undefined) {
      const d = toDate(body.offerendtime);
      data.offerendtime = d;
    }
    if (body.offerprice !== undefined) {
      const v = body.offerprice === null ? null : toFloat(String(body.offerprice));
      if (v !== null && Number.isNaN(v)) {
        return NextResponse.json({ success: false, error: "offerprice must be a valid number" }, { status: 400 });
      }
      data.offerprice = v;
    }
    if (body.offerpercent !== undefined) {
      const v = body.offerpercent === null ? null : toFloat(String(body.offerpercent));
      if (v !== null && Number.isNaN(v)) {
        return NextResponse.json({ success: false, error: "offerpercent must be a valid number" }, { status: 400 });
      }
      data.offerpercent = v;
    }

    if (body.type !== undefined) {
      const t = String(body.type || "").trim();
      data.type = t.length ? (t as any) : null; // let Prisma validate enum
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.courses.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/courses error", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Duplicate value for a unique field (coursename)" },
        { status: 409 }
      );
    }
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let idStr = searchParams.get("id");
    if (!idStr) {
      const body = await parseBody(req);
      idStr = String(body.id ?? "").trim();
    }

    const id = Number(idStr);
    if (!idStr || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "Valid id is required" }, { status: 400 });
    }

    await prisma.courses.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/courses error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
