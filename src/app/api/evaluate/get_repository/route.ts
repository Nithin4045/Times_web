// // app/api/test-repository/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const testId = searchParams.get("TEST_ID");

//     if (!testId) {
//       return NextResponse.json(
//         { error: "TEST_ID is required" },
//         { status: 400 }
//       );
//     }

//     // Prisma query
//     const result = await prisma.test_repository.findUnique({
//       where: {
//         test_id: parseInt(testId),
//       },
//     });

//     if (!result) {
//       return NextResponse.json(
//         { message: "Test not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(result, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { TEST_ID, status } = body;

//     if (!TEST_ID) {
//       return NextResponse.json(
//         { error: "TEST_ID is required" },
//         { status: 400 }
//       );
//     }

//     // Prisma update
//     const updatedTest = await prisma.test_repository.update({
//       where: { test_id: parseInt(TEST_ID) },
//       data: { status: status },
//     });

//     return NextResponse.json({ success: true, updatedTest }, { status: 200 });
//   } catch (error) {
//     console.error("Error updating data:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }












// app/api/evaluate/get_repository/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("TEST_ID");
    const tid = Number(raw);

    // ❗ Guard 'null', '', NaN, <=0
    if (!Number.isFinite(tid) || tid <= 0) {
      return NextResponse.json({ error: "Valid TEST_ID is required" }, { status: 400 });
    }

    const result = await prisma.test_repository.findUnique({
      where: { test_id: tid },
    });

    if (!result) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("TEST_ID");
    const tid = Number(raw);

    if (!Number.isFinite(tid) || tid <= 0) {
      return NextResponse.json({ error: "Valid TEST_ID is required" }, { status: 400 });
    }

    const {
      TEST_TYPE,
      TEST_DESCRIPTION,
      VALIDITY_START,
      VALIDITY_END,
      QUESTION_SELECTION_METHOD,
      TEST_CODE,
      TEST_TITLE,
      general_data,
      master_data,
      epi_question,
      video,
      COLLEGE_CODE,
      COLLEGE_NAME,
      LINK_TEST,
      ip_restriction,
      ip_addresses,
    } = await req.json();

    const updatedTest = await prisma.test_repository.update({
      where: { test_id: tid },
      data: {
        test_type: TEST_TYPE,
        test_description: TEST_DESCRIPTION,
        validity_start: VALIDITY_START ? new Date(VALIDITY_START) : null,
        validity_end: VALIDITY_END ? new Date(VALIDITY_END) : null,
        question_selection_method: QUESTION_SELECTION_METHOD,
        test_code: TEST_CODE,
        test_title: TEST_TITLE,
        general_data,
        master_data,
        epi_question,
        video: video ?? 0,
        college_code: COLLEGE_CODE,
        college_name: COLLEGE_NAME,
        module: 3,
        link_test: LINK_TEST ?? 0,
        ip_restriction: ip_restriction ?? 0,
        ip_addresses: ip_addresses ?? "",
        status: 1,
      },
    });

    return NextResponse.json({ success: true, updatedTest }, { status: 200 });
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



// ... your existing GET and PUT remain ...

export async function PATCH(req: NextRequest) {
  try {
    // Prefer TEST_ID from query; optional fallback from JSON body
    const qsTid = req.nextUrl.searchParams.get("TEST_ID");
    let tid = Number(qsTid);
    const body = await req.json().catch(() => ({} as any));
    if (!Number.isFinite(tid) || tid <= 0) {
      const bodyTid = Number(body?.TEST_ID);
      if (Number.isFinite(bodyTid) && bodyTid > 0) tid = bodyTid;
    }

    if (!Number.isFinite(tid) || tid <= 0) {
      return NextResponse.json(
        { error: "Valid TEST_ID is required" },
        { status: 400 }
      );
    }

    // status can be "1"/"0" or 1/0 or true/false
    const rawStatus = body?.status;
    if (rawStatus === undefined || rawStatus === null) {
      return NextResponse.json(
        { error: "status is required in body" },
        { status: 400 }
      );
    }
    const statusNum =
      typeof rawStatus === "boolean"
        ? rawStatus ? 1 : 0
        : Number(rawStatus);

    if (!(statusNum === 0 || statusNum === 1)) {
      return NextResponse.json(
        { error: "status must be 0 or 1" },
        { status: 400 }
      );
    }

    const updated = await prisma.test_repository.update({
      where: { test_id: tid },
      data: { status: statusNum },
    });

    return NextResponse.json({ success: true, updated }, { status: 200 });
  } catch (error) {
    console.error("Error PATCH status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
