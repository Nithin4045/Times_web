import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { id_card_no, video_id, video_path, video_title } = await request.json();

    if (!id_card_no) {
      return NextResponse.json({ message: 'id_card_no is required' }, { status: 400 });
    }

    if (!video_id && !video_path) {
      return NextResponse.json({ message: 'Either video_id or video_path is required' }, { status: 400 });
    }

    // Update the user's last seen video
    const result = await prisma.users.updateMany({
      where: {
        id_card_no: id_card_no
      },
      data: {
        last_seen_video_id: video_id || null,
        last_seen_video_path: video_path || null,
        last_seen_video_title: video_title || null,
        last_activity_updated_at: new Date()
      }
    });

    if (result.count === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Last seen video updated successfully'
    });
  } catch (error) {
    console.error('Update last seen video error:', error);

    if (error instanceof Error) {
      return NextResponse.json({
        message: 'Failed to update last seen video',
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
