import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = parseInt(url.searchParams.get('limit') || '5', 10);
    const take = Math.min(Math.max(limitParam, 1), 5); // clamp to 1..5

    // const rows = await prisma.notification.findMany({
    //   take,
    //   orderBy: { createdAt: 'desc' },
    //   select: {
    //     id: true,          // BigInt-safe handling below
    //     title: true,
    //     body: true,
    //     createdAt: true,
    //   },
    // });

    // // Convert BigInt -> number/string for JSON safety
    // const data = rows.map(r => ({
    //   id: typeof r.id === 'bigint' ? Number(r.id) : (r.id as any),
    //   title: r.title,
    //   body: r.body,
    //   createdAt: (r.createdAt instanceof Date) ? r.createdAt.toISOString() : String(r.createdAt),
    // }));

    // return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error('[notifications.peek][GET] error', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
