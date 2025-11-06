"use client";

import { CheckOutlined, CloseOutlined, CopyOutlined } from "@ant-design/icons";
import {
  Button,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Switch,
} from "antd";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import type { PDFAIQuestion, PDFBundle } from "../../models/types";
import EditQuestionModal, {
  EditQuestionModalValue,
} from "../editmodal/EditQuestionModal";
import LaTeXRenderer from "@/components/LaTeXRenderer/LaTeXRenderer";
import styles from "./Replicate.module.css";

/* ---------- Helpers ---------- */
function promptFromFieldMap(
  label?: string,
  map?: Record<string, string>
): string | undefined {
  if (!label || !map) return undefined;
  const target = label.trim().toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (k.trim().toLowerCase() === target) return String(v);
  }
  return undefined;
}

/* ---------- Local types ---------- */
type ApproveTransformPayload = {
  questionId: string;
  transformationId: string;
  approved: boolean;
};

/** Safely coerce to boolean approved from mixed shapes */
function coerceApproved(input: { approved?: unknown; status?: unknown }): boolean {
  if (typeof input.approved === "boolean") return input.approved;
  if (typeof input.status === "number") return input.status === 1;
  return false;
}

/* ---------- Props ---------- */
type BaseProps =
  | { bundle: PDFBundle; bundles?: never }
  | { bundle?: never; bundles: PDFBundle[] };

type ExtraProps = {
  onToggleApprove?: (
    fileId: string,
    payload: { questionId: string; transformationId?: string; approved: boolean }
  ) => void;
  onEdit?: () => void;
  searchQuery?: string;
  onSearchQueryChange?: React.Dispatch<React.SetStateAction<string>> | ((s: string) => void);
};

type Props = BaseProps & ExtraProps;


function getUserIdFromSession(session: any): number | undefined {
  if (!session) return undefined;
  const u = (session as any).user ?? (session as any);
  if (!u) return undefined;

  // Common locations: user.id (string|number), userId, sub
  if (typeof u.id === "number") return u.id;
  if (typeof u.id === "string" && u.id.trim() !== "" && !Number.isNaN(Number(u.id))) return Number(u.id);
  if (typeof u.userId === "number") return u.userId;
  if (typeof u.userId === "string" && u.userId.trim() !== "" && !Number.isNaN(Number(u.userId))) return Number(u.userId);
  if (typeof u.sub === "string" && u.sub.trim() !== "" && !Number.isNaN(Number(u.sub))) return Number(u.sub);

  return undefined;
}

/* ---------- Utility functions ---------- */
function parseAppliedEdits(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).filter(Boolean);

  if (typeof input === "string") {
    // Try JSON parse first (stored as JSON string sometimes)
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // fallback to comma-separated
      const maybeList = input.split(",").map((s) => s.trim()).filter(Boolean);
      if (maybeList.length > 0) return maybeList;
    }
  }
  return [];
}

function makeMixedLabel(label?: string, appliedEdits?: unknown): string {
  const base = label ?? "Transformation";
  if (!base.toLowerCase().includes("mixed")) return base;
  const edits = parseAppliedEdits(appliedEdits);
  return edits.length ? `${base} (${edits.join(", ")})` : base;
}

/* ---------- Change-Concept fallback prompt ---------- */
const DEFAULT_CHANGE_CONCEPT_PROMPT =
  "Transform the original question into a new version that changes the scenario, objects, or units and alters numbers as needed while keeping the underlying core concept intact. Reframe the problem so it looks unique but still tests the same idea. Wrap the new question in a brief, natural story or situation (one to two sentences) to make it engaging, but do not change the core math or logic being tested.";

