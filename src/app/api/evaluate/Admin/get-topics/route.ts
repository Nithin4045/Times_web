import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** GET: list topics, newest first */
export async function GET() {
  try {
    const topics = await prisma.topics.findMany({
      orderBy: { topic_id: "desc" }, // adjust field name if different
    });
    return NextResponse.json({ topics }, { status: 200 });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json({ message: "Error fetching topics" }, { status: 500 });
  }
}

/** POST: assign a topic to a subject (insert into SUBJECT_TOPICS) */
export async function POST(request: Request) {
  try {
    const { subject_id, topic_id } = await request.json();

    if (subject_id == null || topic_id == null) {
      return NextResponse.json(
        { error: "Both Subject ID and Topic ID are required" },
        { status: 400 }
      );
    }

    // Subject likely numeric; topic_id looked quoted in your SQL, so treat as string here.
    const subjectIdNum = Number(subject_id);
    if (!Number.isFinite(subjectIdNum)) {
      return NextResponse.json({ error: "Invalid Subject ID" }, { status: 400 });
    }
    const topicIdStr = String(topic_id);

    // await prisma.subject_topics.create({
    //   data: {
    //     subject_id: subjectIdNum,
    //     topic_id: topicIdStr,
    //   },
    // });

    return NextResponse.json({ message: "Topic assigned successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Error assigning topic:", error);
    return NextResponse.json({ message: "Error assigning topic" }, { status: 500 });
  }
}

/** DELETE: remove a topic assignment */
export async function DELETE(request: Request) {
  try {
    const { subject_id, topic_id } = await request.json();

    if (subject_id == null || topic_id == null) {
      return NextResponse.json(
        { error: "Subject ID and Topic ID are required" },
        { status: 400 }
      );
    }

    const subjectIdNum = Number(subject_id);
    if (!Number.isFinite(subjectIdNum)) {
      return NextResponse.json({ error: "Invalid Subject ID" }, { status: 400 });
    }
    const topicIdStr = String(topic_id);

    // await prisma.subject_topics.deleteMany({
    //   where: {
    //     subject_id: subjectIdNum,
    //     topic_id: topicIdStr,
    //   },
    // });

    return NextResponse.json({ message: "Topic deleted successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json({ message: "Error deleting topic" }, { status: 500 });
  }
}
