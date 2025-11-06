// app/api/evaluate/upload-video/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { clear } from "console";


const getDateTime = () => {
  console.log("[savevideo route] route module loaded");
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${MM}${dd}_${hh}${mm}${ss}`;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get("video") as File;
    const testId = formData.get("testId") as string;
    const subjectId = formData.get("subjectId") as string;
    const userTestId = formData.get("userTestId") as string;
    const collegeCode = formData.get("college_code") as string | null;

    console.log("Received upload:", {
      testId,
      subjectId,
      userTestId,
      collegeCode,
      videoFileName: videoFile?.name,
      videoFileSize: videoFile?.size,
    });

    if (!videoFile) {
      return NextResponse.json({ error: "No video uploaded" }, { status: 400 });
    }

    // Save file to disk
    const zipBuffer = Buffer.from(await videoFile.arrayBuffer());
    const uploadDir = path.join(`c:\\evaluate-videos\\${collegeCode ?? "default"}`);
    await fs.mkdir(uploadDir, { recursive: true });

    const timestamp = getDateTime();
    const zipPath = path.join(
      uploadDir,
      `${testId}_${subjectId}_${userTestId}_${timestamp}.zip`
    );

    await fs.writeFile(zipPath, zipBuffer);

    // Update DB using Prisma (instead of MSSQL SP)
    const updated = await prisma.$executeRawUnsafe<number>(
  `SELECT update_eval_video_path($1::int, $2::int, $3::int, $4::text)`,
  Number(testId),
  Number(userTestId),
  Number(subjectId),
  zipPath
);


    console.log("DB update result:", updated);
    return NextResponse.json(
      { message: "Video uploaded successfully", updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving video:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
