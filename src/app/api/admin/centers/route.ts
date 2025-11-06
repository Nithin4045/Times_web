// app/api/admin/centers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Parse JSON or multipart
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

// export async function GET() {
//   try {
//     const [rows, cities] = await Promise.all([
//       prisma.centers.findMany({ orderBy: { created_at: "desc" } }),
//       prisma.city.findMany({ orderBy: { city: "asc" } }),
//     ]);

//     return NextResponse.json(
//       { success: true, count: rows.length, data: rows, cities },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("GET /api/admin/centers error", err);
//     return NextResponse.json(
//       { success: false, error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityIdStr = searchParams.get("city_id");

    if (cityIdStr) {
      console.log("GET /api/admin/centers called with city_id:", cityIdStr);
      // ✅ Only centers of given city_id
      const city_id = Number(cityIdStr);
      if (Number.isNaN(city_id)) {
        return NextResponse.json(
          { success: false, error: "city_id must be a number" },
          { status: 400 }
        );
      }

      const rows = await prisma.centers.findMany({
        where: { city_id },
        orderBy: { created_at: "desc" },
      });

      return NextResponse.json(
        { success: true, count: rows.length, data: rows },
        { status: 200 }
      );
    }

    // ✅ Fallback: return all centers (with cities)
    const [rows, cities] = await Promise.all([
      prisma.centers.findMany({ orderBy: { created_at: "desc" } }),
      prisma.city.findMany({ orderBy: { city: "asc" } }),
    ]);
    console.log("GET /api/admin/centers called without city_id, returning all centers");
    return NextResponse.json(
      { success: true, count: rows.length, data: rows, cities },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/admin/centers error", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);

    const center  = String(body.center ?? "").trim();
    const city_id_raw = String(body.city_id ?? "").trim();
    const address = String(body.address ?? "").trim();
    const phone   = String(body.phone ?? "").trim();
    const email   = String(body.email ?? "").trim().toLowerCase();
    const gpslink = String(body.gpslink ?? "").trim();
    const updated_by_raw = String(body.updated_by ?? "").trim();

    if (!center || !city_id_raw || !address || !phone || !email || !gpslink || !updated_by_raw) {
      return NextResponse.json(
        { success: false, error: "center, city_id, address, phone, email, gpslink, updated_by are required" },
        { status: 400 }
      );
    }

    const city_id = Number(city_id_raw);
    const updated_by = Number(updated_by_raw);
    if (Number.isNaN(city_id) || Number.isNaN(updated_by)) {
      return NextResponse.json(
        { success: false, error: "city_id and updated_by must be numbers" },
        { status: 400 }
      );
    }

    const cityExists = await prisma.city.findUnique({ where: { id: city_id } });
    if (!cityExists) {
      return NextResponse.json({ success: false, error: "city_id not found" }, { status: 400 });
    }

    const created = await prisma.centers.create({
      data: { center, city_id, address, phone, email, gpslink, updated_by },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/centers error", err);
    if (err?.code === "P2002") {
      // Unique constraint (e.g., email or phone)
      const tgt = Array.isArray(err?.meta?.target) ? err.meta.target.join(",") : "unique field";
      return NextResponse.json(
        { success: false, error: `Duplicate value for ${tgt}` },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await parseBody(req);

    const idRaw = String(body.id ?? "").trim();
    const id = Number(idRaw);
    if (!idRaw || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "Valid id is required" }, { status: 400 });
    }

    const data: any = {};

    if (body.center != null) data.center = String(body.center).trim();
    if (body.city_id != null) {
      const city_id = Number(body.city_id);
      if (Number.isNaN(city_id)) {
        return NextResponse.json({ success: false, error: "city_id must be a number" }, { status: 400 });
      }
      const cityExists = await prisma.city.findUnique({ where: { id: city_id } });
      if (!cityExists) {
        return NextResponse.json({ success: false, error: "city_id not found" }, { status: 400 });
      }
      data.city_id = city_id;
    }
    if (body.address != null) data.address = String(body.address).trim();
    if (body.phone != null) data.phone = String(body.phone).trim();
    if (body.email != null) data.email = String(body.email).trim().toLowerCase();
    if (body.gpslink != null) data.gpslink = String(body.gpslink).trim();

    if (body.updated_by != null) {
      const ub = Number(String(body.updated_by).trim());
      if (!Number.isNaN(ub)) data.updated_by = ub;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.centers.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/centers error", err);
    if (err?.code === "P2002") {
      const tgt = Array.isArray(err?.meta?.target) ? err.meta.target.join(",") : "unique field";
      return NextResponse.json(
        { success: false, error: `Duplicate value for ${tgt}` },
        { status: 409 }
      );
    }
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Center not found" }, { status: 404 });
    }
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
    if (!idStr || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "Valid id is required" }, { status: 400 });
    }

    await prisma.centers.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/centers error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Center not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
