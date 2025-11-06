import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST => upsert test_repository_details (create if no repository_details_id, else update)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      repository_details_id, // optional (for update)
      test_id,
      subjectid,            // client -> subject_id
      topicid,              // client -> topic_id
      questioncount,
      duration_min,
      rendering_order,
      selection_method,
      subject_marks,
      negative_marks,       // present in schema
      REQUIRE_RESOURCE,     // client -> require_resource
    } = body;

    if (!test_id || !subjectid || !topicid) {
      return NextResponse.json(
        { error: "Missing required fields: test_id, subjectid, topicid" },
        { status: 400 }
      );
    }

    const data = {
      test_id: Number(test_id),
      subject_id: Number(subjectid),
      topic_id: Number(topicid),
      question_count: questioncount != null ? Number(questioncount) : null,
      duration_min: duration_min != null ? Number(duration_min) : null,
      rendering_order: rendering_order != null ? Number(rendering_order) : null,
      selection_method: selection_method ?? null,
      subject_marks: subject_marks != null ? Number(subject_marks) : null,
      negative_marks: negative_marks != null ? Number(negative_marks) : null,
      require_resource: REQUIRE_RESOURCE != null ? Number(REQUIRE_RESOURCE) : null,
    };

    let record;

    if (repository_details_id) {
      // UPDATE
      record = await prisma.test_repository_details.update({
        where: { repository_details_id: Number(repository_details_id) },
        data,
      });
    } else {
      // CREATE (need to supply repository_details_id because model doesn't autoincrement)
      const agg = await prisma.test_repository_details.aggregate({
        _max: { repository_details_id: true },
      });
      const nextId = (agg._max.repository_details_id ?? 0) + 1;

      record = await prisma.test_repository_details.create({
        data: {
          repository_details_id: nextId,
          ...data,
        },
      });
    }

    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    console.error("POST /ManageTestRepositoryDetails error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET => list details by test_id (return a plain array with joined subject/topic names)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawTestId = searchParams.get("test_id");
    const test_id = Number(rawTestId);

    if (!Number.isFinite(test_id) || test_id <= 0) {
      return NextResponse.json({ error: "Valid test_id is required" }, { status: 400 });
    }

    // Join subjects & topics so the UI can render the three columns
    const rows = await prisma.$queryRaw<
      Array<{
        repository_details_id: number;
        test_id: number;
        subject_id: number | null;
        TOPIC_ID: number | null;
        SUBJECT_DESCRIPTION: string | null;
        SUBJECT_CODE: string | null;
        TOPIC_DESCRIPTION: string | null;
        TOPIC_CODE: string | null;
        question_count: number | null;
        duration_min: number | null;
        rendering_order: number | null;
        selection_method: string | null;
        subject_marks: number | null;
        negative_marks: number | null;
        require_resource: number | null;
      }>
    >`
      SELECT
        d.repository_details_id,
        d.test_id,
        d.subject_id,
        d.topic_id        AS "TOPIC_ID",
        s.subject_description AS "SUBJECT_DESCRIPTION",
        s.subject_code       AS "SUBJECT_CODE",
        t.topic_description  AS "TOPIC_DESCRIPTION",
        t.topic_code         AS "TOPIC_CODE",
        d.question_count,
        d.duration_min,
        d.rendering_order,
        d.selection_method,
        d.subject_marks,
        d.negative_marks,
        d.require_resource
      FROM test_repository_details d
      LEFT JOIN subjects s ON s.subject_id = d.subject_id
      LEFT JOIN topics   t ON t.topic_id   = d.topic_id
      WHERE d.test_id = ${test_id}
      ORDER BY d.rendering_order NULLS LAST, d.repository_details_id
    `;
      console.log('GET rows:', rows);
    return NextResponse.json(rows ?? [], { status: 200 });
  } catch (error) {
    console.error("GET /ManageTestRepositoryDetails error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE => delete a test_repository_details row by repository_details_id (query param)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get("repository_details_id");
    const id = Number(rawId);
    console.log("DELETE id:", id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Valid repository_details_id is required" }, { status: 400 });
    }

    // Attempt delete
    await prisma.test_repository_details.delete({
      where: { repository_details_id: id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /ManageTestRepositoryDetails error:", err);

    // If Prisma FK constraint error, return explanatory message
    if (err?.code === "P2003") {
      return NextResponse.json({ error: "Delete failed due to related records (foreign key)." }, { status: 409 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
