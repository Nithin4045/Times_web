"use client";

import { SearchOutlined } from "@ant-design/icons";
import React from "react";
import type {
  ApprovePayload,
  PDFBundle,
  RegeneratePayload,
} from "../../models/types";
import ReplicatePage from "../Replicate/Replicate";
import TranslationPage, { TranslatedQuestion } from "../Translation/Translation";
import TaggedQuestions from "../TaggedQuestions/TaggedQuestions";
import dynamic from "next/dynamic";
const TaggingPage = dynamic(() => import("../Tagging/Tagging"), { ssr: false });
import styles from "./RightPane.module.css";

type Props = {
  bundles: PDFBundle[];
  selectedTagType: string | null;
  selectedPaperId?: string | null;
  questionSearch: string;
  setQuestionSearch: React.Dispatch<React.SetStateAction<string>>;
  selectedQuestionIds: Set<string>;
  setSelectedQuestionIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onToggleApprove: (fileId: string, payload: ApprovePayload) => void;
  modalOpen: boolean;
  modalPhase: "edit" | "loading" | "result" | "error" | "closed";
  modalPrompt: string;
  setModalPrompt: React.Dispatch<React.SetStateAction<string>>;
  closeModal: () => void;
  handleModalGenerate: () => void;
  taggedQuestions?: any[]; // For tagged questions display
  modalResult:
  | {
    question: string;
    options: string[];
    answer: string;
    answer_index: number;
  }
  | null;
  translationQuestions?: TranslatedQuestion[] | null;
  translationLoading?: boolean;
  modalError?: string;
  handleModalSave: () => void;
  isLoading?: boolean; // ✅ Add loading prop
  onRegenerateOpen: (payload: RegeneratePayload) => void;
};

