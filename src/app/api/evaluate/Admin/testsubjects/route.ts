// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const testId = searchParams.get("test_id");

//     if (!testId) {
//       return NextResponse.json({ message: "Test ID is required" }, { status: 400 });
//     }

//     , { status: 400 });
//     }

//     , { status: 500 });
//     }

    
//     const result = await pool
//       .request()
//       .input("testId", testId)
//       .query(`
//         SELECT DISTINCT s.subject_id, s.subject_description, s.subject_code
// FROM TEST_REPOSITORY_DETAILS ts
// JOIN SUBJECTS s ON ts.subject_id = s.subject_id
// WHERE ts.test_id = @testId
//       `);

//     return NextResponse.json(result, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching subjects:", error);
//     return NextResponse.json({ message: "Error fetching subjects" }, { status: 500 });
//   }
// }









import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("test_id");

    if (!testId) {
      return NextResponse.json({ message: "Test ID is required" }, { status: 400 });
    }

    // Step 1: Get all subject_ids for the given test
    const testSubjects = await prisma.test_repository_details.findMany({
      where: { test_id: Number(testId) },
      select: { subject_id: true },
    });

    const subjectIds = testSubjects
      .map((row) => row.subject_id)
      .filter((id): id is number => id !== null); // ensure only numbers

    if (subjectIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Step 2: Get the actual subject details
    const subjects = await prisma.subjects.findMany({
      where: { subject_id: { in: subjectIds } },
      select: {
        subject_id: true,
        subject_description: true,
        subject_code: true,
      },
    });

    return NextResponse.json(subjects, { status: 200 });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Error fetching subjects", details: errorMessage },
      { status: 500 }
    );
  }
}
