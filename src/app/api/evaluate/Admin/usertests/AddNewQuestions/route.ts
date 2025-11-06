
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Request Body:", body);

    const {
      startUserId,
      endUserId,
      test_id,
      validity_start,
      validity_end,
      created_by,
      module,
      batch_code,
      user_name,
      access,
      test_name,
      user_data,
      epi_data,
      distcount,
      distsecs,
      video,
    } = body;

    // Validate required fields
    if (
      startUserId === undefined ||
      endUserId === undefined ||
      !test_id ||
      !validity_start ||
      !validity_end
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userTests = [];

    for (let userId = startUserId; userId <= endUserId; userId++) {
      userTests.push({
        user_id: userId,
        test_id,
        created_by: created_by || 1,
        created_date: new Date(),
        validity_start: new Date(validity_start),
        validity_end: new Date(validity_end),
        module: module || "2",
        batch_code: batch_code || null,
        user_name: user_name || null,
        access: access || null,
        test_name: test_name || null,
        user_data: user_data || null,
        epi_data: epi_data || null,
        distcount: distcount || null,
        distsecs: distsecs || null,
        video: video || null,
      });
    }

    // Insert all records in a single query
    const inserted = await prisma.user_tests.createMany({
      data: userTests,
      skipDuplicates: true, // optional, avoids duplicate insert errors
    });

    return NextResponse.json({
      message: "User tests inserted successfully",
      insertedCount: inserted.count,
    });
  } catch (error: any) {
    console.error("Error inserting user tests:", error);
    return NextResponse.json(
      { error: "Failed to insert user tests", details: error.message },
      { status: 500 }
    );
  }
}
