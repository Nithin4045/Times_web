import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
      // ✅ Check if a topic with this code exists
      const existing = await prisma.topics.findFirst({
        where: { topic_code: code },
        select: { topic_code: true },
      });
      return NextResponse.json({ exists: !!existing }, { status: 200 });
    }

    // ✅ Fetch all topics
    const topics = await prisma.topics.findMany({
      orderBy: { topic_id: "desc" },
    });

    return NextResponse.json({ tests: topics }, { status: 200 });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json({ message: "Error fetching topics" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.records) {
      // Single record creation
      const { topic_description, topic_code, require_resource, test_type } = body;

      if (!topic_description || !topic_code) {
        return NextResponse.json({ message: "Topic description and code are required" }, { status: 400 });
      }

      // ✅ Check for duplicates by topic_code (not topic_id)
      const existing = await prisma.topics.findFirst({ 
        where: { topic_code: topic_code } 
      });
      
      if (existing) {
        return NextResponse.json({ 
          message: `Topic code ${topic_code} already exists` 
        }, { status: 409 });
      }

      // ✅ Create new topic - let Prisma handle topic_id auto-increment
      const newTopic = await prisma.topics.create({
        data: {
          topic_description,
          topic_code,
          require_resource: require_resource ? parseInt(require_resource.toString()) : 0,
          test_type: test_type || null,
        },
      });

      return NextResponse.json({ 
        message: "Topic added successfully", 
        topic: newTopic 
      }, { status: 201 });
    }

    // ✅ Bulk insert
    const { records } = body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ message: "No records provided" }, { status: 400 });
    }

    const formattedRecords = records.map((r: any) => ({
      topic_description: r.topic_description,
      topic_code: r.topic_code,
      require_resource: r.require_resource ? parseInt(r.require_resource.toString()) : 0,
      test_type: r.test_type || null,
    }));

    // Check for duplicates
    const topicCodes = formattedRecords.map((r: any) => r.topic_code);
    const existingRecords = await prisma.topics.findMany({
      where: { topic_code: { in: topicCodes } },
      select: { topic_code: true },
    });

    if (existingRecords.length > 0) {
      const duplicates = existingRecords.map((r) => r.topic_code);
      return NextResponse.json(
        { message: `Duplicate topic codes found: ${duplicates.join(", ")}` },
        { status: 409 }
      );
    }

    // Use createMany for better performance with bulk inserts
    const result = await prisma.topics.createMany({
      data: formattedRecords,
      skipDuplicates: true, // This will skip any duplicates that might slip through
    });

    return NextResponse.json({ 
      message: "Records uploaded successfully",
      count: result.count 
    }, { status: 201 });

  } catch (error) {
    console.error("Error processing request:", error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json({ 
          message: "Duplicate entry detected. Please check your data." 
        }, { status: 409 });
      }
    }
    
    return NextResponse.json({ 
      message: "Error processing request",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const topicIdStr = url.pathname.split("/").pop();
    const topic_id = topicIdStr ? parseInt(topicIdStr) : null;

    if (!topic_id) {
      return NextResponse.json({ message: "Topic ID is required for update" }, { status: 400 });
    }

    const { topic_description, require_resource, test_type } = await request.json();

    // Check if topic exists before updating
    const existingTopic = await prisma.topics.findUnique({
      where: { topic_id },
    });

    if (!existingTopic) {
      return NextResponse.json({ message: "Topic not found" }, { status: 404 });
    }

    const updatedTopic = await prisma.topics.update({
      where: { topic_id },
      data: {
        topic_description,
        require_resource: require_resource ?? 0,
        test_type: test_type || null,
      },
    });

    return NextResponse.json({ 
      message: "Topic updated successfully", 
      topic: updatedTopic 
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json({ 
      message: "Error updating topic",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}