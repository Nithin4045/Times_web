import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";

export async function GET(request: NextRequest) {
  try {
    
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');

    // Require and validate user_id (Int). If your schema uses string, see note below.
    const userId =
      userIdParam !== null && userIdParam.trim() !== '' ? Number(userIdParam) : null;

    if (userId === null || Number.isNaN(userId)) {
      return new NextResponse('Missing or invalid user_id', { status: 400 });
    }

    // Today in UTC
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Fetch everything EXCEPT success for this user today
    const jobs = await prisma.generate_jobs.findMany({
      where: {
        user_id: userId,
        status: { not: 'success' }, // includes 'pending', 'error', etc. (and nulls)
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse percent (if present in response_data JSON)
    const jobsWithPercent = jobs.map((job) => {
      let percent: number | null = null;
      try {
        if (job.response_data) {
          const resp = JSON.parse(job.response_data as unknown as string);
          if (typeof resp.percent === 'number') percent = resp.percent;
        }
      } catch {
        // ignore JSON parse errors
      }
      return { ...job, percent };
    });

    // console.log('✅ Fetched file jobs:', jobsWithPercent);
    return NextResponse.json(jobsWithPercent);
  } catch (err) {
    console.error('❌ Error fetching file jobs:', err);
    return new NextResponse('Error fetching data', { status: 500 });
  }
}

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "palms");

function sanitizeFilename(filename: string): string {
  const base = path.basename(filename);
  return base.replace(/[\s<>:"/\\|?*\u0000-\u001F]/g, "_");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      fileName,
      fileBase64,
      filePath: _ignoredFilePath, // we will compute and overwrite this
      user_id,
      input_type,
      request_data = null,
      response_data = null,
      response_time = null,
      status = null,
      api_endpoint = null,
      percentage = 0,
    } = body as any;

    // Validate required fields
    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json({ error: "fileName is required and must be a string" }, { status: 400 });
    }
    if (!fileBase64 || typeof fileBase64 !== "string") {
      return NextResponse.json({ error: "fileBase64 is required and must be a base64 string" }, { status: 400 });
    }
    if (typeof user_id !== "number" || Number.isNaN(user_id)) {
      return NextResponse.json({ error: "user_id is required and must be a number" }, { status: 400 });
    }
    if (!input_type || typeof input_type !== "string") {
      return NextResponse.json({ error: "input_type is required and must be a string" }, { status: 400 });
    }

    // Sanitize filename and split ext
    const safeName = sanitizeFilename(fileName);
    const ext = path.extname(safeName);
    const baseName = ext ? safeName.slice(0, -ext.length) : safeName;

    // Create uploads directory if missing
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (mkdirErr) {
      // If we cannot create folder, return 500
      console.error("Failed to ensure upload directory:", mkdirErr);
      return NextResponse.json({ error: "Server could not create upload directory" }, { status: 500 });
    }

    // Build saved filename: "<original_base>_<uuid><ext>"
    const savedFilename = `${baseName}_${uuidv4()}${ext || ""}`;
    const savedFileRelativePath = path.posix.join("uploads", "palms", savedFilename); // forward-slash path for DB/API
    const savedFileAbsolutePath = path.join(UPLOAD_DIR, savedFilename);

    // Normalize base64: allow "data:<mime>;base64,...." or raw base64
    const maybeMatch = fileBase64.match(/^data:.*;base64,(.*)$/);
    const base64Data = maybeMatch ? maybeMatch[1] : fileBase64;

    // Validate base64 length minimally
    if (!base64Data || typeof base64Data !== "string") {
      return NextResponse.json({ error: "Invalid base64 file data" }, { status: 400 });
    }

    // Decode and write file
    try {
      const buffer = Buffer.from(base64Data, "base64");
      await fs.writeFile(savedFileAbsolutePath, buffer);
    } catch (writeErr) {
      console.error("Failed to write uploaded file:", writeErr);
      return NextResponse.json({ error: "Failed to write uploaded file to disk" }, { status: 500 });
    }

    // Build DB payload. Per your request:
    // - fileName (DB) = original filename (unchanged)
    // - filePath (DB) = saved path "uploads/palms/<saved_filename>"
    const createPayload: any = {
      fileName: fileName, // original name as requested
      filePath: savedFileRelativePath,
      user_id,
      input_type,
      request_data,
      response_data,
      api_endpoint,
      percentage: typeof percentage === "number" ? Math.max(0, Math.min(100, Math.trunc(percentage))) : 0,
    };

    if (response_time) {
      const d = new Date(response_time);
      if (!isNaN(d.getTime())) {
        createPayload.response_time = d;
      } else {
        // optionally accept numeric epoch ms too
        return NextResponse.json({ error: "response_time must be an ISO datetime string" }, { status: 400 });
      }
    }

    if (status) createPayload.status = status;

    // Insert into DB
    const created = await prisma.generate_jobs.create({
      data: createPayload,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create generate_jobs with base64 upload:", err);
    return NextResponse.json({ error: "Internal server error", detail: err?.message ?? String(err) }, { status: 500 });
  } finally {
    // Do NOT call prisma.$disconnect() per-request in serverless; keep client open.
  }
}