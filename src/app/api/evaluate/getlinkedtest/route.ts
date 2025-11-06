// app/api/get-linked-test/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("test_id");
    console.log("Fetching linked test for TEST_ID:", testId);

    if (!testId) {
      console.log("TEST_ID parameter is missing");
      return NextResponse.json(
        { message: "Test ID is required" },
        { status: 400 }
      );
    }

    // Fetch the LINK_TEST for the given TEST_ID
    console.log("Received testId from getLinkedTest:", testId);
    const test = await prisma.test_repository.findUnique({
      where: { test_id: parseInt(testId) },
      select: { link_test: true }
    });

    if (!test || !test.link_test) {
             console.log("No linked test found for TEST_ID:", testId);
      return NextResponse.json(
        { message: "No linked test found for this test" },
        { status: 404 }
      );


    }

    const linkedTestId = test.link_test;

    // Fetch all details of the linked test
    const linkedTestDetails = await prisma.test_repository.findUnique({
      where: { test_id: linkedTestId },
    });
    console.log("Linked test details:", linkedTestDetails);

    if (!linkedTestDetails) {
      console.log("No details found for linked TEST_ID:", linkedTestId);
      return NextResponse.json(
        { message: "No details found for the linked test" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        testId: parseInt(testId),
        linkedTestId,
        linkedTestDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching linked test details:", error);
    return NextResponse.json(
      { message: "Error fetching test details" },
      { status: 500 }
    );
  }
}
