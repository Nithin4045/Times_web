// Shared types used across listofaiquestions page

export type FileType = "PDF_AI" | "VOCABULARY" | "DOCX" | "VIDEO" | "OTHER" | "FILE_JOB";

export interface FileCardBase {
  id: string;
  filename: string;
  type: FileType;
  createdAt: string; // ISO
}

/** ---------- UI types ---------- */
export type Transformation = {
  id: string;
  label?: string;
  question: string;
  options: string[];
  correctIndex: number;
  approved?: boolean;
  prompt?: string;            // prompt used to generate this transformation (optional)
  solution?: string | null;   // solution HTML/text (optional)
  applied_edits?: string[];   // normalized applied edits (optional)
  transformations?: Transformation[]; // nested transforms (optional)
};

export type PDFAIQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  transformations: Transformation[];
  approved?: boolean;
  prompt?: string;            // optional prompt for main question (if stored)
  solution?: string | null;   // optional solution for parent question
  // Tagging-specific fields
  area?: string | null;
  sub_area?: string | null;
  topic?: string | null;
  sub_topic?: string | null;
  job_id?: number;
  paper_id?: string;
  question_number?: number | null;
  direction?: string | null;
  passage?: string | null;
  notes?: string | null;
  tags?: string | null;
};

export type PDFBundle = FileCardBase & {
  type: "PDF_AI";
  filepath?: string;
  questions: PDFAIQuestion[];
  fieldMap?: Record<string, string>;
};

export type FlatQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  prompt?: string; // optional prompt for consistency
};

export type GenericBundle = FileCardBase & {
  questions: FlatQuestion[];
};

export type FileJobBundle = FileCardBase & {
  type: "FILE_JOB";
  status: string;
  jobId: number;
  errorMessage?: string;
  percentage?: number;
  input_type?: string;
};

export type FileBundle = GenericBundle | PDFBundle | FileJobBundle;

/** ---------- API shapes ---------- */
export type ApiChange = {
  id: number;
  question: string;
  options: string;        // JSON string
  correct_ans: string;
  changes: string | null; // label
  status: number | null;  // 1=approved?
  applied_edits: string | null;
  prompt?: string | null;   // prompt stored on this change row
  solution?: string | null; // solution stored on this change row
  // children/replications may be returned as nested arrays but are not typed here
};

export type ApiParent = {
  id: number;
  parent_id: number | null;
  question: string;
  options: string;          // JSON string
  correct_ans: string;
  changes: ApiChange[];     // children
  filename: string | null;
  filepath: string | null;
  createdAt: string | Date; // DB
  file_type: "PDF_AI" | string | null;
  field_map: string | null;
  applied_edits: string | null;
  status: number | null;    // 1=approved?
  deleted: number | null;
  prompt?: string | null;   // optional parent prompt
  solution?: string | null; // optional parent solution
};

/** ---------- Events from child components ---------- */
export type EditPayload = {
  clickedId: string;
  question: PDFAIQuestion;
};

export type ApprovePayload = {
  questionId: string;
  approved: boolean;
  transformationId?: string;
};

export type RegeneratePayload = {
  fileId: string;
  questionId: string;
  transformationId?: string;
  prompt: string;
  question: string;
  options: string[];
  correctAnswer: string;
  targetLabel?: string;
};
