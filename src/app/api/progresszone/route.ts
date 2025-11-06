// api/progresszone/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const id_card_no = (form.get("id_card_no") ?? "").toString().trim();

    if (!id_card_no) {
      return NextResponse.json(
        { success: false, error: "Missing id_card_no" },
        { status: 400 }
      );
    }

    console.log("➡️ /api/progresszone input", { id_card_no });

    const rows = await prisma.$queryRaw<Array<{ data: any }>>`
      SELECT public.get_user_course_analytics(${id_card_no}::text) AS data
    `;

    const payload = rows?.[0]?.data ?? { courses: [] };

    console.log("✅ Analytics fetched for", id_card_no, payload);

    return NextResponse.json({ success: true, ...payload }, { status: 200 });
  } catch (error: any) {
    console.error("❌ /api/analytics/user_courses error", {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch user course analytics" },
      { status: 500 }
    );
  }
}
