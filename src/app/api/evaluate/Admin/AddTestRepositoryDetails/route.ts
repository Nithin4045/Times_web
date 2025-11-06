// import { writeFile } from "fs/promises";
// import { promises as fs } from "fs";
// import { NextRequest, NextResponse } from "next/server";
// import * as XLSX from "xlsx";
// import { prisma } from "@/lib/prisma";
// import bcrypt from 'bcryptjs';
// import path from "path";

// export async function POST(request: NextRequest) {
//     try {
//       const url = new URL(request.url);
//       const subfolder = url.searchParams.get("subfolder") || "default";
//       const tableName = url.searchParams.get("table") || "default_table";

//       const resData = await request.formData();
//       const file: File | null = resData.get("file") as unknown as File;

//       if (!file) {
//         return NextResponse.json(
//           { success: false, message: "No file uploaded" },
//           { status: 400 }
//         );
//       }

//       const fileName = file.name;
//       const bytes = await file.arrayBuffer();
//       const buffer = Buffer.from(bytes);
//       const uint8Array = Uint8Array.from(buffer);

//       const basePath = `${process.cwd()}`;
//       const folderPath = path.join(`${basePath}\\uploads`, subfolder);
//       await fs.mkdir(folderPath, { recursive: true });
//       const filePath = path.join(folderPath, file.name);

//       await writeFile(filePath, uint8Array);
//       const fileBuffer = await fs.readFile(filePath);
//       const workbook = XLSX.read(fileBuffer, { type: "buffer" });
//       const sheetName = workbook.SheetNames[0];
//       const sheet = workbook.Sheets[sheetName];
//       const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

//       if (data.length === 0) {
//         return NextResponse.json(
//           { message: "No data found in the uploaded file" },
//           { status: 400 }
//         );
//       }

//       const failedUsernames: string[] = [];

//       // Process data using Prisma
//       const insertPromises = data.map(async (row) => {
//         try {
//           // Prepare data for Prisma insert
//           const testRepositoryDetailsData: any = {};
          
//           // Map Excel columns to Prisma model fields
//           Object.keys(row).forEach(key => {
//             let value = row[key];
            
//             // Handle null/undefined values
//             if (value === null || value === undefined) {
//               value = "";
//             }

//             // Handle password hashing
//             if (key.toLowerCase() === 'password') {
//               value = bcrypt.hashSync(value.toString(), 10);
//             }

//             // Map to appropriate field names
//             switch(key) {
//               case 'repository_details_id':
//                 testRepositoryDetailsData.repository_details_id = parseInt(value) || null;
//                 break;
//               case 'test_id':
//                 testRepositoryDetailsData.test_id = parseInt(value) || null;
//                 break;
//               case 'subject_id':
//                 testRepositoryDetailsData.subject_id = parseInt(value) || null;
//                 break;
//               case 'question_count':
//                 testRepositoryDetailsData.question_count = parseInt(value) || null;
//                 break;
//               case 'duration_min':
//                 testRepositoryDetailsData.duration_min = parseInt(value) || null;
//                 break;
//               case 'rendering_order':
//                 testRepositoryDetailsData.rendering_order = parseInt(value) || null;
//                 break;
//               case 'selection_method':
//                 testRepositoryDetailsData.selection_method = value.toString();
//                 break;
//               case 'TOPIC_ID':
//                 testRepositoryDetailsData.TOPIC_ID = value.toString();
//                 break;
//               case 'REQUIRE_RESOURCE':
//                 testRepositoryDetailsData.REQUIRE_RESOURCE = parseInt(value) || null;
//                 break;
//               case 'complexity':
//                 testRepositoryDetailsData.complexity = parseInt(value) || null;
//                 break;
//               case 'subject_marks':
//                 testRepositoryDetailsData.subject_marks = parseInt(value) || null;
//                 break;
//               default:
//                 // Handle any other fields
//                 testRepositoryDetailsData[key] = value;
//             }
//           });

