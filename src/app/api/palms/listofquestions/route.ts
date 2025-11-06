import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const query = `
      SELECT
        q.id,
        q.questionName,
        q.pdfName,
        q.createdAt,
        q.FilePath,
        q.uploadType,
        ISNULL(q.status, 0) as status,
        a.id as answerId,
        a.answerName,
        a.correctAns,
        a.questionId
      FROM Question q
      LEFT JOIN Answer a ON q.id = a.questionId
      ORDER BY q.id, a.id
    `;

    console.log('📥 Executing query to fetch questions and answers...');
    const result = await prisma.$queryRaw`${query}`;
    console.log(`✅ Query executed successfully — ${(result as any[]).length} records fetched`);

    const questionsMap = new Map();
    let questionCount = 0;
    let answerCount = 0;

    console.log('📦 Processing records...');
    (result as any[]).forEach((record) => {
      const { id, questionName, pdfName, createdAt, FilePath, uploadType,status, answerId, answerName, correctAns } = record;

      if (!questionsMap.has(id)) {
        questionsMap.set(id, {
          id: id.toString(),
          question: questionName,
          filePath: FilePath,
          uploadType: uploadType || 'default',
          pdf_name: pdfName,
          created_date: createdAt,
          isApproved: status === 1,
          options: [],
          correctAnswer: ''
        });
        questionCount++;
      }

      if (answerId) {
        const question = questionsMap.get(id);
        question.options.push(answerName);
        answerCount++;

        // Ensure boolean handling is consistent
        const isCorrect = correctAns === true || correctAns === 1;
        if (isCorrect) {
          question.correctAnswer = answerName;
          console.log(`✅ Set correct answer for question ${id}: "${answerName}"`);
        }
      }
    });

    const questions = Array.from(questionsMap.values());
    console.log('🚀 Response data ready, sending...');
    return NextResponse.json(questions);
  } catch (error) {
    console.error('🛑 Error in [GET] /api/listofquestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isApproved } = body;
    console.log(`Updating question status - ID: ${id}, New Status: ${isApproved ? 'Approved' : 'Unapproved'}`);

    console.log('Executing update query...');
    const result = await prisma.$executeRaw`
      UPDATE Question
      SET status = ${isApproved ? 1 : 0}
      WHERE id = ${id}
    `;
    console.log(`Update query executed. Rows affected: ${result}`);

    if (result === 0) {
      console.warn(`No question found with ID: ${id}`);
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    console.log('Question status updated successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/listofquestions:', error);
    return NextResponse.json(
      {
        error: 'Failed to update question status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, question, options, correctAnswer } = body;
    console.log('Received update request:', { id, question, options, correctAnswer });

    // Use Prisma transaction for atomic operations
    await prisma.$transaction(async (tx) => {
      // Update the question
      await tx.$executeRaw`
        UPDATE Question
        SET questionName = ${question}
        WHERE id = ${id}
      `;
      console.log('Question updated successfully');

      // Get existing answers
      const existingAnswers = await tx.$queryRaw`
        SELECT id, answerId, answerName, correctAns
        FROM Answer
        WHERE questionId = ${id}
        ORDER BY id
      `;
      console.log('Existing answers:', existingAnswers);

      const existingAnswersMap = new Map(
        (existingAnswers as any[]).map(ans => [ans.answerName, ans])
      );

      const answersToKeep = new Set<number>();

      for (let i = 0; i < options.length; i++) {
        const optionText = options[i];
        console.log(`Options Text: ${optionText}  Correct Answer: ${correctAnswer}`);
        const isCorrect = optionText === correctAnswer;
        const answerId = i + 1;

        if (existingAnswersMap.has(optionText)) {
          // Update existing answer
          const existing = existingAnswersMap.get(optionText);
          await tx.$executeRaw`
            UPDATE Answer
            SET answerName = ${optionText},
                correctAns = ${isCorrect ? 1 : 0},
                answerId = ${answerId}
            WHERE id = ${existing.id}
          `;
          answersToKeep.add(existing.id);
          console.log(`Updated answer (id=${existing.id})`);
        } else {
          // Insert new answer
          const insertResult = await tx.$queryRaw`
            INSERT INTO Answer (questionId, answerName, correctAns, answerId)
            OUTPUT INSERTED.id
            VALUES (${id}, ${optionText}, ${isCorrect ? 1 : 0}, ${answerId})
          `;
          const newId = (insertResult as any[])[0].id;
          answersToKeep.add(newId);
          console.log(`Inserted new answer (id=${newId})`);
        }
      }

      // Delete answers no longer in the options list
      const toDelete = (existingAnswers as any[])
        .filter(ans => !answersToKeep.has(ans.id))
        .map(ans => ans.id);

      if (toDelete.length > 0) {
        const placeholders = toDelete.map(() => '?').join(',');
        await tx.$executeRaw`
          DELETE FROM Answer
          WHERE questionId = ${id}
          AND id IN (${placeholders})
        `;
        console.log(`Deleted answers with IDs: ${toDelete.join(', ')}`);
      }
    });

    console.log('Transaction committed successfully');
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Error in PATCH /api/listofquestions:', err);
    return NextResponse.json(
      {
        error: 'Failed to update question content',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
 
 