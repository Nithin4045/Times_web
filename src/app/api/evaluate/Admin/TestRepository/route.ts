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
          const testRepositoryData: any = {};
          
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
              case 'TEST_ID':
                testRepositoryData.TEST_ID = parseInt(value) || null;
                break;
              case 'TEST_TYPE':
                testRepositoryData.TEST_TYPE = value.toString();
                break;
              case 'TEST_DESCRIPTION':
                testRepositoryData.TEST_DESCRIPTION = value.toString();
                break;
              case 'VALIDITY_START':
                testRepositoryData.VALIDITY_START = value ? new Date(value) : null;
                break;
              case 'VALIDITY_END':
                testRepositoryData.VALIDITY_END = value ? new Date(value) : null;
                break;
              case 'CREATED_DATE':
                testRepositoryData.CREATED_DATE = value ? new Date(value) : new Date();
                break;
              case 'CREATED_BY':
                testRepositoryData.CREATED_BY = parseInt(value) || null;
                break;
              case 'IS_RECURRING':
                testRepositoryData.IS_RECURRING = parseInt(value) || null;
                break;
              case 'QUESTION_SELECTION_METHOD':
                testRepositoryData.QUESTION_SELECTION_METHOD = value.toString();
                break;
              case 'STATUS':
                testRepositoryData.STATUS = parseInt(value) || null;
                break;
              case 'TEST_CODE':
                testRepositoryData.TEST_CODE = value.toString();
                break;
              case 'TEST_TITLE':
                testRepositoryData.TEST_TITLE = value.toString();
                break;
              case 'TEST_ICON':
                testRepositoryData.TEST_ICON = value.toString();
                break;
              case 'LANGUAGE':
                testRepositoryData.LANGUAGE = value.toString();
                break;
              case 'general_data':
                testRepositoryData.general_data = value.toString();
                break;
              case 'role':
                testRepositoryData.role = parseInt(value) || null;
                break;
              case 'master_data':
                testRepositoryData.master_data = value.toString();
                break;
              case 'epi_question':
                testRepositoryData.epi_question = value.toString();
                break;
              case 'video':
                testRepositoryData.video = parseInt(value) || null;
                break;
              case 'COLLEGE_CODE':
                testRepositoryData.COLLEGE_CODE = value.toString();
                break;
              case 'COLLEGE_NAME':
                testRepositoryData.COLLEGE_NAME = value.toString();
                break;
              case 'Module':
                testRepositoryData.Module = parseInt(value) || null;
                break;
              case 'LINK_TEST':
                testRepositoryData.LINK_TEST = parseInt(value) || null;
                break;
              case 'IP_RESTRICTION':
                testRepositoryData.IP_RESTRICTION = parseInt(value) || null;
                break;
              case 'IP_ADDRESSES':
                testRepositoryData.IP_ADDRESSES = value.toString();
                break;
              default:
                // Handle any other fields
                testRepositoryData[key] = value;
            }
          });

          // Create test repository record using Prisma
          await prisma.test_repository.create({
            data: testRepositoryData
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

// GET: Retrieve test repository data
export async function GET(req: NextRequest) {
    try {
      // Query to get latest test repository data using Prisma
      const result = await prisma.$queryRaw`
        SELECT * FROM TEST_REPOSITORY 
        WHERE created_date >= (SELECT MAX(created_date) FROM TEST_REPOSITORY)
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
  