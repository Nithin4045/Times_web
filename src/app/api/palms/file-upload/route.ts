import { writeFile } from "fs/promises";
import { promises as fs } from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
// export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const subfolder = url.searchParams.get("subfolder") || "default";

    const resData = await request.formData();
    const file: File | null = resData.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const basePath = `${process.cwd()}`;
    const folderPath = path.join(`${basePath}\\uploads`, subfolder);
    await fs.mkdir(folderPath, { recursive: true });
    const filePath = path.join(folderPath, file.name);
    await writeFile(filePath, buffer);
    
    return NextResponse.json(
      { message: "File uploaded successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("File upload failed:", error);
    return NextResponse.json(
      { message: "File upload failed" },
      { status: 500 }
    );
  }
}
