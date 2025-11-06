// src/app/api/uploads/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeSegments(segments: string[]) {
  const cleaned = segments.map(seg => seg.replace(/[/\\]/g, ''));
  if (cleaned.some(s => s === '' || s === '.' || s === '..')) return null;
  return cleaned;
}

function guessContentType(filename: string) {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.') + 1);
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    case 'svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> } // Next 15: params is a Promise
) {
  try {
    const { path: rawSegs } = await ctx.params;
    const clean = sanitizeSegments(rawSegs || []);
    if (!clean) return NextResponse.json({ error: 'Invalid path' }, { status: 400 });

    const baseDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(baseDir, ...clean);

    // Prevent path escape
    const rel = path.relative(baseDir, filePath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const st = await stat(filePath);
    if (!st.isFile()) return NextResponse.json({ error: 'Not a file' }, { status: 404 });

    const fileBuf = await readFile(filePath);           // Node Buffer
    const body = new Uint8Array(fileBuf);               // ✅ BodyInit
    const contentType = guessContentType(filePath);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(body.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
