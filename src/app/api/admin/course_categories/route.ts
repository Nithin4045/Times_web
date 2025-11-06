import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Parse JSON or multipart bodies
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
    const rows = await prisma.course_categories.findMany({ orderBy: { created_at: "desc" } });
    return NextResponse.json({ success: true, count: rows.length, data: rows }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/course_categories error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);

    const category = String(body.category ?? "").trim();
    const created_by_raw = String(body.created_by ?? "").trim();
    const updated_by_raw = body.updated_by != null ? String(body.updated_by).trim() : "";

    if (!category || !created_by_raw) {
      return NextResponse.json(
        { success: false, error: "category and created_by are required" },
        { status: 400 }
      );
    }

    // Duplicate category check (case-insensitive)
    const dup = await prisma.course_categories.findFirst({
      where: { category: { equals: category, mode: "insensitive" } },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json(
        { success: false, error: "Category already exists", field: "category" },
        { status: 409 }
      );
    }

    const created_by = Number(created_by_raw);
    if (Number.isNaN(created_by)) {
      return NextResponse.json({ success: false, error: "created_by must be a number" }, { status: 400 });
    }

    const updated_by = updated_by_raw ? Number(updated_by_raw) : null;
    if (updated_by_raw && Number.isNaN(updated_by)) {
      return NextResponse.json({ success: false, error: "updated_by must be a number" }, { status: 400 });
    }

    const created = await prisma.course_categories.create({
      data: { category, created_by, updated_by: updated_by ?? undefined },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/course_categories error", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Duplicate value for a unique field (category)" },
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

    if (body.category != null) {
      const newCat = String(body.category).trim();
      if (!newCat) {
        return NextResponse.json({ success: false, error: "category cannot be empty" }, { status: 400 });
      }
      // Duplicate check excluding this id
      const dup = await prisma.course_categories.findFirst({
        where: { category: { equals: newCat, mode: "insensitive" }, NOT: { id } },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json(
          { success: false, error: "Category already exists", field: "category" },
          { status: 409 }
        );
      }
      data.category = newCat;
    }

    if (body.updated_by != null) {
      const ub = Number(String(body.updated_by).trim());
      if (!Number.isNaN(ub)) data.updated_by = ub;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.course_categories.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/course_categories error", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Duplicate value for a unique field (category)" },
        { status: 409 }
      );
    }
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
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

    await prisma.course_categories.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/course_categories error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
