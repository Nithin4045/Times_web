//  // Adjust the import based on your project structure
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import logger from "@/lib/logger";

// // GET request handler
// export async function GET(req : NextRequest) {
//   try {
//      const host = req.headers.get('host'); // Get host from headers

//     if (!host) {
//       return NextResponse.json({ error: 'Host header is missing' }, { status: 400 });
//     }
    
//     , { status: 500 });
//     }
//     const result = await pool.request().execute("GetReviewData");

//     const pendingReviews: any[] = [];
//     const reviewedReviews: any[] = [];
//     const seenTests = new Set();

//     for (const row of result) {
//       const { user_test_id, test_id, user_id, TEST_DESCRIPTION, answer_data, review_status,distCount, distSecs, general_data,user_data,epi_data,modified_date,video, test_total_marks,total_marks } = row;
//       // console.log("Raw answer_data:", answer_data);

//       if (!seenTests.has(user_test_id)) {
//         const parsedAnswerData = JSON.parse(answer_data || "{}");
//         console.log("Parsed answer_data1:", parsedAnswerData[0].question);
//         // const isPending =
//         //   parsedAnswerData[0].ANSWER == null &&
//         //   review === 0;
//         const isPending =
//   Array.isArray(parsedAnswerData) &&
//   parsedAnswerData.every(item => item.ANSWER == null) &&
//   review_status === 0;

//         if (isPending) {
//           pendingReviews.push({ user_test_id, test_id, user_id, test_description: TEST_DESCRIPTION,distCount, distSecs, general_data,user_data,epi_data,modified_date,video,test_total_marks,total_marks });
//           seenTests.add(user_test_id);
//         } else if (review_status === 1) {
//           reviewedReviews.push({ user_test_id, test_id, user_id, test_description: TEST_DESCRIPTION,distCount, distSecs, general_data,user_data,epi_data,modified_date,video,test_total_marks,total_marks });
//           seenTests.add(user_test_id);
//         }
//       }
//     }

//     return NextResponse.json({ pendingReviews, reviewedReviews });
//   } catch (error) {
//     logger.error(`Error fetching review data ${error}`)
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     console.error("Error fetching review data:", errorMessage);
//     return NextResponse.json({ message: errorMessage }, { status: 500 });
//   }
// }














// app/api/get-review-data/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET() {
  try {
    // Call the Postgres function via Prisma
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM GetReviewData()
    `;

    const pendingReviews: any[] = [];
    const reviewedReviews: any[] = [];
    const seenTests = new Set();

    for (const row of rows) {
      const {
        user_test_id,
        test_id,
        user_id,
        test_description,
        answer_data,
        review_status,
        distcount,
        distsecs,
        general_data,
        user_data,
        epi_data,
        modified_date,
        video,
        test_total_marks,
        total_marks,
      } = row;

      if (!seenTests.has(user_test_id)) {
        let parsedAnswerData: any[] = [];
        try {
          parsedAnswerData = Array.isArray(answer_data) ? answer_data : JSON.parse(answer_data || "[]");
        } catch {
          parsedAnswerData = [];
        }

        const isPending =
          Array.isArray(parsedAnswerData) &&
          parsedAnswerData.every((item: any) => item.ANSWER == null) &&
          review_status === 0;

        if (isPending) {
          pendingReviews.push({
            user_test_id,
            test_id,
            user_id,
            test_description,
            distcount,
            distsecs,
            general_data,
            user_data,
            epi_data,
            modified_date,
            video,
            test_total_marks,
            total_marks,
          });
          seenTests.add(user_test_id);
        } else if (review_status === 1) {
          reviewedReviews.push({
            user_test_id,
            test_id,
            user_id,
            test_description,
            distcount,
            distsecs,
            general_data,
            user_data,
            epi_data,
            modified_date,
            video,
            test_total_marks,
            total_marks,
          });
          seenTests.add(user_test_id);
        }
      }
    }

    return NextResponse.json({ pendingReviews, reviewedReviews });
  } catch (error) {
    logger.error(`Error fetching review data: ${error}`);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
