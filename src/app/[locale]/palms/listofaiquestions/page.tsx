"use client";

import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import LeftRail, { FileJob } from "./components/LeftRail/LeftRail";
import RightPane from "./components/RightPane/RightPane";
import type { TranslatedQuestion } from "./components/Translation/Translation";
import {
  ApprovePayload,
  PDFBundle,
  PDFAIQuestion,
  RegeneratePayload,
} from "./models/types";
import styles from "./page.module.css";

function safeParseOptions(raw: unknown): string[] {
  if (raw === undefined || raw === null) return [];
  if (Array.isArray(raw)) return raw.map((s) => String(s));
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s));
    } catch {
      // ignore
    }
    const separators = [",", "|", ";", "\n"];
    for (const sep of separators) {
      if (raw.includes(sep)) {
        return raw
          .split(sep)
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    return [raw];
  }
  return [String(raw)];
}

function getCorrectIndexFromOptions(options: string[], correctAns?: string | null) {
  if (!options || options.length === 0) return 0;
  if (correctAns === undefined || correctAns === null) return 0;
  const idx = options.findIndex((o) => String(o).trim() === String(correctAns).trim());
  return idx >= 0 ? idx : 0;
}

function mapTransformationNode(node: any, parentKey: string): any {
  const options = safeParseOptions(node.options ?? []);
  const correctIndex =
    typeof node.correctIndex === "number"
      ? node.correctIndex
      : getCorrectIndexFromOptions(options, node.correct_ans ?? node.answer ?? node.correctAns);

  const childNodes = Array.isArray(node.transformations)
    ? node.transformations.map((child: any, idx: number) =>
        mapTransformationNode(child, `${parentKey}-${idx}`))
    : undefined;

  return {
    id: String(node.id ?? `${parentKey}`),
    label: node.label ?? node.applied_edits ?? node.key ?? "Transformation",
    question: String(node.question ?? ""),
    options,
    correctIndex,
    approved: Boolean(node.approved),
    applied_edits: node.applied_edits,
    solution: node.solution ?? null,
    prompt: node.prompt ?? undefined,
    transformations: childNodes && childNodes.length > 0 ? childNodes : undefined,
  };
}

function mapReplicateQuestions(rawQuestions: any[]): PDFAIQuestion[] {
  return rawQuestions.map((q, index) => {
    const options = safeParseOptions(q.options ?? []);
    const correctIndex =
      typeof q.correctIndex === "number"
        ? q.correctIndex
        : getCorrectIndexFromOptions(options, q.correct_ans ?? q.answer);

    const transformations = Array.isArray(q.transformations)
      ? q.transformations.map((t: any, tIndex: number) =>
          mapTransformationNode(t, `${index}-${tIndex}`))
      : undefined;

    return {
      id: String(q.question_id ?? q.id ?? `replicate-${index}`),
      question: String(q.question ?? ""),
      options,
      correctIndex,
      transformations,
      approved: Boolean(q.approved),
      solution: q.solution ?? null,
      prompt: q.prompt ?? null,
    };
  });
}

type ParsedRequestData = {
  paper_id?: string;
  paperId?: string;
};

const noopSetString: React.Dispatch<React.SetStateAction<string>> = () => {};
const noop = () => {};

