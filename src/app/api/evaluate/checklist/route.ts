// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const testId = searchParams.get("test_id");

//     if (!testId) {
//       return NextResponse.json(
//         { message: "Test ID is required" },
//         { status: 400 }
//       );
//     }

//     const host = request.headers.get('host');

//     if (!host) {
//       return NextResponse.json(
//         { error: 'Host header is missing' },
//         { status: 400 }
//       );
//     }

//     // Convert stored procedure to Prisma query
//     const result = await prisma.eval_questions.findMany({
//       where: {
//         TEST_ID: parseInt(testId),
//         QUESTION_TYPE: 'EPI' // Assuming EPI questions have a specific type
//       },
//       include: {
//         subjects: {
//           select: {
//             SUBJECT_DESCRIPTION: true
//           }
//         }
//       },
//       orderBy: {
//         QUESTION_NUMBER: 'asc'
//       }
//     });

//     const questions = result || [];

//     return NextResponse.json({ questions }, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching questions:", error);
//     return NextResponse.json(
//       { message: "Error fetching questions" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const host = request.headers.get('host');

//     if (!host) {
//       return NextResponse.json(
//         { error: 'Host header is missing' },
//         { status: 400 }
//       );
//     }

//     const { user_id, test_id, data } = await request.json();
//     console.log("Received POST data:", { user_id, test_id, data });

//     if (!user_id || !test_id || !data) {
//       console.error("Missing required fields: user_id, test_id, or data");
//       return NextResponse.json(
//         { message: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const epiData = JSON.stringify(data.qns).replace(/[\/\(\)\']/g, "&apos;");

//     // Convert stored procedure to Prisma update query
//     const result = await prisma.user_tests.updateMany({
//       where: {
//         USER_ID: parseInt(user_id),
//         TEST_ID: parseInt(test_id)
//       },
//       data: {
//         EPI_DATA: epiData,
//         UPDATED_DATE: new Date()
//       }
//     });

//     console.log("Rows affected:", result.count);
//     if (result.count === 0) {
//       console.error(
//         "No rows were updated. Check if the user_id and test_id exist."
//       );
//       return NextResponse.json(
//         { message: "No rows were updated." },
//         { status: 404 }
//       );
//     }

//     console.log("EPI data submitted successfully.");
//     return NextResponse.json(
//       { message: "EPI data submitted successfully." },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error submitting data:", error);
//     return NextResponse.json(
//       { message: "Error submitting data." },
//       { status: 500 }
//     );
//   }
// }






import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET EPI questions for a given test_id and subject_id
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subject_id");

    if (!subjectId) {
      return NextResponse.json(
        { message: "subject_id is required" },
        { status: 400 }
      );
    }

    // Fetch questions for the given subject
    const questions = await prisma.eval_questions.findMany({
      where: {
        subject_id: parseInt(subjectId),
        question_type: "EPI", // filter for EPI questions
      },
      orderBy: {
        question: "asc",
      },
    });

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { message: "Error fetching questions" },
      { status: 500 }
    );
  }
}

// POST to submit EPI answers for a user + test
export async function POST(request: Request) {
  try {
    const { user_id, test_id, data } = await request.json();

    if (!user_id || !test_id || !data) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert answers to JSON string safely
    const epiData = JSON.stringify(data.qns).replace(/[\/\(\)\']/g, "&apos;");

    // Update user_tests for the given user + test
    const result = await prisma.user_tests.updateMany({
      where: {
        user_id: parseInt(user_id),
        test_id: parseInt(test_id),
      },
      data: {
        epi_data: epiData,
        created_date: new Date(), // update timestamp
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { message: "No matching records found to update." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "EPI data submitted successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting data:", error);
    return NextResponse.json(
      { message: "Error submitting data." },
      { status: 500 }
    );
  }
}
