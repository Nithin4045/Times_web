// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// type BatchRowDB = {
//   batch_code: string;
//   batch_description: string | null;
// };

// type BatchRowOut = {
//   BATCH_CODE: string;
//   BATCH_NAME: string | null;
// };

// export async function GET(req: NextRequest) {
//   const t0 = Date.now();
//   try {
//     const { searchParams } = new URL(req.url);
//     const roleRaw = (searchParams.get("ROLE") || "STU").toUpperCase();
//     const userIdRaw = searchParams.get("USER_ID");

//     // 🔒 role guard
//     if (roleRaw !== "ADM" && roleRaw !== "STU") {
//       return NextResponse.json({ message: "Invalid ROLE" }, { status: 400 });
//     }

//     // 🔒 STU requires USER_ID
//     let userId: number | null = null;
//     if (roleRaw === "STU") {
//       if (!userIdRaw) {
//         return NextResponse.json(
//           { message: "USER_ID required for STU" },
//           { status: 400 }
//         );
//       }
//       userId = Number(userIdRaw);
//       if (!Number.isFinite(userId) || userId <= 0) {
//         return NextResponse.json({ message: "Invalid USER_ID" }, { status: 400 });
//       }
//     }

//     let rows: BatchRowDB[] = [];

//     if (roleRaw === "ADM") {
//       // ✅ All active batches
//       rows = await prisma.$queryRaw<BatchRowDB[]>`
//         SELECT b.batch_code, b.batch_description
//         FROM batches b
//         WHERE b.status = TRUE
//         ORDER BY b.id DESC
//       `;
//     } else {
//       // ✅ STU: batches for the given user via users -> users_courses -> batches
//       rows = await prisma.$queryRaw<BatchRowDB[]>`
//         SELECT DISTINCT b.batch_code, b.batch_description
//         FROM users u
//         JOIN users_courses uc ON uc.id_card_no = u.id_card_no
//         JOIN batches b ON b.id = uc.batch_id
//         WHERE u.id = ${userId!} AND b.status = TRUE
//         ORDER BY b.id DESC
//       `;
//     }

//     const batches: BatchRowOut[] = (rows ?? []).map((r) => ({
//       BATCH_CODE: r.batch_code,
//       BATCH_NAME: r.batch_description,
//     }));

//     // ✅ Shape the response exactly as the client now expects
//     const payload = { batches, took_ms: Date.now() - t0 };

//     return NextResponse.json(payload, { status: 200 });
//   } catch (error: any) {
//     // 🔧 More verbose error logging to help during dev
//     console.error("evalbatches GET failed:", {
//       message: error?.message,
//       stack: error?.stack,
//     });
//     return NextResponse.json(
//       { message: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }






// C:\Users\admin\Downloads\09-08-2025_BAK_TIMES_WEB\src\app\api\evaluate\Admin\evalbatches\route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type BatchRowDB = { batch_code: string; batch_description: string | null };
type BatchRowOut = { BATCH_CODE: string; BATCH_NAME: string | null };

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const roleRaw = (searchParams.get("ROLE") || "STU").toUpperCase();
    const userIdRaw = searchParams.get("USER_ID");

    if (roleRaw !== "ADM" && roleRaw !== "STU") {
      return NextResponse.json({ message: "Invalid ROLE" }, { status: 400 });
    }

    let userId: number | null = null;
    if (roleRaw === "STU") {
      if (!userIdRaw) {
        return NextResponse.json({ message: "USER_ID required for STU" }, { status: 400 });
      }
      userId = Number(userIdRaw);
      if (!Number.isFinite(userId) || userId <= 0) {
        return NextResponse.json({ message: "Invalid USER_ID" }, { status: 400 });
      }
    }

    let rows: BatchRowDB[] = [];

    if (roleRaw === "ADM") {
      rows = await prisma.$queryRaw<BatchRowDB[]>`
        SELECT b.batch_code, b.batch_description
        FROM batches b
        WHERE b.status = TRUE
        ORDER BY b.id DESC
      `;
    } else {
      // via id -> id_card_no -> users_courses -> batches
      rows = await prisma.$queryRaw<BatchRowDB[]>`
        SELECT DISTINCT b.batch_code, b.batch_description
        FROM users u
        JOIN users_courses uc ON uc.id_card_no = u.id_card_no
        JOIN batches b ON b.id = uc.batch_id
        WHERE u.id = ${userId!}
          AND b.status = TRUE
        ORDER BY b.id DESC
      `;
    }

    const batches: BatchRowOut[] = (rows ?? []).map((r) => ({
      BATCH_CODE: r.batch_code,
      BATCH_NAME: r.batch_description,
    }));

    return NextResponse.json({ batches, took_ms: Date.now() - t0 }, { status: 200 });
  } catch (error: any) {
    console.error("evalbatches GET failed:", { message: error?.message, stack: error?.stack });
    // Never 500 out to the grid; return empty
    return NextResponse.json({ batches: [], took_ms: Date.now() - t0 }, { status: 200 });
  }
}
