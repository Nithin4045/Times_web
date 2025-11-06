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
    const tableName = url.searchParams.get("table") || "default_table";

    const resData = await request.formData();
    const file: File | null = resData.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uint8Array = Uint8Array.from(buffer);

    const basePath = `${process.cwd()}`;
    const folderPath = path.join(`${basePath}\\uploads`, subfolder);
    await fs.mkdir(folderPath, { recursive: true });
    const filePath = path.join(folderPath, file.name);

    await writeFile(filePath, uint8Array);
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (data.length === 0) {
      return NextResponse.json(
        { message: "No data found in the uploaded file" },
        { status: 400 }
      );
    }

    const failedUsernames: string[] = [];

    // Process data using Prisma
    const insertPromises = data.map(async (row) => {
      try {
        // Prepare data for Prisma insert
        const userTestData: any = {};
        
        // Map Excel columns to Prisma model fields
        Object.keys(row).forEach(key => {
          let value = row[key];
          
          // Handle null/undefined values
          if (value === null || value === undefined) {
            value = "";
          }

          // Handle password hashing
          if (key.toLowerCase() === 'password') {
            value = bcrypt.hashSync(value.toString(), 10);
          }

          // Map to appropriate field names
          switch(key) {
            case 'test_id':
              userTestData.test_id = parseInt(value) || 0;
              break;
            case 'user_id':
              userTestData.user_id = parseInt(value) || null;
              break;
            case 'USER_NAME':
              userTestData.USER_NAME = value.toString();
              break;
            case 'access':
              userTestData.access = value.toString();
              break;
            case 'test_name':
              userTestData.test_name = value.toString();
              break;
            case 'user_data':
              userTestData.user_data = value.toString();
              break;
            case 'epi_data':
              userTestData.epi_data = value.toString();
              break;
            case 'distCount':
              userTestData.distCount = parseInt(value) || null;
              break;
            case 'distSecs':
              userTestData.distSecs = parseInt(value) || null;
              break;
            case 'video':
              userTestData.video = value.toString();
              break;
            case 'BATCH_CODE':
              userTestData.BATCH_CODE = value.toString();
              break;
            case 'Module':
              userTestData.Module = value.toString();
              break;
            case 'LOGIN_WINDOW':
              userTestData.LOGIN_WINDOW = value ? new Date(value) : null;
              break;
            case 'VALIDITY_START':
              userTestData.VALIDITY_START = value ? new Date(value) : null;
              break;
            case 'VALIDITY_END':
              userTestData.VALIDITY_END = value ? new Date(value) : null;
              break;
            case 'created_date':
              userTestData.created_date = value ? new Date(value) : new Date();
              break;
            case 'created_by':
              userTestData.created_by = parseInt(value) || null;
              break;
            default:
              // Handle any other fields
              userTestData[key] = value;
          }
        });

        // Create user test record using Prisma
        await prisma.user_tests.create({
          data: userTestData
        });

      } catch (error) {
        console.error(`Error inserting row:`, error);
        if (row['USER_NAME']) {
          failedUsernames.push(row['USER_NAME']);
        }
      }
    });

    await Promise.all(insertPromises);

    return NextResponse.json(
      {
        message: "File uploaded and data processed successfully",
        failedUsernames: failedUsernames.length > 0 ? failedUsernames : null
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("File upload and data insertion failed:", error);
    return NextResponse.json(
      { message: "File upload and data insertion failed" },
      { status: 500 }
    );
  }
}

// GET: Retrieve user tests data
export async function GET(req: NextRequest) {
  try {
    // Query to get latest user tests data using Prisma
    const result = await prisma.$queryRaw`
      SELECT * FROM USER_TESTS 
      WHERE created_date >= (SELECT MAX(created_date) FROM USER_TESTS)
    `;

    return new NextResponse(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Server error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to retrieve data', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
  