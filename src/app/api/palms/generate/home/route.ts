import { NextResponse, NextRequest } from 'next/server';
import { prismaWordDb } from '@/lib/prismaWordDb';
import { Prisma } from "@/generated/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/palms/generate/home
 * Fetches distinct paper IDs from extractor_question table
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📥 Fetching distinct paper IDs from extractor_question');

    // Get distinct paper_ids
    let uniquePaperIds: string[] = [];

    const extractorModel = (prismaWordDb as any)?.extractor_question;
    if (extractorModel?.findMany) {
      const paperIds = await extractorModel.findMany({
        select: {
          paper_id: true,
        },
        distinct: ['paper_id'],
        orderBy: {
          paper_id: 'asc'
        }
      });
      uniquePaperIds = paperIds.map((item: any) => item.paper_id);
    } else {
      const rows = await prismaWordDb.$queryRaw<{ paper_id: string }[]>(Prisma.sql`
        SELECT DISTINCT paper_id
        FROM extractor_question
        ORDER BY paper_id ASC
      `);
      uniquePaperIds = rows.map((row) => row.paper_id);
    }

    console.log(`✅ Found ${uniquePaperIds.length} unique paper IDs`);

    return NextResponse.json({
      success: true,
      count: uniquePaperIds.length,
      paper_ids: uniquePaperIds,
    });

  } catch (error: any) {
    console.error('❌ Error fetching paper IDs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch paper IDs',
        detail: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/palms/generate/home
 * Fetches all questions for a specific paper_id joined with master_keys
 * Body: { paper_id: string, action?: 'full' | 'table' }
 * - action='table' (default): returns question_id, question_text, area for table display
 * - action='full': returns complete MCQ data with options for replication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paper_id, action = 'table' } = body;

    if (!paper_id) {
      return NextResponse.json(
        { error: 'paper_id is required' },
        { status: 400 }
      );
    }

    console.log(`📥 Fetching questions for paper_id=${paper_id}, action=${action}`);

    if (action === 'full') {
      // ✅ Fetch full MCQ data with options AND answers for replication (join with master_keys and solutions)
      const questions = await prismaWordDb.$queryRaw`
        SELECT
          eq.question_id,
          eq.question_text,
          eq.question_number,
          eq.options,
          mk.master_key as answer,
          es.solution_text
        FROM extractor_question eq
        LEFT JOIN master_keys mk ON eq.question_id = mk.qno_in_new_paper
        LEFT JOIN extractor_solution es ON es.paper_id = CONCAT(eq.paper_id, '_Sol') AND es.solution_number = eq.question_number
        WHERE eq.paper_id = ${paper_id}
        ORDER BY eq.question_number ASC
      ` as Array<{
        question_id: string;
        question_text: string | null;
        question_number: number;
        options: any;
        answer: string | null;
        solution_text: string | null;
      }>;

      // Transform to Python API format - extract options from JSONB properly
      const mcqArray = questions.map(q => {
        let options = [];
        if (q.options) {
          if (Array.isArray(q.options)) {
            options = q.options.filter(opt => opt && typeof opt === 'string');
          } else if (typeof q.options === 'object') {
            options = Object.values(q.options).filter(opt => opt && typeof opt === 'string') as string[];
          }
        }
        
        return {
          question: q.question_text || '',
          options: options,
          answer: q.answer || '',
          solution_text: q.solution_text || '',
          question_id: q.question_id,
        };
      });

      console.log(`✅ Fetched ${mcqArray.length} full MCQs with answers for paper_id=${paper_id}`);

      return NextResponse.json({
        success: true,
        paper_id: paper_id,
        count: mcqArray.length,
        data: mcqArray,
      });
    } else {
      // Default: Fetch questions for table display with area from master_keys and solutions from extractor_solution
      const questions = await prismaWordDb.$queryRaw`
        SELECT
          eq.question_id,
          eq.question_text,
          eq.question_number,
          eq.options,
          mk.area,
          es.solution_text
        FROM extractor_question eq
        LEFT JOIN master_keys mk ON eq.question_id = mk.qno_in_new_paper
        LEFT JOIN extractor_solution es ON es.paper_id = CONCAT(eq.paper_id, '_Sol') AND es.solution_number = eq.question_number
        WHERE eq.paper_id = ${paper_id}
        ORDER BY eq.question_number ASC
      `;

      const questionArray = questions as Array<{
        question_id: string;
        question_text: string | null;
        question_number: number;
        options: any;
        area: string | null;
        solution_text: string | null;
      }>;

      console.log(`✅ Fetched ${questionArray.length} questions with solutions for paper_id=${paper_id}`);

      return NextResponse.json({
        success: true,
        paper_id: paper_id,
        count: questionArray.length,
        data: questionArray,
      });
    }

  } catch (error: any) {
    console.error('❌ Error fetching questions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch questions',
        detail: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
