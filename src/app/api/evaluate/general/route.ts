
// import { prisma } from "@/lib/prisma";
// import logger from "@/lib/logger";
// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   const url = new URL(request.url);
//   const test_id = url.searchParams.get("test_id");

//   if (!test_id) {
//     console.error("Test ID is missing");
//     return NextResponse.json({ message: "Test ID is missing" }, { status: 400 });
//   }

//   try {
//     const host = request.headers.get('host');

//     if (!host) {
//       return NextResponse.json({ error: 'Host header is missing' }, { status: 400 });
//     }

//     // Convert stored procedure to Prisma query
//     const result = await prisma.testRepository.findFirst({
//       where: {
//         TEST_ID: parseInt(test_id)
//       },
//       include: {
//         evalQuestions: {
//           include: {
//             subjects: {
//               select: {
//                 SUBJECT_DESCRIPTION: true
//               }
//             }
//           }
//         }
//       }
//     });

//     if (!result) {
//       console.error("No data found for the provided Test ID");
//       return NextResponse.json({ message: "No data found" }, { status: 404 });
//     }

//     console.log('Fetched data:', result);
//     return NextResponse.json(result);
//   } catch (error) {
//     logger.error(`Error fetching data ${error}`);
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
//     const result = await prisma.userTests.updateMany({
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
//     logger.error(`error inserting data ${error}`);
//     console.error("Error inserting data:", error);
//     return NextResponse.json({ message: "Error inserting data" }, { status: 500 });
//   }
// }










import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const test_id = url.searchParams.get("test_id");

  if (!test_id) {
    return NextResponse.json({ message: "Test ID is missing" }, { status: 400 });
  }

  try {
    const result = await prisma.test_repository.findFirst({
      where: { test_id: parseInt(test_id) },
      // If you have relations defined in schema, you can include them here
      // include: { evalQuestions: true } 
    });

    if (!result) {
      return NextResponse.json({ message: "No data found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error(`Error fetching test: ${error}`);
    return NextResponse.json({ message: "Error fetching data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { test_id, data, user_id } = await request.json();

    if (!test_id || !user_id || !data) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const result = await prisma.user_tests.updateMany({
      where: {
        test_id: parseInt(test_id),
        user_id: parseInt(user_id),
      },
      data: {
        user_data: JSON.stringify(data),
        // updated_date: new Date(), 
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ message: "No rows updated" }, { status: 404 });
    }

    return NextResponse.json({ message: "Data submitted successfully" }, { status: 201 });
  } catch (error) {
    logger.error(`Error updating user test data: ${error}`);
    return NextResponse.json({ message: "Error inserting data" }, { status: 500 });
  }
}
