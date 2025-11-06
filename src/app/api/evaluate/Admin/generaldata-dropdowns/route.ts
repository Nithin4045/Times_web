// C:\Users\admin\Downloads\09-08-2025_BAK_TIMES_WEB\src\app\api\evaluate\Admin\generaldata-dropdowns\route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    // Collect distinct non-null general_data JSON strings (you can parse to richer shape if needed)
    const rows = await prisma.test_repository.findMany({
      where: { general_data: { not: null } },
      select: { general_data: true },
      distinct: ["general_data"],
      take: 100
    });

    // If your UI expects key/value arrays, parse JSON here; else return strings as-is
    const options = rows
      .map(r => r.general_data)
      .filter(Boolean);

    return NextResponse.json({ options });
  } catch (e) {
    console.error("[generaldata-dropdowns] error:", e);
    // return empty but 200 to avoid breaking UI
    return NextResponse.json({ options: [] });
  }
}
