import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const { subject_description, test_type, subject_code } = await request.json();
    const subject_id_str = request.url.split("/").pop();

    if (!subject_description || !subject_code) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const subject_id = parseInt(subject_id_str!);
    if (isNaN(subject_id)) {
      return NextResponse.json({ message: "Invalid subject_id" }, { status: 400 });
    }

    const updatedSubject = await prisma.subjects.update({
      where: { subject_id },
      data: {
        subject_description,
        test_type: test_type ?? null,
        subject_code,
      },
    });

    return NextResponse.json({ message: "Test updated successfully", updatedSubject }, { status: 200 });
  } catch (error) {
    console.error("Error updating test:", error);
    return NextResponse.json({ message: "Error updating test" }, { status: 500 });
  }
}
