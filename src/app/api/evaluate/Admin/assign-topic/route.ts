import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { test_id, subject_id, topic_id, question_count, complexity } = await request.json();

    if (!test_id || !subject_id || !topic_id || !question_count) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if the topic already exists
    const existingRecord = await prisma.test_repository_details.findFirst({
      where: {
        test_id,
        subject_id,
        topic_id: topic_id,
      },
    });

    if (!existingRecord) {
      // Fetch required_resource from the topics table
      const topic = await prisma.topics.findUnique({
        where: { topic_id: topic_id },
      });
      const required_resource = topic?.require_resource ?? null;

      // Fetch rendering_order from existing test_repository_details
      const renderData = await prisma.test_repository_details.findFirst({
        where: { test_id, subject_id },
        orderBy: { repository_details_id: "asc" },
      });
      const rendering_order = renderData?.rendering_order ?? null;

      await prisma.test_repository_details.create({
        data: {
          repository_details_id: 0,
          test_id: Number(test_id),
          subject_id: Number(subject_id),
          topic_id: Number(topic_id),
          question_count: Number(question_count),
          require_resource:
            required_resource == null ? null : Number(required_resource),
          selection_method: "RANDOM",
          complexity: complexity ?? null,
          subject_marks:
            question_count == null ? null : Number(question_count),
          rendering_order:
            rendering_order == null ? null : Number(rendering_order),
        },
      });
    } else {
      // Update existing record
      await prisma.test_repository_details.update({
        where: { repository_details_id: existingRecord.repository_details_id },
        data: {
          question_count,
          subject_marks: question_count,
          complexity: complexity ?? null,
        },
      });
    }

    return NextResponse.json({ message: "Topic assigned/updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error assigning topic:", error);
    return NextResponse.json({ message: "Error assigning topic", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const test_id = searchParams.get("test_id");
    const topic_id = searchParams.get("topic_id");

    if (!test_id || !topic_id) {
      return NextResponse.json({ error: "Missing test_id or topic_id" }, { status: 400 });
    }

    // Find the record first
    // const record = await prisma.test_repository_details.findFirst({
    //   where: { test_id: Number(test_id), TOPIC_ID: topic_id },
    // });

    const record = await prisma.test_repository_details.findFirst({
      where: { test_id: Number(test_id) },
    });

    if (!record) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    await prisma.test_repository_details.delete({
      where: { repository_details_id: record.repository_details_id },
    });

    return NextResponse.json({ message: "Topic deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting topic:", error);
    return NextResponse.json({ message: "Error deleting topic", error: error.message }, { status: 500 });
  }
}
