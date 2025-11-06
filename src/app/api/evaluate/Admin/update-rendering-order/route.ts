// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function POST(request: Request) {
//   try {
//     const { subject_id, test_id, rendering_order } = await request.json();

//     if (!subject_id || !test_id || !rendering_order) {
//       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
//     }

//     , { status: 400 });
//     }

//     , { status: 500 });
//     }

//     const updateQuery = `
//       UPDATE TEST_REPOSITORY_DETAILS
//       SET rendering_order = @renderingOrder
//       WHERE subject_id = @subjectId AND test_id = @testId
//     `;

//     await pool
//       .request()
//       .input("subjectId", subject_id)
//       .input("testId", test_id)
//       .input("renderingOrder", rendering_order)
//       .query(updateQuery);

//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     console.error("Error updating rendering order:", error.message);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }













import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { subject_id, test_id, rendering_order } = await request.json();

    if (!subject_id || !test_id || rendering_order === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update using Prisma
    const updatedRecord = await prisma.test_repository_details.updateMany({
      where: {
        subject_id: subject_id,
        test_id: test_id,
      },
      data: {
        rendering_order: rendering_order,
      },
    });

    if (updatedRecord.count === 0) {
      return NextResponse.json(
        { success: false, message: "No matching record found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: updatedRecord.count,
    });
  } catch (error: any) {
    console.error("Error updating rendering order:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
