// src/app/api/evaluate/Admin/addresources/route.ts
import { NextResponse } from "next/server";
import { mkdirSync, writeFileSync } from "fs";
import { join, extname } from "path";
import { prisma } from "@/lib/prisma";

// ensure upload dir exists (frontend expects files under /static/files or similar)
const uploadDir = join(process.cwd(), "uploads", "evaluate", "static", "files");
mkdirSync(uploadDir, { recursive: true });

export async function PUT(request: Request) {
  try {
    // get resource id from url
    const parts = request.url.split("/");
    const RESOURCE_ID_RAW = parts.pop() || parts.pop(); // handle trailing slash
    if (!RESOURCE_ID_RAW) {
      return NextResponse.json({ message: "RESOURCE_ID is required in URL" }, { status: 400 });
    }
    const resourceId = parseInt(RESOURCE_ID_RAW, 10);
    if (isNaN(resourceId)) {
      return NextResponse.json({ message: "Invalid RESOURCE_ID" }, { status: 400 });
    }

    const formData = await request.formData();
    console.log("Received formData keys:", Array.from(formData.keys()));

    // server-side names (frontend sends uppercase keys)
    const RESOURCE_TYPE = (formData.get("RESOURCE_TYPE") as string) ?? null;
    const RESOURCE = (formData.get("RESOURCE") as string) ?? null;
    const RESOURCE_FILES = formData.get("RESOURCE_FILES") as File | null;
    const SUBJECT_ID = (formData.get("SUBJECT_ID") as string) ?? null;
    const resource_code = (formData.get("resource_code") as string) ?? null;
    const TOPIC_ID = (formData.get("TOPIC_ID") as string) ?? null; // stored as string in Prisma
    const COMPLEXITY = (formData.get("COMPLEXITY") as string) ?? null; // stored as string in Prisma

    // optional helper: frontend may send existing filename to preserve it
    const existingFileName = (formData.get("existing_file_name") as string) ?? null;

    // Validate required fields (same as MSSQL)
    if (!RESOURCE_TYPE || !SUBJECT_ID || !resource_code || !TOPIC_ID) {
      return NextResponse.json(
        { message: "RESOURCE_TYPE, SUBJECT_ID, RESOURCE_CODE, and TOPIC_ID are required fields" },
        { status: 400 }
      );
    }

    // parse subject id to integer (Prisma schema has subject_id Int?)
    const subjectIdInt = parseInt(SUBJECT_ID, 10);
    if (isNaN(subjectIdInt)) {
      return NextResponse.json({ message: "Invalid input: SUBJECT_ID must be an integer" }, { status: 400 });
    }

    // verify resource exists
    const existing = await prisma.question_resources.findUnique({
      where: { resource_id: resourceId },
    });
    if (!existing) {
      return NextResponse.json({ message: "Resource not found" }, { status: 404 });
    }

    // handle file: priority -> new upload > existing_file_name > keep existing DB value
    let filePath: string | null = null;

    if (RESOURCE_FILES) {
      const originalName = RESOURCE_FILES.name;
      // add unique prefix if you want to avoid collisions:
      // const savedName = `${Date.now()}_${originalName}`;
      const savedName = originalName;
      const buffer = Buffer.from(await RESOURCE_FILES.arrayBuffer());
      writeFileSync(join(uploadDir, savedName), buffer);
      filePath = savedName;
    } else if (existingFileName) {
      // frontend explicitly sent the existing filename to preserve it
      filePath = existingFileName;
    } else {
      // if neither new nor explicit existing provided, preserve what DB already has
      filePath = existing.resource_files ?? null;
    }

    // Build update data to match Prisma schema
    const updateData: any = {
      resource_type: RESOURCE_TYPE,
      resource: RESOURCE || null,
      resource_files: filePath || null,
      subject_id: subjectIdInt,
      resource_code: resource_code,
      // topic_id and complexity are strings in schema => store as provided string or null
      topic_id: TOPIC_ID ?? null,
      complexity: COMPLEXITY ?? null,
    };

    // perform the update
    const updated = await prisma.question_resources.update({
      where: { resource_id: resourceId },
      data: updateData,
    });

    return NextResponse.json(
      { message: "Resource updated successfully", resource: updated },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating resource (PUT):", error);
    return NextResponse.json({ message: error?.message || "Error updating resource" }, { status: 500 });
  }
}
