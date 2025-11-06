// app/api/save-fcm-token/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if needed

type RequestBody = {
  userId?: number | string; // accept numeric or string id
  token?: string;
};

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();

    const userIdRaw = body.userId;
    const token = (body.token || "").trim();

    if (!userIdRaw) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }
    if (!token) {
      return NextResponse.json(
        { success: false, error: "token is required" },
        { status: 400 }
      );
    }

    // Normalize userId to number if possible
    const userId = typeof userIdRaw === "string" && /^\d+$/.test(userIdRaw)
      ? Number(userIdRaw)
      : (userIdRaw as number);

    // Optional: further validation on token length
    if (token.length < 10) {
      return NextResponse.json(
        { success: false, error: "token looks too short" },
        { status: 400 }
      );
    }

    // Update users table where id matches (or mobile/email if you prefer)
    const existingUser = await prisma.users.findUnique({
      where: { id: userId as number },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "user not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.users.update({
      where: { id: userId as number },
      data: {
        fcm_token: token,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: { id: updated.id, fcm_token: updated.fcm_token } });
  } catch (err: any) {
    console.error("Error saving fcm token:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
