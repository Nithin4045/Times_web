
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import logger from "@/lib/logger";


// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const userId = searchParams.get("userId");
//   const userTestId = searchParams.get("userId");
//   if (!userId) {
//     return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
//   }

//   try {
//      const host = request.headers.get('host'); // Get host from headers

//     if (!host) {
//       return NextResponse.json({ error: 'Host header is missing' }, { status: 400 });
//     }
    
//     , { status: 500 });
//     }

//     const result = await pool
//       .request()
//       .input("user_id", sql.NVarChar, userId)
//       .input("user_id", sql.NVarChar, userTestId)
//       .query(`
//         SELECT 
//           user_test_id,
//           test_id,
//           test_description,
//           //VALIDITY_START,
//           VALIDITY_START AS VALIDITY_START,
//           VALIDITY_END,
//           is_valid,
//           distCount,
//           distSecs,
//           video,
//           user_data,
//           epi_data
//         FROM USER_TESTS
//         WHERE USER_NAME = @user_id and user_test_id = @user_test_id
//       `);

//     return NextResponse.json(result);
//   } catch (error: any) {   
//      logger.error(`Error fetching test details: ${error}`)
//     console.error("Error fetching test details:", error);
//     return NextResponse.json({ message: error.message }, { status: 500 });
//   }
// }











import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const userTestId = searchParams.get("userTestId"); // fixed: you were using "userId" twice

  if (!userId || !userTestId) {
    return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
  }

  try {
    const result = await prisma.user_tests.findFirst({
      where: {
        user_name: userId, // since in your schema `user_name` is String?
        user_test_id: Number(userTestId), // cast because schema defines Int
      },
      select: {
        user_test_id: true,
        test_id: true,
        test_name: true,
        validity_start: true,
        validity_end: true,
        user_data: true,
        epi_data: true,
        distcount: true,
        distsecs: true,
        video: true,
      },
    });

    if (!result) {
      return NextResponse.json({ message: "No test found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error(`Error fetching test details: ${error}`);
    console.error("Error fetching test details:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
