
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from 'fs/promises';
import path from 'path';

// GET Method
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    const host = request.headers.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is missing' }, { status: 400 });
    }

    // Convert stored procedure to Prisma query
    const result = await prisma.test_repository.findFirst({
      where: {
        test_id: parseInt(testId)
      },
      select: {
        video: true
      }
    });

    const questions = result ? [result] : [];

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ message: 'Error fetching questions' }, { status: 500 });
  }
}

// POST Method
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const testId = formData.get('testId') as string;
    const userTestId = formData.get('userTestId') as string;
    const collegeCode = formData.get("college_code") as string;

    if (!videoFile) {
      return NextResponse.json({ message: 'No video file uploaded' }, { status: 400 });
    }

    if (!testId || !userTestId) {
      return NextResponse.json({ message: 'Test ID and User Test ID are required' }, { status: 400 });
    }

    const uploadDir = path.join(`c:\\evaluate-videos\\${collegeCode}`);
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error('Error creating directory:', err);
      return NextResponse.json({ message: 'Error creating upload directory' }, { status: 500 });
    }

    const filePath = path.join(uploadDir, videoFile.name);

    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      await fs.writeFile(filePath, buffer);
      console.log(`Video saved to ${filePath}`);

      const host = request.headers.get('host');

      if (!host) {
        return NextResponse.json({ error: 'Host header is missing' }, { status: 400 });
      }

      // Convert stored procedure to Prisma update query
      await prisma.user_tests.updateMany({
        where: {
          test_id: parseInt(testId),
          user_test_id: parseInt(userTestId)
        },
        data: {
          video: filePath
        }
      });

      return NextResponse.json({ message: 'Video uploaded and saved successfully!' }, { status: 200 });
    } catch (writeError) {
      console.error('Error saving video file:', writeError);
      return NextResponse.json({ message: 'Error saving video' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing video upload:', error);
    return NextResponse.json({ message: 'Error uploading video' }, { status: 500 });
  }
}
