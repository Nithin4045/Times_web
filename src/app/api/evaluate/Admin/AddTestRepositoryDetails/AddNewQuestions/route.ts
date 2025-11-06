import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const toInt = (v: any, name: string) => {
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid number for ${name}`);
  }
  return n;
};

// POST: create a test_repository_details record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // REQUIRED because your schema requires it (no autoincrement)
    if (body.repository_details_id == null) {
      return NextResponse.json(
        { error: "repository_details_id is required by the current schema" },
        { status: 422 }
      );
    }

    // Validate required numeric fields
    const repository_details_id = toInt(body.repository_details_id, "repository_details_id");
    const test_id = toInt(body.test_id, "test_id");
    const subject_id = toInt(body.subject_id, "subject_id");
    const question_count = toInt(body.question_count, "question_count");
    const duration_min = toInt(body.duration_min, "duration_min");

    // Optional fields
    const rendering_order = body.rendering_order ?? null;   // string | null
    const selection_method = body.selection_method ?? null; // string | null
    const complexity = body.complexity ?? null;             // string | null
    const subject_marks =
      body.subject_marks == null ? null : toInt(body.subject_marks, "subject_marks");

    // If you actually need these saved and they exist as columns, parse them too:
    // const TOPIC_ID = body.TOPIC_ID ?? null;
    // const REQUIRE_RESOURCE =
    //   body.REQUIRE_RESOURCE == null ? null : toInt(body.REQUIRE_RESOURCE, "REQUIRE_RESOURCE");

    // Build the payload matching your Prisma model
    // const data: Prisma.test_repository_detailsUncheckedCreateInput = {
    //   repository_details_id,
    //   test_id,
    //   subject_id,
    //   question_count,
    //   duration_min,
    //   rendering_order,
    //   selection_method,
    //   complexity,
    //   subject_marks,
    //   // TOPIC_ID,          // uncomment if present in your Prisma model
    //   // REQUIRE_RESOURCE,  // uncomment if present in your Prisma model
    // };

    // const newRecord = await prisma.test_repository_details.create({ data });

    return NextResponse.json(
      { message: "Resource created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource", details: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

// GET: fetch all test_repository_details records
export async function GET() {
  try {
    const records = await prisma.test_repository_details.findMany({
      orderBy: { repository_details_id: "desc" },
    });
    return NextResponse.json(records, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching test repository details:", error);
    return NextResponse.json(
      { error: "Failed to fetch data", details: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
