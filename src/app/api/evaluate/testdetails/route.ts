
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

interface TestDetails {
  test_id: number;
  user_test_id: number;
  test_name: string;
  test_description: string;
  general_data: string | null;
  user_data :string | null;
  video : string | null;
  epi_data: string | null;
  VALIDITY_START: Date;
  VALIDITY_END: Date;
  is_valid: boolean;
  total_marks: number;
  distCount:number;
  distSecs : number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0].trim() || 'unknown';

  if (!userId) {
    console.error("User is not authenticated");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Query to get test details using Prisma
    const result = await prisma.$queryRaw`
      SELECT * FROM GetEvalUserTestScoreDetails(${parseInt(userId)})
    `;

    const data: TestDetails[] = result as TestDetails[];
    return NextResponse.json(data);
  } catch (error) {
    logger.error(`Error fetching test details: ${error}`)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error fetching test details:", errorMessage);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}