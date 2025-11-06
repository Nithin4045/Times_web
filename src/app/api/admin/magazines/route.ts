// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clear } from "console";

/**
 * GET -> list magazines
 * POST -> create magazine
 * DELETE -> delete magazine (body: { id })
 */

export async function GET() {
  try {
    const rows = await prisma.magazines.findMany({
      orderBy: { created_at: "desc" },
    });
    console.log("GET /api/magazines rows:", rows);
    return NextResponse.json({ success: true, data: rows });
  } catch (err: any) {
    console.error("GET /api/magazines error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { magazine_id, title, year, type, price_one_year, price_two_year, nav_link } = body ?? {};

    if (!nav_link || !nav_link.trim()) {
  return NextResponse.json({ success: false, error: "nav_link is required" }, { status: 400 });
}



    if (!magazine_id || typeof magazine_id !== "string" || !magazine_id.trim()) {
      return NextResponse.json({ success: false, error: "magazine_id is required" }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "title is required" }, { status: 400 });
    }

    // optional duplicate checks: prefer magazine_id uniqueness
    const existsByMag = await prisma.magazines.findUnique({ where: { magazine_id } });
    if (existsByMag) {
      return NextResponse.json({ success: false, error: "magazine_id already exists", field: "magazine_id" }, { status: 409 });
    }

    // you may also check title+year duplicates if needed
    const exists = await prisma.magazines.findFirst({
      where: { title, year },
    });
    if (exists) {
      return NextResponse.json({ success: false, error: "Magazine already exists for this year", field: "title" }, { status: 409 });
    }

    const created = await prisma.magazines.create({
      data: {
        magazine_id: magazine_id.trim(),
        title: title.trim(),
        year: year ?? null,
        type: type ?? null,
        // Preserve incoming structure: if client sends an object, it will be stored as JSON.
        // If client sent a number, wrap into an object or coerce to a number field depending on schema.
        price_one_year: price_one_year ?? null,
        price_two_year: price_two_year ?? null,
         nav_link: nav_link.trim(), 
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/magazines error:", err);
    // include Prisma message to help debugging in dev (DO NOT return raw error in prod)
    const msg = err?.message ?? "Internal error";
    return NextResponse.json({ success: false, error: "Internal error", detail: msg }, { status: 500 });
  }
}


export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id } = body ?? {};
    if (!id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });

    await prisma.magazines.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/magazines error:", err);
    // if not found, send 404
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}



export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, magazine_id, title, year, type, price_one_year, price_two_year, nav_link } = body ?? {};

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "title is required" }, { status: 400 });
    }
    if (!magazine_id || !magazine_id.trim()) {
      return NextResponse.json({ success: false, error: "magazine_id is required" }, { status: 400 });
    }
    if (!nav_link || !nav_link.trim()) {
      return NextResponse.json({ success: false, error: "nav_link is required" }, { status: 400 });
    }

    // Optional duplicate check: ensure no other magazine with same magazine_id
    const exists = await prisma.magazines.findFirst({
      where: { magazine_id, NOT: { id: Number(id) } },
    });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "magazine_id already exists", field: "magazine_id" },
        { status: 409 }
      );
    }

    const updated = await prisma.magazines.update({
      where: { id: Number(id) },
      data: {
        magazine_id: magazine_id.trim(),
        title: title.trim(),
        year: year ?? null,
        type: type ?? null,
        price_one_year: price_one_year ?? null,
        price_two_year: price_two_year ?? null,
        nav_link: nav_link.trim(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("PUT /api/magazines error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
