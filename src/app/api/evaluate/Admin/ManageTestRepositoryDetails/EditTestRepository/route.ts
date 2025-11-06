// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from "@/lib/prisma";
//  // Adjust the path if needed

// export async function GET(req: NextRequest): Promise<NextResponse> {
//   const host = req.headers.get('host');

//   if (!host) {
//     return NextResponse.json(
//       { message: 'Host header is missing' },
//       { status: 400 }
//     );
//   }

//   const { searchParams } = new URL(req.url);
//   const repository_details_id = searchParams.get('repository_details_id');

//   try {
//     ,
//         { status: 500 }
//       );
//     }

//     const request = pool.request();
//     if (repository_details_id && !isNaN(Number(repository_details_id))) {
//       request.input('repository_details_id', sql.Int, Number(repository_details_id));
//     }

//     const result = await request.query(`
//       SELECT * FROM TEST_REPOSITORY_DETAILS
//       ${repository_details_id ? 'WHERE repository_details_id = @repository_details_id' : ''}
//     `);

//     return NextResponse.json(result, { status: 200 });
//   } catch (error: any) {
//     console.error('Database Query Error:', error);
//     return NextResponse.json(
//       { message: 'Failed to fetch data', error: error.message },
//       { status: 500 }
//     );
//   }
// }







import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repository_details_id = searchParams.get('repository_details_id');

    let details;

    if (repository_details_id && !isNaN(Number(repository_details_id))) {
      details = await prisma.test_repository_details.findUnique({
        where: { repository_details_id: Number(repository_details_id) },
      });
    } else {
      details = await prisma.test_repository_details.findMany();
    }

    return NextResponse.json({ details }, { status: 200 });

  } catch (error: any) {
    console.error('Database Query Error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch data', error: error.message },
      { status: 500 }
    );
  }
}
