// app/api/admin/materials/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// You can keep/enjoy TS typing with these imports, but DO NOT use them in runtime validations.
// import { MaterialType, MaterialStorage } from "@prisma/client";

// --- Safe, runtime-constant allowlists ---
const ALLOWED_TYPES = ["pdf", "image"] as const;
const ALLOWED_STORAGE = ["URL", "PATH"] as const;
type MaterialType = typeof ALLOWED_TYPES[number];
type MaterialStorage = typeof ALLOWED_STORAGE[number];

const getStr = (fd: FormData, key: string): string | null => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : null;
};
const toInt = (v: string | null) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};

export async function GET() {
  try {
    const rows = await prisma.materials.findMany({ orderBy: { created_at: "desc" } });
    return NextResponse.json({ success: true, count: rows.length, data: rows }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/materials error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();

    const title = getStr(fd, "title");
    const description = getStr(fd, "description");
    const typeRaw = getStr(fd, "type");       // "pdf" | "image"
    const storageRaw = getStr(fd, "storage"); // "URL" | "PATH"
    const url = getStr(fd, "url");
    const path = getStr(fd, "path");
    const mime = getStr(fd, "mime");
    const file_ext = getStr(fd, "file_ext");
    const size_bytes_raw = getStr(fd, "size_bytes");
    const created_by_raw = getStr(fd, "created_by");
    const updated_by_raw = getStr(fd, "updated_by");

    if (!title || !typeRaw || !storageRaw || !created_by_raw) {
      return NextResponse.json(
        { success: false, error: "title, type, storage, created_by are required" },
        { status: 400 }
      );
    }

    // Validate enums via literal arrays (no Object.values on possibly-undefined objects)
    if (!ALLOWED_TYPES.includes(typeRaw as any)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    if (!ALLOWED_STORAGE.includes(storageRaw as any)) {
      return NextResponse.json(
        { success: false, error: `Invalid storage. Allowed: ${ALLOWED_STORAGE.join(", ")}` },
        { status: 400 }
      );
    }

    // Narrow types for TS after validation
    const type = typeRaw as MaterialType;
    const storage = storageRaw as MaterialStorage;

    const created_by = toInt(created_by_raw);
    const updated_by = updated_by_raw ? toInt(updated_by_raw) : null;
    if (created_by === null || Number.isNaN(created_by)) {
      return NextResponse.json({ success: false, error: "created_by must be a valid integer" }, { status: 400 });
    }
    if (updated_by_raw && (updated_by === null || Number.isNaN(updated_by))) {
      return NextResponse.json({ success: false, error: "updated_by must be a valid integer" }, { status: 400 });
    }

    const size_bytes = size_bytes_raw ? toInt(size_bytes_raw) : null;
    if (size_bytes_raw && (size_bytes === null || Number.isNaN(size_bytes))) {
      return NextResponse.json({ success: false, error: "size_bytes must be an integer" }, { status: 400 });
    }

    // Require url/path according to storage
    if (storage === "URL" && !url) {
      return NextResponse.json({ success: false, error: "url is required when storage=URL" }, { status: 400 });
    }
    if (storage === "PATH" && !path) {
      return NextResponse.json({ success: false, error: "path is required when storage=PATH" }, { status: 400 });
    }

    const created = await prisma.materials.create({
      data: {
        title,
        description: description ?? undefined,
        // type: type as any,           // Prisma enum will accept "pdf" | "image"
        storage: storage as any,     // Prisma enum will accept "URL" | "PATH"
        url: url ?? undefined,
        path: path ?? undefined,
        // mime: mime ?? undefined,
        // file_ext: file_ext ?? undefined,
        size_bytes: size_bytes ?? undefined,
        created_by,
        updated_by: updated_by ?? undefined,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/materials error", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
