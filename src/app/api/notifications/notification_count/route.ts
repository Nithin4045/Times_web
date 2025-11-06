// src/app/api/notifications/notification_count/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const now = new Date().toISOString();

  try {
    // Support both form-data and JSON bodies (form-data preferred)
    let id_cardno: string | null = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data") || contentType.includes("form-data")) {
      // form-data
      try {
        const fd = await req.formData();
        const v = fd.get("id_cardno");
        id_cardno = v == null ? null : String(v);
      } catch (e) {
        console.warn(`[API][NOTIF][${now}] Failed to parse formData:`, e);
      }
    } else {
      // try JSON fallback
      try {
        const body = await req.json().catch(() => ({}));
        const v = body?.id_cardno ?? body?.id_card_no ?? body?.idCardNo ?? null;
        if (v != null) id_cardno = String(v);
      } catch (e) {
        console.warn(`[API][NOTIF][${now}] Failed to parse JSON body:`, e);
      }
    }

    if (!id_cardno) {
      console.warn(`[API][NOTIF][${now}] Missing id_cardno in request`);
      return NextResponse.json(
        { success: false, error: "id_cardno is required" },
        { status: 400 }
      );
    }

    console.log(`[API][NOTIF][${now}] Counting unseen notifications for id_cardno='${id_cardno}'`);

    const count = await prisma.notifications.count({
      where: {
        id_card_no: id_cardno,
        is_seen: false,
      },
    });

    console.log(`[API][NOTIF][${now}] id_cardno='${id_cardno}' unseenCount=${count}`);

    return NextResponse.json(
      { success: true, id_cardno, unseenCount: count },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[API][NOTIF][${new Date().toISOString()}] Error checking unseen count:`, err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
