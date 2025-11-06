import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next's RouteContext in your project expects: { params: Promise<{ id: string }> }
type RouteParams = { params: Promise<{ id: string }> };

// PUT => update by id
export async function PUT(req: NextRequest, ctx: RouteParams) {
  try {
    const { id } = await ctx.params; // <-- await the promise
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();
    const {
      test_id,
      subjectid,
      topicid,
      questioncount,
      duration_min,
      rendering_order,
      selection_method,
      subject_marks,
      negative_marks,
      REQUIRE_RESOURCE,
    } = body ?? {};

    const data: Record<string, any> = {};
    if (test_id != null) data.test_id = Number(test_id);
    if (subjectid != null) data.subject_id = Number(subjectid);
    if (topicid != null) data.topic_id = Number(topicid);
    if (questioncount != null) data.question_count = Number(questioncount);
    if (duration_min != null) data.duration_min = Number(duration_min);
    if (rendering_order != null) data.rendering_order = Number(rendering_order);
    if (selection_method != null) data.selection_method = String(selection_method);
    if (subject_marks != null) data.subject_marks = Number(subject_marks);
    if (negative_marks != null) data.negative_marks = Number(negative_marks);
    if (REQUIRE_RESOURCE != null) data.require_resource = Number(REQUIRE_RESOURCE);

    const record = await prisma.test_repository_details.update({
      where: { repository_details_id: idNum },
      data,
    });

    return NextResponse.json(record, { status: 200 });
  } catch (error: any) {
    console.error("PUT /ManageTestRepositoryDetails/[id] error:", error);
    if (error?.code === "P2025") {
      return NextResponse.json({ message: "Record not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE => delete by id
export async function DELETE(_req: NextRequest, ctx: RouteParams) {
  try {
    const { id } = await ctx.params; // <-- await the promise
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return NextResponse.json(
        { message: "Invalid or missing repository_details_id" },
        { status: 400 }
      );
    }

    await prisma.test_repository_details.delete({
      where: { repository_details_id: idNum },
    });

    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /ManageTestRepositoryDetails/[id] error:", error);
    if (error?.code === "P2025") {
      return NextResponse.json({ message: "Record not found" }, { status: 404 });
    }
    return NextResponse.json(
        { message: "Failed to delete record", error: String(error?.message ?? error) },
        { status: 500 }
    );
  }
}
