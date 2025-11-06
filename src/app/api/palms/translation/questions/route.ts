import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from "@/generated/prisma";
import { prismaWordDb } from '@/lib/prismaWordDb';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/palms/translation/questions?paper_id=...
 * Fetches translated questions for a specific paper_id
 * Also fetches original English questions from extractor_question table
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paper_id');

    if (!paperId) {
      return NextResponse.json(
        { error: 'paper_id is required' },
        { status: 400 }
      );
    }

    console.log(`📥 Fetching translated questions for paper_id=${paperId}`);

    // Fetch translated questions from database
    const questions = await prisma.translated_questions.findMany({
      where: {
        paper_id: paperId,
        deleted: 0
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`✅ Found ${questions.length} translated questions`);

    // Extract all question_ids to fetch original questions
    const questionIds = questions.map(q => q.question_id);
    
    // Fetch original English questions AND solutions from extractor_question table
    let originalQuestions: Array<{
      question_id: string;
      question_text: string | null;
      options: unknown;
      question_number: number | null;
      paper_id: string | null;
    }> = [];

    const extractorModel = (prismaWordDb as any)?.extractor_question;

    if (questionIds.length > 0) {
      if (extractorModel?.findMany) {
        originalQuestions = await extractorModel.findMany({
          where: {
            question_id: {
              in: questionIds
            }
          },
          select: {
            question_id: true,
            question_text: true,
            options: true,
            question_number: true,
            paper_id: true
          }
        });
      } else {
        originalQuestions = await prismaWordDb.$queryRaw<Array<{
          question_id: string;
          question_text: string | null;
          options: unknown;
          question_number: number | null;
          paper_id: string | null;
        }>>(Prisma.sql`
          SELECT
            question_id,
            question_text,
            options,
            question_number,
            paper_id
          FROM extractor_question
          WHERE question_id IN (${Prisma.join(questionIds)})
        `);
      }
    }

    console.log(`Found ${originalQuestions.length} original questions from extractor_question`);

    // Fetch solutions from extractor_solution table
    let originalSolutions: Array<{
      paper_id: string;
      solution_number: number | null;
      solution_text: string | null;
    }> = [];

    // Build paper_id list with _Sol suffix for solution lookup
    const solutionPaperIds = [...new Set(originalQuestions.map(q => q.paper_id).filter(Boolean).map(pid => `${pid}_Sol`))];

    if (solutionPaperIds.length > 0) {
      originalSolutions = await prismaWordDb.$queryRaw<Array<{
        paper_id: string;
        solution_number: number | null;
        solution_text: string | null;
      }>>(Prisma.sql`
        SELECT
          paper_id,
          solution_number,
          solution_text
        FROM extractor_solution
        WHERE paper_id IN (${Prisma.join(solutionPaperIds)})
      `);
    }

    console.log(`Found ${originalSolutions.length} original solutions from extractor_solution`);

    // Create a map for quick lookup of questions
    const originalQuestionsMap = new Map(
      originalQuestions.map(q => [q.question_id, q])
    );

    // Create a solution map: key is "paper_id_question_number", value is solution_text
    const solutionMap = new Map<string, string>();
    originalSolutions.forEach(sol => {
      if (sol.paper_id && sol.solution_number !== null) {
        // Remove _Sol suffix to get original paper_id
        const originalPaperId = sol.paper_id.replace(/_Sol$/, '');
        const key = `${originalPaperId}_${sol.solution_number}`;
        if (sol.solution_text) {
          solutionMap.set(key, sol.solution_text);
        }
      }
    });

    console.log(`Created solution map with ${solutionMap.size} entries`);

    // Parse translations JSON and merge with original questions
    const formattedQuestions = questions.map(q => {
      let translations: Record<string, any> = {};
      
      try {
        if (typeof q.translations === 'string') {
          translations = JSON.parse(q.translations);
        } else if (typeof q.translations === 'object' && q.translations !== null) {
          translations = q.translations as Record<string, any>;
        }
        
        console.log(`Question ${q.question_id} translations keys:`, Object.keys(translations));
        
      } catch (err) {
        console.error(`Failed to parse translations for question ${q.question_id}:`, err);
      }

      // Get original English question from extractor_question
      const originalQuestion = originalQuestionsMap.get(q.question_id);
      const originalEnglish = originalQuestion?.question_text || '';
      const originalOptions = originalQuestion?.options || null;
      const questionNumber = originalQuestion?.question_number;
      const questionPaperId = originalQuestion?.paper_id;

      // Get original English solution from extractor_solution
      let originalSolution: string | null = null;
      if (questionPaperId && questionNumber !== null && questionNumber !== undefined) {
        const solutionKey = `${questionPaperId}_${questionNumber}`;
        originalSolution = solutionMap.get(solutionKey) || null;
      }

      console.log(`Question ${q.question_id}: has original solution = ${!!originalSolution}`);

      // Add English question to translations if not already there
      const hasEnglish = Object.prototype.hasOwnProperty.call(translations, 'en') || 
                         Object.prototype.hasOwnProperty.call(translations, 'english');
      
      if (!hasEnglish) {
        // Build English translation object with question, options, and solution
        const englishData: any = {
          question: originalEnglish,
          options: Array.isArray(originalOptions) ? originalOptions : 
                   (typeof originalOptions === 'object' && originalOptions !== null ? Object.values(originalOptions) : [])
        };
        
        // Add solution if it exists
        if (originalSolution) {
          englishData.solution = originalSolution;
        }
        
        translations = {
          en: englishData,
          ...translations
        };
      } else {
        // If English exists but doesn't have solution, add it
        const existingEn = translations['en'] || translations['english'];
        if (existingEn && typeof existingEn === 'object' && !existingEn.solution && originalSolution) {
          if (translations['en']) {
            translations['en'] = { ...existingEn, solution: originalSolution };
          } else if (translations['english']) {
            translations['english'] = { ...existingEn, solution: originalSolution };
          }
        }
      }

      return {
        id: q.id,
        paper_id: q.paper_id,
        question_id: q.question_id,
        job_id: q.job_id,
        translations,
        original_question: originalEnglish,
        original_options: originalOptions,
        question_number: originalQuestion?.question_number,
        local_words: q.local_words,
        global_words: q.global_words,
        user_id: q.user_id,
        created_at: q.created_at?.toISOString(),
        updated_at: q.updated_at?.toISOString(),
      };
    });

    // Log sample translation data structure to verify solutions are included
    if (formattedQuestions.length > 0) {
      const sample = formattedQuestions[0];
      console.log(`Sample translation data structure for ${sample.question_id}:`);
      console.log(`  - Translation languages: ${Object.keys(sample.translations).join(', ')}`);
      
      // Check each language for solution
      for (const [lang, data] of Object.entries(sample.translations)) {
        if (typeof data === 'object' && data !== null) {
          console.log(`  - ${lang}: has question=${!!data.question}, has options=${!!data.options}, has solution=${!!data.solution}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      paper_id: paperId,
      count: formattedQuestions.length,
      questions: formattedQuestions
    });

  } catch (error: any) {
    console.error('❌ Error fetching translated questions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch translated questions',
        detail: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

