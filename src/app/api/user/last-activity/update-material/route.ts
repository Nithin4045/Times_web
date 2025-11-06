import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { id_card_no, material_id, material_path, material_title, material_type } = await request.json();

    if (!id_card_no) {
      return NextResponse.json({ message: 'id_card_no is required' }, { status: 400 });
    }

    if (!material_id && !material_path) {
      return NextResponse.json({ message: 'Either material_id or material_path is required' }, { status: 400 });
    }

    // Update the user's last read material
    const result = await prisma.users.updateMany({
      where: {
        id_card_no: id_card_no
      },
      data: {
        last_read_material_id: material_id || null,
        last_read_material_path: material_path || null,
        last_read_material_title: material_title || null,
        last_read_material_type: material_type || null,
        last_activity_updated_at: new Date()
      }
    });

    if (result.count === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Last read material updated successfully'
    });
  } catch (error) {
    console.error('Update last read material error:', error);

    if (error instanceof Error) {
      return NextResponse.json({
        message: 'Failed to update last read material',
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
