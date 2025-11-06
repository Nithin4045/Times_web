// src/app/api/save_fcm_token/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ReqBody = {
  userId?: number | string;
  token?: string;
};

export async function POST(req: Request) {
  const now = new Date().toISOString();
  console.log(`[API][FCM][${now}] Incoming POST /api/save_fcm_token`);

  let body: ReqBody;
  try {
    body = await req.json();
    console.log(`[API][FCM][${now}] Request body:`, body);
  } catch (err) {
    console.error(`[API][FCM][${now}] Failed to parse JSON body:`, err);
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId: rawUserId, token } = body ?? {};

  if (!rawUserId) {
    console.warn(`[API][FCM][${now}] Missing userId`);
    return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  }
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    console.warn(`[API][FCM][${now}] Missing or empty token`);
    return NextResponse.json({ success: false, error: "token is required" }, { status: 400 });
  }

  // Normalize userId to number if possible
  let userId: number | string = rawUserId as any;
  if (typeof rawUserId === "string" && /^\d+$/.test(rawUserId)) {
    userId = Number(rawUserId);
  }

  try {
    // Find user: use id when numeric, otherwise try matching email or mobile optionally
    let user;
    if (typeof userId === "number") {
      console.log(`[API][FCM][${now}] Looking up user by id=${userId}`);
      user = await prisma.users.findUnique({ where: { id: userId } });
    } else {
      // if a non-numeric string, try mobile or email (choose your preferred unique field)
      console.log(`[API][FCM][${now}] Looking up user by mobile/email: ${userId}`);
      user = await prisma.users.findFirst({
        where: {
          OR: [{ mobile: String(userId) }, { email: String(userId) }],
        },
      });
    }

    if (!user) {
      console.warn(`[API][FCM][${now}] User not found for identifier:`, userId);
      return NextResponse.json({ success: false, error: "user not found" }, { status: 404 });
    }

    // Update user's fcm_token
    const updated = await prisma.users.update({
      where: { id: user.id },
      data: {
        fcm_token: token,
        updated_at: new Date(),
      },
      select: { id: true, fcm_token: true },
    });

    console.log(`[API][FCM][${now}] Updated user id=${updated.id} fcm_token saved (length=${String(updated.fcm_token).length})`);

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err) {
    console.error(`[API][FCM][${now}] Error while saving token:`, err);
    return NextResponse.json({ success: false, error: "internal server error" }, { status: 500 });
  }
}
