// // app/api/evaluate/exam/questionsbysub/route.ts

// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function GET(request: Request) {
//   const url = new URL(request.url);
//   const testId = url.searchParams.get("testid");
//   const subjectId = url.searchParams.get("subjectid");
//   const userId = url.searchParams.get("userid");
//   const topicId = url.searchParams.get("topicid");

//   // Validate required parameters
//   if (!testId || !subjectId || !userId) {
//     console.error("Missing parameters:", { testId, subjectId, userId });
//     return NextResponse.json({ message: "Test ID, Subject ID, and User ID are required." }, { status: 400 });
//   }

//   try {
//     // Convert stored procedure to Prisma query
//     const result = await prisma.eval_questions.findMany({
//       where: {
//         TEST_ID: parseInt(testId),
//         SUBJECT_ID: parseInt(subjectId),
//         ...(topicId && { TOPIC_ID: parseInt(topicId) })
//       },
//       include: {
//         subjects: {
//           select: {
//             SUBJECT_DESCRIPTION: true
//           }
//         },
//         topics: {
//           select: {
//             TOPIC_NAME: true
//           }
//         }
//       },
//       orderBy: {
//         QUESTION_NUMBER: 'asc'
//       }
//     });

//     if (!result || result.length === 0) {
//       console.error("No data found for the given parameters.");
//       return NextResponse.json({ message: "No data found for the given parameters." }, { status: 404 });
//     }

//     return NextResponse.json(result);
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return NextResponse.json({ message: "Error fetching data" }, { status: 500 });
//   }
// }










// app/api/evaluate/exam/questionsbysub/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const testId = url.searchParams.get("testid");
  const subjectId = url.searchParams.get("subjectid");
  const topicId = url.searchParams.get("topicid");

  if (!testId || !subjectId) {
    return NextResponse.json(
      { message: "Test ID and Subject ID are required." },
      { status: 400 }
    );
  }

  try {
    const questions = await prisma.eval_questions.findMany({
      where: {
        question_id: { gte: 0 }, // optional, just a placeholder filter
        subject_id: parseInt(subjectId),
        ...(topicId && { TOPIC_ID: parseInt(topicId) })
      },
      orderBy: {
        question_number: "asc"
      }
    });

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { message: "No questions found for the given parameters." },
        { status: 404 }
      );
    }

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { message: "Error fetching questions" },
      { status: 500 }
    );
  }
}
