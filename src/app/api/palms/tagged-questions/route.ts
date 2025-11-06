import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prismaWordDb } from '@/lib/prismaWordDb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paper_id = searchParams.get("paper_id");
    const job_id = searchParams.get("job_id");
    
    if (!paper_id && !job_id) {
      return NextResponse.json([], { status: 200 });
    }

    console.log(`📥 Fetching tagged questions with full data - paper_id: ${paper_id}, job_id: ${job_id}`);

    // Build where clause for tagged_questions
    const whereClause: any = { deleted: 0 };
    if (paper_id) whereClause.paper_id = paper_id;
    if (job_id) whereClause.job_id = Number(job_id);

    // Get tagged questions
    const taggedQuestions = await prisma.tagged_questions.findMany({
      where: whereClause,
      orderBy: [{ id: "asc" }],
      select: {
        id: true,
        question_id: true,
        job_id: true,
        paper_id: true,
        area: true,
        sub_area: true,
        topic: true,
        sub_topic: true,
      },
    });

    console.log(`🔍 Found ${taggedQuestions.length} tagged questions`);

    if (taggedQuestions.length === 0) {
      return NextResponse.json([]);
    }

    // Get question IDs to fetch from extractor_question table
    const questionIds = taggedQuestions.map(tq => tq.question_id);
    
    // Fetch full question data from extractor_question table using raw query
    const fullQuestions = await prismaWordDb.$queryRawUnsafe<any[]>(`
      SELECT 
        question_id,
        question_text,
        question_number,
        options,
        direction,
        passage,
        notes,
        tags
      FROM extractor_question
      WHERE question_id = ANY($1::text[])
    `, questionIds);

    console.log(`📋 Found ${fullQuestions.length} full questions from extractor_question`);

    // Create a map for quick lookup
    const questionMap = new Map();
    fullQuestions.forEach(q => {
      questionMap.set(q.question_id, q);
    });

    // Join tagged questions with full question data
    const result = taggedQuestions.map(tagged => {
      const fullQuestion = questionMap.get(tagged.question_id);
      
      return {
        id: tagged.id,
        question_id: tagged.question_id,
        question: fullQuestion?.question_text || tagged.question_id,
        question_number: fullQuestion?.question_number || null,
        options: fullQuestion?.options || [],
        direction: fullQuestion?.direction || null,
        passage: fullQuestion?.passage || null,
        notes: fullQuestion?.notes || null,
        tags: fullQuestion?.tags || null,
        // Tagging-specific fields
        area: tagged.area,
        sub_area: tagged.sub_area,
        topic: tagged.topic,
        sub_topic: tagged.sub_topic,
        job_id: tagged.job_id,
        paper_id: tagged.paper_id,
        // Standard fields for UI compatibility
        correctIndex: 0,
        approved: false,
        transformations: [],
      };
    });

    console.log(`✅ Returning ${result.length} tagged questions with full data`);
    return NextResponse.json(result);

  } catch (e) {
    console.error("/api/palms/tagged-questions GET failed", e);
    return NextResponse.json(
      { error: "Failed to fetch tagged questions" },
      { status: 500 }
    );
  }
}
