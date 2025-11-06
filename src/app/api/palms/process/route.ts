import { NextResponse } from 'next/server';
import { fetchWithTimeout, API_CONFIG } from '@/lib/api-config';

export async function POST(request: Request) {
  try {
    // Parse incoming multipart form data
    const formData = await request.formData();
    const inputType = (formData.get('inputType') as string | null) ?? '';
    const pdfFile = formData.get('pdf_file') as File | null;
    const conceptsFile = formData.get('concepts_file') as File | null;

    if (!pdfFile || !conceptsFile) {
      return NextResponse.json(
        { error: 'Both PDF and Concepts CSV are required.' },
        { status: 400 }
      );
    }

    // Normalize input type: lowercase, spaces -> underscores
    const normalizedType = inputType.trim().toLowerCase().replace(/\s+/g, '_');

    // Forward form data to FastAPI backend
    const forwardData = new FormData();
    forwardData.append('input_type', normalizedType);
    forwardData.append('pdf_file', pdfFile, pdfFile.name);
    forwardData.append('concepts_file', conceptsFile, conceptsFile.name);

    // Backend URL (set via env)
    const url = `${API_CONFIG.PYTHON_SERVER.BASE_URL}process/process`;

    const resp = await fetchWithTimeout(url, {
      method: 'POST',
      body: forwardData,
    }, API_CONFIG.TIMEOUT.UPLOAD);

    if (!resp.ok) {
      const errorText = await resp.text();
      return new NextResponse(errorText, { status: resp.status });
    }

    const result = await resp.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in process route:', error);
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}
