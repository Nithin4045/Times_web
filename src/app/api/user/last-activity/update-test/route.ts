import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { id_card_no, test_id, test_path, test_title } = await request.json();

    if (!id_card_no) {
      return NextResponse.json({ message: 'id_card_no is required' }, { status: 400 });
    }

    if (!test_id && !test_path) {
      return NextResponse.json({ message: 'Either test_id or test_path is required' }, { status: 400 });
    }

    // Update the user's last taken test
    const result = await prisma.users.updateMany({
      where: {
        id_card_no: id_card_no
      },
      data: {
        last_taken_test_id: test_id || null,
        last_taken_test_path: test_path || null,
        last_taken_test_title: test_title || null,
        last_activity_updated_at: new Date()
      }
    });

    if (result.count === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Last taken test updated successfully'
    });
  } catch (error) {
    console.error('Update last taken test error:', error);

    if (error instanceof Error) {
      return NextResponse.json({
        message: 'Failed to update last taken test',
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
