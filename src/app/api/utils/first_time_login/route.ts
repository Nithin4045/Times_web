// src/app/api/utils/first_time_login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    let user_id: number | undefined;

    // Check content type to handle both JSON and form data
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON request
      const body = await req.json().catch(() => ({}));
      user_id = body.user_id;
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      // Handle form data request
      const formData = await req.formData();
      const userIdStr = formData.get('user_id');
      user_id = userIdStr ? Number(userIdStr) : undefined;
    } else {
      // Fallback: try to parse as form data
      try {
        const formData = await req.formData();
        const userIdStr = formData.get('user_id');
        user_id = userIdStr ? Number(userIdStr) : undefined;
      } catch {
        // If that fails, try JSON
        const body = await req.json().catch(() => ({}));
        user_id = body.user_id;
      }
    }

    if (!user_id || isNaN(Number(user_id))) {
      return NextResponse.json(
        { error: "user_id is required and must be a number" },
        { status: 400 }
      );
    }

    const updated = await prisma.users.update({
      where: { id: Number(user_id) },
      data: {
        first_time_login: false,
        last_login_datetime: new Date(),
      },
    });

    return NextResponse.json({ success: true, user: updated }, { status: 200 });
  } catch (err: any) {
    console.error("first_time_login PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update user", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
