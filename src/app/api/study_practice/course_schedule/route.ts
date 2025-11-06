import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const variant = (searchParams.get('variant') ?? '').trim();
    const course  = (searchParams.get('course')  ?? '').trim();
    const batch   = (searchParams.get('batch')   ?? '').trim();

    // if (!variant || !course || !batch) {
    //   return badRequest('variant, course, and batch are required');
    // }

    // const resolvedBatch = await resolveBatch(variant, batch);

    // const schedules = await prisma.course_schedule.findMany({
    //   where: {
    //     // course_id:     { equals: course,      mode: 'insensitive' },
    //     // batch_code: { equals: resolvedBatch, mode: 'insensitive' },
    //   },
    //   orderBy: { scheduled_date_time: 'asc' },
    // });

    // return NextResponse.json({
    //   variant,
    //   course,
    //   input_batch: batch,
    //   resolved_batch: resolvedBatch,
    //   merged: resolvedBatch !== batch,
    //   count: schedules.length,
    //   data: schedules,
    // });
  } catch (err) {
    console.error('[course-schedule][GET] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
