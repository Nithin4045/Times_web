// app/api/admin/test-types/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FORM_NAME = "test_types_form";

// helpers
const getStr = (fd: FormData, key: string): string | null => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : null;
};
const toInt = (v: string | null) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};

// GET: list all test types + form
export async function GET() {
  try {
    const [rows, formRow] = await Promise.all([
      prisma.test_types.findMany({ orderBy: { created_at: "desc" } }),
      prisma.form_jsons.findUnique({ where: { name: FORM_NAME } }),
    ]);

    return NextResponse.json(
      {
        success: true,
        count: rows.length,
        data: rows,
        form_name: FORM_NAME,
        form: formRow?.formjson ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/admin/test-types error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: create a test type (form-data)
export async function POST(req: NextRequest) {
  try{
    const body = await req.json();
    const test_name = body.test_name;
    const order = toInt(body.order);
    if (!test_name) {
      return NextResponse.json(
        { success: false, error: "test_name is required" },
        { status: 400 }
      );
    }
    if (order === undefined || order === null || isNaN(order)) {
      return NextResponse.json(
        { success: false, error: "Valid order is required" },
        { status: 400 }
      );
    }
    try{
      const created = await prisma.test_types.create({
        data: {
          test_name,
          order,
        },
      });
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }
    catch(err){
      console.error("POST /api/admin/test-types error", err);
      return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }

  }
  catch(err){
    console.error("POST /api/admin/test-types error", err);
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
}

// PUT: update a test type
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body?.id);
    
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const data: any = {};
    if (body.test_name !== undefined) data.test_name = String(body.test_name).trim();
    if (body.order !== undefined) {
      const orderVal = Number(body.order);
      if (!Number.isNaN(orderVal)) data.order = orderVal;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.test_types.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/admin/test_types error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Test type not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: delete a test type
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    await prisma.test_types.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/test_types error", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Test type not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}