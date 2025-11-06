import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

function safeParse(val: unknown) {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return val ?? [];
}

function normalizeSubName(val: unknown) {
  const subArray = safeParse(val);
  if (!Array.isArray(subArray)) return [];

  return subArray.map((s: any) => ({
    role: s.role || '',
    bookmarks: Array.isArray(s.bookmarks)
      ? s.bookmarks.map((bm: any) => ({
          key: bm.key,
          icon: bm.icon,
          link: bm.link,
          label: bm.label,
          children: Array.isArray(bm.children) ? bm.children : [],
        }))
      : [],
  }));
}

export async function GET(req: NextRequest) {
  try {
    const rows = await prisma.sidenav.findMany({ orderBy: { id: 'asc' } });

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No sidenav entries found' }, { status: 404 });
    }

    const formattedResult = rows.map((record) => ({
      ID: record.id,
      NAME: record.name,
      URL: record.url || '',
      IMAGES: record.images || '',
      SUB_NAME: normalizeSubName(record.sub_name),
      ICON_NAME: record.icon_name || '',
    }));
    
    return NextResponse.json(formattedResult, { status: 200 });
  } catch (error) {
    logger.error(`[sidenav] Error fetching sidebar data: ${error}`);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    );
  }
}