export default function RightPane({
  bundles,
  questionSearch,
  setQuestionSearch,
  selectedQuestionIds,
  setSelectedQuestionIds,
  onToggleApprove,
  selectedTagType,
  selectedPaperId,
  modalOpen,
  modalPhase,
  modalPrompt,
  setModalPrompt,
  closeModal,
  handleModalGenerate,
  taggedQuestions,
  modalResult,
  translationQuestions,
  translationLoading = false,
  modalError,
  handleModalSave,
  isLoading = false,
  onRegenerateOpen,
}: Props) {
  const { headerFilename, filePath } = React.useMemo(() => {
    if (!bundles?.length) {
      return { headerFilename: "No file selected", filePath: null as string | null };
    }
    const counts = new Map<string, number>();
    let best = bundles[0].filename;
    let bestPath = bundles[0].filepath;
    let bestN = 0;
    for (const b of bundles) {
      const n = (counts.get(b.filename) || 0) + 1;
      counts.set(b.filename, n);
      if (n > bestN) {
        bestN = n;
        best = b.filename;
        bestPath = b.filepath;
      }
    }
    return { headerFilename: best, filePath: bestPath };
  }, [bundles]);

  const baseUrl =
    (typeof window !== "undefined" && process.env.NEXT_PUBLIC_BASE_URL) ||
    (typeof window !== "undefined" ? `${window.location.origin}/` : "http://localhost:3000/");

  const toAbsoluteUrl = React.useCallback(
    (p: string) => {
      // If already absolute
      if (p.startsWith("http://") || p.startsWith("https://")) return p;

      // Normalize leading slash
      const normalized = p.startsWith("/") ? p.slice(1) : p;
      if (normalized.startsWith("uploads/")) {
        return `${baseUrl}api/uploads/${normalized.replace(/^uploads\//, "")}`;
      }

      return `${baseUrl}${normalized}`;
    },
    [baseUrl]
  );

  const handleFilenameClick = () => {
    if (!filePath || headerFilename === "No file selected") return;

    try {
      const url = toAbsoluteUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open file:", err);
      // Fallback: open as-is
      window.open(filePath, "_blank", "noopener,noreferrer");
    }
  };

  // Determine if translation view
  const isTranslationView = selectedTagType === "translation";

  // Totals (for header)
  const { totalQuestions, totalTransformations } = React.useMemo(() => {
    let qCount = 0,
      tCount = 0;
    for (const b of bundles) {
      if (b.questions && Array.isArray(b.questions)) {
        qCount += b.questions.length;
        for (const q of b.questions) tCount += q.transformations?.length ?? 0;
      }
    }
    return { totalQuestions: qCount, totalTransformations: tCount };
  }, [bundles]);

  // Language selection state from Questions table
  const [selectedLang, setSelectedLang] = React.useState<string | undefined>(undefined);

  // Clean display name. For translation/tagging, prefer cleaned selectedPaperId (strip extractor:...:tag)
  const displayHeaderName = React.useMemo(() => {
    if ((selectedTagType === "translation" || selectedTagType === "tagging") && selectedPaperId) {
      const pid = selectedPaperId.includes(":") ? selectedPaperId.split(":")[1] : selectedPaperId;
      return (pid || "").trim();
    }
    const raw = headerFilename || "";
    const withoutPrefix = raw.replace(/^Paper\s+/i, "").trim();
    return withoutPrefix || raw;
  }, [headerFilename, selectedPaperId, selectedTagType]);

  return (
    <section className={styles.rightPane}>
      <header className={styles.topNav} role="region" aria-label="Right pane header">
        <div className={styles.headerLeft}>
          <div
            className={`${styles.filename} ${filePath ? styles.clickableFilename : ""}`}
            title={filePath ? `Click to open ${displayHeaderName} in new tab` : displayHeaderName}
            onClick={filePath ? handleFilenameClick : undefined}
            style={{ cursor: filePath ? "pointer" : "default" }}
            role={filePath ? "button" : undefined}
            tabIndex={filePath ? 0 : undefined}
            onKeyDown={(e) => {
              if (filePath && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                handleFilenameClick();
              }
            }}
            aria-label={
              filePath ? `Click to open file in new tab: ${displayHeaderName}` : displayHeaderName
            }
          >
            {displayHeaderName}
            {filePath && <span className={styles.fileIcon} aria-hidden="true">📄</span>}
          </div>

          {!isTranslationView && (
            <div className={styles.countRow} aria-label="Counts">
              <div className={styles.countBlock}>
                <span className={styles.countLabel}>Total questions</span>
                <span className={styles.countNumber}>{totalQuestions}</span>
              </div>
              <span className={styles.countSeparator}>•</span>
              <div className={styles.countBlock}>
                <span className={styles.countLabel}>Total transformed questions</span>
                <span className={styles.countNumber}>{totalTransformations}</span>
              </div>
            </div>
          )}
          {isTranslationView && (
            <div className={styles.countRow} aria-label="Translation view">
              <div className={styles.countBlock}>
                <span className={styles.countLabel}>View</span>
                <span className={styles.countNumber}>Translations</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.headerSearchWrap}>
          <SearchOutlined className={styles.headerSearchIcon} />
          <input
            className={styles.headerSearchInput}
            placeholder="Search filename, questions or transformations…"
            value={questionSearch}
            onChange={(e) => setQuestionSearch(e.target.value)}
            aria-label="Search in questions"
          />
        </div>
      </header>

      <main
        className={`${styles.scrollArea} ${styles.hideInnerReplicateUI}`}
        role="region"
        aria-label="Questions list"
      >
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #1890ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{ color: '#666', fontSize: '14px' }}>Loading questions...</div>
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : selectedTagType === "translation" ? (
          <TranslationPage
            paperId={selectedPaperId || ""}
            searchQuery={questionSearch}
            prefetchedQuestions={selectedPaperId && translationQuestions ? translationQuestions : undefined}
            parentLoading={isLoading || translationLoading}
          />
        ) : selectedTagType === "tagging" ? (
          bundles && bundles.length > 0 && bundles[0].questions && bundles[0].questions.length > 0 ? (
            <TaggedQuestions 
              questions={bundles[0].questions}
              onToggleApprove={(questionId, approved) => onToggleApprove(bundles[0].id, { questionId, approved })}
              searchQuery={questionSearch}
            />
          ) : (
            <TaggingPage paperId={selectedPaperId || ""} searchQuery={questionSearch} />
          )
        ) : selectedTagType === "replicate" ? (
          <ReplicatePage
            bundles={bundles}
            onToggleApprove={onToggleApprove}
            onEdit={() => { }}
            searchQuery={questionSearch}
            onSearchQueryChange={setQuestionSearch}
          />
        ) : (
          <ReplicatePage
            bundles={bundles}
            onToggleApprove={onToggleApprove}
            onEdit={() => { }}
            searchQuery={questionSearch}
            onSearchQueryChange={setQuestionSearch}
          />
        )}
      </main>
    </section>
  );
}
