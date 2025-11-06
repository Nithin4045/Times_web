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
    const rows = await prisma.variants.findMany({ orderBy: { created_at: "desc" } });
    return NextResponse.json({ success: true, count: rows.length, data: rows }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/variants error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);
    const variant = String(body.variant ?? "").trim();
    const description = String(body.description ?? "").trim() || null;

    if (!variant) {
      return NextResponse.json({ success: false, error: "variant is required" }, { status: 400 });
    }

    // Duplicate name check (case-insensitive)
    const dup = await prisma.variants.findFirst({
      where: { variant: { equals: variant, mode: "insensitive" } },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json(
        { success: false, error: "Variant already exists", field: "variant" },
        { status: 409 }
      );
    }

    const created = await prisma.variants.create({
      data: { variant, description: description || undefined },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/variants error", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Duplicate value for a unique field (variant)" },
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
    if (body.variant != null) {
      const newName = String(body.variant).trim();
      if (!newName) {
        return NextResponse.json({ success: false, error: "variant cannot be empty" }, { status: 400 });
      }
      // Duplicate name check excluding current id
      const dup = await prisma.variants.findFirst({
        where: { variant: { equals: newName, mode: "insensitive" }, NOT: { id } },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json(
          { success: false, error: "Variant already exists", field: "variant" },
          { status: 409 }
        );
      }
      data.variant = newName;
    }
    if (body.description != null) data.description = String(body.description).trim();

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.variants.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/variants error", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Duplicate value for a unique field (variant)" },
        { status: 409 }
      );
    }
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Variant not found" }, { status: 404 });
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

    await prisma.variants.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/variants error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Variant not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
