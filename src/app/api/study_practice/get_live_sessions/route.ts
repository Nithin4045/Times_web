// src/app/api/live_sessions/by_user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const idCardNo = form.get("id_card_no")?.toString().trim();

    if (!idCardNo) {
      return NextResponse.json(
        { error: "id_card_no is required" },
        { status: 400 }
      );
    }

    console.log("[get_live_sessions][POST] id_card_no", idCardNo);

    // Call function with explicit cast to text
    const rows = await prisma.$queryRaw<{ data: any }[]>`
      SELECT public.get_live_sessions(${idCardNo}::text) AS data
    `;

    const data = rows?.[0]?.data ?? null;

    // ✅ result log
    console.log("[get_live_sessions][POST] result", data);

    return NextResponse.json(
      { id_card_no: idCardNo, data },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[get_live_sessions][POST] error", {
      message: err?.message,
    });
    return NextResponse.json(
      { error: "Server error", hint: err?.message },
      { status: 500 }
    );
  }
}
