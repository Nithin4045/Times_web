import type { FileBundle } from "../models/types";

/** One source of truth for grouping files by their original source */
export const getGroupKey = (f: FileBundle) => {
  // For job-based bundles (from replicated_questions), use the bundle ID directly
  if (f.id && f.id.startsWith("job-")) {
    return f.id;
  }
  
  // For legacy filepath-based bundles
  return f.type === "PDF_AI" && "filepath" in f && f.filepath
    ? (f.filepath as string)
    : `__no_path__/${f.filename}`;
};
