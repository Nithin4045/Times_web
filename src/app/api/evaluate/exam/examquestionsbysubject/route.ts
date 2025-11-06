export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function GET(request: Request) {
  console.log('questions loading');
  const url = new URL(request.url);
 
  const testid    = Number(url.searchParams.get("testid"));
  const subjectid = Number(url.searchParams.get("subjectid"));
  const userid    = Number(url.searchParams.get("userid"));
  const topicRaw  = url.searchParams.get("topicid"); // optional
 
 
  console.log('testid',testid,'subjectid',subjectid,'userid',userid,'topicRaw',topicRaw);
  if (!Number.isFinite(testid) || !Number.isFinite(subjectid) || !Number.isFinite(userid)) {
    return NextResponse.json({ message: "Missing or invalid parameters" }, { status: 400 });
  }
 
  // Normalize topic: null means “all topics”
  const topicid: string | null =
    topicRaw && topicRaw !== "All" && topicRaw.trim() !== "" ? topicRaw : null;
 
  try {
    const questions = await prisma.$queryRaw<any[]>`
      SELECT *
      FROM public.get_test_questions(
        CAST(${testid}    AS int),
          CAST(${userid}    AS int),
        CAST(${subjectid} AS int),
        ${topicid}::text
      )
    `;
    console.log('questions',questions);
    return NextResponse.json(questions, { status: 200 });
  } catch (err: any) {
    console.error("[examquestionsbysubject]", err?.code, err?.message ?? err);
    if (err?.code === "42883") {
      return NextResponse.json(
        { message: "Function public.get_test_questions(int,int,int,text) not found or wrong signature." },
        { status: 500 }
      );
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
 