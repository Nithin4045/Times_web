import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(options);
    
    console.log("📊 DEBUG SESSION API - Session data:", JSON.stringify(session, null, 2));
    
    return NextResponse.json({
      success: true,
      session,
      user: session?.user,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json({ 
      error: "Failed to get session",
      details: String(error)
    }, { status: 500 });
  }
}

