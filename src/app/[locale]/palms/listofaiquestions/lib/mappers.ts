import { ApiParent, PDFAIQuestion, PDFBundle, Transformation } from "../models/types";

function toArraySafe(jsonLike: unknown): string[] {
  if (Array.isArray(jsonLike)) return (jsonLike as any).map(String);
  if (typeof jsonLike === "string") {
    try {
      const arr = JSON.parse(jsonLike);
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch {
      return jsonLike
        .split(/[,\n;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function correctIndexFrom(options: string[], correctAns: string): number {
  const idx = options.findIndex(
    (o) => String(o).trim().toLowerCase() === String(correctAns).trim().toLowerCase()
  );
  return idx >= 0 ? idx : 0;
}

function deriveFilename(filename?: string | null, filepath?: string | null) {
  if (filename && filename.trim()) return filename.trim();
  if (filepath && filepath.includes("/")) {
    const last = filepath.split("/").pop()!;
    return last || "unknown.pdf";
  }
  return "unknown.pdf";
}

function parseFieldMap(fieldMap: string | null): Record<string, string> | undefined {
  if (!fieldMap) return undefined;
  try {
    const obj = JSON.parse(fieldMap);
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) out[String(k)] = String(v);
    return out;
  } catch {
    return undefined;
  }
}

/**
 * Normalize applied_edits coming from the API into string[] | undefined
 * Accepts:
 *  - null -> undefined
 *  - string[] -> returned as string[]
 *  - JSON string of array -> parsed
 *  - comma/semicolon/newline separated string -> split into parts
 */
function normalizeAppliedEdits(raw: unknown): string[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return undefined;
    // Try parse JSON array first
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // not JSON - continue to split
    }
    // split on common separators
    const parts = s
      .split(/[;,|\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length ? parts : undefined;
  }
  // If it's some other primitive, coerce to string and return single-item array
  try {
    const coerced = String(raw).trim();
    return coerced ? [coerced] : undefined;
  } catch {
    return undefined;
  }
}

export function mapApiToBundles(apiParents: ApiParent[]): PDFBundle[] {
  if (!Array.isArray(apiParents)) return [];
  const bundles: PDFBundle[] = apiParents.map((p) => {
    const parentOptions = toArraySafe(p.options);
    const question: PDFAIQuestion = {
      id: String(p.id),
      question: p.question,
      options: parentOptions,
      correctIndex: correctIndexFrom(parentOptions, p.correct_ans),
      approved: p.status === 1,
      transformations: (p.changes || []).map<Transformation>((t) => {
        const tOpts = toArraySafe(t.options);
        return {
          id: String(t.id),
          label: t.changes ?? undefined,
          question: t.question,
          options: tOpts,
          correctIndex: correctIndexFrom(tOpts, t.correct_ans),
          approved: t.status === 1,
          applied_edits: normalizeAppliedEdits((t as any).applied_edits),
        };
      }),
    };

    return {
      id: String(p.id),
      filename: deriveFilename(p.filename, p.filepath),
      filepath: p.filepath ?? undefined,
      type: "PDF_AI",
      createdAt: new Date(p.createdAt as any).toISOString(),
      questions: [question],
      fieldMap: parseFieldMap(p.field_map),
    };
  });

  return bundles;
}
