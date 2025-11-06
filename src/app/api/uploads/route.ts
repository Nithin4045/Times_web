// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

// Keep folder names safe
function sanitizeFolder(input: string | null): string {
  if (!input) return '';
  let f = input.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  f = f.replace(/\/{2,}/g, '/');
  if (!/^[\w\-\/]*$/.test(f)) return '';
  if (f.split('/').some(seg => seg === '..' || seg === '.')) return '';
  return f;
}

function getExt(filename: string) {
  const i = filename.lastIndexOf('.');
  return i >= 0 ? filename.slice(i).toLowerCase() : '';
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const folder = sanitizeFolder((form.get('folder') as string) ?? '');
    const filenameBase = ((form.get('filename') as string) ?? '').trim();

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!filenameBase) {
      return NextResponse.json({ error: 'filename is required' }, { status: 400 });
    }

    // (Optional) enforce a server-side size cap (MB)
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `File too large (>${MAX_MB} MB)` }, { status: 413 });
    }

    const baseDir = path.join(process.cwd(), 'uploads');
    const targetDir = folder ? path.join(baseDir, folder) : baseDir;

    // Ensure we don't escape baseDir (folder was already sanitized)
    const rel = path.relative(baseDir, targetDir);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
    }

    await mkdir(targetDir, { recursive: true });

    const incomingExt = getExt(file.name) || '.bin';
    const finalName = `${filenameBase}${incomingExt}`;
    const targetPath = path.join(targetDir, finalName);

    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(targetPath, buf);

    // Return the new READ URL served by GET /api/uploads/[...path]
    const urlPath = folder
      ? `/api/uploads/${folder}/${encodeURIComponent(finalName)}`
      : `/api/uploads/${encodeURIComponent(finalName)}`;

    return NextResponse.json({ url: urlPath }, { status: 200 });
  } catch (err: any) {
    console.error('[UPLOAD] Error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
