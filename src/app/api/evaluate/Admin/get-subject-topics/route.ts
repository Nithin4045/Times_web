import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const subjectId = url.searchParams.get("subject_id");

    if (!subjectId) {
      return NextResponse.json({ message: "Subject ID is required" }, { status: 400 });
    }

    // ✅ Use Prisma directly
    const result = await prisma.$queryRawUnsafe(`
      SELECT 
        ST.ID, 
        ST.SUBJECT_ID, 
        S.subject_description, 
        ST.TOPIC_ID, 
        T.TOPIC_DESCRIPTION
      FROM SUBJECT_TOPICS ST
      JOIN SUBJECTS S ON ST.SUBJECT_ID = S.subject_id
      JOIN TOPICS T ON ST.TOPIC_ID = T.TOPIC_ID
      WHERE ST.SUBJECT_ID = ${subjectId}
    `);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("Error fetching subject topics:", error);
    return NextResponse.json({ message: "Error fetching subject topics" }, { status: 500 });
  }
}
