import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    console.log('📥 [GET] Fetching replicated questions...');

    const parentQuestions = await prisma.replicated_questions.findMany({
      where: { parent_id: null, deleted: 0 },
    });

    console.log(`✅ Fetched ${parentQuestions.length} parent questions from replicated_questions.`);

    const fullData = await Promise.all(
      parentQuestions.map(async (parent) => {

        const changes = await prisma.replicated_questions.findMany({
          where: { parent_id: parent.id, deleted: 0 },
          orderBy: { id: 'asc' },
          select: {
            id: true,
            question: true,
            options: true,
            correct_ans: true,
            applied_edits: true,
            solution: true,
            prompt: true,
            paper_id: true,
            question_id: true,
          },
        });

        return {
          ...parent,
          changes,
        };
      })
    );

    return NextResponse.json(fullData);

  } catch (err) {
    console.error('❌ Error fetching replicated questions:', err);
    return new NextResponse('Error fetching data', { status: 500 });
  }
}