// src/app/api/.../route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // Prisma needs Node, not Edge

export async function GET() {
  try {
    const rows = await prisma.language.findMany({
      select: { language: true },
      distinct: ["language"],
    });
    const langList = rows.map(r => r.language!).filter(Boolean);
    return NextResponse.json(langList);
  } catch (error) {
    console.error("Error fetching languages:", error);
    return NextResponse.json({ error: "Failed to fetch languages" }, { status: 500 });
  }
  // Do not call prisma.$disconnect() in Next.js handlers
}
