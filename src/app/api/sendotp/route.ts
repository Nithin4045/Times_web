// src/app/api/sendotp/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtp } from "@/lib/otpservice";
import { decryptForClient } from "@/lib/obfuscator";

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(req: Request) {
  const context: Record<string, any> = {};
  try {
    // typed parse to help TS
    const body = (await req.json()) as { mobileNo?: string };
    const mobileNo = body.mobileNo;
    context.mobileNo = mobileNo;

    // Validate payload
    if (!mobileNo || !/^\d{10}$/.test(mobileNo)) {
      console.warn("OTP DENY: Invalid payload", context);
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
      select: { id: true, mobile: true },
    });

    // Find user by decrypting stored mobiles and comparing with input
    // ✅ Skip plain mobile numbers, only check encrypted ones
    console.log(`Searching for mobile: ${mobileNo} among ${allUsers.length} users`);
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
      console.warn("OTP DENY: Unregistered mobile number", context);
      return NextResponse.json(
        { error: "Please contact your administrator" },
        { status: 403 }
      );
    }

    // Generate & (optionally) send OTP
    const otpEnabled = process.env.OTP_ENABLED === "true";
    const otp = generateOtp();

    if (otpEnabled) {
      const ttlMs = 5 * 60 * 1000; // 5 minutes
      const expires_at = new Date(Date.now() + ttlMs);

      // Deactivate any existing active OTP for this mobile
      // await prisma.otp_tokens.updateMany({
      //   where: { mobile: mobileNo, is_used: false },
      //   data: { is_used: true },
      // });

      // // Create new OTP token
      // await prisma.otp_tokens.create({
      //   data: { mobile: mobileNo, otp, expires_at },
      // });

      try {
        await sendOtp(mobileNo, otp);
        console.log("OTP ALLOW: Sent successfully", context);
      } catch (sendErr: any) {
        console.error("OTP FAIL: Failed to send", {
          ...context,
          error: sendErr?.message,
        });
        return NextResponse.json(
          { error: "Failed to send OTP" },
          { status: 500 }
        );
      }
    } else {
      console.log("OTP SKIP: Sending skipped (disabled by config)", context);
    }

    return NextResponse.json({
      success: true,
      message: otpEnabled ? "OTP sent successfully" : "OTP sending skipped",
      newUser: false,
      mobileNo,
    });
  } catch (err: any) {
    console.error("OTP FAIL: Server error", {
      ...context,
      error: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
