// @ts-nocheck
import { NextResponse } from "next/server";
// If you already have a prisma helper, keep this line:
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    let name: string | null = null;

    if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
      const fd = await req.formData();
      name = (fd.get("name") as string) ?? null;
    } else {
      const body = await req.json().catch(() => null);
      name = body?.name ?? null;
    }

    console.log("form_jsons POST name:", name);

    if (!name) {
      return NextResponse.json({ ok: false, error: "name is required" }, { status: 400 });
    }

    const row = await prisma.form_jsons.findUnique({ where: { name } });
    if (!row) {
      return NextResponse.json({ ok: false, error: `No form_jsons row for name="${name}"` }, { status: 404 });
    }

    // Return the full row (including your JSON)
    return NextResponse.json({ ok: true, data: row });
  } catch (err: any) {
    console.error("form_jsons POST error:", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
