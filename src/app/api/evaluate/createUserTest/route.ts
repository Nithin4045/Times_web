// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma'; // ensure path matches your project
// import logger from '@/lib/logger';

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { test_id, user_id } = body;

//     if (!test_id || !user_id) {
//       return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
//     }
//     console.log('createUserTest received:', { test_id, user_id });
//     const existing = await prisma.user_tests.findFirst({
//       where: {
//         test_id: Number(test_id),
//         user_id: Number(user_id),
//       },
//     });
//         console.log("Existing user_test record:", existing);
//     if (existing) {
//       return NextResponse.json({ user_test_id: existing.user_test_id });
//     }
//   } catch (err: any) {
//     logger.error(`createUserTest error: ${err?.message ?? err}`);
//     return NextResponse.json(
//       { message: 'Internal server error', error: String(err) },
//       { status: 500 }
//     );
//   }
// }













import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { test_id, user_id } = body ?? {};

    console.log("createUserTest received:", { test_id, user_id });

    if (!test_id || !user_id) {
      console.log("createUserTest: missing params");
      return NextResponse.json({ message: "Missing parameters: test_id and user_id are required" }, { status: 400 });
    }

    const tId = Number(test_id);
    const uId = Number(user_id);
    if (!Number.isFinite(tId) || !Number.isFinite(uId)) {
      console.log("createUserTest: invalid params", { tId, uId });
      return NextResponse.json({ message: "Invalid parameters: must be numbers" }, { status: 400 });
    }

    // Check existing
    const existing = await prisma.user_tests.findFirst({
      where: { test_id: tId, user_id: uId },
      select: { user_test_id: true },
    });
    console.log("Existing user_test record:", existing);

    if (existing) {
      return NextResponse.json({ user_test_id: existing.user_test_id }, { status: 200 });
    }

    // Create new user_tests row
    const created = await prisma.user_tests.create({
      data: {
        test_id: tId,
        user_id: uId,
        created_by: uId,
      },
      select: { user_test_id: true },
    });

    console.log("Created user_test:", created);
    return NextResponse.json({ user_test_id: created.user_test_id }, { status: 200 });
  } catch (err: any) {
    logger?.error?.(`createUserTest error: ${err?.message ?? String(err)}`);
    console.error("createUserTest error (console):", err);

    if (err?.code === "P2002") {
      return NextResponse.json({ message: "Unique constraint failed" }, { status: 409 });
    }
    if (err?.code === "P2003") {
      return NextResponse.json({ message: "Foreign key constraint failed (test or user missing)" }, { status: 409 });
    }

    return NextResponse.json({ message: "Internal server error", error: String(err) }, { status: 500 });
  }
}
