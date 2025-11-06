import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idCardNo = (searchParams.get('id_card_no') || '').trim();

    if (!idCardNo) return badRequest('id_card_no is required');

    const rows = await prisma.users_courses.findMany({
      where: { id_card_no: idCardNo },
      orderBy: { updated_at: 'desc' },
      select: { id: true, id_card_no: true, batch_id: true,payment: true, registration_date: true},
    });

    return NextResponse.json({ id_card_no: idCardNo, count: rows.length, data: rows }, { status: 200 });
  } catch (err) {
    console.error('[users-courses/by-id][GET] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const idCardNo = (body?.id_card_no || '').trim();

    if (!idCardNo) return badRequest('id_card_no is required');

    const rows = await prisma.users_courses.findMany({
      where: { id_card_no: idCardNo },
      orderBy: { updated_at: 'desc' },
      // select: { id: true, id_card_no: true, city: true, center: true, batch_code: true, course: true, variants: true, payment: true, registration_date: true, updated_datetime: true },
    });

    return NextResponse.json({ id_card_no: idCardNo, count: rows.length, data: rows }, { status: 200 });
  } catch (err) {
    console.error('[users-courses/by-id][POST] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
