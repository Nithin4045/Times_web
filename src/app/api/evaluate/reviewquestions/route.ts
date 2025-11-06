// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import logger from "@/lib/logger";

// export async function GET(request: Request) {
//   const url = new URL(request.url);
//   const testId = url.searchParams.get("test_id");
//   const userTestId = url.searchParams.get("user_test_id");

//   if (!testId || !userTestId) {
//     return NextResponse.json({ message: "Missing test_id or user_test_id" }, { status: 400 });
//   }

//   try {
//     // Convert stored procedure to Prisma query
//     const result = await prisma.userTestDetails.findMany({
//       where: {
//         TEST_ID: parseInt(testId),
//         USER_TEST_ID: parseInt(userTestId)
//       },
//       include: {
//         evalQuestions: {
//           select: {
//             QUESTION: true,
//             SUBJECT_ID: true
//           }
//         }
//       }
//     });

//     const questions: { subject_id: any; question: any; user_answer: any; }[] = [];

//     for (const row of result) {
//       const { SUBJECT_ID, USER_ANSWER, evalQuestions } = row;
      
//       if (!USER_ANSWER || USER_ANSWER === 'null') {
//         continue;
//       }

//       const questionData = {
//         subject_id: SUBJECT_ID,
//         question: evalQuestions?.QUESTION || '',
//         user_answer: USER_ANSWER,
//       };

//       console.log('questionData', questionData);
//       questions.push(questionData);
//     }

//     return NextResponse.json({ questions });
//   } catch (error) {
//     logger.error(`an unknown error occurred in review questions ${error}`);
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     return NextResponse.json({ message: errorMessage }, { status: 500 });
//   }
// }

// export async function POST(request: Request) {
//   const body = await request.json();
//   const { test_id, user_test_id, subject_id, marks, userId } = body;

//   if (!test_id || !user_test_id || !subject_id || marks == null || !userId) {
//     return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
//   }

//   try {
//     // Convert stored procedure to Prisma transaction
//     await prisma.$transaction(async (tx) => {
//       for (let i = 0; i < subject_id.length; i++) {
//         // Update user test details with marks
//         await tx.userTestDetails.updateMany({
//           where: {
//             TEST_ID: parseInt(test_id),
//             USER_TEST_ID: parseInt(user_test_id),
//             SUBJECT_ID: subject_id[i]
//           },
//           data: {
//             MARKS: marks[i],
//             UPDATED_DATE: new Date()
//           }
//         });
//       }

//       // Update user test status
//       await tx.userTests.update({
//         where: {
//           USER_TEST_ID: parseInt(user_test_id)
//         },
//         data: {
//           STATUS: 'reviewed',
//           REVIEWED_DATE: new Date()
//         }
//       });
//     });

//     return NextResponse.json({ message: "Marks updated successfully" });
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     return NextResponse.json({ message: errorMessage }, { status: 500 });
//   }
// }

































import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

// GET: fetch answered questions for a specific test and user
export async function GET(request: Request) {
  const url = new URL(request.url);
  const testId = url.searchParams.get("test_id");
  const userTestId = url.searchParams.get("user_test_id");

  if (!testId || !userTestId) {
    return NextResponse.json({ message: "Missing test_id or user_test_id" }, { status: 400 });
  }

  try {
    // Fetch all user test details for this test/user
    const records = await prisma.user_test_details.findMany({
      where: {
        test_id: Number(testId),
        user_test_id: Number(userTestId),
      },
    });

    const questions: { subject_id: number | null; question_data: string | null; user_answer: string | null }[] = [];

    for (const record of records) {
      if (!record.answer_data || record.answer_data === 'null') continue;

      // Assuming answer_data is JSON string of [{question, user_answer}]
      try {
        const parsed = JSON.parse(record.answer_data);
        parsed.forEach((q: any) => {
          questions.push({
            subject_id: record.subject_id,
            question_data: q.question || '',
            user_answer: q.user_answer || '',
          });
        });
      } catch (err) {
        console.warn("Failed to parse answer_data for record_id:", record.record_id);
      }
    }

    return NextResponse.json({ questions });
  } catch (error) {
    logger.error(`Error fetching review questions: ${error}`);
    return NextResponse.json({ message: "Error fetching review questions" }, { status: 500 });
  }
}

// POST: update marks per subject and mark the test as reviewed
export async function POST(request: Request) {
  const body = await request.json();
  const { test_id, user_test_id, subject_id, marks, userId } = body;

  if (!test_id || !user_test_id || !subject_id || !marks || !userId) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < subject_id.length; i++) {
        await tx.user_test_details.updateMany({
          where: {
            test_id: Number(test_id),
            user_test_id: Number(user_test_id),
            subject_id: subject_id[i],
          },
          data: {
            marks: Number(marks[i]),
            modified_date: new Date(),
            modified_by: userId.toString(),
          },
        });
      }

      // Update user_tests status
      await tx.user_tests.update({
        where: { user_test_id: Number(user_test_id) },
        data: {
          // You can add a review_status field in user_tests if needed
          // Or keep using user_test_details.review_status
          // Example:
          // review_status: 1,
          // modified_date: new Date(),
        },
      });
    });

    return NextResponse.json({ message: "Marks updated successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
