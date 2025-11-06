import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all tagging data
export async function GET() {
  try {
    const taggingData = await prisma.tagging_data.findMany({
      where: {
        deleted: 0,
      },
      orderBy: [
        { area: 'asc' },
        { sub_area: 'asc' },
        { topic: 'asc' },
        { sub_topic: 'asc' },
      ],
      select: {
        id: true,
        area: true,
        sub_area: true,
        topic: true,
        sub_topic: true,
        description: true,
        deleted: true,
        user_id: true,
        created_at: true,
        updated_at: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: taggingData,
      count: taggingData.length,
    });
  } catch (error) {
    console.error("Error fetching tagging data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tagging data" },
      { status: 500 }
    );
  }
}

// POST - Create new tagging data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { area, sub_area, topic, sub_topic, description, user_id } = body;

    if (!area || !sub_area || !topic || !sub_topic) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const newData = await prisma.tagging_data.create({
      data: {
        area,
        sub_area,
        topic,
        sub_topic,
        description,
        user_id: user_id ? parseInt(user_id) : null,
        deleted: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: newData,
      message: "Tagging data created successfully",
    });
  } catch (error) {
    console.error("Error creating tagging data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create tagging data" },
      { status: 500 }
    );
  }
}

// PUT - Update tagging data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, area, sub_area, topic, sub_topic, description, user_id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    if (!area || !sub_area || !topic || !sub_topic) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const updatedData = await prisma.tagging_data.update({
      where: { id: parseInt(id) },
      data: {
        area,
        sub_area,
        topic,
        sub_topic,
        description,
        user_id: user_id ? parseInt(user_id) : null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: "Tagging data updated successfully",
    });
  } catch (error) {
    console.error("Error updating tagging data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update tagging data" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete tagging data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const deletedData = await prisma.tagging_data.update({
      where: { id: parseInt(id) },
      data: {
        deleted: 1,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: deletedData,
      message: "Tagging data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tagging data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete tagging data" },
      { status: 500 }
    );
  }
}

