import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const { subject_id } = await request.json();

    if (!subject_id) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    // // Delete all related subject_topics by subject_id
    // await prisma.subject_topics.deleteMany({
    //   where: { subject_id: Number(subject_id) },
    // });

    return NextResponse.json(
      { message: "Subject and topics deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { message: "Error deleting subject", error: String(error) },
      { status: 500 }
    );
  }
}
