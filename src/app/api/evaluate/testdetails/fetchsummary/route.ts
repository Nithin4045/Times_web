import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get("testId");
  const userTestId = searchParams.get("userTestId");

  if (!testId || !userTestId) {
    return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
  }
  console.log(`Fetching summary for testId: ${testId}, userTestId: ${userTestId}`);

  try {
    // Call PostgreSQL function instead of MSSQL SP
    // const result = await prisma.$queryRaw<any[]>`
    //   SELECT * FROM GetEvalUserSummary(${parseInt(testId)}, ${parseInt(userTestId)})
    // `;

    const result = await prisma.$queryRaw<any[]>`
  SELECT * FROM GetEvalUserSummary(${parseInt(testId)}::integer, ${parseInt(userTestId)}::integer)
`;


    return NextResponse.json(result);
  } catch (error: any) {
    logger.error(`Error fetching test summary: ${error}`);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
