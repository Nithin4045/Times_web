import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('job_id');

  console.log('[python-job-progress] Incoming request for job_id:', jobId);

  if (!jobId) {
    return new Response(JSON.stringify({ error: 'Missing job_id' }), { status: 400 });
  }

  const pythonServer = process.env.NEXT_PUBLIC_PYTHON_SERVER || 'http://localhost:8000';
  const baseUrl = pythonServer.replace(/\/$/, '');
  const percentUrl = `${baseUrl}/mcq_generator/generate-questions/${jobId}/percent`;
  const streamUrl = `${baseUrl}/mcq_generator/generate-questions/${jobId}`;

  try {
    const initialResp = await fetch(percentUrl, {
      headers: { Accept: 'application/json' },
    });

    let initialEvent = '';
    if (initialResp.ok) {
      const initialData = await initialResp.json();
      initialEvent = `data: ${JSON.stringify(initialData)}\n\n`;
    } else {
      initialEvent = `data: {"error": "Could not fetch initial progress", "job_id": "${jobId}"}\n\n`;
    }

    const resp = await fetch(streamUrl, {
      headers: { Accept: 'text/event-stream' },
    });

    if (!resp.body) {
      const fallbackStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(initialEvent));
          controller.close();
        },
      });

      return new Response(fallbackStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

const stream = new ReadableStream({
  async start(controller) {
    controller.enqueue(new TextEncoder().encode(initialEvent));

    const reader = resp.body?.getReader();
    if (!reader) {
      controller.enqueue(new TextEncoder().encode(`data: {"error": "No readable stream"}\n\n`));
      controller.close();
      return;
    }

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
    } catch (err) {
      console.error('[python-job-progress] Error reading stream:', err);
      controller.enqueue(new TextEncoder().encode(`data: {"error": "Stream error"}\n\n`));
    } finally {
      controller.close();
    }
  },
});


    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[python-job-progress] Error streaming from Python server:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to stream from Python server', details: String(err) }),
      { status: 500 }
    );
  }
}
