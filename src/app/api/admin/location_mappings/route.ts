import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// GET - Fetch all location mappings with joined data
export async function GET(req: NextRequest) {
  try {
    // Check if table exists first
    const tableExists = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'location_mappings'
      );
    `;
    
    if (!tableExists[0]?.exists) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "Table does not exist yet. Please run migration.",
      });
    }

    const mappings = await prisma.$queryRaw<any[]>`
      SELECT 
        lm.id,
        lm.category_id,
        cc.category as category_name,
        lm.course_id,
        co.coursename as course_name,
        lm.city_id,
        c.city as city_name,
        lm.center_id,
        ct.center as center_name,
        lm.variant_id,
        v.variant as variant_name,
        lm.created_at,
        lm.updated_at
      FROM location_mappings lm
      LEFT JOIN course_categories cc ON lm.category_id = cc.id
      LEFT JOIN courses co ON lm.course_id = co.id
      LEFT JOIN city c ON lm.city_id = c.id
      LEFT JOIN centers ct ON lm.center_id = ct.id
      LEFT JOIN variants v ON lm.variant_id = v.id
      ORDER BY lm.category_id, lm.course_id, lm.city_id, lm.center_id
    `;

    return NextResponse.json({ success: true, data: mappings });
  } catch (error: any) {
    console.error("[GET /api/admin/location_mappings] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch mappings" },
      { status: 500 }
    );
  }
}

// POST - Create new location mapping
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category_id, course_id, city_id, center_id, variant_id } = body;

    if (!category_id || !course_id || !city_id || !center_id || !variant_id) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM location_mappings 
      WHERE category_id = ${category_id}
        AND course_id = ${course_id}
        AND city_id = ${city_id} 
        AND center_id = ${center_id} 
        AND variant_id = ${variant_id}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "This mapping already exists" },
        { status: 409 }
      );
    }

    const result = await prisma.$queryRaw`
      INSERT INTO location_mappings (category_id, course_id, city_id, center_id, variant_id, created_at, updated_at)
      VALUES (${category_id}, ${course_id}, ${city_id}, ${center_id}, ${variant_id}, NOW(), NOW())
      RETURNING id
    `;

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[POST /api/admin/location_mappings] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create mapping" },
      { status: 500 }
    );
  }
}

// PUT - Update existing location mapping
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, category_id, course_id, city_id, center_id, variant_id } = body;

    if (!id || !category_id || !course_id || !city_id || !center_id || !variant_id) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check for duplicate (excluding current record)
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM location_mappings 
      WHERE category_id = ${category_id}
        AND course_id = ${course_id}
        AND city_id = ${city_id} 
        AND center_id = ${center_id} 
        AND variant_id = ${variant_id}
        AND id != ${id}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "This mapping already exists" },
        { status: 409 }
      );
    }

    await prisma.$queryRaw`
      UPDATE location_mappings 
      SET category_id = ${category_id},
          course_id = ${course_id},
          city_id = ${city_id},
          center_id = ${center_id},
          variant_id = ${variant_id},
          updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PUT /api/admin/location_mappings] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update mapping" },
      { status: 500 }
    );
  }
}

// DELETE - Remove location mapping
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    await prisma.$queryRaw`
      DELETE FROM location_mappings WHERE id = ${Number(id)}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/admin/location_mappings] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete mapping" },
      { status: 500 }
    );
  }
}

