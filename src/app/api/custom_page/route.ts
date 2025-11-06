// src/app/api/dynamic-content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const placement = url.searchParams.get('placement')?.trim();
  const role = url.searchParams.get('role')?.trim() || undefined;
  const userIdStr = url.searchParams.get('userId')?.trim();

  if (!placement) {
    return NextResponse.json(
      { error: 'Missing required query param: placement' },
      { status: 400 }
    );
  }
  
  // Parse userId (users.id is Int in your schema)
  const userId = userIdStr && /^\d+$/.test(userIdStr) ? Number(userIdStr) : undefined;
  const now = new Date();

  try {
    // Base query: active, placement match, inside time window, optional role restriction
    const items = await prisma.dynamic_content.findMany({
      where: {
        placement,
        isactive: true,
        AND: [
          { OR: [{ startat: null }, { startat: { lte: now } }] },
          { OR: [{ endat: null }, { endat: { gte: now } }] },
        ],
        ...(role
          ? {
              // If role is provided, allow records explicitly for role OR global (null)
              OR: [{ role }, { role: null }],
            }
          : {}),
      },
      orderBy: { createdat: 'desc' },
    });

    if (!items.length) {
      return new NextResponse(null, { status: 204 }); // No Content
    }

    // If any item uses FIRST_LOGIN, we may need the user once
    let user: { first_time_login: boolean } | null = null;
    const needsFirstLoginCheck = items.some((it) => it.repeatrule === 'FIRST_LOGIN');

    if (needsFirstLoginCheck && userId) {
      user = await prisma.users.findUnique({
        where: { id: userId },
        select: { first_time_login: true },
      });
    }

    // Post-filter in memory for FIRST_LOGIN logic
    const filtered = items.filter((it) => {
      if (it.repeatrule === 'FIRST_LOGIN') {
        return !!user && user.first_time_login === true;
      }
      return true; // keep all others
    });

    if (!filtered.length) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(
      {
        placement,
        count: filtered.length,
        items: filtered.map((it) => ({
          id: it.id,
          placement: it.placement,
          template: it.template,
          repeatrule: it.repeatrule,
          role: it.role,
          isactive: it.isactive,
          startat: it.startat,
          endat: it.endat,
          createdat: it.createdat,
          updatedat: it.updatedat,
          contentjson: it.contentjson,
        })),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch dynamic content', details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
