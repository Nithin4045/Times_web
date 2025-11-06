import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
 
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const testId = Number(body.test_id);
    const userId = Number(body.user_id);
    const userTestIdRaw = body.user_test_id;
    const userTestId = Number.isFinite(Number(userTestIdRaw)) ? Number(userTestIdRaw) : null;
    const distCount = Number(body.distCount ?? 0);
    const distSecs = Math.round(Number(body.distSecs ?? 0)); // ensure Int
 
    if (!testId || !userId) {
      return NextResponse.json(
        { message: "Missing required fields: test_id or user_id" },
        { status: 400 }
      );
    }
 
    // 1) Get user core info
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id_card_no: true, firstname: true },
    });
    if (!user?.id_card_no) {
      return NextResponse.json({ message: "User id_card_no not found" }, { status: 404 });
    }
 
    // 2) Get batch_id -> batch_code
    const userCourse = await prisma.users_courses.findFirst({
      where: { id_card_no: user.id_card_no },
      select: { batch_id: true },
    });
    if (!userCourse?.batch_id) {
      return NextResponse.json({ message: "No batch_id found for user" }, { status: 404 });
    }
 
    const batch = await prisma.batches.findUnique({
      where: { id: userCourse.batch_id },
      select: { batch_code: true },
    });
    if (!batch?.batch_code) {
      return NextResponse.json({ message: "Batch code not found" }, { status: 404 });
    }
 
    // 3) Fetch test name
    const testRepo = await prisma.test_repository.findUnique({
      where: { test_id: testId },
      select: { test_description: true },
    });
 
    const commonData = {
      user_name: user.firstname ?? undefined,
      distcount: distCount,
      distsecs: distSecs,
      login_window: new Date(),
      module: "3",
      test_name: testRepo?.test_description ?? undefined,
      batch_code: batch.batch_code,
    };
 
    // If we have a numeric userTestId -> try upsert on PK
    if (userTestId && Number.isInteger(userTestId) && userTestId > 0) {
      const result = await prisma.user_tests.upsert({
        where: { user_test_id: userTestId },
        update: { ...commonData },
        create: {
          ...commonData,
          test_id: testId,
          user_id: userId,
          created_date: new Date(),
          created_by: 1, // adjust if you track the real actor
        },
      });
 
      const wasCreated = result.created_date && result.created_date.getTime() === result.login_window?.getTime();
      return NextResponse.json(
        {
          message: wasCreated ? "Distraction data created" : "Distraction data updated",
          user_test_id: result.user_test_id,
          action: wasCreated ? "created" : "updated",
        },
        { status: 200 }
      );
    }
 
    // Else, no valid userTestId provided -> create new row
    const created = await prisma.user_tests.create({
      data: {
        ...commonData,
        test_id: testId,
        user_id: userId,
        created_date: new Date(),
        created_by: 1,
      },
    });
 
    return NextResponse.json(
      {
        message: "Distraction data created",
        user_test_id: created.user_test_id,
        action: "created",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`error updating distraction data: ${error}`);
    return NextResponse.json({ message: "Error updating distraction data" }, { status: 500 });
  }
}