// src/app/api/evaluate/exam/getsubjectslist/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SubjectData = {
  subject_description: string;
  repository_details_id: number;
  test_id: number;
  subject_id: number;
  question_count: number;
  duration_min: number;
  rendering_order: number;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const testIdParam = url.searchParams.get("testid");
  if (!testIdParam) return NextResponse.json({ message: "Test ID is missing" }, { status: 400 });

  const testId = Number(testIdParam);
  if (!Number.isFinite(testId)) return NextResponse.json({ message: "Test ID must be a number" }, { status: 400 });

  console.log("[getsubjectslist] testId:", testId);

  try {
    // ✅ CAST the bound parameter to int so Postgres can pick the function
    const rows = await prisma.$queryRaw<SubjectData[]>`
      SELECT * FROM public.get_subjects_by_test_id(CAST(${testId} AS int))
    `;
    console.log("[getsubjectslist] rows:", rows);
    if (!rows?.length) return NextResponse.json({ message: "No subjects found" }, { status: 404 });
    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    console.error("[getsubjectslist]", err?.code, err?.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
