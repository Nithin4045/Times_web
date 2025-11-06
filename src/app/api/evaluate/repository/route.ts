import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const {
      TEST_TYPE,
      TEST_DESCRIPTION,
      VALIDITY_START,
      VALIDITY_END,
      QUESTION_SELECTION_METHOD,
      TEST_CODE,
      TEST_TITLE,
      general_data,
      master_data,
      epi_question,
      video,
      COLLEGE_CODE,
      COLLEGE_NAME,
      LINK_TEST,
      ip_restriction,
      ip_addresses,
    } = await req.json();

    const host = req.headers.get("host");
    if (!host) {
      return NextResponse.json({ error: "Host header is missing" }, { status: 400 });
    }

    await prisma.test_repository.create({
      data: {
        test_type: TEST_TYPE,
        test_description: TEST_DESCRIPTION,
        validity_start: new Date(VALIDITY_START),
        validity_end: new Date(VALIDITY_END),
        question_selection_method: QUESTION_SELECTION_METHOD,
        test_code: TEST_CODE,
        test_title: TEST_TITLE,
        general_data,
        master_data,
        epi_question,
        video: video || 0,
        college_code: COLLEGE_CODE,
        college_name: COLLEGE_NAME,
        module: 3,
        link_test: LINK_TEST || 0,
        ip_restriction: ip_restriction || 0,
        ip_addresses: ip_addresses || "",
        status: 1,
        created_date: new Date(),
      },
    });

    return NextResponse.json({ message: "Test repository inserted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error inserting test repository:", error);
    return NextResponse.json({ message: "Error inserting test repository", error }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const TEST_ID = req.nextUrl.searchParams.get("TEST_ID");

  try {
    const {
      TEST_TYPE,
      TEST_DESCRIPTION,
      VALIDITY_START,
      VALIDITY_END,
      QUESTION_SELECTION_METHOD,
      TEST_CODE,
      TEST_TITLE,
      general_data,
      master_data,
      epi_question,
      video,
      COLLEGE_CODE,
      COLLEGE_NAME,
      LINK_TEST,
      ip_restriction,
      ip_addresses,
    } = await req.json();

    const host = req.headers.get("host");
    if (!host) {
      return NextResponse.json({ error: "Host header is missing" }, { status: 400 });
    }

    await prisma.test_repository.update({
      where: { test_id: parseInt(TEST_ID!) },
      data: {
        test_type: TEST_TYPE,
        test_description: TEST_DESCRIPTION,
        validity_start: new Date(VALIDITY_START),
        validity_end: new Date(VALIDITY_END),
        question_selection_method: QUESTION_SELECTION_METHOD,
        test_code: TEST_CODE,
        test_title: TEST_TITLE,
        general_data,
        master_data,
        epi_question,
        video: video || 0,
        college_code: COLLEGE_CODE,
        college_name: COLLEGE_NAME,
        module: 3,
        link_test: LINK_TEST || 0,
        ip_restriction: ip_restriction || 0,
        ip_addresses: ip_addresses || "",
        status: 1
      },
    });

    return NextResponse.json({ message: "Test repository updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating test repository:", error);
    return NextResponse.json({ message: "Error updating test repository", error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get("host");
    if (!host) {
      return NextResponse.json({ error: "Host header is missing" }, { status: 400 });
    }

    const result = await prisma.test_repository.findMany({
      where: { module: 3, status: 1 },
      orderBy: { created_date: "desc" },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Server error", error);
    return NextResponse.json({ message: "Failed to retrieve repository." }, { status: 500 });
  }
}
