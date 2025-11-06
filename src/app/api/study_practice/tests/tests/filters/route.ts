import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // fetch distinct values for area & level
    const areas = await prisma.$queryRaw<{ area: string }[]>`
      SELECT DISTINCT area FROM tests_area_level;
    `;

    const levels = await prisma.$queryRaw<{ level: string }[]>`
      SELECT DISTINCT level FROM tests_area_level;
    `;

    return NextResponse.json({
      success: true,
      areas: areas.map((a) => a.area),
      levels: levels.map((l) => l.level),
    });
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
