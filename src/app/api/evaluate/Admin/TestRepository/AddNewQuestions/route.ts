import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST handler to insert a new test repository record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Request Body:", body);

    const {
      TEST_TYPE,
      TEST_DESCRIPTION,
      VALIDITY_START,
      VALIDITY_END,
      CREATED_BY,
      IS_RECURRING,
      QUESTION_SELECTION_METHOD,
      STATUS,
      TEST_CODE,
      TEST_TITLE,
      TEST_ICON,
      LANGUAGE,
      GENERAL_DATA,
      ROLE,
      MASTER_DATA,
      EPI_QUESTION,
      VIDEO,
      COLLEGE_CODE,
      COLLEGE_NAME,
      MODULE,
      LINK_TEST,
      IP_RESTRICTION,
      IP_ADDRESSES,
    } = body;

    const newTest = await prisma.test_repository.create({
      data: {
        test_type: TEST_TYPE,
        test_description: TEST_DESCRIPTION,
        validity_start: VALIDITY_START ? new Date(VALIDITY_START) : undefined,
        validity_end: VALIDITY_END ? new Date(VALIDITY_END) : undefined,
        created_by: CREATED_BY ? Number(CREATED_BY) : undefined,
        is_recurring: IS_RECURRING ? Number(IS_RECURRING) : undefined,
        question_selection_method: QUESTION_SELECTION_METHOD,
        status: STATUS ? Number(STATUS) : undefined,
        test_code: TEST_CODE,
        test_title: TEST_TITLE,
        test_icon: TEST_ICON,
        language: LANGUAGE,
        general_data: GENERAL_DATA,
        role: ROLE ? Number(ROLE) : undefined,
        master_data: MASTER_DATA,
        epi_question: EPI_QUESTION,
        video: VIDEO ? Number(VIDEO) : undefined,
        college_code: COLLEGE_CODE,
        college_name: COLLEGE_NAME,
        module: MODULE ? Number(MODULE) : undefined,
        link_test: LINK_TEST ? Number(LINK_TEST) : undefined,
        ip_restriction: IP_RESTRICTION ? Number(IP_RESTRICTION) : undefined,
        ip_addresses: IP_ADDRESSES,
      },
    });

    return NextResponse.json({ message: "Resource created successfully!", data: newTest }, { status: 201 });
  } catch (error) {
    console.error("Error during request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET handler to fetch all test repository records
export async function GET(req: NextRequest) {
  try {
    const tests = await prisma.test_repository.findMany({
      orderBy: { test_id: "desc" },
    });

    return NextResponse.json(tests, { status: 200 });
  } catch (error) {
    console.error("Error fetching test repository details:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch data", details: errorMessage },
      { status: 500 }
    );
  }
}
