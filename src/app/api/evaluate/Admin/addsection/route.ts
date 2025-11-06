import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
      // Check if a subject with this code exists
      const exists = await prisma.subjects.findFirst({
        where: { subject_code: code },
        select: { subject_id: true },
      });
      return NextResponse.json({ exists: !!exists }, { status: 200 });
    }

    // Return all subjects
    const subjects = await prisma.subjects.findMany({
      orderBy: { subject_id: "desc" },
    });
    console.log("Fetched subjects:", subjects); 
    return NextResponse.json({ tests: subjects }, { status: 200 });

  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ message: "Error fetching subjects" }, { status: 500 });
  }
}

// POST (add) subject
export async function POST(request: Request) {
  try {
    const { subject_description, test_type, subject_code, REQUIRE_RESOURCE } = await request.json();

    if (!subject_description || !subject_code) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const newSubject = await prisma.subjects.create({
      data: {
        subject_description,
        test_type: test_type ?? null,
        subject_code,
        require_resource: Number(REQUIRE_RESOURCE) ?? 0,
      },
    });

    return NextResponse.json({ message: "Test added successfully", newSubject }, { status: 201 });

  } catch (error) {
    console.error("Error adding subject:", error);
    return NextResponse.json({ message: "Error adding subject" }, { status: 500 });
  }
}

// DELETE subject
export async function DELETE(request: Request) {
  try {
    const { subject_id } = await request.json();

    if (!subject_id) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 });
    }

    // Delete related test_repository_details first
    await prisma.test_repository_details.deleteMany({
      where: { subject_id },
    });

    // Delete subject
    await prisma.subjects.delete({
      where: { subject_id },
    });

    return NextResponse.json({ message: "Subject and related details deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json({ message: "Error deleting subject" }, { status: 500 });
  }
}
