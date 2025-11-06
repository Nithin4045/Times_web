// app/api/admin/city/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helpers to parse body as JSON or FormData seamlessly
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
  // fallback: try json
  try { return await req.json(); } catch { return {}; }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || null;

    const rows = await prisma.city.findMany({
      orderBy: { created_at: "desc" },
      ...(limit ? { take: limit } : {}),
    });

    return NextResponse.json(
      { success: true, count: rows.length, data: rows },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/admin/city error", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);

    const city  = String(body.city ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const name  = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const updated_by_raw = String(body.updated_by ?? "").trim();

    if (!city || !phone || !name || !email) {
      return NextResponse.json(
        { success: false, error: "city, phone, name, and email are required" },
        { status: 400 }
      );
    }

    const updated_by = updated_by_raw ? Number(updated_by_raw) : null;
    if (updated_by_raw && Number.isNaN(updated_by)) {
      return NextResponse.json(
        { success: false, error: "updated_by must be a number" },
        { status: 400 }
      );
    }

    // ---- preflight duplicate checks (give field-level errors)
    const [existingByEmail, existingByPhone] = await Promise.all([
      prisma.city.findUnique({ where: { email } }).catch(() => null),
      prisma.city.findUnique({ where: { phone } }).catch(() => null),
    ]);

    if (existingByEmail) {
      return NextResponse.json(
        { success: false, error: "Email already exists", field: "email" },
        { status: 409 }
      );
    }
    if (existingByPhone) {
      return NextResponse.json(
        { success: false, error: "Phone already exists", field: "phone" },
        { status: 409 }
      );
    }

    const created = await prisma.city.create({
      data: { city, phone, name, email, updated_by: updated_by ?? undefined },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/city error", err);

    // Fallback for races: still map unknown P2002 to informative message
    if (err?.code === "P2002") {
      // err.meta?.target typically has ['email'] or ['phone']
      const tgt = Array.isArray(err?.meta?.target) ? err.meta.target.join(",") : "unique field";
      return NextResponse.json(
        { success: false, error: `Duplicate value for ${tgt}` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await parseBody(req);

    const idRaw = (body.id ?? "").toString().trim();
    const id = Number(idRaw);
    if (!idRaw || Number.isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid id is required" },
        { status: 400 }
      );
    }

    const data: any = {};
    if (body.city != null) data.city = String(body.city).trim();
    if (body.phone != null) data.phone = String(body.phone).trim();
    if (body.name != null) data.name = String(body.name).trim();
    if (body.email != null) data.email = String(body.email).trim();

    // optional updated_by
    if (body.updated_by != null) {
      const ub = Number(String(body.updated_by).trim());
      if (!Number.isNaN(ub)) data.updated_by = ub;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "Nothing to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.city.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/city error", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Duplicate value for a unique field (email/phone)" },
        { status: 409 }
      );
    }
    if (err?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "City not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // allow id via query or body
    let idStr = searchParams.get("id");
    if (!idStr) {
      const body = await parseBody(req);
      idStr = (body.id ?? "").toString().trim();
    }
    const id = Number(idStr);
    if (!idStr || Number.isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid id is required" },
        { status: 400 }
      );
    }

    await prisma.city.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/city error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "City not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
