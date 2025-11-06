import { NextResponse } from "next/server";
import { join } from "path";
import { statSync, createReadStream, existsSync } from "fs";
import { Readable } from "stream";
// import mime from "mime";
import { lookup as mimeLookup } from "mime-types";
const UPLOAD_DIR = join(process.cwd(), "uploads", "evaluate", "static", "files");
 
// Allowlist of safe extensions
const ALLOWED_EXT = new Set([
  "pdf", "txt", "doc", "docx", "jpg", "jpeg", "png", "gif",
  "mp3", "wav", "webm", "mp4"
]);
 
export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    // ✅ Must await params in async handler
    const { filename: rawName } = await context.params;
    const filename = decodeURIComponent(rawName || "");
 
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ message: "Invalid filename" }, { status: 400 });
    }
 
    const filePath = join(UPLOAD_DIR, filename);
 
    if (!filePath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json({ message: "Invalid path" }, { status: 400 });
    }
 
    if (!existsSync(filePath)) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }
 
    const stats = statSync(filePath);
    const ext = (filename.split(".").pop() || "").toLowerCase();
    // const mimeType = mime.getType(ext) || "application/octet-stream";
    // const mimeType = mime.lookup(ext) || "application/octet-stream";
 
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ message: "File type not allowed" }, { status: 403 });
    }
 
     const mimeType = mimeLookup(filename) || "application/octet-stream";
 
    const inlineExt = new Set(["pdf", "jpg", "jpeg", "png", "gif", "mp4", "webm", "mp3", "wav"]);
    const disposition = inlineExt.has(ext)
      ? `inline; filename="${encodeURIComponent(filename)}"`
      : `attachment; filename="${encodeURIComponent(filename)}"`;
 
    const nodeStream = createReadStream(filePath);
    const webStream = Readable.toWeb(nodeStream as any) as unknown as ReadableStream;
 
    const headers = new Headers();
      headers.set("Content-Type", String(mimeType));
    headers.set("Content-Length", String(stats.size));
    headers.set("Content-Disposition", disposition);
    headers.set("Cache-Control", "public, max-age=3600");
 
    return new NextResponse(webStream, { status: 200, headers });
  } catch (err: any) {
    console.error("serve file error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}