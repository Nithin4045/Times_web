import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('🚀 [pdf_questions] Route called');
  console.log('📝 [pdf_questions] Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.json();
 
    const { questions, fileName, fileBase64, user_id, file_type, job_id } = body;

    if (!Array.isArray(questions)) {
      console.error('❌ [pdf_questions] Invalid question array:', questions);
      throw new Error('Invalid question array');
    }
    if (!fileBase64 || !fileName) {
      console.error('❌ [pdf_questions] Missing required fields:', { hasFileBase64: !!fileBase64, hasFileName: !!fileName });
      throw new Error('Missing fileBase64 or fileName');
    }

    const fileType = path.extname(fileName).replace('.', '').toUpperCase();
    const sanitizedFileName = fileName.replace(/\s+/g, '_');
    const uuid = uuidv4();
    const uuidFileName = `${uuid}_${sanitizedFileName}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'palms');
    const filePath = path.join(uploadDir, uuidFileName);

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });
    console.log('📁 [pdf_questions] Processing file:', { fileName, fileType, uploadDir, filePath });

    // Decode and save base64 file
    const buffer = Buffer.from(fileBase64, 'base64');
    await writeFile(filePath, buffer);
    console.log(`✅ [pdf_questions] Saved file at: ${filePath}`);

    const savedRecords = [];
    console.log('💾 [pdf_questions] Starting database operations for', questions.length, 'questions');

    for (const [index, q] of questions.entries()) {
      const { question, options, answer: correct_answer, timestamp, page } = q;
      if (!question || !options || !correct_answer) {
        console.warn(`⚠️ [pdf_questions] Skipping question ${index + 1} - missing required fields:`, { hasQuestion: !!question, hasOptions: !!options, hasAnswer: !!correct_answer });
        continue;
      }

      console.log(`📝 [pdf_questions] Creating question ${index + 1}/${questions.length}:`, { question: question.substring(0, 50) + '...' });
      const numericUserId = parseInt(user_id, 10);

      const created = await prisma.replicated_questions.create({
        data: {
          paper_id: fileName,
          question_id: `Q${index + 1}`,
          parent_id: null, // Main question from PDF extraction
          job_id: job_id ? Number(job_id) : 0,
          question,
          correct_ans: correct_answer,
          options: JSON.stringify(options),
          solution: null,
          applied_edits: null,
          prompt: null,
          user_id: numericUserId,
          deleted: 0,
        },
      });

      savedRecords.push(created);
      console.log(`✅ [pdf_questions] Question ${index + 1} created with ID:`, created.id);
    }
    
    console.log(`🎉 [pdf_questions] Successfully processed ${savedRecords.length}/${questions.length} questions`);

    const responseData = { 
      success: true,
      message: 'Questions processed successfully', 
      details: `Saved ${savedRecords.length} questions from ${fileName}`,
      questions: savedRecords,
      count: savedRecords.length,
      fileName: fileName
    };

    // Update generate_jobs with success
    console.log(`[pdf_questions] Updating generate_jobs ${job_id} with status 'success'`);
    if (job_id) {
      await prisma.generate_jobs.update({
        where: { id: Number(job_id) },
        data: {
          status: 'success',
          response_data: JSON.stringify(responseData),
          updatedAt: new Date(),
        },
      });
      console.log(`[pdf_questions] generate_jobs ${job_id} updated to 'success'`);
    }
    console.log('✅ [pdf_questions] Sending success response:', responseData);
    
    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error('❌ [pdf_questions] Error in update-db:', err);
    console.error('❌ [pdf_questions] Error stack:', err.stack);
    
    const errorResponse = { 
      success: false,
      error: 'Failed to process questions',
      details: err.message,
      fileName: 'Unknown file'
    };
    
    // Update generate_jobs with error
    try {
      const body = await request.json();
      const file_job_id = body.job_id;
      if (file_job_id) {
        console.log(`[pdf_questions] Updating generate_jobs ${file_job_id} with status 'error'`);
        await prisma.generate_jobs.update({
          where: { id: Number(file_job_id) },
          data: {
            status: 'error',
            response_data: JSON.stringify(errorResponse),
            updatedAt: new Date(),
          },
        });
        console.log(`[pdf_questions] fileJob ${file_job_id} updated to 'error'`);
      }
    } catch (e) {
      console.error('[pdf_questions] Failed to update fileJob with error status:', e);
    }
    console.log('❌ [pdf_questions] Sending error response:', errorResponse);
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
