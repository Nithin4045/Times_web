// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function PUT(request: Request) {
//     try {
//       , { status: 400 });
//       }
  
//       , { status: 500 });
//       }
  
//       const { test_name, test_type, validity_start, validity_end, college_code, college_name } = await request.json();
//       const testId = request.url.split("/").pop();
  
//       if (!test_name || !test_type || !validity_start || !validity_end || !college_code || !college_name) {
//         return NextResponse.json({ message: "All fields are required" }, { status: 400 });
//       }
  
//       const query = `
//         UPDATE TEST_REPOSITORY 
//         SET TEST_DESCRIPTION = @test_name, 
//             TEST_TYPE = @test_type,
//             VALIDITY_START = @validity_start, 
//             VALIDITY_END = @validity_end, 
//             COLLEGE_CODE = @college_code,
//             COLLEGE_NAME = @college_name
//         WHERE TEST_ID = @testId;
//       `;
  
//       await pool
//         .request()
//         .input("test_name", test_name)
//         .input("test_type", test_type)
//         .input("validity_start", validity_start)
//         .input("validity_end", validity_end)
//         .input("college_code", college_code)
//         .input("college_name", college_name)
//         .input("testId", testId)
//         .query(query);
  
//       return NextResponse.json({ message: "Test updated successfully" }, { status: 200 });
//     } catch (error) {
//       console.error("Error updating test:", error);
//       return NextResponse.json({ message: "Error updating test" }, { status: 500 });
//     }
//   }
  
  






import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const testId = request.url.split("/").pop();
    if (!testId) {
      return NextResponse.json({ message: "Test ID is required" }, { status: 400 });
    }

    const { test_name, test_type, validity_start, validity_end, college_code, college_name } = await request.json();

    // Validate required fields
    if (!test_name || !test_type || !validity_start || !validity_end || !college_code || !college_name) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // Update using Prisma
    const updatedTest = await prisma.test_repository.update({
      where: { test_id: parseInt(testId) }, // or string depending on your schema
      data: {
        test_description: test_name,
        test_type: test_type,
        validity_start: new Date(validity_start),
        validity_end: new Date(validity_end),
        college_code: college_code,
        college_name: college_name,
      },
    });

    return NextResponse.json({ message: "Test updated successfully", updatedTest }, { status: 200 });

  } catch (error: any) {
    console.error("Error updating test:", error);
    return NextResponse.json({ message: "Error updating test", error: error.message }, { status: 500 });
  }
}