export default function Page() {
  const { data: session } = useSession();
  const userId = (session as any)?.user?.id as number | undefined;

  const [jobs, setJobs] = useState<FileJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobSearch, setJobSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<FileJob | null>(null);

  const [bundles, setBundles] = useState<PDFBundle[]>([]);
  const [selectedTagType, setSelectedTagType] = useState<string | null>(null);
  const [translationData, setTranslationData] = useState<{ paperId: string; questions: TranslatedQuestion[] } | null>(null);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [questionSearch, setQuestionSearch] = useState("");
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const fetchJobs = useCallback(
    async (signal?: AbortSignal) => {
      if (!userId) {
        setJobs([]);
        setJobsLoading(false);
        setJobsError(null);
        return;
      }

      try {
        setJobsLoading(true);
        setJobsError(null);
        const url = `/api/filejobs?user_id=${encodeURIComponent(userId)}`;
        
        const res = await fetch(url, {
          cache: "no-store",
          signal,
        });
        
        if (!res.ok) {
          throw new Error(`Failed with ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log('📦 Jobs fetched:', {
          count: data?.length,
          jobs: data?.map((j: any) => ({ 
            id: j.id, 
            fileName: j.fileName, 
            input_type: j.input_type, 
            status: j.status,
            request_data: j.request_data
          }))
        });
        setJobs(data || []);
      } catch (error: any) {
        if (error?.name === "AbortError") {
          return;
        }
        setJobsError(error?.message || "Unable to load jobs");
      } finally {
        setJobsLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchJobs(controller.signal);
    return () => controller.abort();
  }, [fetchJobs]);

  useEffect(() => {
    if (!jobs.length || !fetchJobs) return;
    const hasProcessing = jobs.some((job) => {
      const status = (job.status || "").toLowerCase();
      return status !== "completed" && status !== "success" && status !== "finished" && status !== "failed";
    });
    if (!hasProcessing) return;

    const interval = setInterval(() => fetchJobs(), 5000);
    return () => clearInterval(interval);
  }, [fetchJobs, jobs]);

  const parseRequestData = (job: FileJob): ParsedRequestData => {
    if (!job.request_data) return {};
    try {
      return JSON.parse(job.request_data) as ParsedRequestData;
    } catch {
      return {};
    }
  };

  const loadTranslationJob = useCallback(
    async (job: FileJob, initialPaperId?: string | null): Promise<string> => {
      console.log('🔍 loadTranslationJob called:', { 
        jobId: job.id, 
        initialPaperId, 
        fileName: job.fileName 
      });
      
      let resolved = (initialPaperId ?? "").trim() || job.fileName || "";
      console.log('📝 Initial resolved paperId:', resolved);

      if (!resolved) {
        throw new Error("Missing paper_id for translation job");
      }

      if (resolved.includes('|')) {
        const parts = resolved.split('|');
        resolved = parts[parts.length - 1].trim();
        console.log('📝 After | split:', resolved);
      }
      if (resolved.includes(':')) {
        const parts = resolved.split(':').filter(Boolean);
        if (parts.length) {
          resolved = parts[parts.length - 1].trim();
          console.log('📝 After : split:', resolved);
        }
      }
      resolved = resolved.replace(/^translation[_-]/i, '').trim();
      console.log('📝 Final resolved paperId:', resolved);
      
      if (!resolved) {
        throw new Error("Unable to determine paper_id for translation job");
      }

      const url = `/api/palms/translation/questions?paper_id=${encodeURIComponent(resolved)}`;
      console.log('🌐 Fetching translations from:', url);
      
      const res = await fetch(url, { cache: "no-store" });
      console.log('📡 Translation API response status:', res.status, res.statusText);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch translation data (${res.status})`);
      }
      
      const json = await res.json();
      console.log('📊 Translation API response:', json);
      
      const questions = Array.isArray(json?.questions) ? (json.questions as TranslatedQuestion[]) : [];
      console.log('✅ Setting translation data:', { paperId: resolved, questionsCount: questions.length });
      
      setTranslationData({ paperId: resolved, questions });
      return resolved;
    },
    []
  );

  const loadTaggingJob = useCallback(
    async (job: FileJob, paperId?: string | null): Promise<string | null> => {
    const params = new URLSearchParams();
    if (paperId) params.set("paper_id", paperId);
    params.set("job_id", String(job.id));

    const res = await fetch(`/api/palms/update_question_tags?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch tagging data (${res.status})`);
    }
    const json = await res.json();
    const entries = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

    const extractorMap = new Map<string, any>();
    const paperIdsToFetch: string[] = Array.from(
      new Set(
        entries
          .map((entry: any) => entry?.paper_id)
          .filter((pid: any): pid is string => typeof pid === "string" && pid.trim().length > 0)
      )
    );

    await Promise.all(
      paperIdsToFetch.map(async (pid: string) => {
        try {
          const extractorRes = await fetch(
            `/api/palms/extractor-questions?paper_id=${encodeURIComponent(pid)}`,
            { cache: "no-store" }
          );
          if (!extractorRes.ok) return;
          const extractorData = await extractorRes.json();
          if (Array.isArray(extractorData)) {
            extractorData.forEach((item: any) => {
              const key = String(item.question_id ?? item.id ?? "");
              if (!key) return;
              extractorMap.set(key, item);
            });
          }
        } catch (err) {
            // Silently handle errors
        }
      })
    );

    const questions: PDFAIQuestion[] = entries.map((entry: any, index: number) => {
      const key = String(entry.question_id || `tagging-${index}`);
      const original = extractorMap.get(key);
      const options = Array.isArray(original?.options) ? original.options : [];
      return {
        id: key,
        question: original?.question ?? original?.question_text ?? entry.question ?? entry.question_id ?? `Question ${index + 1}`,
        options,
        correctIndex: 0,
        transformations: [],
        approved: false,
        area: entry.area ?? null,
        sub_area: entry.sub_area ?? null,
        topic: entry.topic ?? null,
        sub_topic: entry.sub_topic ?? null,
        job_id: entry.job_id ?? job.id,
        paper_id: entry.paper_id ?? paperId ?? "",
        question_number: original?.question_number ?? entry.question_number ?? null,
        direction: original?.direction ?? entry.direction ?? null,
        passage: original?.passage ?? entry.passage ?? null,
        notes: original?.notes ?? entry.notes ?? null,
        tags: original?.tags ?? entry.tags ?? null,
      };
    });

    setBundles([
      {
        id: `tagging-${job.id}`,
        filename:
          paperId ||
          entries[0]?.paper_id ||
          job.fileName ||
          `Job ${job.id}`,
        type: "PDF_AI",
        filepath: "",
        createdAt: new Date(job.createdAt as any).toISOString(),
        questions,
      },
    ]);

    return (paperId || entries[0]?.paper_id || null) ?? null;
  },
  []
);

  const loadReplicateJob = useCallback(async (job: FileJob, paperId?: string | null) => {
    if (!paperId) {
      throw new Error("Missing paper_id for replicate job");
    }
    const cleanPaperId = paperId.trim();
    const params = new URLSearchParams();
    params.set("paper_id", `extractor:${cleanPaperId}:replicate`);
    params.set("job_id", String(job.id));

    const res = await fetch(`/api/palms/extractor-questions?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to load replicate data (${res.status})`);
    }
    const data = await res.json();
    const questions = mapReplicateQuestions(Array.isArray(data) ? data : []);

    setBundles([
      {
        id: `replicate-${job.id}`,
        filename: cleanPaperId || job.fileName || `Job ${job.id}`,
        type: "PDF_AI",
        filepath: "",
        createdAt: new Date(job.createdAt as any).toISOString(),
        questions,
      },
    ]);
  }, []);

  const handleSelectJob = useCallback(
    async (job: FileJob) => {
      console.log('========================================');
      console.log('🎯 JOB CLICKED - START');
      console.log('========================================');
      console.log('Job Details:', {
        id: job.id,
        fileName: job.fileName,
        input_type: job.input_type,
        status: job.status,
        request_data: job.request_data,
        fullJob: job
      });
      console.log('========================================');
      
      setSelectedJob(job);
      setSelectedQuestionIds(new Set());
      setQuestionSearch("");
      setSelectedPaperId(null);
      setSelectedTagType(null);
      setTranslationData(null);
      setBundles([]);

      const status = (job.status || "").toLowerCase();
      const isCompleted =
        status === "completed" || status === "success" || status === "finished";

      console.log('📊 Status check:', { 
        rawStatus: job.status, 
        normalizedStatus: status, 
        isCompleted 
      });

      if (!isCompleted) {
        console.log('⚠️ Job not completed, skipping data load');
        return;
      }

      const parsed = parseRequestData(job);
      const paperId = parsed.paper_id || parsed.paperId || job.fileName || null;
      setSelectedPaperId(paperId ? String(paperId) : null);

      const inputType = (job.input_type || "").toLowerCase();

      console.log('🔍 Job details:', {
        parsedRequestData: parsed,
        paperId,
        inputType,
        inputTypeRaw: job.input_type
      });

      setIsLoadingQuestions(true);
      try {
        if (inputType === "replicate") {
          console.log('🔄 Loading REPLICATE job...');
          await loadReplicateJob(job, paperId);
          setSelectedTagType("replicate");
          console.log('✅ Replicate job loaded');
        } else if (inputType === "translation" || inputType === "translate") {
          console.log('🌐 Loading TRANSLATION job...');
          const resolvedPaperId = await loadTranslationJob(job, paperId);
          console.log('✅ Translation job loaded, resolved paperId:', resolvedPaperId);
          setSelectedPaperId(resolvedPaperId);
          setSelectedTagType("translation");
          setBundles([]);
        } else if (inputType === "tagging") {
          console.log('🏷️ Loading TAGGING job...');
          const resolvedPaperId = await loadTaggingJob(job, paperId);
          console.log('✅ Tagging job loaded, resolved paperId:', resolvedPaperId);
          setSelectedTagType("tagging");
          if (!paperId && resolvedPaperId) {
            setSelectedPaperId(String(resolvedPaperId));
          }
        } else {
          console.log('❓ Unknown input type:', inputType);
          setSelectedTagType(null);
        }
      } catch (error) {
        console.error('❌ Error loading job data:', error);
        setSelectedTagType(null);
        setBundles([]);
      } finally {
        setIsLoadingQuestions(false);
        console.log('🏁 handleSelectJob complete');
      }
    },
    [loadReplicateJob, loadTaggingJob, loadTranslationJob]
  );

  const handleToggleApprove = useCallback(
    (_fileId: string, payload: ApprovePayload) => {
      setBundles((prev) =>
        prev.map((bundle) => ({
          ...bundle,
          questions: bundle.questions.map((q) =>
            q.id === payload.questionId ? { ...q, approved: payload.approved } : q
          ),
        }))
      );
    },
    []
  );

  const selectedBundles = useMemo(() => bundles, [bundles]);

  console.log('🎨 Page render state:', {
    selectedJob: selectedJob ? { id: selectedJob.id, fileName: selectedJob.fileName, inputType: selectedJob.input_type } : null,
    selectedTagType,
    selectedPaperId,
    bundlesCount: bundles.length,
    translationData: translationData ? { paperId: translationData.paperId, questionsCount: translationData.questions.length } : null,
    isLoadingQuestions,
    translationQuestionsPassedToRightPane: selectedTagType === "translation" && selectedPaperId && translationData?.paperId === selectedPaperId ? translationData.questions.length : 'undefined'
  });

  return (
    <div className={styles.pageRoot}>
      <div className={styles.page}>
        <div className={styles.leftPane}>
          <LeftRail
            jobs={jobs}
            jobsLoading={jobsLoading}
            jobsError={jobsError}
            selectedJobId={selectedJob?.id ?? null}
            onSelectJob={handleSelectJob}
            search={jobSearch}
            onSearch={setJobSearch}
          />
        </div>

        <div className={styles.rightPane}>
          <RightPane
            bundles={selectedBundles}
            selectedTagType={selectedTagType}
            selectedPaperId={selectedPaperId}
            questionSearch={questionSearch}
            setQuestionSearch={setQuestionSearch}
            selectedQuestionIds={selectedQuestionIds}
            setSelectedQuestionIds={setSelectedQuestionIds}
            onToggleApprove={handleToggleApprove}
            translationQuestions={selectedTagType === "translation" && selectedPaperId && translationData?.paperId === selectedPaperId ? translationData.questions : undefined}
            translationLoading={selectedTagType === "translation" && isLoadingQuestions}
            isLoading={isLoadingQuestions}
            modalOpen={false}
            modalPhase="closed"
            modalPrompt=""
            setModalPrompt={noopSetString}
            closeModal={noop}
            handleModalGenerate={noop}
            modalResult={null}
            handleModalSave={noop}
            onRegenerateOpen={(_payload: RegeneratePayload) => {}}
          />
        </div>
      </div>
    </div>
  );
}
