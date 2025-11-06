  import { prisma } from "@/lib/prisma";
  import { NextResponse, NextRequest } from "next/server";

  export async function GET(request: NextRequest) {
    try {
      const subjects = await prisma.subjects.findMany({
        select: {
          subject_id: true,
          subject_description: true,
          subject_code: true
        },
        distinct: ['subject_id']
      });

      return NextResponse.json(subjects, { status: 200 });
    } catch (error) {
      return NextResponse.json({ message: "Error fetching subjects" }, { status: 500 });
    }
  }
