// app/api/study_practice/videolectures/updateseen/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const idCardNoRaw = form.get('id_card_no');
    const batchIdRaw = form.get('batch_id');
    const videoLectureIdRaw = form.get('videolecture_id') ?? form.get('video_lecture_id') ?? form.get('topic_id');

    // Basic validation
    const id_card_no = typeof idCardNoRaw === 'string' ? idCardNoRaw.trim() : null;
    if (!id_card_no) {
      return NextResponse.json({ success: false, error: "Missing 'id_card_no'." }, { status: 400 });
    }

    const batch_id =
      batchIdRaw == null || batchIdRaw === ''
        ? null
        : Number(batchIdRaw) && Number.isFinite(Number(batchIdRaw))
        ? Number(batchIdRaw)
        : null;

    const videolecture_id =
      videoLectureIdRaw == null || videoLectureIdRaw === ''
        ? null
        : Number(videoLectureIdRaw) && Number.isFinite(Number(videoLectureIdRaw))
        ? Number(videoLectureIdRaw)
        : null;

    if (!videolecture_id) {
      return NextResponse.json({ success: false, error: "Missing or invalid 'videolecture_id'." }, { status: 400 });
    }

    // Find existing users_courses row (prefer exact match on id_card_no + batch_id if batch_id provided)
    let userCourse = null;
    if (batch_id !== null) {
      userCourse = await prisma.users_courses.findFirst({
        where: {
          id_card_no: id_card_no,
          batch_id: batch_id,
        },
      });
    }

    if (!userCourse) {
      // fallback: find by id_card_no only
      userCourse = await prisma.users_courses.findFirst({
        where: {
          id_card_no: id_card_no,
        },
        orderBy: { id: 'asc' }, // pick first if multiple
      });
    }

    if (!userCourse) {
      // create new users_courses row with completed_videolectures = [videolecture_id]
      const created = await prisma.users_courses.create({
        data: {
          id_card_no,
          batch_id: batch_id ?? null,
          // initialize arrays - other fields left null
          completed_videolectures: [videolecture_id],
        },
      });

      return NextResponse.json(
        { success: true, message: 'Created users_courses and marked video as completed.', data: created },
        { status: 200 }
      );
    }

    // Ensure completed_videolectures is an array
    const existingArray: number[] = Array.isArray(userCourse.completed_videolectures)
      ? (userCourse.completed_videolectures as number[])
      : [];

    // Add if not present
    if (!existingArray.includes(videolecture_id)) {
      const newArr = [...existingArray, videolecture_id];

      const updated = await prisma.users_courses.update({
        where: { id: userCourse.id },
        data: {
          completed_videolectures: newArr,
          updated_at: new Date(),
        },
      });

      return NextResponse.json(
        { success: true, message: 'Marked videolecture as completed.', data: updated },
        { status: 200 }
      );
    }

    // already present - nothing to do
    return NextResponse.json(
      { success: true, message: 'Videolecture already marked completed.', data: userCourse },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error in updateseen route:', err);
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}