//           // Create test repository details record using Prisma
//           await prisma.tEST_REPOSITORY_DETAILS.create({
//             data: testRepositoryDetailsData
//           });

//         } catch (error) {
//           console.error(`Error inserting row:`, error);
//           if (row['USER_NAME']) {
//             failedUsernames.push(row['USER_NAME']);
//           }
//         }
//       });

//       await Promise.all(insertPromises);

//       return NextResponse.json(
//         { 
//           message: "File uploaded and data processed successfully", 
//           failedUsernames: failedUsernames.length > 0 ? failedUsernames : null 
//         },
//         { status: 200 }
//       );
//     } catch (error) {
//       console.error("File upload and data insertion failed:", error);
//       return NextResponse.json(
//         { message: "File upload and data insertion failed" },
//         { status: 500 }
//       );
//     }
// }

// // GET: Retrieve test repository details data
// export async function GET(req: NextRequest) {
//     try {
//       // Query to get latest test repository details data using Prisma
//       const result = await prisma.$queryRaw`
//         SELECT * FROM TEST_REPOSITORY_DETAILS 
//         WHERE created_at >= (SELECT MAX(created_at) FROM TEST_REPOSITORY_DETAILS)
//       `;

//       return new NextResponse(
//         JSON.stringify(result),
//         { status: 200, headers: { 'Content-Type': 'application/json' } }
//       );
//     } catch (error: any) {
//       console.error('Server error:', error);
//       return new NextResponse(
//         JSON.stringify({ message: 'Failed to retrieve data', error: error.message }),
//         { status: 500, headers: { 'Content-Type': 'application/json' } }
//       );
//     }
// }






import { writeFile } from "fs/promises";
import { promises as fs } from "fs";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const subfolder = url.searchParams.get("subfolder") || "default";

    const resData = await request.formData();
    const file: File | null = resData.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    const fileName = file.name;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const basePath = process.cwd();
    const folderPath = path.join(basePath, "uploads", subfolder);
    await fs.mkdir(folderPath, { recursive: true });
    const filePath = path.join(folderPath, fileName);

    await writeFile(filePath, buffer);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (data.length === 0) {
      return NextResponse.json({ message: "No data found in the uploaded file" }, { status: 400 });
    }

    const failedUsernames: string[] = [];

    const insertPromises = data.map(async (row) => {
      try {
        const record: any = {};

        Object.keys(row).forEach((key) => {
          let value = row[key] ?? "";

          if (key.toLowerCase() === "password") {
            value = bcrypt.hashSync(value.toString(), 10);
          }

          switch (key) {
            case "repository_details_id":
            case "test_id":
            case "subject_id":
            case "question_count":
            case "duration_min":
            case "rendering_order":
            case "REQUIRE_RESOURCE":
            case "complexity":
            case "subject_marks":
              record[key] = parseInt(value) || null;
              break;
            case "selection_method":
            case "TOPIC_ID":
              record[key] = value.toString();
              break;
            default:
              record[key] = value;
          }
        });

        await prisma.test_repository_details.create({ data: record });
      } catch (error) {
        console.error("Error inserting row:", error);
        if (row["USER_NAME"]) failedUsernames.push(row["USER_NAME"]);
      }
    });

    await Promise.all(insertPromises);

    return NextResponse.json(
      {
        message: "File uploaded and data processed successfully",
        failedUsernames: failedUsernames.length > 0 ? failedUsernames : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("File upload failed:", error);
    return NextResponse.json({ message: "File upload and data insertion failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const result = await prisma.test_repository_details.findMany({
      orderBy: { repository_details_id: "desc" },
      take: 100, // optional: limit for performance
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Failed to retrieve data:", error);
    return NextResponse.json(
      { message: "Failed to retrieve data", error: error.message },
      { status: 500 }
    );
  }
}
  