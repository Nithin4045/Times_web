import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/filejobs?user_id=X
 * Fetch all fileJobs for a user, ordered by creation date (newest first)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');

    if (!userIdParam) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
    }

    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 });
    }

    console.log(`📥 Fetching generate_jobs for user_id=${userId}`);

    const fileJobs = await prisma.generate_jobs.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        fileName: true,
        user_id: true,
        input_type: true,
        request_data: true,
        response_data: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        api_endpoint: true,
        percentage: true,
      },
    });

    console.log(`✅ Found ${fileJobs.length} generate_jobs for user ${userId}`);

    return NextResponse.json(fileJobs);
  } catch (error: any) {
    console.error('❌ Error fetching fileJobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fileJobs', detail: error?.message },
      { status: 500 }
    );
  }
}
