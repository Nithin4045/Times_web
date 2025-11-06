import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { decryptForClient } from "@/lib/obfuscator";

function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

const trim = (v: unknown): string | undefined =>
  typeof v === "string" ? v.trim() : undefined;

const localPart = (email: unknown): string | undefined =>
  typeof email === "string" ? email.split("@")[0] : undefined;

export async function POST(req: NextRequest) {
  try {
    const { mobileNo, otp, fcm_token, channel } = await req.json();
    const otpEnabled = process.env.OTP_ENABLED === "true";

    if (!mobileNo || !otp) {
      return NextResponse.json(
        { error: "Mobile number and OTP required" },
        { status: 400 }
      );
    }
    if (!/^\d{10}$/.test(String(mobileNo))) {
      return NextResponse.json(
        { error: "Valid 10-digit phone number is required" },
        { status: 400 }
      );
    }

    // Fetch all users with mobile numbers (we need to decrypt and compare)
    // Note: Encryption uses time-based random components, so we can't encrypt and search directly
    const allUsers = await prisma.users.findMany({
      where: { 
        mobile: { not: null }
      },
      select: {
        id: true,
        id_card_no: true,
        email: true,
        mobile: true,
        photo: true,
        firstname: true,
        lastname: true,
        role: true,
        address: true,
        selected_course_id: true,
        created_datetime: true,
        fcm_token: true,
        login_status: true,
        last_login_datetime: true,
        modules: true, // IMPORTANT: Required for dashboard and sidenav
      }
    });

    // Find user by decrypting stored mobiles and comparing with input
    // ✅ Skip plain mobile numbers, only check encrypted ones
    console.log(`Verifying OTP: Searching for mobile: ${mobileNo} among ${allUsers.length} users`);
    let user = null;
    for (const u of allUsers) {
      const storedMobile = u.mobile || '';
      
      // ✅ Skip if mobile is already plain text (10 digits)
      if (/^\d{10}$/.test(storedMobile)) {
        console.log(`⏭️  Skipping user ID ${u.id}: Mobile is plain text (${storedMobile})`);
        continue;
      }
      
      // ✅ Only decrypt and check encrypted mobile numbers
      const decryptedMobile = decryptForClient(storedMobile);
      if (decryptedMobile === mobileNo) {
        console.log(`✅ Found matching user: ID ${u.id}, decrypted mobile: ${decryptedMobile}`);
        user = u;
        break;
      }
    }
    if (!user) {
      console.log(`❌ No match found for mobile: ${mobileNo} (checked only encrypted mobiles)`);
    }

    if (!user) {
      return NextResponse.json(
        { error: "User does not exist. Please request OTP first." },
        { status: 404 }
      );
    }

    // OTP flow (unchanged) ...
    if (otpEnabled) {
      const token = await prisma.otp_tokens.findFirst({
        where: { mobile: String(mobileNo), is_used: false },
        orderBy: { created_at: "desc" },
      });
      if (!token) {
        return NextResponse.json(
          { error: "OTP not found or already used. Please request a new OTP." },
          { status: 401 }
        );
      }
      if (token.expires_at.getTime() < Date.now()) {
        await prisma.otp_tokens.update({ where: { id: token.id }, data: { is_used: true } });
        return NextResponse.json(
          { error: "OTP expired. Please request a new OTP." },
          { status: 401 }
        );
      }
      if (token.otp !== String(otp)) {
        return NextResponse.json(
          { error: "Invalid OTP. Please try again." },
          { status: 401 }
        );
      }
      await prisma.otp_tokens.update({ where: { id: token.id }, data: { is_used: true } });
    } else {
      if (!/^\d{4}$/.test(String(otp))) {
        return NextResponse.json({ error: "Invalid OTP format" }, { status: 401 });
      }
    }

    // ---- This now type-checks because `user.id` is a number
    if (fcm_token) {
      await prisma.users.update({
        where: { id: user.id },
        data: { fcm_token: String(fcm_token) },
      });
    }

    // session handling (unchanged) ...
    const accessToken = generateToken();
    const refreshToken = generateToken();
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      const existingSession = await prisma.session.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!existingSession) {
        await prisma.session.create({
          data: {
            userId: user.id,
            accessToken,
            refreshToken,
            expiryDate,
            status: 1,
            latestAccessTime: new Date(),
          },
        });
      } else {
        await prisma.session.update({
          where: { id: existingSession.id },
          data: {
            accessToken,
            refreshToken,
            expiryDate,
            latestAccessTime: new Date(),
          },
        });
      }
    } catch {
      // session table optional
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_datetime: new Date(), login_status: true },
    });

    const displayName =
      trim(user.firstname) || trim(user.lastname) || localPart(user.email) || "User";

    // Decrypt the mobile number for client response
    const decryptedMobile = decryptForClient(user.mobile);

    const responseUser = {
      id: user.id,
      id_card_no: user.id_card_no,
      email: user.email,
      mobile: decryptedMobile, // Return decrypted mobile to client
      photo: user.photo,
      modules: user.modules, // IMPORTANT: Required for dashboard and sidenav
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
      address: user.address,
      selected_course_id: user.selected_course_id,
      created_datetime: user.created_datetime,
      fcm_token: fcm_token ?? user.fcm_token,
      login_status: true,
      last_login_datetime: new Date(),
      displayName,
    };

    console.log('✅ VERIFYOTP - Returning user data to NextAuth:', {
      id: responseUser.id,
      email: responseUser.email,
      mobile: responseUser.mobile,
      firstname: responseUser.firstname,
      lastname: responseUser.lastname,
      role: responseUser.role,
      modules: responseUser.modules,
      displayName: responseUser.displayName
    });

    return NextResponse.json(responseUser, { status: 200 });
  } catch (err) {
    console.error("OTP Verify Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
