import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    OTP_ENABLED: process.env.OTP_ENABLED || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    timestamp: new Date().toISOString()
  });
}