/* ---------- Component ---------- */
export default function ReplicatePage({
  bundle,
  bundles,
  onToggleApprove,
  onEdit,
  searchQuery,
  onSearchQueryChange,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  /* ---------- Normalize incoming bundles ---------- */
  const bundlesArr: PDFBundle[] = useMemo(() => {
    if (bundles && Array.isArray(bundles)) return bundles;
    return bundle ? [bundle] : [];
  }, [bundle, bundles]);

  /* ---------- Shape questions with source metadata ---------- */
  type QWithSource = PDFAIQuestion & {
    _fileId: string;
    _filename: string;
    _fieldMap?: Record<string, string>;
    status?: number;
    approved?: boolean;
  };

  const allQuestions: QWithSource[] = useMemo(() => {
    const out: QWithSource[] = [];
    for (const b of bundlesArr) {
      if (b.questions && Array.isArray(b.questions)) {
        for (const q of b.questions) {
          const qAny = q as any;
          out.push({
            ...q,
            id: String(q.id),
            transformations:
              (q.transformations ?? []).map((tr: any) => ({
                approved: typeof tr?.approved === "boolean" ? tr.approved : false,
                ...tr,
                id: String(tr.id),
              })) ?? [],
            _fileId: b.id,
            _filename: b.filename,
            _fieldMap: b.fieldMap,
            status: typeof qAny?.status === "number" ? qAny.status : undefined,
            approved: typeof qAny?.approved === "boolean" ? qAny.approved : undefined,
          });
        }
      }
    }
    return out;
  }, [bundlesArr]);

  /* ---------- LOCAL QUESTIONS CACHE (render source) ---------- */
  const [qList, setQList] = useState<QWithSource[]>([]);
  useEffect(() => {
    setQList(allQuestions);
  }, [allQuestions]);

  /* ---------- Search filtering ---------- */
  const filteredQuestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === "") {
      return qList;
    }

    const query = searchQuery.toLowerCase().trim();
    return qList.filter((q) => {
      if ((q.question ?? "").toLowerCase().includes(query)) return true;
      if ((q.options ?? []).some((opt) => opt.toLowerCase().includes(query))) return true;
      if ((q.transformations ?? []).some((t) =>
        (t.question ?? "").toLowerCase().includes(query) ||
        ((t.options ?? []) as string[]).some(opt => opt.toLowerCase().includes(query)) ||
        ((t.label ?? "") as string).toLowerCase().includes(query)
      )) return true;
      if ((q._filename ?? "").toLowerCase().includes(query)) return true;
      return false;
    });
  }, [qList, searchQuery]);

  /* ---------- Expand/collapse per question ---------- */
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const toggleOpen = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /* ---------- Expand/collapse for transformations (nested) ---------- */
  const [openTransformIds, setOpenTransformIds] = useState<Set<string>>(new Set());
  const toggleTransformOpen = (id: string) =>
    setOpenTransformIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /* ---------- Optimistic approvals for transforms ---------- */
  const [tApprove, setTApprove] = useState<Record<string, boolean>>({});
  const tKey = (fileId: string, qId: string, trId: string) => `${fileId}::${qId}::${trId}`;
  useEffect(() => {
    setTApprove({});
  }, [bundlesArr.length]);

  /* ---------- Optimistic approvals for MAIN questions ---------- */
  const [qApprove, setQApprove] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const q of allQuestions) next[q.id] = coerceApproved(q);
    setQApprove(next);
  }, [allQuestions]);

  /* ---------- Edit modal state ---------- */
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editInitial, setEditInitial] =
    useState<Partial<EditQuestionModalValue>>();

  /* ---------- Solution modal state ---------- */
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [solutionHtml, setSolutionHtml] = useState<string | null>(null);
  const [solutionTitle, setSolutionTitle] = useState<string>("");

  /* ---------- Generate modal state ---------- */
  const [genOpen, setGenOpen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genPromptMode, setGenPromptMode] = useState<"change_concept" | "custom">("custom");
  const [genPromptText, setGenPromptText] = useState<string>("");
  const [genCount, setGenCount] = useState<number>(1);

  // store current context for modal (which q and t launched it)
  const [genContext, setGenContext] = useState<{
    fileId: string;
    qId: string;
    tId: string;
    instructionDefault: string;
    changeConceptDefault: string;
    promptDefault: string; // <- new: transformation.prompt or instructionDefault
    questionText: string;
    options: string[];
    correctAnswer: string;
  } | null>(null);

  // Open generate modal with computed defaults
  const openGenerateModal = (params: {
    fileId: string;
    q: QWithSource;
    t: any;
  }) => {
    const { fileId, q, t } = params;
    const labelInstr = promptFromFieldMap(t.label, q._fieldMap) ?? (t.label ?? "Apply a transformation.");
    const changeConceptInstr =
      promptFromFieldMap("Change Concept", q._fieldMap) ?? DEFAULT_CHANGE_CONCEPT_PROMPT;

    // transformation-level prompt (if transformation has .prompt use it, else fallback to labelInstr)
    const tPrompt = (typeof t?.prompt === "string" && t.prompt.trim()) ? t.prompt : labelInstr;

    setGenContext({
      fileId,
      qId: q.id,
      tId: t.id,
      instructionDefault: labelInstr,
      changeConceptDefault: changeConceptInstr,
      promptDefault: tPrompt,
      // Use the clicked transformation's question if present; fallback to main question
      questionText: (typeof t?.question === "string" && t.question.trim()) ? t.question : q.question,
      // Prefer transformation options if available; else main question options
      options: Array.isArray(t?.options) ? (t.options as string[]).slice(0, 4) : (q.options?.slice(0, 4) ?? []),
      // Compute correct answer from the selected source
      correctAnswer: (() => {
        const sourceOpts = Array.isArray(t?.options) ? (t.options as string[]) : (q.options ?? []);
        const idx = (t as any)?.correctIndex ?? (q as any)?.correctIndex ?? 0;
        return sourceOpts?.[idx] ?? "";
      })(),
    });

    // default mode: custom (pre-fill with transformation prompt if present)
    setGenPromptMode("custom");
    setGenPromptText(tPrompt);
    setGenCount(1);
    setGenOpen(true);
  };

  // Close modal & reset small state
  const closeGenerateModal = () => {
    setGenOpen(false);
    setGenLoading(false);
  };

  /* ================= API helpers ================= */

  async function patchAiQuestion(
    id: string | number,
    body: Record<string, any>
  ) {
    const res = await fetch(`/api/palms/aiquestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Update failed (${res.status})`);
    }
    return res.json();
  }

  /* ---------- Approve handlers ---------- */

  // Main question toggle (optimistic)
  const handleApproveMain = async (qId: string, approved: boolean) => {
    setQApprove((prev) => ({ ...prev, [qId]: approved }));
    try {
      await patchAiQuestion(qId, { status: approved ? 1 : 0 });
      setQList((prev) =>
        prev.map((q) =>
          q.id === qId ? { ...q, status: approved ? 1 : 0, approved } : q
        )
      );
      onToggleApprove?.("", { questionId: qId, approved });
    } catch (e: any) {
      setQApprove((prev) => ({ ...prev, [qId]: !approved }));
      message.error(e.message || "Failed to update approval");
    }
  };

  // Transformation toggle (optimistic)
  const handleApproveTransform = async (
    p: ApproveTransformPayload,
    fileId: string
  ) => {
    const key = tKey(fileId, p.questionId, p.transformationId);
    setTApprove((prev) => ({ ...prev, [key]: p.approved }));

    try {
      await patchAiQuestion(p.transformationId, { status: p.approved ? 1 : 0 });
      setQList((prev) =>
        prev.map((q) =>
          q.id !== p.questionId
            ? q
            : {
                ...q,
                transformations: q.transformations.map((t: any) =>
                  String(t.id) === String(p.transformationId)
                    ? { ...t, approved: p.approved, status: p.approved ? 1 : 0 }
                    : t
                ),
              }
        )
      );
      onToggleApprove?.(fileId, {
        questionId: p.questionId,
        transformationId: p.transformationId,
        approved: p.approved,
      });
    } catch (e: any) {
      setTApprove((prev) => ({ ...prev, [key]: !p.approved }));
      message.error(e.message || "Failed to update transformation");
    }
  };

  /* ---------- Edit handlers ---------- */

  const openEditForMain = (q: QWithSource) => {
    setEditInitial({
      questionId: q.id,
      question: q.question,
      options: [
        q.options[0] ?? "",
        q.options[1] ?? "",
        q.options[2] ?? "",
        q.options[3] ?? "",
      ],
      correctIndex: (q as any).correctIndex ?? 0,
    });
    setEditOpen(true);
    onEdit?.();
  };

  const openEditForTransform = (
    q: QWithSource,
    t: (QWithSource["transformations"])[number]
  ) => {
    setEditInitial({
      questionId: q.id,
      transformationId: t.id,
      question: t.question,
      options: [
        (t.options ?? [])[0] ?? "",
        (t.options ?? [])[1] ?? "",
        (t.options ?? [])[2] ?? "",
        (t.options ?? [])[3] ?? "",
      ],
      correctIndex: (t as any).correctIndex ?? 0,
    });
    setEditOpen(true);
    onEdit?.();
  };

  const handleSaveEdit = async (val: EditQuestionModalValue) => {
    setEditLoading(true);
    try {
      const payload: any = {
        question: val.question,
        options: [val.options[0], val.options[1], val.options[2], val.options[3]],
        correctIndex: val.correctIndex,
        changes: val.transformationId
          ? "Edited transformation content"
          : "Edited main question content",
      };

      const targetId = val.transformationId ?? val.questionId;
      await patchAiQuestion(targetId, payload);

      // reflect locally
      if (val.transformationId) {
        setQList((prev) =>
          prev.map((q) =>
            q.id !== val.questionId
              ? q
              : {
                  ...q,
                  transformations: q.transformations.map((t: any) =>
                    String(t.id) === String(val.transformationId)
                      ? {
                          ...t,
                          question: val.question,
                          options: [
                            val.options[0],
                            val.options[1],
                            val.options[2],
                            val.options[3],
                          ],
                          correctIndex: val.correctIndex,
                        }
                      : t
                  ),
                }
          )
        );
      } else {
        setQList((prev) =>
          prev.map((q) =>
            q.id === val.questionId
              ? {
                  ...q,
                  question: val.question,
                  options: [
                    val.options[0],
                    val.options[1],
                    val.options[2],
                    val.options[3],
                  ],
                  correctIndex: val.correctIndex,
                }
              : q
          )
        );
      }

      message.success("Saved changes");
      setEditOpen(false);
    } catch (e: any) {
      message.error(e.message || "Failed to save");
    } finally {
      setEditLoading(false);
    }
  };

  /* ---------- Copy helper ---------- */
  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success("Prompt copied to clipboard");
    } catch {
      message.error("Failed to copy");
    }
  };

  /* ---------- Generate modal submit ---------- */
  const handleGenerateConfirm = async () => {
    if (!genContext) return;
    const prompt =
      genPromptMode === "change_concept"
        ? genContext.changeConceptDefault
        : genPromptText?.trim();

    if (!prompt) {
      message.error("Prompt cannot be empty");
      return;
    }

    setGenLoading(true);
    try {
      const userId = getUserIdFromSession(session);
      const count = Math.max(1, Math.min(5, Math.floor(Number(genCount) || 1)));
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const changeKey = genPromptMode === "change_concept" ? `Change Concept — ${stamp}` : `Custom Prompt — ${stamp}`;
      
      // Find the question to get paper_id from filename
      const targetQuestion = qList.find(q => q.id === genContext.qId);
      const paperId = targetQuestion?._filename || "";
      
      const payload = {
        question_id: genContext.tId || genContext.qId,
        question: genContext.questionText,
        count,
        prompt,
        user_id: userId,
        change_key: changeKey,
        paper_id: paperId,
        original_question_id: genContext.qId,
      };
      
      console.log("🔧 Generate payload:", { 
        question_id: payload.question_id, 
        paper_id: payload.paper_id,
        original_question_id: payload.original_question_id,
        count: payload.count 
      });
      const resp = await fetch("/api/palms_db/custom_prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok || !Array.isArray(data.replications)) {
        message.error(data?.error || data?.detail || "Regeneration failed");
        setGenLoading(false);
        return;
      }
      
      console.log("✅ Generated transformations:", {
        count: data.replications.length,
        replications: data.replications,
        targetQuestionId: genContext.qId,
        targetTransformationId: genContext.tId,
        isNestedGeneration: !!genContext.tId
      });
      
      // Update local state with new transformation(s)
      // We need to add the new transformations to the correct parent (could be main question or a transformation)
      const parentId = genContext.tId || genContext.qId; // If tId exists, we're generating from a transformation
      
      setQList((prev) =>
        prev.map((q) => {
          if (q.id !== genContext.qId) return q;
          
          // If we're generating from the main question (no tId)
          if (!genContext.tId) {
            return {
              ...q,
              transformations: [
                ...q.transformations,
                ...data.replications.map((rep: any, idx: number) => ({
                  id: String(rep.id || `t-${Date.now()}-${idx}`), // Use database ID if available
                  label: rep.key || genContext.promptDefault || "Generated",
                  question: rep.question,
                  options: rep.options,
                  correctIndex: rep.options && rep.answer ? rep.options.findIndex((o: string) => o === rep.answer) : 0,
                  solution: rep.solution ?? null,
                  approved: false,
                  applied_edits: rep.key ? [rep.key] : undefined,
                  prompt: rep.prompt || undefined,
                })),
              ],
            };
          }
          
          // If we're generating from a transformation, we need to find it recursively and add children
          const addToTransformation = (transformations: any[]): any[] => {
            return transformations.map(t => {
              // Found the target transformation (compare as strings to handle type mismatch)
              if (String(t.id) === String(genContext.tId)) {
                console.log(`🎯 Found target transformation with id=${t.id}, adding ${data.replications.length} new transformations`);
                const newTransformations = data.replications.map((rep: any, idx: number) => {
                  const newT = {
                    id: String(rep.id || `t-${Date.now()}-${idx}`), // Use database ID if available
                    label: rep.key || rep.applied_edits || genContext.promptDefault || "Generated",
                    question: rep.question,
                    options: rep.options,
                    correctIndex: rep.options && rep.answer ? rep.options.findIndex((o: string) => o === rep.answer) : (rep.options && rep.correct_ans ? rep.options.findIndex((o: string) => o === rep.correct_ans) : 0),
                    solution: rep.solution ?? null,
                    approved: false,
                    applied_edits: rep.key || rep.applied_edits ? [rep.key || rep.applied_edits] : undefined,
                    prompt: rep.prompt || undefined,
                    transformations: [], // Initialize empty transformations array for new items
                  };
                  console.log(`  ➕ Adding new transformation: id=${newT.id}, label=${newT.label}`);
                  return newT;
                });
                
                return {
                  ...t,
                  transformations: [
                    ...(t.transformations || []),
                    ...newTransformations,
                  ],
                };
              }
              
              // Recursively search in nested transformations
              if (t.transformations && t.transformations.length > 0) {
                const updatedTransformations = addToTransformation(t.transformations);
                // Only update if something changed (optimization)
                if (updatedTransformations !== t.transformations) {
                  return {
                    ...t,
                    transformations: updatedTransformations,
                  };
                }
              }
              
              return t;
            });
          };
          
          return {
            ...q,
            transformations: addToTransformation(q.transformations),
          };
        })
      );
      message.success(`Generated ${data.replications.length} transformation${data.replications.length > 1 ? "s" : ""}`);
      
      // ✅ Auto-expand the parent transformation to show the new nested transformations
      if (genContext.tId) {
        setOpenTransformIds((prev) => new Set([...prev, String(genContext.tId)]));
        console.log(`🔓 Auto-expanded transformation id=${genContext.tId} to show new nested transformations`);
      }
      
      setGenOpen(false);
      try {
        router.refresh();
      } catch {}
    } catch (e: any) {
      console.error("Regenerate failed", e);
      message.error(e?.message || "Regeneration failed");
    } finally {
      setGenLoading(false);
    }
  };

  /* ---------- Solution modal helpers ---------- */
  const openSolutionModal = (html: string | undefined | null, title?: string) => {
    setSolutionHtml(html ?? null);
    setSolutionTitle(title ?? "Solution");
    setSolutionOpen(true);
  };
  const closeSolutionModal = () => {
    setSolutionOpen(false);
    setSolutionHtml(null);
    setSolutionTitle("");
  };

  /* ---------- Render helpers (recursive for nested transforms) ---------- */

  function renderTransformCard(
    q: QWithSource,
    t: any,
    nesting: number = 0
  ): React.ReactElement {
    const instruction =
      promptFromFieldMap(t.label, q._fieldMap) ?? (t.label ?? "Apply a transformation.");
    const key = tKey(q._fileId, q.id, t.id);
    const checked = tApprove[key] ?? Boolean(t.approved);
    const nestedTransforms: any[] = Array.isArray(t.transformations) ? t.transformations : [];

    return (
      <div
        key={`tr-${t.id}`}
        className={styles.transformCard}
        style={{ marginLeft: nesting * 12 }}
      >
        <div className={styles.transformHeader}>
          <span className={styles.transformLabel}>
            {makeMixedLabel(t.label, t.applied_edits ?? t.appliedEdits)}
          </span>

          <div className={styles.actionBar}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => openEditForTransform(q, t)}
              title="Edit"
            >
              Edit
            </button>

            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => openGenerateModal({ fileId: q._fileId, q, t })}
              title="Generate"
            >
              Generate
            </button>

            {/* Solution button (present always, disabled if no solution) */}
            <Button
              size="small"
              onClick={() => openSolutionModal(t.solution, `Solution — ${t.label ?? "Transformation"}`)}
              disabled={!t.solution}
              style={{ marginRight: 8 }}
            >
              Solution
            </Button>

            <Switch
              checked={checked}
              checkedChildren={<CheckOutlined />}
              unCheckedChildren={<CloseOutlined />}
              onChange={(approved) => {
                setTApprove((prev) => ({ ...prev, [key]: approved }));
                handleApproveTransform(
                  { questionId: q.id, transformationId: t.id, approved },
                  q._fileId
                );
              }}
            />
          </div>
        </div>

        <LaTeXRenderer 
          content={t.question || ''}
          className={styles.transformQuestion}
        />

        <ul className={styles.optionsList}>
          {(t.options ?? []).slice(0, 4).map((opt: string, i: number) => {
            const isCorrect = i === (t.correctIndex ?? 0);
            return (
              <li
                key={i}
                className={`${styles.optionItem} ${isCorrect ? styles.correctOption : ""}`}
              >
                <span className={styles.optionIndex}>{String.fromCharCode(65 + i)}.</span>
                <LaTeXRenderer 
                  content={opt || ''}
                  className={styles.optionText}
                  inline
                />
              </li>
            );
          })}
        </ul>

        {nestedTransforms.length > 0 && (
          <>
            <button
              className={styles.collapseToggle}
              onClick={() => toggleTransformOpen(String(t.id))}
              aria-expanded={openTransformIds.has(String(t.id))}
              aria-controls={`body-tr-${t.id}`}
              type="button"
              style={{ marginTop: 8 }}
            >
              <span className={styles.caret}>
                {openTransformIds.has(String(t.id)) ? "▾" : "▸"}
              </span>
              <span className={styles.toggleText}>
                {openTransformIds.has(String(t.id))
                  ? `Hide  transformations (${nestedTransforms.length})`
                  : `Show transformations (${nestedTransforms.length})`}
              </span>
            </button>

            {openTransformIds.has(String(t.id)) && (
              <div id={`body-tr-${t.id}`} style={{ marginTop: 8 }}>
                {nestedTransforms.map((nt) => renderTransformCard(q, nt, nesting + 1))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  /* ================= Render ================= */
  return (
    <div>
      {/* Search results info */}
      {searchQuery && searchQuery.trim() !== "" && (
        <div
          style={{
            marginBottom: 16,
            padding: "8px 12px",
            background: "var(--primary-50)",
            border: "1px solid var(--primary-100)",
            borderRadius: 8,
            fontSize: "0.875rem",
            color: "var(--primary)",
          }}
        >
          Found {filteredQuestions.length} question
          {filteredQuestions.length !== 1 ? "s" : ""} matching "{searchQuery}"
        </div>
      )}

      {filteredQuestions.map((q, idx) => {
        const open = openIds.has(q.id);
        const originalIndex = qList.findIndex((originalQ) => originalQ.id === q.id);
        const questionNumber = originalIndex + 1;

        const presentLabels = new Set(
          (q.transformations ?? [])
            .map((t) => (t.label ?? "").trim())
            .filter(Boolean)
            .map((s) => s.toLowerCase())
        );

        const missingEntries = q._fieldMap
          ? Object.entries(q._fieldMap).filter(
              ([key]) => !presentLabels.has(key.trim().toLowerCase())
            )
          : [];

        const mainCorrectAnswer = (q.options ?? [])[ (q as any).correctIndex ?? 0 ] ?? "";

        return (
          <article
            key={`${q._fileId}:${q.id}`}
            className="questionCard"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 14,
              marginBottom: 12,
              boxShadow: "var(--shadow)",
              borderLeft: "4px solid var(--primary)",
            }}
          >
            {/* Header */}
            <div className={styles.transformHeader} style={{ gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, letterSpacing: 0.2 }}>Q{questionNumber}</span>

              <div className={styles.actionBar}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => openEditForMain(q)}
                  title="Edit"
                >
                  Edit
                </button>

                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => openGenerateModal({ 
                    fileId: q._fileId, 
                    q, 
                    t: { 
                      id: `main-${q.id}`, 
                      question: q.question, 
                      options: q.options,
                      label: "Main Question",
                      prompt: null
                    } 
                  })}
                  title="Generate"
                >
                  Generate
                </button>

                <Button
                  size="small"
                  onClick={() => openSolutionModal(q.solution, `Solution — Main question`)}
                  disabled={!q.solution}
                  style={{ marginRight: 8 }}
                >
                  Solution
                </Button>

                <Switch
                  checked={qApprove[q.id] ?? coerceApproved(q)}
                  checkedChildren={<CheckOutlined />}
                  unCheckedChildren={<CloseOutlined />}
                  onChange={(approved) => handleApproveMain(q.id, approved)}
                />
              </div>
            </div>

            {/* Main question */}
            <LaTeXRenderer 
              content={q.question || ''}
              className={styles.transformQuestion}
            />

            <ul className={styles.optionsList}>
              {(q.options ?? []).slice(0, 4).map((opt, i) => {
                const isCorrect = i === ((q as any).correctIndex ?? 0);
                return (
                  <li
                    key={i}
                    className={`${styles.optionItem} ${isCorrect ? styles.correctOption : ""}`}
                  >
                    <span className={styles.optionIndex}>{String.fromCharCode(65 + i)}.</span>
                    <LaTeXRenderer 
                      content={opt || ''}
                      className={styles.optionText}
                      inline
                    />
                  </li>
                );
              })}
            </ul>

            {/* Expand/collapse */}
            <button
              className={styles.collapseToggle}
              onClick={() => toggleOpen(q.id)}
              aria-expanded={open}
              aria-controls={`body-${q._fileId}-${q.id}`}
              type="button"
            >
              <span className={styles.caret}>{open ? "▾" : "▸"}</span>
              <span className={styles.toggleText}>
                {open ? `Hide transformations (${(q.transformations ?? []).length})` : `Show transformations (${(q.transformations ?? []).length})`}
              </span>
            </button>

            {/* Body */}
            {open && (
              <div id={`body-${q._fileId}-${q.id}`} className={styles.collapseBody}>
                {/* Existing transforms */}
                {(q.transformations ?? []).map((t: any) => renderTransformCard(q, t, 0))}

                {/* Missing transforms block is still commented out as in your original */}
              </div>
            )}
          </article>
        );
      })}

      {/* Single instance of the Edit modal */}
      <EditQuestionModal
        open={editOpen}
        loading={editLoading}
        initial={editInitial}
        onCancel={() => setEditOpen(false)}
        onSave={handleSaveEdit}
      />

      {/* Generate modal */}
      <Modal
        title="Generate / Regenerate"
        open={genOpen}
        onCancel={() => closeGenerateModal()}
        footer={null}
        destroyOnHidden
      >
        {genContext ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Radio.Group
                onChange={(e) => {
                  const val = e.target.value as "change_concept" | "custom";
                  setGenPromptMode(val);
                  if (val === "change_concept") {
                    setGenPromptText(genContext.changeConceptDefault || "");
                  } else {
                    setGenPromptText(genContext.promptDefault || genContext.instructionDefault || "");
                  }
                }}
                value={genPromptMode}
              >
                <Radio value="custom">Custom prompt</Radio>
                <Radio value="change_concept">Change Concept (locked)</Radio>
              </Radio.Group>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Prompt</label>
              <Input.TextArea
                rows={6}
                value={genPromptText}
                onChange={(e) => setGenPromptText(e.target.value)}
                disabled={genPromptMode === "change_concept"}
                placeholder="Enter prompt to use for generation"
              />
              {genPromptMode === "change_concept" && (
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyToClipboard(genContext.changeConceptDefault || "")}
                  >
                    Copy Change Concept prompt
                  </Button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Count (max 5)</label>
              <InputNumber
                min={1}
                max={5}
                value={genCount}
                onChange={(v) => setGenCount(Math.max(1, Math.min(5, Number(v) || 1)))}
              />
              <div style={{ marginTop: 6, color: "var(--muted)" }}>
                Number of requests to send (calls onRegenerate this many times). Max 5.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => closeGenerateModal()}>Cancel</Button>
              <Button type="primary" loading={genLoading} onClick={() => handleGenerateConfirm()}>
                Generate
              </Button>
            </div>
          </div>
        ) : (
          <div>Preparing…</div>
        )}
      </Modal>

      {/* Solution modal */}
      <Modal
        title={solutionTitle}
        open={solutionOpen}
        onCancel={() => closeSolutionModal()}
        footer={[
          <Button key="close" onClick={() => closeSolutionModal()}>
            Close
          </Button>,
        ]}
        width={800}
        destroyOnHidden
      >
        {solutionHtml ? (
          <LaTeXRenderer 
            content={solutionHtml}
            className={styles.solutionHtml}
          />
        ) : (
          <div style={{ color: "var(--muted)" }}>No solution available.</div>
        )}
      </Modal>
    </div>
  );
}
