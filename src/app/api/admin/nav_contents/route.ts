import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NavContentType, LinkStorage } from "@/generated/prisma"; 


export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resource = searchParams.get("resource");

    if (resource === "cities") {
      const items = await prisma.city.findMany({
        select: { id: true, city: true },
        orderBy: { city: "asc" },
      });
      return NextResponse.json({ success: true, items });
    }

    if (resource === "centers") {
      const cityIdsParam = searchParams.get("cityIds") || "";
      const cityIds = cityIdsParam.split(",").map(Number).filter(Number.isFinite);
      const where = cityIds.length ? { city_id: { in: cityIds } } : {};
      const items = await prisma.centers.findMany({
        where,
        select: { id: true, center: true, city_id: true },
        orderBy: { center: "asc" },
      });
      return NextResponse.json({ success: true, items });
    }

    if (resource === "courses") {
      const cityIds = (searchParams.get("cityIds") || "").split(",").map(Number).filter(Number.isFinite);
      const centerIds = (searchParams.get("centerIds") || "").split(",").map(Number).filter(Number.isFinite);

      const batchWhere: any = {};
      if (cityIds.length) batchWhere.city_id = { in: cityIds };
      if (centerIds.length) batchWhere.center_id = { in: centerIds };

      const fromBatches = await prisma.batches.findMany({ where: batchWhere, select: { course_id: true } });
      const courseIds = Array.from(new Set(fromBatches.map(b => b.course_id).filter((v): v is number => typeof v === "number")));

      const items = await prisma.courses.findMany({
        where: courseIds.length ? { id: { in: courseIds } } : undefined,
        select: { id: true, coursename: true },
        orderBy: { coursename: "asc" },
      });
      return NextResponse.json({ success: true, items });
    }

    if (resource === "batches") {
      const cityIds   = (searchParams.get("cityIds") || "").split(",").map(Number).filter(Number.isFinite);
      const centerIds = (searchParams.get("centerIds") || "").split(",").map(Number).filter(Number.isFinite);
      const courseIds = (searchParams.get("courseIds") || "").split(",").map(Number).filter(Number.isFinite);

      const where: any = {};
      if (cityIds.length) where.city_id = { in: cityIds };
      if (centerIds.length) where.center_id = { in: centerIds };
      if (courseIds.length) where.course_id = { in: courseIds };

      const items = await prisma.batches.findMany({
        where,
        select: { id: true, batch_code: true },
        orderBy: { batch_code: "asc" },
      });
      return NextResponse.json({ success: true, items });
    }

    if (resource === "validateId") {
      const id_card_no = searchParams.get("id_card_no") || "";
      if (!id_card_no) return NextResponse.json({ success: true, exists: false });
      const user = await prisma.users.findUnique({ where: { id_card_no }, select: { id: true } });
      return NextResponse.json({ success: true, exists: !!user });
    }

    if (resource === "test_types") {
      const items = await prisma.test_types.findMany({
        select: { id: true, test_name: true },
        orderBy: { test_name: "asc" },
      });
      return NextResponse.json({ success: true, items });
    }

    if (resource === "list") {
      const rawItems = await prisma.nav_contents.findMany({ orderBy: { id: "desc" } });
      
      // Transform items to show counts instead of full arrays for large ID fields
      const items = rawItems.map(item => ({
        ...item,
        // Keep original arrays but add count info
        city_id_count: Array.isArray(item.city_id) ? item.city_id.length : 0,
        center_id_count: Array.isArray(item.center_id) ? item.center_id.length : 0,
        course_id_count: Array.isArray(item.course_id) ? item.course_id.length : 0,
        batch_id_count: Array.isArray(item.batch_id) ? item.batch_id.length : 0,
        // Limit arrays to first 10 items for display
        city_id: Array.isArray(item.city_id) ? item.city_id.slice(0, 10) : [],
        center_id: Array.isArray(item.center_id) ? item.center_id.slice(0, 10) : [],
        course_id: Array.isArray(item.course_id) ? item.course_id.slice(0, 10) : [],
        batch_id: Array.isArray(item.batch_id) ? item.batch_id.slice(0, 10) : [],
      }));
      
      return NextResponse.json({ success: true, items });
    }

    if (resource === "detail") {
      const id = Number(searchParams.get("id"));
      if (!id || !Number.isFinite(id)) {
        return NextResponse.json({ success: false, error: "Valid ID required" }, { status: 400 });
      }
      const item = await prisma.nav_contents.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, item });
    }

    return NextResponse.json({ success: false, error: "Unknown resource" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "GET failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    // Check if record exists
    const existing = await prisma.nav_contents.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    // Prepare update data
    const data: any = {};
    if (updateData.label !== undefined) data.label = updateData.label;
    if (updateData.storage !== undefined) {
      data.storage = updateData.storage === "URL" ? LinkStorage.URL : LinkStorage.PATH;
    }
    if (updateData.url !== undefined) data.url = updateData.url;
    if (updateData.path !== undefined) data.path = updateData.path;
    if (updateData.isactive !== undefined) data.isactive = updateData.isactive;
    if (updateData.id_card_nos !== undefined) data.id_card_nos = updateData.id_card_nos;
    if (updateData.city_id !== undefined) {
      data.city_id = Array.isArray(updateData.city_id) 
        ? updateData.city_id.map(Number).filter(Number.isFinite) 
        : [];
    }
    if (updateData.center_id !== undefined) {
      data.center_id = Array.isArray(updateData.center_id) 
        ? updateData.center_id.map(Number).filter(Number.isFinite) 
        : [];
    }
    if (updateData.course_id !== undefined) {
      data.course_id = Array.isArray(updateData.course_id) 
        ? updateData.course_id.map(Number).filter(Number.isFinite) 
        : [];
    }
    if (updateData.batch_id !== undefined) {
      data.batch_id = Array.isArray(updateData.batch_id) 
        ? updateData.batch_id.map(Number).filter(Number.isFinite) 
        : [];
    }
    if (updateData.icon_name !== undefined) data.icon_name = updateData.icon_name;
    if (updateData.test_type_id !== undefined) data.test_type_id = updateData.test_type_id;

    const updated = await prisma.nav_contents.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "PUT failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id || !Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "Valid ID is required" }, { status: 400 });
    }

    // Check if record exists
    const existing = await prisma.nav_contents.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    // If accordion type, delete associated sub rows first
    if (existing.type === NavContentType.accordion) {
      await prisma.nav_accordion_rows.deleteMany({
        where: { accordion_id: id },
      });
    }

    await prisma.nav_contents.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Record deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "DELETE failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await req.json() : {};

    const {
      // main accordion (nav_contents)
      type,
      label,
      storage,
      url,
      path,
      id_card_nos = [],
      isactive = true,
      created_by = null,
      city_id = [],
      center_id = [],
      course_id = [],
      batch_id = [],
      icon_name = null,
      test_type_id = null,
      is_navigation = false,

      // sub rows (nav_accordion_rows)
      sub_rows = [],
    } = body || {};

    // Basic validation
    if (type !== "general_info" && type !== "buttons" && type !== "tests" && type !== "accordion") {
      return NextResponse.json({ success: false, error: "type must be one of: general_info, buttons, tests, accordion" }, { status: 400 });
    }
    if (!label) return NextResponse.json({ success: false, error: "label is required" }, { status: 400 });
    if (storage !== "URL" && storage !== "PATH") {
      return NextResponse.json({ success: false, error: "storage must be URL or PATH" }, { status: 400 });
    }
    if (storage === "URL" && !url) {
      return NextResponse.json({ success: false, error: "url is required for storage=URL" }, { status: 400 });
    }
    if (storage === "PATH" && !path) {
      return NextResponse.json({ success: false, error: "path is required for storage=PATH" }, { status: 400 });
    }

    // Verify id_card_nos exist (best-effort)
    if (Array.isArray(id_card_nos) && id_card_nos.length > 0) {
      const existing = await prisma.users.findMany({
        where: { id_card_no: { in: id_card_nos as string[] } },
        select: { id_card_no: true },
      });
      const existingSet = new Set(existing.map(u => u.id_card_no));
      const missing = (id_card_nos as string[]).filter(v => !existingSet.has(v));
      if (missing.length) {
        return NextResponse.json(
          { success: false, error: `id_card_nos not found: ${missing.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Coerce arrays
    const cityIds   = Array.isArray(city_id)   ? city_id.map(Number).filter(Number.isFinite)   : [];
    const centerIds = Array.isArray(center_id) ? center_id.map(Number).filter(Number.isFinite) : [];
    const courseIds = Array.isArray(course_id) ? course_id.map(Number).filter(Number.isFinite) : [];
    const batchIds  = Array.isArray(batch_id)  ? batch_id.map(Number).filter(Number.isFinite)  : [];

const typeEnum =
  type === "buttons"   ? NavContentType.buttons :
  type === "tests"     ? NavContentType.tests :
  type === "accordion" ? NavContentType.accordion :
                         NavContentType.general_info;

    const storageEnum = storage === "URL" ? LinkStorage.URL : LinkStorage.PATH;

    // If not accordion or there are no sub rows, we can just do a single create
    if (typeEnum !== NavContentType.accordion || !Array.isArray(sub_rows) || sub_rows.length === 0) {
      const created = await prisma.nav_contents.create({
        data: {
          type: typeEnum,
          label,
          is_navigation: !!is_navigation,
          storage: storageEnum,
          url: storageEnum === LinkStorage.URL ? (url as string) : null,
          path: storageEnum === LinkStorage.PATH ? (path as string) : null,
          id_card_nos: id_card_nos as string[],
          isactive: !!isactive,
          created_by: created_by ?? undefined,
          center_id: centerIds,
          city_id: cityIds,
          course_id: courseIds,
          batch_id: batchIds,
          icon_name: icon_name ?? undefined,
          test_type_id: test_type_id ?? undefined,
        },
      });
      return NextResponse.json({ success: true, item: created }, { status: 201 });
    }

    // --- Accordion with sub_rows: do a transaction ---
    const result = await prisma.$transaction(async (tx) => {
      const main = await tx.nav_contents.create({
        data: {
          type: NavContentType.accordion,
          label,
          is_navigation: !!is_navigation,
          storage: storageEnum,
          url: storageEnum === LinkStorage.URL ? (url as string) : null,
          path: storageEnum === LinkStorage.PATH ? (path as string) : null,
          id_card_nos: id_card_nos as string[],
          isactive: !!isactive,
          created_by: created_by ?? undefined,
          center_id: centerIds,
          city_id: cityIds,
          course_id: courseIds,
          batch_id: batchIds,
          icon_name: icon_name ?? undefined,
          test_type_id: test_type_id ?? undefined,
        },
      });

      // Validate each sub row ID cards (best-effort; skip if empty)
      for (const r of sub_rows as any[]) {
        if (Array.isArray(r?.id_card_nos) && r.id_card_nos.length > 0) {
          const existing = await tx.users.findMany({
            where: { id_card_no: { in: r.id_card_nos as string[] } },
            select: { id_card_no: true },
          });
          const existingSet = new Set(existing.map(u => u.id_card_no));
          const missing = (r.id_card_nos as string[]).filter((v) => !existingSet.has(v));
          if (missing.length) {
            throw new Error(`Sub row: id_card_nos not found: ${missing.join(", ")}`);
          }
        }
      }

      // Insert sub rows
      for (const r of sub_rows as any[]) {
        const rStorage: LinkStorage =
          r.storage === "URL" ? LinkStorage.URL : LinkStorage.PATH;

        const rCity   = Array.isArray(r.city_id)   ? r.city_id.map(Number).filter(Number.isFinite)   : [];
        const rCenter = Array.isArray(r.center_id) ? r.center_id.map(Number).filter(Number.isFinite) : [];
        const rCourse = Array.isArray(r.course_id) ? r.course_id.map(Number).filter(Number.isFinite) : [];
        const rBatch  = Array.isArray(r.batch_id)  ? r.batch_id.map(Number).filter(Number.isFinite)  : [];

        await tx.nav_accordion_rows.create({
          data: {
            accordion_id: main.id,
            text: String(r.text ?? ""),
            storage: rStorage,
            url: rStorage === LinkStorage.URL ? (r.url ?? null) : null,
            path: rStorage === LinkStorage.PATH ? (r.path ?? null) : null,
            sort_order: 0,
            isactive: r.isactive ?? true,
            created_by: (r.created_by ?? created_by) ?? undefined,
            id_card_nos: (r.id_card_nos as string[]) ?? [],
            city_id: rCity,
            center_id: rCenter,
            course_id: rCourse,
            batch_id: rBatch,
          },
        });
      }

      return main;
    });

    return NextResponse.json({ success: true, item: result }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/nav_contents error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "POST failed" },
      { status: 500 }
    );
  }
}
