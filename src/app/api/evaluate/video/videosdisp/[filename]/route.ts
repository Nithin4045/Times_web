import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

type RouteParams = { params: Promise<{ filename: string }> };

export async function GET(req: NextRequest, ctx: RouteParams) {
  try {
    const { filename } = await ctx.params; // only filename is a route param
    const { searchParams } = new URL(req.url);
    const college_code = searchParams.get("college_code");

    if (!college_code) {
      return NextResponse.json({ error: "college_code is required" }, { status: 400 });
    }

    const baseDir = `C:\\evaluate-videos\\${college_code}`;
    const filePath = path.join(baseDir, filename);

    // read file (you can stream if files are large)
    const fileBuffer = await fs.readFile(filePath);
    const file = new Uint8Array(fileBuffer);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": "video/webm",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Error accessing video file:", err);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
