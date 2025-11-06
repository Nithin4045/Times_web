import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/refer-earn - Fetch referral history
export async function GET() {
  try {
    // For now, return empty array since we don't have a referrals table yet
    // You can implement this later when you have the database table
    return NextResponse.json([]);
  } catch (error: any) {
    console.error("Error fetching referral history:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/refer-earn - Submit new referral
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, contact, email, referredCourse, status } = body;

    // Validate required fields
    if (!name || !contact || !email || !referredCourse) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // For now, just log the referral data since we don't have a referrals table
    // You can implement database storage later
    console.log("New referral submitted:", {
      name,
      contact,
      email,
      referredCourse,
      status: status || "Referred",
      timestamp: new Date().toISOString()
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Referral submitted successfully!",
      data: {
        id: `ref-${Date.now()}`,
        name,
        contact,
        email,
        referredCourse,
        status: status || "Referred",
        date: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("Error submitting referral:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
