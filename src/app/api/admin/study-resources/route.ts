// src/app/api/admin/study-resources/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 10;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE));

    // total count
    const total = await prisma.study_resources.count();

    // fetch paginated resources
    const resources = await prisma.study_resources.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: "desc" },
    });

    // fetch lookups
    const [courses, cities] = await Promise.all([
      prisma.courses.findMany({ select: { id: true, coursename: true } }),
      prisma.city.findMany({ select: { id: true, city: true } }),
    ]);

    return NextResponse.json({ 
      success: true, 
      data: resources, 
      total,
      lookups: { courses, cities }
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/study-resources error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    const title = String(body?.title ?? "").trim();
    const type = String(body?.type ?? "").trim();
    
    if (!title) {
      return NextResponse.json({ success: false, error: "title is required" }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ success: false, error: "type is required" }, { status: 400 });
    }

    const created = await prisma.study_resources.create({
      data: {
        title,
        type,
        category: body.category ?? null,
        link_url: body.link_url ?? null,
        content: body.content ?? null,
        page_id: body.page_id ?? null,
        accordion_content: body.accordion_content ?? null,
        course_id: Array.isArray(body.course_id) ? body.course_id : [],
        city_id: Array.isArray(body.city_id) ? body.city_id : [],
        category_id: Array.isArray(body.category_id) ? body.category_id : [],
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/study-resources error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id);
    
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const data: any = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.type !== undefined) data.type = String(body.type).trim();
    if (body.category !== undefined) data.category = body.category ?? null;
    if (body.link_url !== undefined) data.link_url = body.link_url ?? null;
    if (body.content !== undefined) data.content = body.content ?? null;
    if (body.page_id !== undefined) data.page_id = body.page_id ?? null;
    if (body.accordion_content !== undefined) data.accordion_content = body.accordion_content ?? null;
    if (body.course_id !== undefined) data.course_id = Array.isArray(body.course_id) ? body.course_id : [];
    if (body.city_id !== undefined) data.city_id = Array.isArray(body.city_id) ? body.city_id : [];
    if (body.category_id !== undefined) data.category_id = Array.isArray(body.category_id) ? body.category_id : [];
    
    data.updated_at = new Date();

    if (Object.keys(data).length === 1) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.study_resources.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/study-resources error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Resource not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    await prisma.study_resources.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/study-resources error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Resource not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

