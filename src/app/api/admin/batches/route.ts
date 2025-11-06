// src/app/api/admin/batches/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 10;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE));

    // total
    const total = await prisma.batches.count();

    const rows = await prisma.batches.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: "desc" },
    });

    // Fetch lookup maps to show names
    const cityIds = Array.from(new Set(rows.map(r => r.city_id).filter(Boolean) as number[]));
    const centerIds = Array.from(new Set(rows.map(r => r.center_id).filter(Boolean) as number[]));
    const courseIds = Array.from(new Set(rows.map(r => r.course_id).filter(Boolean) as number[]));
    const mergedBatchIds = Array.from(new Set(rows.map(r => r.merged_batch).filter(Boolean) as number[]));

    const [cities, centers, courses, mergedBatches] = await Promise.all([
      cityIds.length ? prisma.city.findMany({ where: { id: { in: cityIds } } }) : [],
      centerIds.length ? prisma.centers.findMany({ where: { id: { in: centerIds } } }) : [],
      courseIds.length ? prisma.courses.findMany({ where: { id: { in: courseIds } } }) : [],
      mergedBatchIds.length ? prisma.batches.findMany({ where: { id: { in: mergedBatchIds } } }) : [],
    ]);

    const citiesById = new Map(cities.map(c => [c.id, c]));
    const centersById = new Map(centers.map(c => [c.id, c]));
    const coursesById = new Map(courses.map(c => [c.id, c]));
    const mergedBatchesById = new Map(mergedBatches.map(b => [b.id, b]));

    const data = rows.map(r => ({
      id: r.id,
      batch_code: r.batch_code,
      batch_description: r.batch_description,
      city_id: r.city_id ?? null,
      city_name: r.city_id ? (citiesById.get(r.city_id)?.city ?? null) : null,
      center_id: r.center_id ?? null,
      center_name: r.center_id ? (centersById.get(r.center_id)?.center ?? null) : null,
      course_id: r.course_id ?? null,
      course_name: r.course_id ? (coursesById.get(r.course_id)?.coursename ?? null) : null,
      status: r.status,
      merged_batch: r.merged_batch ?? null,
      merged_batch_name: r.merged_batch ? (mergedBatchesById.get(r.merged_batch)?.batch_code ?? null) : null,
      start_date: r.start_date?.toISOString() ?? null,
      validity_date: r.validity_date?.toISOString() ?? null,
    }));

    return NextResponse.json({ success: true, data, total }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/batches error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const batch_code = String(body?.batch_code ?? "").trim();
    if (!batch_code) return NextResponse.json({ success: false, error: "batch_code is required" }, { status: 400 });

    const created = await prisma.batches.create({
      data: {
        batch_code,
        batch_description: body.batch_description ?? null,
        city_id: body.city_id ?? undefined,
        center_id: body.center_id ?? undefined,
        course_id: body.course_id ?? undefined,
        status: true,
        start_date: body.start_date ? new Date(body.start_date) : undefined,
        validity_date: body.validity_date ? new Date(body.validity_date) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/batches error", err);
    if (err?.code === "P2002") {
      return NextResponse.json({ success: false, error: "batch_code must be unique" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id);
    if (!id || Number.isNaN(id)) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });

    const data: any = {};
    if (body.batch_code !== undefined) data.batch_code = String(body.batch_code).trim();
    if (body.batch_description !== undefined) data.batch_description = body.batch_description ?? null;
    if (body.city_id !== undefined) data.city_id = body.city_id ?? null;
    if (body.center_id !== undefined) data.center_id = body.center_id ?? null;
    if (body.course_id !== undefined) data.course_id = body.course_id ?? null;
    if (body.status !== undefined) data.status = Boolean(body.status);
    if (body.start_date !== undefined) data.start_date = body.start_date ? new Date(body.start_date) : null;
    if (body.validity_date !== undefined) data.validity_date = body.validity_date ? new Date(body.validity_date) : null;
    if (Object.keys(data).length === 0) return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });

    const updated = await prisma.batches.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/batches error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!id || Number.isNaN(id)) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    await prisma.batches.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/batches error", err);
    if (err?.code === "P2025") return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// Handle merge batch functionality
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sourceBatchId = Number(body?.sourceBatchId);
    const targetBatchId = Number(body?.targetBatchId);
    
    if (!sourceBatchId || Number.isNaN(sourceBatchId)) {
      return NextResponse.json({ success: false, error: "sourceBatchId is required" }, { status: 400 });
    }
    
    if (!targetBatchId || Number.isNaN(targetBatchId)) {
      return NextResponse.json({ success: false, error: "targetBatchId is required" }, { status: 400 });
    }
    
    if (sourceBatchId === targetBatchId) {
      return NextResponse.json({ success: false, error: "Cannot merge batch with itself" }, { status: 400 });
    }
    
    // Check if both batches exist
    const [sourceBatch, targetBatch] = await Promise.all([
      prisma.batches.findUnique({ where: { id: sourceBatchId } }),
      prisma.batches.findUnique({ where: { id: targetBatchId } })
    ]);
    
    if (!sourceBatch) {
      return NextResponse.json({ success: false, error: "Source batch not found" }, { status: 404 });
    }
    
    if (!targetBatch) {
      return NextResponse.json({ success: false, error: "Target batch not found" }, { status: 404 });
    }
    
    // Check for circular merge (if target batch is already merged into source)
    if (targetBatch.merged_batch === sourceBatchId) {
      return NextResponse.json({ success: false, error: "Cannot create circular merge" }, { status: 400 });
    }
    
    // Update the source batch to point to the target batch
    const updatedBatch = await prisma.batches.update({
      where: { id: sourceBatchId },
      data: { merged_batch: targetBatchId }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: updatedBatch,
      message: `Batch "${sourceBatch.batch_code}" merged into "${targetBatch.batch_code}"`
    }, { status: 200 });
    
  } catch (err: any) {
    console.error("PATCH /api/admin/batches error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}