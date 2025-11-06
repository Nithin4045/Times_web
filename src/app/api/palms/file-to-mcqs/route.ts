import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const fileBase64 = formData.get('fileBase64');
  const num_questions = formData.get('num_questions');
  const prompt = formData.get('prompt');
  const fileName = formData.get('fileName') || 'text_input.txt';
  const user_id = formData.get('user_id') || '0';
  const file_type = formData.get('file_type') || 'text';

  // Log incoming form data for debugging
  console.log('[file-to-mcqs] Received:', {
    fileName,
    file_type,
    user_id,
    num_questions,
    hasFileBase64: !!fileBase64,
    prompt
  });

  // Create a new generate_jobs record
  let job_id: number | undefined = undefined;
  try {
    const fileJob = await prisma.generate_jobs.create({
      data: {
        fileName: fileName as string,
        user_id: Number(user_id),
        input_type: file_type as string,
        request_data: JSON.stringify({ fileBase64, num_questions, prompt }),
        response_data: '',
        status: 'started',
        api_endpoint: '/api/palms/file-to-mcqs',
        percentage: 0,
      },
    });
    job_id = fileJob.id;
    console.log('[file-to-mcqs] Created generate_jobs with id:', job_id);
  } catch (e) {
    console.error('[file-to-mcqs] Failed to create generate_jobs:', e);
  }

  // Construct form data for FastAPI
  const backendForm = new FormData();
  backendForm.append('fileBase64', fileBase64 as string);
  backendForm.append('fileName', fileName as string);
  backendForm.append('file_type', file_type as string);
  backendForm.append('num_questions', num_questions as string);
  if (prompt) backendForm.append('prompt', prompt as string);
  backendForm.append('job_id', job_id ? job_id.toString() : '');

  // Call FastAPI backend
  console.log('[file-to-mcqs] Starting backend streaming request...');
  const backendRes = await fetch(process.env.PYTHON_PALMS_URL + '/file-to-mcqs/stream', {
    method: 'POST',
    body: backendForm,
  });

  // Stream and collect MCQs
  let questions: any[] = [];
  let percent = 0;
  let error: string | null = null;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      if (!backendRes.body) {
        controller.enqueue(encoder.encode('data: {"error": "No response body from backend"}\n\n'));
        controller.close();
        return;
      }
      const reader = backendRes.body.getReader();
      let buffer = '';
      console.log('[file-to-mcqs] Streaming from backend...');
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += new TextDecoder().decode(value);
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          if (part.startsWith('data:')) {
            try {
              const json = JSON.parse(part.replace('data:', '').trim());
              console.log('[file-to-mcqs] Received chunk:', json);
              if (json.error) {
                error = json.error;
                // Update generate_jobs with error in response_data and status
                if (job_id) {
                  try {
                    await prisma.generate_jobs.update({
                      where: { id: job_id },
                      data: {
                        response_data: JSON.stringify({ error: json.error }),
                        status: 'error',
                        percentage: percent,
                      },
                    });
                  } catch (e) {
                    console.error('[file-to-mcqs] Failed to update generate_jobs with error:', e);
                  }
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(json)}\n\n`));
                controller.close();
                console.log('[file-to-mcqs] Streaming ended with error.');
                return;
              }
              percent = json.percent || 0;
              // Update percentage in generate_jobs
              if (job_id && typeof percent === 'number') {
                try {
                  await prisma.generate_jobs.update({
                    where: { id: job_id },
                    data: { percentage: percent },
                  });
                } catch (e) {
                  console.error('[file-to-mcqs] Failed to update generate_jobs percentage:', e);
                }
              }
              if (json.data) questions.push(json.data);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(json)}\n\n`));
              console.log('[file-to-mcqs] Streamed to client:', json);
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
      // After streaming is done and no error, update DB
      if (!error && questions.length > 0) {
        // Prepare DB payload
        const dbPayload = {
          questions,
          fileName,
          fileBase64,
          user_id,
          file_type,
          job_id,
        };
        await fetch(process.env.NEXT_PUBLIC_BASE_URL + '/api/palms_db/pdf_questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbPayload),
        });
      }
      controller.close();
      console.log('[file-to-mcqs] Streaming finished.');
    },
  });
  return new Response(stream, {
    status: backendRes.status,
    headers: {
      'Content-Type': 'text/event-stream',
    },
  });
} 