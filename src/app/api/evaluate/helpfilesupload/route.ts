import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";



export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // const fileName = `${Date.now()}_${file.name}`;
    const fileName = file.name;
    const helpfilesDir = path.join(process.cwd(), "uploads", "evaluate", "static","files");

    await fs.mkdir(helpfilesDir, { recursive: true });

    const uploadPath = path.join(helpfilesDir, fileName);

    await fs.writeFile(uploadPath, buffer);

    return NextResponse.json({ filename: fileName });

  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}
