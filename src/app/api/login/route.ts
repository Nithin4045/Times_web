import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
// import { logEvent, tryLogEvent } from "@/lib/auditLogger";

export async function POST(req: Request) {
  try {
    const { email, password, fcmtoken } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user in new schema
    const userRow = await prisma.users.findFirst({ where: { email } });

    if (!userRow) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Password handling (not available in schema)
    const passwordless = process.env.PASSWORDLESS_LOGIN === "true";
    const masterPassword = process.env.MASTER_PASSWORD;
    const passwordOk =
      passwordless ||
      (!!masterPassword && typeof password === "string" && password === masterPassword);

    if (!passwordOk) {

      return NextResponse.json(
        { error: "Password login not available" },
        { status: 400 }
      );
    }

    // Update FCM token if provided
    if (fcmtoken) {
      try {
        await prisma.users.update({
          where: { id: userRow.id },
          data: { fcm_token: fcmtoken },
        });
      } catch (e) {
        logger.warn(`FCM token update failed for ${email}: ${String(e)}`);
      }
    }

    // Update login status & last login time
    const now = new Date();
    try {
      await prisma.users.update({
        where: { id: userRow.id },
        data: {
          login_status: true,
          last_login_datetime: now,
        },
      });
    } catch (e) {
      logger.warn(`Failed to update login fields for ${email}: ${String(e)}`);
    }

    // Build response only with schema fields (plus a couple derived)
    const user = {
      id: userRow.id,
      id_card_no: userRow.id_card_no,
      email: userRow.email,
      mobile: userRow.mobile,
      photo: userRow.photo,
      modules: userRow.modules,
      firstname: userRow.firstname,
      lastname: userRow.lastname,
      fullname: `${userRow.firstname} ${userRow.lastname}`.trim(),
      role: userRow.role,
      address: userRow.address,
      created_datetime: userRow.created_datetime,
      fcm_token: userRow.fcm_token,
      login_status: true,
      last_login_datetime: userRow.last_login_datetime ?? now,
    };


    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    logger.error(`Error in login API ${String(error)}`);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
