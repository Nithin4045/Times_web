import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const idNum = Number(id);
    if (!id || !Number.isFinite(idNum)) {
      return NextResponse.json({ message: "Invalid topic id" }, { status: 400 });
    }

    const body = await request.json();
    const { topic_description, topic_code, require_resource, test_type } = body ?? {};

    if (!topic_description || !topic_code) {
      return NextResponse.json(
        { message: "Topic name and code are required" },
        { status: 400 }
      );
    }

    const updatedTopic = await prisma.topics.update({
      where: { topic_id: idNum },
      data: {
        topic_description,
        topic_code,
        require_resource:
          typeof require_resource === "number"
            ? require_resource
            : require_resource == null
            ? null
            : parseInt(String(require_resource), 10) || 0,
        test_type: test_type ?? null,
      },
    });

    return NextResponse.json(
      { message: "Topic updated successfully", updatedTopic },
      { status: 200 }
    );
  } catch (err: any) {
    if (err?.code === "P2002" && err?.meta?.target?.includes("topic_code")) {
      return NextResponse.json(
        { message: "Topic Code already exists" },
        { status: 409 }
      );
    }
    console.error("Error updating topic:", err);
    return NextResponse.json(
      { message: "Error updating topic", error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
