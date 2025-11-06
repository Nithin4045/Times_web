import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch all subjects
export async function GET(request: Request) {
  try {
    const subjects = await prisma.$queryRaw`
      SELECT * FROM subjects ORDER BY 1 DESC
    `;
    return NextResponse.json({ topics: subjects }, { status: 200 });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { message: "Error fetching topics", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a subject and its topics
export async function DELETE(request: Request) {
  try {
    const { subject_id } = await request.json();
    if (!subject_id) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 });
    }

    // Delete related topics first
    await prisma.$queryRaw`
      DELETE FROM subject_topics WHERE SUBJECT_ID = ${subject_id}
    `;

    // Delete the subject
    await prisma.$queryRaw`
      DELETE FROM subjects WHERE SUBJECT_ID = ${subject_id}
    `;

    return NextResponse.json(
      { message: "Subject and topics deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { message: "Error deleting subject", error: (error as Error).message },
      { status: 500 }
    );
  }
}
