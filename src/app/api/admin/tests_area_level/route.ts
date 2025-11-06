// src/app/api/admin/tests-area-level/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FORM_NAME = "tests_area_level_form";

// GET: list all rows + lookups + form
export async function GET() {
  try {
    const [rows, testTypes, cities, centers, courses, formRow] = await Promise.all([
      prisma.tests_area_level.findMany({
        orderBy: { id: "desc" },
      }),
      prisma.test_types.findMany({
        select: { id: true, test_name: true },
        orderBy: { test_name: "asc" },
      }),
      prisma.city.findMany({
        select: { id: true, city: true },
        orderBy: { city: "asc" },
      }),
      prisma.centers.findMany({
        select: { id: true, center: true, city_id: true },
        orderBy: { center: "asc" },
      }),
      prisma.courses.findMany({
        select: { id: true, coursename: true },
        orderBy: { coursename: "asc" },
      }),
      prisma.form_jsons.findUnique({ where: { name: FORM_NAME } }),
    ]);

    return NextResponse.json(
      {
        success: true,
        count: rows.length,
        data: rows,
        lookups: {
          test_types: testTypes,
          cities,
          centers,
          courses,
        },
        form_name: FORM_NAME,
        form: formRow?.formjson ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/admin/tests-area-level error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: handle JSON payload to create/update tests_area_level
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const area = typeof body.area === "string" ? body.area.trim() : "";
    const level = typeof body.level === "string" ? body.level.trim() : "";
    const selected_ids = Array.isArray(body.selected_ids) ? body.selected_ids.map((x: any) => Number(x)).filter((n: number) => Number.isInteger(n)) : [];
    const new_names = Array.isArray(body.new_names) ? body.new_names.map((x: any) => String(x).trim()).filter((s: string) => s.length > 0) : [];

    if (!area || !level) {
      return NextResponse.json({ success: false, error: "area and level are required" }, { status: 400 });
    }

    // 1) Ensure or create test_types for new_names. Collect their ids.
    const newIds: number[] = [];

    for (const name of new_names) {
      // try find first
      const existing = await prisma.test_types.findUnique({ where: { test_name: name } });
      if (existing) {
        newIds.push(existing.id);
        continue;
      }
      try {
        const created = await prisma.test_types.create({ data: { test_name: name } });
        newIds.push(created.id);
      } catch (e: any) {
        // handle unique constraint race: find existing
        if (e?.code === "P2002") {
          const existing2 = await prisma.test_types.findUnique({ where: { test_name: name } });
          if (existing2) newIds.push(existing2.id);
        } else {
          console.error("create test_types error", e);
          throw e;
        }
      }
    }

    // 2) Merge selected_ids and newIds, dedupe
    const allIds = Array.from(new Set([...selected_ids, ...newIds]));

    // 3) Check if area+level exists (case-insensitive)
    const existingRow = await prisma.tests_area_level.findFirst({
      where: {
        area: { equals: area, mode: "insensitive" },
        level: { equals: level, mode: "insensitive" },
      },
    });

    if (existingRow) {
      // Merge into existing test_type_id array (ensure it's an array)
      const existingArr: number[] = Array.isArray(existingRow.test_type_id) ? existingRow.test_type_id : [];
      const merged = Array.from(new Set([...existingArr, ...allIds]));
      const updated = await prisma.tests_area_level.update({
        where: { id: existingRow.id },
        data: { test_type_id: merged },
      });
      return NextResponse.json({ success: true, data: updated, mode: "updated" }, { status: 200 });
    } else {
      // Create new row with test_type_id array
      const created = await prisma.tests_area_level.create({
        data: {
          area,
          level,
          test_type_id: allIds,
        },
      });
      return NextResponse.json({ success: true, data: created, mode: "created" }, { status: 201 });
    }
  } catch (err: any) {
    console.error("POST /api/admin/tests-area-level error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: update a test area level
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body?.id);
    
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const data: any = {};
    if (body.area !== undefined) data.area = String(body.area).trim();
    if (body.level !== undefined) data.level = String(body.level).trim();
    if (body.test_type_id !== undefined) {
      data.test_type_id = Array.isArray(body.test_type_id) ? body.test_type_id : [];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.tests_area_level.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/tests_area_level error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Test area level not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: delete a test area level
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    await prisma.tests_area_level.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/tests_area_level error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Test area level not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}