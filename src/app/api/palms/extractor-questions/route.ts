import { prismaWordDb } from '@/lib/prismaWordDb';
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const originalPaperId = searchParams.get("paper_id");
    const typeParam = searchParams.get("type");
    const byParam = searchParams.get("by");
    const jobIdParam = searchParams.get("job_id"); // ✅ Get job_id if provided
    let paperId = originalPaperId;
    console.log()
    // Parse paperId if it contains colons, e.g., "extractor:QAT100200:translation" -> "QAT100200"
    if (paperId && paperId.includes(":")) {
      const parts = paperId.split(":");
      if (parts.length >= 3) {
        paperId = parts[1];
      }
    }

    if (!paperId) {
      // If type=translation, return paper_ids from translated_questions table
      if (typeParam === "translation") {
        const translatedPaperIds = await prisma.translated_questions.findMany({
          where: {
            deleted: 0
          },
          select: {
            paper_id: true,
          },
          distinct: ["paper_id"],
        });

        const distinctTranslatedPaperIds = translatedPaperIds.map((p) => p.paper_id);
        console.log(`📋 Found ${distinctTranslatedPaperIds.length} paper IDs with translations:`, distinctTranslatedPaperIds);
        return NextResponse.json(distinctTranslatedPaperIds);
      }
      // If type=tagging, return paper_ids from tagged_questions table
      if (typeParam === "tagging") {
        if (byParam === "job") {
          const jobIds = await prisma.tagged_questions.findMany({
            where: { deleted: 0 },
            select: { job_id: true },
            distinct: ["job_id"],
            orderBy: { job_id: "desc" },
          });
          return NextResponse.json(jobIds.map((r) => String(r.job_id)));
        } else {
          const taggedPaperIds = await prisma.tagged_questions.findMany({
            where: { deleted: 0 },
            select: { paper_id: true },
            distinct: ["paper_id"],
          });
          const distinctTaggedPaperIds = taggedPaperIds.map((p) => p.paper_id);
          return NextResponse.json(distinctTaggedPaperIds);
        }
      }
      
      // Default: Return distinct paper_ids from translated_questions table only
      const paperIds = await prisma.translated_questions.findMany({
        where: {
          deleted: 0
        },
        select: {
          paper_id: true,
        },
        distinct: ["paper_id"],
      });

      const distinctPaperIds = paperIds.map((p) => p.paper_id);
      console.log(`📋 Found ${distinctPaperIds.length} paper IDs with translations (default):`, distinctPaperIds);
      return NextResponse.json(distinctPaperIds);
    }

    let questions: any[];
    console.log(originalPaperId)
    if (originalPaperId && originalPaperId.includes(":replicate")) {
      // ✅ FIXED: Query replicated_questions table (not replicate_q)
      console.log('replicate triggered for paper_id:', paperId, 'job_id:', jobIdParam);
      
      // Build where clause with optional job_id filter
      const whereClause: any = {
        paper_id: paperId,
        deleted: 0, // Only get non-deleted questions
        parent_id: null, // Only get main questions (not transformations)
      };
      
      // ✅ Filter by job_id if provided
      if (jobIdParam) {
        whereClause.job_id = parseInt(jobIdParam);
        console.log('✅ Filtering by job_id:', whereClause.job_id);
      }
      
      questions = await prisma.replicated_questions.findMany({
        where: whereClause,
        select: {
          id: true,
          question_id: true,
          question: true,
          options: true,
          correct_ans: true,
          applied_edits: true,
          solution: true,
          prompt: true,
          job_id: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

      // Map to UI-friendly format with transformations
      questions = await Promise.all(questions.map(async (q: any) => {
        let options = [];
        if (Array.isArray(q.options)) {
          options = q.options;
        } else if (typeof q.options === "string") {
          try {
            options = JSON.parse(q.options);
            if (!Array.isArray(options)) options = [];
          } catch {
            options = [];
          }
        }
        
        // Find correct answer index
        const correctAns = q.correct_ans || "";
        const correctIndex = options.findIndex((opt: string) => opt === correctAns);
        
        // ✅ Recursive function to fetch transformations at any depth
        const fetchTransformationsRecursive = async (parentId: number, depth: number = 0): Promise<any[]> => {
          // Safety limit to prevent infinite recursion (max 10 levels)
          if (depth > 10) return [];

          const childQuestions = await prisma.replicated_questions.findMany({
            where: {
              paper_id: paperId,
              deleted: 0,
              parent_id: parentId,
            },
            select: {
              id: true,
              question_id: true,
              question: true,
              options: true,
              correct_ans: true,
              applied_edits: true,
              solution: true,
              prompt: true,
              job_id: true,
            },
            orderBy: {
              id: 'asc',
            },
          });

          // Map each child and recursively fetch its children
          return await Promise.all(childQuestions.map(async (child: any) => {
            let childOptions = [];
            if (Array.isArray(child.options)) {
              childOptions = child.options;
            } else if (typeof child.options === "string") {
              try {
                childOptions = JSON.parse(child.options);
                if (!Array.isArray(childOptions)) childOptions = [];
              } catch {
                childOptions = [];
              }
            }
            
            const childCorrectAns = child.correct_ans || "";
            const childCorrectIndex = childOptions.findIndex((opt: string) => opt === childCorrectAns);
            
            // ✅ Recursively fetch nested transformations at any depth
            const nestedTransformations = await fetchTransformationsRecursive(child.id, depth + 1);
            
            return {
              id: String(child.id),
              label: child.applied_edits || `Transformation (Level ${depth + 1})`,
              question: child.question || "",
              options: childOptions,
              correctIndex: childCorrectIndex >= 0 ? childCorrectIndex : 0,
              approved: false,
              solution: child.solution,
              prompt: child.prompt,
              applied_edits: child.applied_edits,
              transformations: nestedTransformations, // ✅ Recursively include nested transformations
            };
          }));
        };

        // ✅ Fetch all transformations recursively starting from main question
        const transformations = await fetchTransformationsRecursive(q.id);
        
        return {
          id: q.question_id,
          question: q.question || "",
          options,
          correctIndex: correctIndex >= 0 ? correctIndex : 0,
          approved: false,
          direction: null,
          passage: null,
          notes: null,
          tags: null,
          // Include replication-specific fields
          applied_edits: q.applied_edits,
          solution: q.solution,
          prompt: q.prompt,
          job_id: q.job_id,
          transformations: transformations, // ✅ Include transformations
        };
      }));
    } else {
      const extractorModel = (prismaWordDb as any)?.extractor_question;
      let rows: any[] = [];

      if (extractorModel?.findMany) {
        rows = await extractorModel.findMany({
          where: {
            paper_id: paperId,
          },
          select: {
            id: true,
            question_id: true,
            question_number: true,
            question_text: true,
            direction: true,
            passage: true,
            options: true,
            notes: true,
            tags: true,
          },
          orderBy: {
            question_number: "asc",
          },
        });
      } else {
        rows = await prismaWordDb.$queryRaw<
          Array<{
            question_id: string;
            question_text: string | null;
            question_number: number | null;
            options: unknown;
            direction: string | null;
            passage: string | null;
            notes: string | null;
            tags: string | null;
          }>
        >(Prisma.sql`
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
          WHERE paper_id = ${paperId}
          ORDER BY question_number ASC
        `);
      }

      questions = rows.map((q: any) => ({
        id: q.question_id,
        question: q.question_text || "",
        options: Array.isArray(q.options)
          ? q.options
          : typeof q.options === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(q.options);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })()
          : [],
        correctIndex: 0,
        approved: false,
        direction: q.direction,
        passage: q.passage,
        notes: q.notes,
        tags: q.tags,
      }));
    }

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching extractor questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
