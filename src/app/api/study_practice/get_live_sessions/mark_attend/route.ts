import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const courseId = Number(body.course_id);
    const idCardNo = body.id_card_no?.toString().trim();
    const liveSessionId = Number(body.live_session_id);

    if (!courseId || !idCardNo || !liveSessionId) {
      return NextResponse.json(
        { error: "course_id, id_card_no and live_session_id are required" },
        { status: 400 }
      );
    }

    // Get the most recent users_courses row for this student + course
    const userCourse = await prisma.users_courses.findFirst({
      // where: { id_card_no: idCardNo, course_id: courseId },
      orderBy: { updated_at: "desc" },
      select: { id: true, completed_live_sessions: true },
    });

    if (!userCourse) {
      return NextResponse.json(
        { error: "No users_courses found for this id_card_no and course_id" },
        { status: 404 }
      );
    }

    // const current = userCourse.completed_live_sessions
    //   ? userCourse.completed_live_sessions.split(",").filter((x) => x.trim() !== "")
    //   : [];

    // Add session id if not present
    // if (!current.includes(String(liveSessionId))) {
    //   current.push(String(liveSessionId));
    // }

    // const updatedStr = current.join(",");

    // await prisma.users_courses.update({
    //   where: { id: userCourse.id },
    //   data: { completed_live_sessions: updatedStr },
    // });

    // return NextResponse.json(
    //   {
    //     course_id: courseId,
    //     id_card_no: idCardNo,
    //     updated: true,
    //     completed_live_sessions: current,
    //   },
    //   { status: 200 }
    // );
  } catch (err: any) {
    console.error("[mark_live_session_attended][POST] error", {
      message: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json(
      { error: "Server error", hint: err?.message },
      { status: 500 }
    );
  }
}
    