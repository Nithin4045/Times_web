import { writeFile } from "fs/promises";
import { promises as fs } from "fs";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs"; // probably unused here, but kept if your sheet ever had passwords
import path from "path";

// ============== GET ==============
export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get("host");
    if (!host) {
      return NextResponse.json({ error: "Host header is missing" }, { status: 400 });
    }

    // Prisma fields are lower_snake_case
    const latestCreatedAt = await prisma.eval_questions.aggregate({
      _max: { created_date: true },
    });

    const result = await prisma.eval_questions.findMany({
      where: {
        created_date: { gte: latestCreatedAt._max.created_date ?? new Date(0) },
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve data", error: error.message },
      { status: 500 }
    );
  }
}

// ============== Helpers ==============
const normalize = (v: any) => (v === "NULL" ? null : v === "" ? null : v);

// function mapRowToEvalQuestions(row: any) {
//   const r: any = {
//     subject_id: normalize(row.SUBJECT_ID),
//     topic_id: normalize(row.TOPIC_ID),
//     question_number: normalize(row.QUESTION_NUMBER),
//     choice1: normalize(row.CHOICE1),
//     choice2: normalize(row.CHOICE2),
//     choice3: normalize(row.CHOICE3),
//     choice4: normalize(row.CHOICE4),
//     answer: normalize(row.ANSWER),
//     complexity: row.COMPLEXITY != null ? Number(row.COMPLEXITY) : null,
//     question_source: normalize(row.QUESTION_SOURCE),
//     link: normalize(row.LINK),
//     created_by: row.CREATED_BY != null ? Number(row.CREATED_BY) : null,
//     modified_date: row.MODIFIED_DATE ? new Date(row.MODIFIED_DATE) : null,
//     modified_by: row.MODIFIED_BY != null ? Number(row.MODIFIED_BY) : null,
//     question_type: normalize(row.QUESTION_TYPE),
//     parent_question_number: normalize(row.PARENT_QUESTION_NUMBER),
//     question: normalize(row.QUESTION),
//     help_text: normalize(row.Help_text),
//     help_files: normalize(row.HELP_FILES),
//     options: normalize(row.OPTIONS),
//     negative_marks:
//       row.negative_marks != null && row.negative_marks !== ""
//         ? Number(row.negative_marks)
//         : null,
//     // status: you can set a default if your table requires it
//   };

//   // If the sheet contains QUESTION_ID, include it; otherwise omit (works for both manual and autoinc schemas)
//   if (row.QUESTION_ID != null && row.QUESTION_ID !== "") {
//     r.question_id = Number(row.QUESTION_ID);
//   }
//   return r;
// }

// helper at top of that file (inside same file)
const normalizeAnswerForServer = (raw: any): string | null => {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) {
    const arr = raw.map((x) => String(x).trim().toUpperCase()).filter(Boolean);
    return arr.length ? Array.from(new Set(arr)).join(",") : null;
  }
  const s = String(raw).trim();
  if (s === "") return null;
  const parts = s.split(/[\s,;|]+/).map((p) => p.trim().toUpperCase()).filter(Boolean);
  if (!parts.length) return null;
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const p of parts) {
    if (!seen.has(p)) {
      seen.add(p);
      deduped.push(p);
    }
  }
  return deduped.join(",");
};

function mapRowToEvalQuestions(row: any) {
  const r: any = {
    subject_id: normalize(row.SUBJECT_ID),
    topic_id: normalize(row.TOPIC_ID),
    question_number: normalize(row.QUESTION_NUMBER),
    choice1: normalize(row.CHOICE1),
    choice2: normalize(row.CHOICE2),
    choice3: normalize(row.CHOICE3),
    choice4: normalize(row.CHOICE4),
    // normalize ANSWER here:
    answer: normalizeAnswerForServer(row.ANSWER),
    complexity: row.COMPLEXITY != null ? Number(row.COMPLEXITY) : null,
    question_source: normalize(row.QUESTION_SOURCE),
    link: normalize(row.LINK),
    created_by: row.CREATED_BY != null ? Number(row.CREATED_BY) : null,
    modified_date: row.MODIFIED_DATE ? new Date(row.MODIFIED_DATE) : null,
    modified_by: row.MODIFIED_BY != null ? Number(row.MODIFIED_BY) : null,
    question_type: normalize(row.QUESTION_TYPE),
    parent_question_number: normalize(row.PARENT_QUESTION_NUMBER),
    question: normalize(row.QUESTION),
    help_text: normalize(row.Help_text),
    help_files: normalize(row.HELP_FILES),
    options: normalize(row.OPTIONS),
    negative_marks:
      row.negative_marks != null && row.negative_marks !== ""
        ? Number(row.negative_marks)
        : null,
    // status: you can set a default if your table requires it
  };

  if (row.QUESTION_ID != null && row.QUESTION_ID !== "") {
    r.question_id = Number(row.QUESTION_ID);
  }
  return r;
}


function mapRowToQuestionResources(row: any) {
  return {
    resource_type: normalize(row.RESOURCE_TYPE),
    resource: normalize(row.RESOURCE),
    resource_files: normalize(row.RESOURCE_FILES),
    subject_id: row.SUBJECT_ID != null ? Number(row.SUBJECT_ID) : null,
    resource_code: normalize(row.resource_code),
    topic_id:
      row.TOPIC_ID != null && row.TOPIC_ID !== ""
        ? String(row.TOPIC_ID) // your model defines topic_id as String? @db.VarChar(10)
        : null,
    complexity: normalize(row.COMPLEXITY),
  };
}

// ============== POST ==============
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const subfolder = url.searchParams.get("subfolder") || "default";

    const form = await request.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    // Save uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const folderPath = path.join(process.cwd(), "uploads", subfolder);
    await fs.mkdir(folderPath, { recursive: true });
    const filePath = path.join(folderPath, file.name);
    await writeFile(filePath, buffer);

    // Parse Excel
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!data.length) {
      return NextResponse.json({ message: "No data found in the uploaded file" }, { status: 400 });
    }

    // Build payloads (normalize + map to Prisma fields)
    const table1Data = data.map(mapRowToEvalQuestions);
    const table2Data = data.map(mapRowToQuestionResources);

    // Insert (skip empty arrays gracefully)
    if (table1Data.some(obj => Object.values(obj).some(v => v !== null && v !== undefined))) {
      await prisma.eval_questions.createMany({ data: table1Data });
    }
    if (table2Data.some(obj => Object.values(obj).some(v => v !== null && v !== undefined))) {
      await prisma.question_resources.createMany({ data: table2Data });
    }

    return NextResponse.json(
      { message: "File uploaded and data processed successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("File upload and data insertion failed:", error);
    return NextResponse.json(
      { message: "File upload and data insertion failed", error: error.message },
      { status: 500 }
    );
  }
}
