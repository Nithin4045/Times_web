import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const uniqueCourses = await prisma.courses.findMany({
      distinct: ["coursename"], // ✅ ensures unique coursenames
      select: { coursename: true }, // ✅ fetch only coursename field
    });

    return NextResponse.json({
      success: true,
      data: uniqueCourses,
      count: uniqueCourses.length,
    });
  } catch (error: any) {
    console.error("Error fetching unique course names:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
