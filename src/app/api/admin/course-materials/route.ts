// src/app/api/admin/course-materials/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 10;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE));

    // total count
    const total = await prisma.course_materials.count();

    // fetch paginated materials
    const materials = await prisma.course_materials.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: "desc" },
    });

    // fetch courses for lookup
    const courses = await prisma.courses.findMany({
      select: { id: true, coursename: true },
    });

    return NextResponse.json({ 
      success: true, 
      data: materials, 
      total,
      lookups: { courses }
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/course-materials error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    const area = String(body?.area ?? "").trim();
    const material_path = String(body?.material_path ?? "").trim();
    const type = body?.type ?? "ebook";
    
    if (!area) {
      return NextResponse.json({ success: false, error: "area is required" }, { status: 400 });
    }
    if (!material_path) {
      return NextResponse.json({ success: false, error: "material_path is required" }, { status: 400 });
    }

    const created = await prisma.course_materials.create({
      data: {
        area,
        material_path,
        key_path: body.key_path ?? null,
        solution_path: body.solution_path ?? null,
        order: body.order ? Number(body.order) : null,
        type: type,
        topic_name: body.topic_name ?? null,
        course_id: Array.isArray(body.course_id) ? body.course_id : [],
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/course-materials error", err);
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
    if (body.area !== undefined) data.area = String(body.area).trim();
    if (body.material_path !== undefined) data.material_path = String(body.material_path).trim();
    if (body.key_path !== undefined) data.key_path = body.key_path ?? null;
    if (body.solution_path !== undefined) data.solution_path = body.solution_path ?? null;
    if (body.order !== undefined) data.order = body.order ? Number(body.order) : null;
    if (body.type !== undefined) data.type = body.type;
    if (body.topic_name !== undefined) data.topic_name = body.topic_name ?? null;
    if (body.course_id !== undefined) data.course_id = Array.isArray(body.course_id) ? body.course_id : [];
    
    data.updated_at = new Date();

    if (Object.keys(data).length === 1) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.course_materials.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/course-materials error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
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

    await prisma.course_materials.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/course-materials error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

