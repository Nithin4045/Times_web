// C:\Users\admin\Downloads\09-08-2025_BAK_TIMES_WEB\src\app\api\evaluate\Admin\batch-codes\route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const test_id_raw = req.nextUrl.searchParams.get("TEST_ID");
    const test_id = Number(test_id_raw);
    if (!Number.isFinite(test_id) || test_id <= 0) {
      return NextResponse.json({ error: "Missing or invalid TEST_ID" }, { status: 400 });
    }

    // NOTE: function must return rows with 'batch_code' and 'test_id'
    const result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM get_eval_batch_codes_by_test_id(${test_id}::integer)`
    );

    return NextResponse.json(result ?? [], { status: 200 });
  } catch (error) {
    logger.error(`server error in get batch codes ${error}`);
    console.error("Server error", error);
    return NextResponse.json({ message: "Failed to retrieve submissions." }, { status: 500 });
  }
}


