import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT 
        st.subject_id, 
        s.subject_description
      FROM 
        subject_topics st
      JOIN 
        subjects s ON st.subject_id = s.subject_id
      GROUP BY 
        st.subject_id, s.subject_description
      ORDER BY 
        st.subject_id DESC;
    `);

    return NextResponse.json({ topics: result }, { status: 200 });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { message: "Error fetching topics" },
      { status: 500 }
    );
  }
}
