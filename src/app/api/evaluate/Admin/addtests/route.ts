// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   try {
//     , { status: 400 });
//     }

//     , { status: 500 });
//     }

//     const result = await prisma.$queryRaw`"SELECT * FROM TEST_REPOSITORY where module =3 order by created_date desc"`;
//     return NextResponse.json({ tests: result }, { status: 200 });

//   } catch (error) {
//     console.error("Error fetching tests:", error);
//     return NextResponse.json({ message: "Error fetching tests" }, { status: 500 });
//   }
// }

// // export async function POST(request: Request) {
// //   try {
// //     const host = request.headers.get("host");
// //     if (!host) {
// //       return NextResponse.json({ error: "Host header is missing" }, { status: 400 });
// //     }


// //     if (!pool) {
// //       return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
// //     }

// //     const { test_name, validity_start, validity_end, video } = await request.json();

// //     if (!test_name || !validity_start || !validity_end  || !video) {
// //       return NextResponse.json({ message: "All fields are required" }, { status: 400 });
// //     }

// //     const query = `
// //       INSERT INTO TEST_REPOSITORY (TEST_DESCRIPTION, VALIDITY_START, VALIDITY_END, VIDEO,module,created_date)
// //       VALUES (@test_name, @validity_start, @validity_end, @video,3,GETDATE() );
// //     `;

// //     await pool
// //       .request()
// //       .input("test_name", test_name)
// //       .input("validity_start", validity_start)
// //       .input("validity_end", validity_end)
// //       .input("video", video)
// //       .query(query);

// //     return NextResponse.json({ message: "Test added successfully" }, { status: 201 });

// //   } catch (error) {
// //     console.error("Error adding test:", error);
// //     return NextResponse.json({ message: "Error adding test" }, { status: 500 });
// //   }
// // }


// export async function POST(request: Request) {
//   try {
//     , { status: 400 });
//     }

//     , { status: 500 });
//     }

//     const { test_name, test_type, validity_start, validity_end, college_code, college_name } = await request.json();

//     if (!test_name || !test_type || !validity_start || !validity_end || !college_code || !college_name) {
//       return NextResponse.json({ message: "All fields are required" }, { status: 400 });
//     }

//     const query = `
//       INSERT INTO TEST_REPOSITORY 
//       (TEST_DESCRIPTION, TEST_TYPE, VALIDITY_START, VALIDITY_END, COLLEGE_CODE, COLLEGE_NAME, module, created_date)
//       VALUES (@test_name, @test_type, @validity_start, @validity_end, @college_code, @college_name, 3, GETDATE());
//     `;

//     await pool
//       .request()
//       .input("test_name", test_name)
//       .input("test_type", test_type)
//       .input("validity_start", validity_start)
//       .input("validity_end", validity_end)
//       .input("college_code", college_code)
//       .input("college_name", college_name)
//       .query(query);

//     return NextResponse.json({ message: "Test added successfully" }, { status: 201 });
//   } catch (error) {
//     console.error("Error adding test:", error);
//     return NextResponse.json({ message: "Error adding test" }, { status: 500 });
//   }
// }













import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch all tests for module 3
export async function GET(request: Request) {
  try {
    const tests = await prisma.test_repository.findMany({
      where: { module: 3 },
      orderBy: { created_date: "desc" },
    });

    return NextResponse.json({ tests }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching tests:", error);
    return NextResponse.json(
      { message: "Error fetching tests", error: error.message },
      { status: 500 }
    );
  }
}

// POST: Add a new test for module 3
export async function POST(request: Request) {
  try {
    const { test_name, test_type, validity_start, validity_end, college_code, college_name } = await request.json();

    // Validate required fields
    if (!test_name || !test_type || !validity_start || !validity_end || !college_code || !college_name) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const newTest = await prisma.test_repository.create({
      data: {
         test_description: test_name,
        test_type: test_type,
        validity_start: new Date(validity_start),
        validity_end: new Date(validity_end),
        college_code: college_code,
        college_name: college_name,
        module: 3,
        created_date: new Date(),
      },
    });

    return NextResponse.json({ message: "Test added successfully", newTest }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding test:", error);
    return NextResponse.json(
      { message: "Error adding test", error: error.message },
      { status: 500 }
    );
  }
}
