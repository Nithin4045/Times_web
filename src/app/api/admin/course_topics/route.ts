// src/app/api/admin/course_topics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids"); // comma separated ids optional
    const where: any = {};
    if (idsParam) {
      const ids = idsParam.split(",").map(s => Number(s)).filter(n => !Number.isNaN(n));
      if (ids.length) where.id = { in: ids };
    }
    const rows = await prisma.course_topics.findMany({ where, orderBy: { order: "asc" }});
    return NextResponse.json({ success: true, data: rows }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/course_topics error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);
    const topic_name = String(body.topic_name ?? "").trim();
    if (!topic_name) return NextResponse.json({ success: false, error: "topic_name is required" }, { status: 400 });

    const created = await prisma.course_topics.create({
      data: {
        topic_name,
        order: body.order != null ? Number(body.order) : 0,
        type: body.type || undefined,
        duration_days: body.duration_days != null ? Number(body.duration_days) : 0,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/course_topics error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await parseBody(req);
    const id = Number(body.id);
    if (!id || Number.isNaN(id)) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    const data: any = {};
    if (body.topic_name !== undefined) data.topic_name = String(body.topic_name ?? "").trim() || undefined;
    if (body.order !== undefined) data.order = Number(body.order);
    if (body.type !== undefined) data.type = body.type || undefined;
    if (body.duration_days !== undefined) data.duration_days = Number(body.duration_days);

    if (Object.keys(data).length === 0) return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    const updated = await prisma.course_topics.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/course_topics error", err);
    if (err?.code === "P2025") return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 });
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
    if (!id || Number.isNaN(id)) return NextResponse.json({ success: false, error: "Valid id is required" }, { status: 400 });
    await prisma.course_topics.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/course_topics error", err);
    if (err?.code === "P2025") return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
