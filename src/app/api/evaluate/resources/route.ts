import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import { writeFile } from "fs/promises";
import path from "path";

// GET resources for a subject and topic
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const subjectId = url.searchParams.get("subjectId");
    const topicId = url.searchParams.get("topicId"); // schema: question_resources.topic_id is String?

    if (!subjectId || !topicId) {
      return NextResponse.json({ message: "Missing subjectId or topicId" }, { status: 400 });
    }

    const resources = await prisma.question_resources.findMany({
      where: {
        subject_id: Number(subjectId),
        // topic_id is String? in schema
        topic_id: String(topicId),
      },
      select: {
        resource_code: true,
        resource: true,
        resource_files: true,
      },
      orderBy: { resource: "asc" },
    });

    return NextResponse.json(resources, { status: 200 });
  } catch (err) {
    console.error("Error fetching resources:", err);
    return NextResponse.json({ message: "Error fetching resources" }, { status: 500 });
  }
}

// PUT to update parent question number on eval_questions
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { QUESTION_ID, PARENT_QUESTION_NUMBER } = body;

    if (!QUESTION_ID || !PARENT_QUESTION_NUMBER) {
      return NextResponse.json(
        { error: "QUESTION_ID and PARENT_QUESTION_NUMBER are required" },
        { status: 400 }
      );
    }

    await prisma.eval_questions.update({
      where: { question_id: Number(QUESTION_ID) },
      data: {
        parent_question_number: String(PARENT_QUESTION_NUMBER),
        modified_date: new Date(),
      },
    });

    return NextResponse.json({ message: "Question updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json({ error: "Error updating question" }, { status: 500 });
  }
}

// POST to upload a help file and attach it to a question
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file: File | null = formData.get("file") as File;
    const questionId = formData.get("QUESTION_ID")?.toString();

    if (!file || !questionId) {
      return NextResponse.json({ message: "Missing file or question ID" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;

    // Save to public/static/files so it’s directly served
    const helpfilesDir = path.join(process.cwd(), "public", "static", "files");
    if (!fs.existsSync(helpfilesDir)) fs.mkdirSync(helpfilesDir, { recursive: true });

    const uploadPath = path.join(helpfilesDir, fileName);
    await writeFile(uploadPath, buffer);

    // Store a web path (what the FE uses)
    const webPath = `/static/files/${fileName}`;

    await prisma.eval_questions.update({
      where: { question_id: Number(questionId) },
      data: { help_files: webPath, modified_date: new Date() },
    });

    return NextResponse.json({ message: "Help file uploaded", filename: webPath }, { status: 200 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Error uploading file" }, { status: 500 });
  }
}
