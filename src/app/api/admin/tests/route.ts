// src/app/api/admin/tests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------- GET: tests having at least one vendor with status true or "true"
export async function GET(req: Request) {
  try {
    // Fetch ALL tests without pagination for client-side filtering
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id, 
        test_link, 
        description, 
        name, 
        solution, 
        type, 
        course_id, 
        test_ref,
        tests_area_level_id,
        start_date,
        end_date
      FROM "tests"
      WHERE
        (
          -- boolean true
          test_link::jsonb @> '[{"status":true}]'
          OR
          -- string "true"
          test_link::jsonb @> '[{"status":"true"}]'
        )
      ORDER BY id DESC
    `);

    // Parse test_link from string to JSON array
    const parsedRows = rows.map(r => {
      let parsedTestLink = r.test_link;
      if (typeof r.test_link === 'string') {
        try {
          parsedTestLink = JSON.parse(r.test_link);
        } catch (e) {
          console.error(`Failed to parse test_link for test ${r.id}:`, e);
          parsedTestLink = [];
        }
      }
      return {
        ...r,
        test_link: parsedTestLink
      };
    });

    // Fetch lookups for courses and area/levels
    const courseIds = Array.from(new Set(
      parsedRows.flatMap(r => Array.isArray(r.course_id) ? r.course_id : [])
    ));
    const areaLevelIds = Array.from(new Set(
      parsedRows.map(r => r.tests_area_level_id).filter(Boolean)
    ));

    const [courses, areaLevels] = await Promise.all([
      courseIds.length > 0
        ? prisma.courses.findMany({
            where: { id: { in: courseIds } },
            select: { id: true, coursename: true }
          })
        : [],
      areaLevelIds.length > 0
        ? prisma.tests_area_level.findMany({
            where: { id: { in: areaLevelIds } },
            select: { id: true, area: true, level: true, test_type_id: true }
          })
        : []
    ]);

    // Fetch test types
    const testTypeIds = Array.from(new Set(
      areaLevels.flatMap(al => Array.isArray(al.test_type_id) ? al.test_type_id : [])
    ));
    const testTypes = testTypeIds.length > 0
      ? await prisma.test_types.findMany({
          where: { id: { in: testTypeIds } },
          select: { id: true, test_name: true }
        })
      : [];

    return NextResponse.json(
      { 
        success: true, 
        count: parsedRows.length,
        data: parsedRows,
        lookups: {
          courses,
          areaLevels,
          testTypes
        }
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET /api/admin/tests error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------- helpers
const getStrFromFD = (fd: FormData, key: string): string | null => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : null;
};

const parseMaybeJSON = <T = any>(raw: string): T | null => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ---------- POST
export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";

    // ===== Path A: JSON body (new single-submit flow: create tests + mapping)
    if (ct.includes("application/json")) {
      const body = await req.json();
      const test = body?.test;
      const mapping = body?.mapping;

      if (!test || !mapping) {
        return NextResponse.json({ success: false, error: "Missing test or mapping payload" }, { status: 400 });
      }

      // Validate test payload
      if (!test.test_ref || !test.name) {
        return NextResponse.json({ success: false, error: "test_ref and name are required" }, { status: 400 });
      }
      // test_link must be an array of vendor objects; if string passed, wrap it
      let testLink = test.test_link;
      if (!Array.isArray(testLink)) {
        // allow a single URL string to be provided
        if (typeof testLink === "string" && testLink.length > 0) {
          testLink = [{ vendorName: test.vendorName ?? "Vendor", test_link: testLink, status: true }];
        } else {
          return NextResponse.json(
            { success: false, error: "test_link must be an array (or a URL string to wrap)" },
            { status: 400 }
          );
        }
      }

      // Validate mapping payload
      const talId: number | undefined = mapping.tests_area_level_id;
      if (!talId) {
        return NextResponse.json({ success: false, error: "tests_area_level_id is required" }, { status: 400 });
      }
      const idCardNos: string[] = Array.isArray(mapping.id_card_nos) ? mapping.id_card_nos : [];
      if (idCardNos.length === 0) {
        return NextResponse.json(
          { success: false, error: "id_card_nos must contain at least one id_card_no" },
          { status: 400 }
        );
      }

      // Ensure Area→Level exists
      const tal = await prisma.tests_area_level.findUnique({ where: { id: talId } });
      if (!tal) {
        return NextResponse.json(
          { success: false, error: `tests_area_level not found: id=${talId}` },
          { status: 400 }
        );
      }

      // Validate id_card_nos exist in users_courses
      const existing = await prisma.users_courses.findMany({
        where: { id_card_no: { in: idCardNos } },
        select: { id_card_no: true },
      });
      const existingSet = new Set(existing.map((x) => x.id_card_no));
      const missing = idCardNos.filter((id: string) => !existingSet.has(id));
      if (missing.length > 0) {
        return NextResponse.json(
          { success: false, error: "Some id_card_nos do not exist in users_courses", missing_ids: missing },
          { status: 400 }
        );
      }

      // Dates
      const startDate: Date | null = mapping.start_date ? new Date(mapping.start_date) : null;
      const endDate: Date | null = mapping.end_date ? new Date(mapping.end_date) : null;

      // Transaction: create test then mapping
      const result = await prisma.$transaction(async (tx) => {
        const createdTest = await tx.tests.create({
          data: {
            test_ref: test.test_ref,
            name: test.name,
            description: test.description ?? null,
            solution: test.solution ?? null,
            test_link: testLink, // JSON array of vendor objects
            type: "EXTERNAL",     // optional; default in schema
            // course_id: test.course_id ?? null,  // 🆕 Handle course_id array from request
            // tests_area_level_id: talId,  // 🆕 Set area_level_id directly
            // start_date: startDate,  // 🆕 Set start_date
            // end_date: endDate,  // 🆕 Set end_date
          },
          select: { id: true },  // 🆕 Return new fields
        });

        // const createdMapping = await tx.tests_area_level_mapping.create({
        //   data: {
        //     tests_area_level_ids: [talId],
        //     test_ids: [createdTest.id],
        //     city_ids: Array.isArray(mapping.city_ids) ? mapping.city_ids : [],
        //     center_ids: Array.isArray(mapping.center_ids) ? mapping.center_ids : [],
        //     course_ids: Array.isArray(mapping.course_ids) ? mapping.course_ids : [],
        //     id_card_nos: idCardNos,
        //     start_date: startDate,
        //     end_date: endDate,
        //   },
        //   select: { id: true },
        // });

        return { test_id: createdTest.id };
      });

      return NextResponse.json({ success: true, data: result }, { status: 201 });
    }

    // ===== Path B: multipart/form-data (backward compatibility: create test only)
    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();

      const area_level_id_raw = getStrFromFD(fd, "area_level_id"); // kept for compatibility (not used for mapping here)
      const test_link_raw = getStrFromFD(fd, "test_link");
      const solution_link = getStrFromFD(fd, "solution_link");
      const description = getStrFromFD(fd, "description");
      const name = getStrFromFD(fd, "name");
      const test_ref = getStrFromFD(fd, "test_ref"); // allow passing ref in form-data too

      if (!test_link_raw || !name) {
        return NextResponse.json(
          { success: false, error: "test_link and name are required" },
          { status: 400 }
        );
      }

      // Ensure area_level exists when provided (kept from your previous code)
      if (area_level_id_raw) {
        const area_level_id = Number(area_level_id_raw);
        if (!Number.isInteger(area_level_id)) {
          return NextResponse.json({ success: false, error: "area_level_id must be an integer" }, { status: 400 });
        }
        const exists = await prisma.tests_area_level.findUnique({ where: { id: area_level_id } });
        if (!exists) {
          return NextResponse.json({ success: false, error: "area_level_id not found" }, { status: 400 });
        }
      }

      // Parse test_link JSON if given; else wrap as vendor object
      let parsedTestLink = parseMaybeJSON<any>(test_link_raw);
      if (!parsedTestLink) {
        // if a plain URL was given, create a 1-vendor array
        parsedTestLink = [{ vendorName: "Vendor", test_link: test_link_raw, status: true }];
      }

      // 🆕 Parse course_ids from form data (optional)
      const courseIdsRaw = getStrFromFD(fd, "course_ids");
      let courseIds: number[] | null = null;
      if (courseIdsRaw) {
        const parsed = parseMaybeJSON<number[]>(courseIdsRaw);
        if (Array.isArray(parsed) && parsed.every(id => Number.isInteger(id))) {
          courseIds = parsed;
        }
      }

      // 🆕 Parse area_level_id for direct reference
      const areaLevelIdVal = area_level_id_raw ? Number(area_level_id_raw) : null;

      const created = await prisma.tests.create({
        data: {
          test_ref: test_ref ?? undefined,
          test_link: parsedTestLink,
          solution: solution_link ?? undefined,
          description: description ?? undefined,
          name,
          course_id: courseIds ?? undefined,  // 🆕 Handle course_id
          // tests_area_level_id: areaLevelIdVal ?? undefined,  // 🆕 Set area_level_id
        },
      });

      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    // Fallback: unsupported content type
    return NextResponse.json(
      { success: false, error: "Unsupported Content-Type. Use application/json or multipart/form-data." },
      { status: 415 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/tests error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: update a test
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body?.id);
    
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const data: any = {};
    if (body.test_ref !== undefined) data.test_ref = body.test_ref?.trim() || null;
    if (body.name !== undefined) data.name = body.name?.trim() || null;
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.solution !== undefined) data.solution = body.solution?.trim() || null;
    if (body.type !== undefined) data.type = body.type;
    if (body.course_id !== undefined) data.course_id = Array.isArray(body.course_id) ? body.course_id : [];
    if (body.start_date !== undefined) data.start_date = body.start_date ? new Date(body.start_date) : null;
    if (body.end_date !== undefined) data.end_date = body.end_date ? new Date(body.end_date) : null;
    if (body.tests_area_level_id !== undefined) data.tests_area_level_id = body.tests_area_level_id;
    
    data.updated_at = new Date();

    if (Object.keys(data).length === 1) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.tests.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/tests error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Test not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: delete a test
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    await prisma.tests.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/tests error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Test not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
