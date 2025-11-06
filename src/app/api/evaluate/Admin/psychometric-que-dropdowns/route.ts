// C:\Users\admin\Downloads\09-08-2025_BAK_TIMES_WEB\src\app\api\evaluate\Admin\psychometric-que-dropdowns\route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    // Collect distinct epi_question JSON strings
    const rows = await prisma.test_repository.findMany({
      where: { epi_question: { not: null } },
      select: { epi_question: true },
      distinct: ["epi_question"],
      take: 100
    });

    const options = rows
      .map(r => r.epi_question)
      .filter(Boolean);

    return NextResponse.json({ options });
  } catch (e) {
    console.error("[psychometric-que-dropdowns] error:", e);
    return NextResponse.json({ options: [] });
  }
}
