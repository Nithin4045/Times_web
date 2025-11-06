// app/api/get-test-results/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const testId = url.searchParams.get("testid");
    const userId = url.searchParams.get("userid");

    if (!testId || !userId) {
      return NextResponse.json(
        { message: "Test ID and User ID are required." },
        { status: 400 }
      );
    }

    const testIdNum = Number(testId);
    const userIdNum = Number(userId);
    if (!Number.isFinite(testIdNum) || !Number.isFinite(userIdNum)) {
      return NextResponse.json(
        { message: "Test ID and User ID must be valid numbers." },
        { status: 400 }
      );
    }

    // Assumption: getTestResults is a Postgres function that returns a setof rows.
    // We use prisma.$queryRaw with tagged template to pass parameters safely.
    // const data: any[] = await prisma.$queryRaw`
    //    SELECT * FROM get_test_results(${Number(testId)}::int, ${Number(userId)}::int)
    // `;
        const data: any[] = await prisma.$queryRaw`
       SELECT * FROM get_test_results(${testIdNum}::int, ${userIdNum}::int)
    `;

    console.log("This is the final data",data);
    if (!data || data.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    // Log the real error server-side if you want (console.log or a logger)
    console.error("Error in GET /api/get-test-results:", err);

    return NextResponse.json(
      { message: "Error fetching data", detail: err?.message ?? null },
      { status: 500 }
    );
  }
}
