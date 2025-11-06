// import {  NextResponse } from "next/server";
// import path from "path";
// import fs from "fs/promises";

// export async function GET(
//   request: Request,
//   {params}: { params: Promise<{ slug: string }> }
// ) {
//   const id = (await params).slug;
//   const [college_code, filename] = id || [];

//   if (!college_code || !filename) {
//     console.error("Invalid path parameters:", { college_code, filename });
//     return NextResponse.json({ error: "Invalid path parameters" }, { status: 400 });
//   }

//   // Define the correct path to the video file
//   const baseDir = `C:\\evaluate-videos\\${college_code}`;
//   const filePath = path.join(baseDir, filename);

//   console.log("Trying to access file at:", filePath);

//   try {
//     // Check if the file exists
//     await fs.access(filePath);
//     console.log("File exists. Reading file...");

//     const file = await fs.readFile(filePath);

//     // Return the video file
//     return new NextResponse(file, {
//       headers: {
//         "Content-Type": "video/webm",
//         "Content-Disposition": `inline; filename="${filename}"`,
//       },
//     });
//   } catch (error: any) {
//     console.error("Error accessing video file:", error.message);
//     return NextResponse.json({ error: "File not found or internal error" }, { status: 500 });
//   }
// }








import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const id = (await params).slug;
  const [college_code, filename] = id || [];

  if (!college_code || !filename) {
    console.error("Invalid path parameters:", { college_code, filename });
    return NextResponse.json({ error: "Invalid path parameters" }, { status: 400 });
  }

  // Define the correct path to the video file
  const baseDir = `C:\\evaluate-videos\\${college_code}`;
  const filePath = path.join(baseDir, filename);

  console.log("Trying to access file at:", filePath);

  try {
    // Check if the file exists
    await fs.access(filePath);
    console.log("File exists. Reading file...");

    const fileBuffer = await fs.readFile(filePath);
    const file = new Uint8Array(fileBuffer); // ✅ convert Buffer -> Uint8Array

    // Return the video file
    return new NextResponse(file, {
      headers: {
        "Content-Type": "video/webm",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error accessing video file:", error.message);
    return NextResponse.json({ error: "File not found or internal error" }, { status: 500 });
  }
}
