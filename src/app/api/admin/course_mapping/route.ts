// app/api/course-mappings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FORM_NAME = "course_mappings_form"; // <- set this to your saved form_jsons.name

// ---------- helpers ----------
const getStr = (fd: FormData, key: string): string | null => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : null;
};

const toInt = (v: string | null) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};

// ---------- GET ----------
export async function GET() {
  try {
    const [
      cities,
      centers,
      courses,
      variants,
      categories,
      formRow,
    ] = await Promise.all([
      prisma.city.findMany({
        select: { id: true, city: true },
        orderBy: { city: "asc" },
      }),
      prisma.centers.findMany({
        select: { id: true, center: true, city_id: true },
        orderBy: { center: "asc" },
      }),
      prisma.courses.findMany({
        select: { id: true, coursename: true },
        orderBy: { coursename: "asc" },
      }),
      prisma.variants.findMany({
        select: { id: true, variant: true },
        orderBy: { variant: "asc" },
      }),
      prisma.course_categories.findMany({
        select: { id: true, category: true },
        orderBy: { category: "asc" },
      }),
      prisma.form_jsons.findUnique({ where: { name: FORM_NAME } }),
    ]);

    return NextResponse.json(
      {
        success: true,
        lookups: {
          cities,
          centers,
          courses,
          variants,
          categories,
        },
        form_name: FORM_NAME,
        form: formRow?.formjson ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/course-mappings error", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ---------- POST ----------
export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();

    const cityIdRaw = getStr(fd, "city_id");
    const centerIdRaw = getStr(fd, "center_id");
    const courseIdRaw = getStr(fd, "course_id");
    const variantIdRaw = getStr(fd, "variant_id");
    const categoryIdRaw = getStr(fd, "course_category_id");

    if (!cityIdRaw || !centerIdRaw || !courseIdRaw || !variantIdRaw || !categoryIdRaw) {
      return NextResponse.json(
        {
          success: false,
          error:
            "city_id, center_id, course_id, variant_id, course_category_id are all required",
        },
        { status: 400 }
      );
    }

    const city_id = toInt(cityIdRaw);
    const center_id = toInt(centerIdRaw);
    const course_id = toInt(courseIdRaw);
    const variant_id = toInt(variantIdRaw);
    const course_category_id = toInt(categoryIdRaw);

    if (
      Number.isNaN(city_id) ||
      Number.isNaN(center_id) ||
      Number.isNaN(course_id) ||
      Number.isNaN(variant_id) ||
      Number.isNaN(course_category_id) ||
      city_id === null ||
      center_id === null ||
      course_id === null ||
      variant_id === null ||
      course_category_id === null
    ) {
      return NextResponse.json(
        { success: false, error: "All ids must be valid integers" },
        { status: 400 }
      );
    }

    // Existence checks (fail fast with clear messages)
    const [city, center, course, variant, category] = await Promise.all([
      prisma.city.findUnique({ where: { id: city_id } }),
      prisma.centers.findUnique({ where: { id: center_id } }),
      prisma.courses.findUnique({ where: { id: course_id } }),
      prisma.variants.findUnique({ where: { id: variant_id } }),
      prisma.course_categories.findUnique({ where: { id: course_category_id } }),
    ]);

    if (!city) return NextResponse.json({ success: false, error: "city_id not found" }, { status: 400 });
    if (!center)
      return NextResponse.json({ success: false, error: "center_id not found" }, { status: 400 });
    if (!course)
      return NextResponse.json({ success: false, error: "course_id not found" }, { status: 400 });
    if (!variant)
      return NextResponse.json({ success: false, error: "variant_id not found" }, { status: 400 });
    if (!category)
      return NextResponse.json(
        { success: false, error: "course_category_id not found" },
        { status: 400 }
      );

    // Optional but recommended: verify the center belongs to the city
    if (center.city_id !== city_id) {
      return NextResponse.json(
        {
          success: false,
          error: `center (${center.id}) belongs to city_id ${center.city_id}, not ${city_id}`,
        },
        { status: 400 }
      );
    }

    // Note: course_mappings table may not exist in current schema
    // This is a lookup-only endpoint for now
    return NextResponse.json({ 
      success: true, 
      message: "Course mapping endpoint - lookups loaded successfully. Actual mapping table not implemented yet."
    }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/course-mappings error", err);
    // unique composite constraint violation
    if (err?.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This course mapping already exists (duplicate city_id, center_id, course_id, variant_id, course_category_id).",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
