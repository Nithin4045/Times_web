import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

// Ensure upload directory exists
const uploadDir = join(process.cwd(), "uploads", "evaluate", "static", "files");
mkdirSync(uploadDir, { recursive: true });



export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    // check existence of resource_code
    if (code) {
      const exists = await prisma.question_resources.findFirst({
        where: { resource_code: code },
        select: { resource_id: true },
      });
      return NextResponse.json({ exists: !!exists }, { status: 200 });
    }

    // fetch resources (include the columns we need)
    const resources = await prisma.question_resources.findMany({
      select: {
        resource_id: true,
        complexity: true,
        resource_type: true,
        resource_files: true,
        resource_code: true,
        resource: true,
        subject_id: true,
        topic_id: true,
      },
      orderBy: { resource_id: "desc" },
    });

    // Collect unique subject_ids and topic_ids (topic_id is stored as string in your schema)
    const subjectIds = Array.from(
      new Set(resources.map((r) => Number(r.subject_id)).filter((v) => Number.isFinite(v)))
    ) as number[];

    const topicIds = Array.from(
      new Set(
        resources
          .map((r) => {
            if (r.topic_id === null || r.topic_id === undefined) return null;
            const n = Number(r.topic_id);
            return Number.isFinite(n) ? n : null;
          })
          .filter((v) => v !== null)
      )
    ) as number[];

    // Bulk fetch subjects and topics
    const [subjects, topics] = await Promise.all([
      subjectIds.length ? prisma.subjects.findMany({ where: { subject_id: { in: subjectIds } } }) : [],
      topicIds.length ? prisma.topics.findMany({ where: { topic_id: { in: topicIds } } }) : [],
    ]);

    const subjectMap = new Map<number, any>(subjects.map((s) => [s.subject_id, s]));
    const topicMap = new Map<number, any>(topics.map((t) => [t.topic_id, t]));

    // Shape each resource similar to MSSQL response
    const shaped = resources.map((r) => {
      const subj = r.subject_id ? subjectMap.get(Number(r.subject_id)) : null;
      const topicNum =
        r.topic_id === null || r.topic_id === undefined ? null : Number(r.topic_id);
      const top = topicNum ? topicMap.get(topicNum) : null;

      return {
        RESOURCE_ID: r.resource_id,
        COMPLEXITY: r.complexity,
        RESOURCE_TYPE: r.resource_type,
        RESOURCE_FILES: r.resource_files,
        resource_code: r.resource_code,
        RESOURCE: r.resource,
        SUBJECT_ID: subj ? subj.subject_id : r.subject_id,
        SUBJECT_NAME: subj ? subj.subject_description : null,
        TOPIC_ID: top ? top.topic_id : r.topic_id,
        TOPIC_NAME: top ? top.topic_description : null,
      };
    });
    console.log("Fetched and shaped resources:", shaped );
    return NextResponse.json({ tests: shaped }, { status: 200 });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json({ message: "Error fetching resources" }, { status: 500 });
  }
}



export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Extract form fields (frontend sends uppercase keys)
    const RESOURCE_TYPE = (formData.get("RESOURCE_TYPE") as string) || null;
    const RESOURCE = (formData.get("RESOURCE") as string) || null;
    const RESOURCE_FILES = formData.get("RESOURCE_FILES") as File | null;
    const SUBJECT_ID = (formData.get("SUBJECT_ID") as string) || null;
    const resource_code = (formData.get("resource_code") as string) || null;
    const TOPIC_ID = (formData.get("TOPIC_ID") as string) || null; // stored as string in Prisma schema
    const COMPLEXITY = (formData.get("COMPLEXITY") as string) || null;

    // Validate required fields (same checks as MSSQL)
    if (!RESOURCE_TYPE || !SUBJECT_ID || !resource_code || !TOPIC_ID) {
      return NextResponse.json(
        {
          message:
            "RESOURCE_TYPE, SUBJECT_ID, RESOURCE_CODE, and TOPIC_ID are required fields",
        },
        { status: 400 }
      );
    }

    // Parse subject id to integer
    const subjectIdInt = parseInt(SUBJECT_ID as string, 10);
    if (isNaN(subjectIdInt)) {
      return NextResponse.json(
        { message: "Invalid input: SUBJECT_ID must be an integer" },
        { status: 400 }
      );
    }

    // Handle file (if any)
    let filePath: string | null = null;

    if (RESOURCE_FILES) {
      // Use original filename. If you want to avoid collisions, prefix with timestamp or UUID.
      const originalName = RESOURCE_FILES.name;
      // optional: validate extension/type here if needed
      const buffer = Buffer.from(await RESOURCE_FILES.arrayBuffer());
      const savedName = originalName; // change if you want unique naming
      const fullPath = join(uploadDir, savedName);
      writeFileSync(fullPath, buffer);
      filePath = savedName;
    }

    // Insert using Prisma
    const newResource = await prisma.question_resources.create({
      data: {
        resource_type: RESOURCE_TYPE,
        resource: RESOURCE || null,
        resource_files: filePath || null,
        subject_id: subjectIdInt,
        resource_code: resource_code,
        topic_id: TOPIC_ID ?? null, // schema stores topic_id as string
        complexity: COMPLEXITY ?? null, // schema expects string
      },
    });

    return NextResponse.json(
      { message: "Resource added successfully", resource: newResource },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error uploading resource (POST):", error);
    return NextResponse.json(
      { message: error?.message || "Error uploading resource" },
      { status: 500 }
    );
  }
}

