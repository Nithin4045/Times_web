// src/app/api/utils/pages_json/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function fetchPlacementConfig(placement: string) {
  const page = await prisma.pages_json.findFirst({
    where: { placement },
    orderBy: { updated_at: 'desc' },
  });

  if (!page) {
    return NextResponse.json(
      { error: `No config found for placement: ${placement}` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: page.id,
    placement: page.placement,
    content: page.content_json,
    created_at: page.created_at,
    updated_at: page.updated_at,
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = (searchParams.get('placement') || '').trim();

    if (!placement) {
      return NextResponse.json({ error: 'Placement is required' }, { status: 400 });
    }

    return fetchPlacementConfig(placement);
  } catch (err) {
    console.error('Error fetching page config (GET):', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || '';
    let placement = '';

    if (ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')) {
      const form = await req.formData();
      placement = String(form.get('placement') || '').trim();
      // Optional fields if you ever need them later:
      // const userId = String(form.get('userId') || '').trim();
      // const role = String(form.get('role') || '').trim();
    } else if (ct.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      placement = String(body?.placement || '').trim();
      // const userId = String(body?.userId || '').trim();
      // const role = String(body?.role || '').trim();
    } else {
      // treat as raw text fallback: "placement=DASHBOARD"
      const text = await req.text();
      const sp = new URLSearchParams(text);
      placement = String(sp.get('placement') || '').trim();
    }

    if (!placement) {
      return NextResponse.json({ error: 'Placement is required' }, { status: 400 });
    }

    return fetchPlacementConfig(placement);
  } catch (err) {
    console.error('Error fetching page config (POST):', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
