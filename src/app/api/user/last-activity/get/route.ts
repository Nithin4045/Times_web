import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { id_card_no } = await request.json();

    if (!id_card_no) {
      return NextResponse.json({ message: 'id_card_no is required' }, { status: 400 });
    }

    // Fetch the user's last activities
    const user = await prisma.users.findUnique({
      where: {
        id_card_no: id_card_no
      },
      select: {
        last_seen_video_id: true,
        last_seen_video_path: true,
        last_seen_video_title: true,
        last_read_material_id: true,
        last_read_material_path: true,
        last_read_material_title: true,
        last_read_material_type: true,
        last_taken_test_id: true,
        last_taken_test_path: true,
        last_taken_test_title: true,
        last_activity_updated_at: true
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        video: {
          id: user.last_seen_video_id,
          path: user.last_seen_video_path,
          title: user.last_seen_video_title
        },
        material: {
          id: user.last_read_material_id,
          path: user.last_read_material_path,
          title: user.last_read_material_title,
          type: user.last_read_material_type
        },
        test: {
          id: user.last_taken_test_id,
          path: user.last_taken_test_path,
          title: user.last_taken_test_title
        },
        lastUpdated: user.last_activity_updated_at
      }
    });
  } catch (error) {
    console.error('Fetch last activities error:', error);

    if (error instanceof Error) {
      return NextResponse.json({
        message: 'Failed to fetch last activities',
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
