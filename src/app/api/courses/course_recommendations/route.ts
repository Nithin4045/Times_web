
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to convert BigInt to Number for JSON serialization
function safeStringify(obj: any) {
  return JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  );
}

export async function POST(request: NextRequest) {
  try {
    const { id_card_no } = await request.json();
    if (!id_card_no) {
      return NextResponse.json({ error: "Missing id_card_no" }, { status: 400 });
    }

    console.log("Fetching course recommendations for:", id_card_no);

    // Step 1: Use parameterized query
    const result: any[] = await prisma.$queryRaw`
      SELECT * FROM get_course_recommendations(${id_card_no})
    `;

    if (!result || result.length === 0) {
      console.log("No courses returned from DB function");
      return NextResponse.json({ success: true, recommendedCourses: [] });
    }

    // Step 2: Only recommended courses (random 3) are used
    const recommendedCourses = result
      .filter(r => r.category === 'RECOMMENDED')
      .map(r => {
        // Convert all values to proper types
        const course = {
          course_id: Number(r.course_id),
          original_id: Number(r.original_id),
          original_name: String(r.original_name),
          coursename: String(r.coursename),
          course_category: Number(r.course_category) || 0,
          variant_id: Number(r.variant_id) || 0,
          // Convert BigInt to Number
          total_students: typeof r.total_students === 'bigint' 
            ? Number(r.total_students) 
            : Number(r.total_students || 0),
          completed_students: typeof r.completed_students === 'bigint'
            ? Number(r.completed_students)
            : Number(r.completed_students || 0),
          // Pricing data - use actual values from database
          price: r.price !== null ? Number(r.price) : null,
          offer_price: r.offerprice !== null ? Number(r.offerprice) : null,
          offer_percent: r.offerpercent !== null ? Number(r.offerpercent) : null,
          offer_start_time: r.offerstarttime ? new Date(r.offerstarttime).toISOString() : null,
          offer_end_time: r.offerendtime ? new Date(r.offerendtime).toISOString() : null,
          image : r.image
        };

        console.log("Course with dynamic pricing:", {
          name: course.coursename,
          price: course.price,
          offer_price: course.offer_price,
          offer_percent: course.offer_percent,
          offer_end_time: course.offer_end_time,
          image : course.image
        });

        return course;
      });

    console.log("Final recommended courses count:", recommendedCourses.length);

    return NextResponse.json({
      success: true,
      recommendedCourses
    });

  } catch (error: any) {
    console.error("🔥 Error in course_recommendations API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


