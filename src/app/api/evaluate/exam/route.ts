
// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   const url = new URL(request.url);
//   const user_id = url.searchParams.get("user_id");

//   if (!user_id) {
//     console.error("User ID is missing");
//     return NextResponse.json({ message: "User ID is missing" }, { status: 400 });
//   }

//   try {
//     const host = request.headers.get('host');

//     if (!host) {
//       return NextResponse.json({ error: 'Host header is missing' }, { status: 400 });
//     }

//     // Convert stored procedure to Prisma query
//     const result = await prisma.user_tests.findFirst({
//       where: {
//         USER_ID: parseInt(user_id),
//         STATUS: 'active'
//       },
//       include: {
//         testRepository: {
//           include: {
//             evalQuestions: {
//               include: {
//                 subjects: {
//                   select: {
//                     SUBJECT_DESCRIPTION: true
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     });

//     if (!result) {
//       console.error("No data found or test expired");
//       return NextResponse.json({ message: "No data found or test expired" }, { status: 404 });
//     }

//     return NextResponse.json(result);
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return NextResponse.json({ message: "Error fetching data" }, { status: 500 });
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const host = request.headers.get('host');

//     if (!host) {
//       return NextResponse.json({ error: 'Host header is missing' }, { status: 400 });
//     }

//     const { test_id, data, user_id } = await request.json();

//     // Convert stored procedure to Prisma update query
//     const result = await prisma.user_tests.updateMany({
//       where: {
//         USER_ID: parseInt(user_id),
//         TEST_ID: parseInt(test_id)
//       },
//       data: {
//         USER_DATA: JSON.stringify(data),
//         UPDATED_DATE: new Date()
//       }
//     });

//     console.log("Rows affected:", result.count);
//     if (result.count === 0) {
//       console.error("No rows were updated. Check if the user_id and test_id exist.");
//       return NextResponse.json({ message: "No rows were updated." }, { status: 404 });
//     }

//     console.log("Data submitted successfully.");
//     return NextResponse.json({ message: "Data submitted successfully" }, { status: 201 });
//   } catch (error) {
//     console.error("Error inserting data:", error);
//     return NextResponse.json({ message: "Error inserting data" }, { status: 500 });
//   }
// }
  
  


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Answer {
  question_number: string;
  user_answer: string;
}

interface RequestBody {
  test_id: string;
  subject_id: number;
  answers: Answer[];
  user_test_id: string;
  timer_value: string; // format MM:SS
  user_id: number;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { test_id, subject_id, answers, user_test_id, timer_value, user_id } = body;

    if (!test_id || !subject_id || !answers || !user_test_id || !timer_value) {
      return NextResponse.json({ message: "Missing required parameters" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const answer of answers) {
        // Check if record exists
        const existing = await tx.user_test_details.findFirst({
          where: {
            user_test_id: parseInt(user_test_id),
            test_id: parseInt(test_id),
            subject_id,
            question_data: answer.question_number,
          },
        });

        if (existing) {
          await tx.user_test_details.update({
            where: { record_id: existing.record_id },
            data: {
              answer_data: answer.user_answer,
              modified_date: new Date(),
              timer_value,
            },
          });
        } else {
          await tx.user_test_details.create({
            data: {
              user_test_id: parseInt(user_test_id),
              test_id: parseInt(test_id),
              subject_id,
              question_data: answer.question_number,
              answer_data: answer.user_answer,
              created_date: new Date(),
              modified_date: new Date(),
              timer_value,
              user_id,
            },
          });
        }
      }

      // Update timer in user_tests (optional)
      const [minutes, seconds] = timer_value.split(":").map((v) => parseInt(v));
      await tx.user_tests.update({
        where: { user_test_id: parseInt(user_test_id) },
        data: {
          distcount: minutes || 0,
          distsecs: seconds || 0,
        },
      });
    });

    return NextResponse.json({ message: "Exam submission completed successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error submitting exam answers:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
