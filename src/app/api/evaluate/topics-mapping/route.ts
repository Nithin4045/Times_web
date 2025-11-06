import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const topics = await prisma.topics.findMany({
      select: {
        topic_id: true,
        topic_description: true,
        topic_code: true,
      },
      orderBy: { topic_description: "asc" },
      // distinct is unnecessary here; remove unless you truly need it
      // distinct: ['topic_id'], // if you ever use it, use lowercase field names
    });

    // Frontend expects { topic_id, topic_description, topic_code }
    return NextResponse.json(topics, { status: 200 });
  } catch (error) {
    console.error("topics-mapping error:", error);
    return NextResponse.json({ message: "Error fetching topics" }, { status: 500 });
  }
}
