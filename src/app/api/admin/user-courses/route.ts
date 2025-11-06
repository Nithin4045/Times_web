// src/app/api/admin/user-courses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clear } from "console";
import { decryptForClient } from "@/lib/obfuscator";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id_card_no = url.searchParams.get("id_card_no")?.trim();

    if (!id_card_no) {
      return NextResponse.json({ success: false, error: "id_card_no is required" }, { status: 400 });
    }

    // user
    const userRaw = await prisma.users.findUnique({
      where: { id_card_no },
      select: { id_card_no: true, firstname: true, lastname: true, email: true, mobile: true },
    });
    if (!userRaw) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // Decrypt email and mobile for client
    const user = {
      ...userRaw,
      email: decryptForClient(userRaw.email),
      mobile: decryptForClient(userRaw.mobile),
    };

    // user_course rows
    const ucRows = await prisma.users_courses.findMany({
      where: { id_card_no },
      select: { id: true, batch_id: true, registration_date: true, validity_date: true },
      orderBy: { created_at: "desc" },
    });

    // collect batch ids present in rows
    const batchIds = Array.from(new Set(ucRows.map(r => r.batch_id).filter((v): v is number => v != null)));

    // --- lookups ---
    // to keep UI flexible we'll return all small lookup tables (you can limit if large)
    const [batches, centers, cities, courses, variants] = await Promise.all([
      // fetch all batches (could be filtered if needed)
      prisma.batches.findMany({ select: { id: true, batch_code: true, center_id: true, city_id: true, course_id: true } }),
      prisma.centers.findMany({ select: { id: true, center: true, city_id: true } }),
      prisma.city.findMany({ select: { id: true, city: true } }),
      prisma.courses.findMany({ select: { id: true, coursename: true, variant_id: true } }),
      prisma.variants.findMany({ select: { id: true, variant: true } }),
    ]);

    // maps for quick lookup
    const batchesById = new Map(batches.map(b => [b.id, b]));
    const centersById = new Map(centers.map(c => [c.id, c]));
    const citiesById = new Map(cities.map(c => [c.id, c]));
    const coursesById = new Map(courses.map(c => [c.id, c]));
    const variantsById = new Map(variants.map(v => [v.id, v]));

    // enrich each users_courses row with batch/course/center/city/variant names & identifiers
    const mappings = ucRows.map(uc => {
      const batch = uc.batch_id ? batchesById.get(uc.batch_id) ?? null : null;
      const course = batch?.course_id ? coursesById.get(batch.course_id) ?? null : null;
      const center = batch?.center_id ? centersById.get(batch.center_id) ?? null : null;
      const city = batch?.city_id ? citiesById.get(batch.city_id) ?? null : null;
      const variant = course?.variant_id ? variantsById.get(course.variant_id) ?? null : null;

      return {
        mapping_id: uc.id,
        batch_id: batch?.id ?? null,
        batch_code: batch?.batch_code ?? null,
        city_id: city?.id ?? null,
        city_name: city?.city ?? null,
        center_id: center?.id ?? null,
        center_name: center?.center ?? null,
        course_id: course?.id ?? null,
        coursename: course?.coursename ?? null,
        variant_id: variant?.id ?? null,
        variant_name: variant?.variant ?? null,
        registration_date: uc.registration_date ?? null,
        validity_date: uc.validity_date ?? null,
      };
    });
    
   const responsePayload = {
      success: true,
      user,
      mappings,
      raw_user_courses_count: ucRows.length,
      lookups: { batches, centers, cities, courses, variants },
    };

    // LOG the payload (pretty print)
    console.log("[GET user-courses] response payload:\n", JSON.stringify(responsePayload, null, 2));
    // alternative: console.dir(responsePayload, { depth: null }) // if you prefer util-style display

    return NextResponse.json(responsePayload, { status: 200 });

  } catch (err) {
    console.error("GET /api/admin/user-courses error", err);
    const resp = { success: false, error: "Internal Server Error" };
    console.log("[GET user-courses] response:", JSON.stringify(resp));
    return NextResponse.json(resp, { status: 500 });
  }
}

// update mapping (edit users_courses row)
// payload: { mapping_id: number, batch_id?: number | null, registration_date?: string | null, validity_date?: string | null }
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body?.mapping_id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "mapping_id is required" }, { status: 400 });
    }

    const data: any = {};
    if (body.batch_id !== undefined) {
      const bid = body.batch_id === null ? null : Number(body.batch_id);
      if (bid !== null && Number.isNaN(bid)) {
        return NextResponse.json({ success: false, error: "batch_id must be an integer or null" }, { status: 400 });
      }
      data.batch_id = bid;
    }
    if (body.registration_date !== undefined) {
      data.registration_date = body.registration_date ? new Date(body.registration_date) : null;
    }
    if (body.validity_date !== undefined) {
      data.validity_date = body.validity_date ? new Date(body.validity_date) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    // validate batch exists if provided (non-null)
    if (data.batch_id != null) {
      const batchExists = await prisma.batches.findUnique({ where: { id: data.batch_id } });
      if (!batchExists) return NextResponse.json({ success: false, error: "batch_id not found" }, { status: 400 });
    }

    const updated = await prisma.users_courses.update({ where: { id }, data });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/admin/user-courses error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// delete mapping: accept ?mapping_id= or JSON body { mapping_id }
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    let idStr = url.searchParams.get("mapping_id");
    console.log("DELETE /api/admin/user-courses called with mapping_id:", idStr);
    if (!idStr) {
      const b = await req.json().catch(() => ({}));
      idStr = b?.mapping_id;
    }
    const id = Number(idStr);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "mapping_id is required" }, { status: 400 });
    }

    await prisma.users_courses.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/user-courses error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Mapping not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}










// POST - create a new users_courses mapping for a user
// expected body:
// {
//   id_card_no: string,
//   batch_id?: number | null,
//   course_id?: number | null,    // optional - stored indirectly via batch if batch provided
//   city_id?: number | null,
//   center_id?: number | null,
//   variant_id?: number | null,
//   validity_date?: string | null, // ISO string
//   registration_date?: string | null // optional ISO; if missing server uses now
// }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id_card_no = String(body?.id_card_no ?? "").trim();
    if (!id_card_no) {
      return NextResponse.json({ success: false, error: "id_card_no is required" }, { status: 400 });
    }

    // ensure user exists
    const user = await prisma.users.findUnique({ where: { id_card_no }, select: { id_card_no: true } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // batch_id is recommended (we use it to set the batch). Validate if provided.
    let batch_id: number | null = null;
    if (body.batch_id !== undefined) {
      batch_id = body.batch_id === null ? null : Number(body.batch_id);
      if (batch_id !== null && Number.isNaN(batch_id)) {
        return NextResponse.json({ success: false, error: "batch_id must be integer or null" }, { status: 400 });
      }
      if (batch_id !== null) {
        const batchExists = await prisma.batches.findUnique({ where: { id: batch_id } });
        if (!batchExists) return NextResponse.json({ success: false, error: "batch_id not found" }, { status: 400 });
      }
    }

    // Optional date parsing
    const registration_date = body.registration_date ? new Date(body.registration_date) : new Date();
    const validity_date = body.validity_date ? new Date(body.validity_date) : null;

    const created = await prisma.users_courses.create({
      data: {
        id_card_no,
        batch_id: batch_id ?? undefined,
        registration_date: registration_date ?? undefined,
        validity_date: validity_date ?? undefined,
      },
    });

    // Return created row (and optionally fresh lookups if you want)
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/user-courses error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}