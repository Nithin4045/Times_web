"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Select, Card, Spin, Empty, Button, Modal } from "antd";
import LaTeXRenderer from "@/components/LaTeXRenderer/LaTeXRenderer";
import styles from "./Translation.module.css";

export type TranslatedQuestion = {
  id: number;
  paper_id: string;
  question_id: string;
  translations: Record<string, any>;
  original_question?: string;
  original_options?: any;
  question_number?: number;
  local_words?: string;
  global_words?: string;
  created_at?: string;
};

type Props = {
  paperId: string;
  searchQuery?: string;
  prefetchedQuestions?: TranslatedQuestion[] | null;
  parentLoading?: boolean;
};

export default function TranslationPage({ paperId, searchQuery = "", prefetchedQuestions, parentLoading = false }: Props) {
  const hasPrefetched = prefetchedQuestions !== undefined && prefetchedQuestions !== null;
  const [questions, setQuestions] = useState<TranslatedQuestion[]>(hasPrefetched ? (prefetchedQuestions as TranslatedQuestion[]) : []);
  const [loading, setLoading] = useState(!hasPrefetched);
  const [error, setError] = useState<string | null>(null);
  const [globalLanguage, setGlobalLanguage] = useState<string>("hin");
  const [questionLanguages, setQuestionLanguages] = useState<Record<string, string>>({});
  
  // Solution modal state
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [solutionHtml, setSolutionHtml] = useState<string | null>(null);
  const [solutionTitle, setSolutionTitle] = useState<string>("");
  const [solutionLanguage, setSolutionLanguage] = useState<string>("en");

  useEffect(() => {
    const hasData = prefetchedQuestions !== undefined && prefetchedQuestions !== null;

    if (hasData) {
      setQuestions(prefetchedQuestions as TranslatedQuestion[]);
      setError(null);
      setLoading(false);
      return;
    }

    if (!paperId) {
      setQuestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const fetchTranslations = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/palms/translation/questions?paper_id=${encodeURIComponent(paperId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch translations: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        if (data.success) {
          setQuestions(data.questions || []);
        } else {
          throw new Error(data.error || "Failed to load translations");
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setError(err.message || "Failed to load translations");
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslations();

    return () => controller.abort();
  }, [paperId, prefetchedQuestions]);

  useEffect(() => {
    setQuestionLanguages({});
  }, [paperId, prefetchedQuestions]);

  // Get available languages
  const availableLanguages = useMemo(() => {
    const langSet = new Set<string>();
    
    questions.forEach((q) => {
      if (q.translations && typeof q.translations === "object") {
        Object.keys(q.translations).forEach((lang) => {
          const val = q.translations[lang];
          if (val) {
            langSet.add(lang);
          }
        });
      }
    });
    
    const langs = Array.from(langSet).sort();
    return langs;
  }, [questions]);

  useEffect(() => {
    if (availableLanguages.length > 0 && !availableLanguages.includes(globalLanguage)) {
      const newLang = availableLanguages.includes("hin") ? "hin" : availableLanguages[0];
      setGlobalLanguage(newLang);
    }
  }, [availableLanguages, globalLanguage]);

  // Helper to extract text from translation value
  const getTranslationText = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      // Handle {question: "...", options: [...]} format
      if (value.question) return value.question;
      // Handle other object formats
      return JSON.stringify(value);
    }
    return String(value || '');
  };

  // Helper to extract solution from translation value
  const getTranslationSolution = (value: any): string | null => {
    if (value && typeof value === 'object' && value.solution) {
      return value.solution;
    }
    return null;
  };

  // Solution modal helpers
  const openSolutionModal = (html: string | null, title: string, language: string) => {
    setSolutionHtml(html);
    setSolutionTitle(title);
    setSolutionLanguage(language);
    setSolutionOpen(true);
  };

  const closeSolutionModal = () => {
    setSolutionOpen(false);
    setSolutionHtml(null);
    setSolutionTitle("");
    setSolutionLanguage("en");
  };

  // Filter questions based on search
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    
    const q = searchQuery.toLowerCase();
    return questions.filter((question) => {
      // Search in question_id
      if (question.question_id.toLowerCase().includes(q)) return true;
      
      // Search in translations
      if (question.translations) {
        const translationValues = Object.values(question.translations);
        if (translationValues.some((val) => {
          const text = getTranslationText(val);
          return text.toLowerCase().includes(q);
        })) {
          return true;
        }
      }
      
      return false;
    });
  }, [questions, searchQuery]);

  const effectiveLoading = parentLoading || loading;

  // Parse local/global words
  const parseWords = (wordStr?: string) => {
    if (!wordStr) return [];
    try {
      const parsed = JSON.parse(wordStr);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.words && Array.isArray(parsed.words)) return parsed.words;
      return [];
    } catch {
      return [];
    }
  };

  // Language display names and codes
  const languageInfo: Record<string, { name: string; code: string }> = {
    en: { name: "English", code: "EN" },
    hin: { name: "Hindi", code: "HA" },
    mar: { name: "Marathi", code: "MA" },
    tam: { name: "Tamil", code: "TA" },
    te: { name: "Telugu", code: "TE" },
  };

  const getLanguageDisplay = (langKey: string): string => {
    const info = languageInfo[langKey];
    if (info) {
      return `${info.code} - ${info.name}`;
    }
    return langKey.toUpperCase();
  };

  const getLanguageName = (langKey: string): string => {
    return languageInfo[langKey]?.name || langKey.toUpperCase();
  };

  const getLanguageCode = (langKey: string): string => {
    return languageInfo[langKey]?.code || langKey.toUpperCase();
  };

  if (effectiveLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Loading translations...">
          <div />
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>❌ {error}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <Empty description="No translations found for this paper" />
      </div>
    );
  }

  return (
    <div className={styles.translationContainer}>
      {/* Global Language Selector + Question Count */}
      <div className={styles.globalLanguageSelector}>
        <label className={styles.globalLanguageLabel}>Global Language:</label>
        <Select
          value={globalLanguage}
          onChange={(lang) => {
            setGlobalLanguage(lang);
            setQuestionLanguages({});
          }}
          size="small"
          style={{ width: 150 }}
          disabled={availableLanguages.length === 0}
        >
          {availableLanguages.map((lang) => (
            <Select.Option key={lang} value={lang}>
              {getLanguageDisplay(lang)}
            </Select.Option>
          ))}
        </Select>
        <span className={styles.questionCount}>
          {filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Questions List */}
      <div className={styles.questionsList}>
        {filteredQuestions.map((question) => {
          const translations = question.translations || {};
          const questionId = String(question.id);
          
          // ✅ Get language for THIS question (per-question override OR global language)
          const selectedLanguage = questionLanguages[questionId] || globalLanguage;
          const hasOverride = questionId in questionLanguages;
          
          // Get available languages for this question
          const questionAvailableLanguages = Object.keys(translations).filter(lang => translations[lang]).sort();
          
          // Use original_question from extractor_question table as primary source
          const originalText = question.original_question || 
                              getTranslationText(translations["en"] || translations["english"] || "");
          const translatedText = getTranslationText(translations[selectedLanguage] || "");
          const localWords = parseWords(question.local_words);

          // Parse options if available
          let originalOptions: string[] = [];
          if (question.original_options) {
            if (Array.isArray(question.original_options)) {
              originalOptions = question.original_options;
            } else if (typeof question.original_options === 'object') {
              originalOptions = Object.values(question.original_options);
            }
          }

          // Get solution for the currently selected language
          const currentSolution = getTranslationSolution(translations[selectedLanguage]);

          return (
            <Card
              key={question.id}
              className={styles.questionCard}
              title={
                <div className={styles.cardHeader}>
                  <span className={styles.questionId}>
                    Q{question.question_number ? ` ${question.question_number}` : ''}: {question.question_id}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* ✅ Per-question language selector */}
                    <Select
                      value={selectedLanguage}
                      onChange={(lang) => {
                        setQuestionLanguages(prev => ({
                          ...prev,
                          [questionId]: lang,
                        }));
                      }}
                      size="small"
                      style={{ 
                        width: 140,
                        borderColor: hasOverride ? '#1890ff' : undefined,
                      }}
                      disabled={questionAvailableLanguages.length === 0}
                    >
                      {questionAvailableLanguages.map((lang) => (
                        <Select.Option key={lang} value={lang}>
                          {getLanguageDisplay(lang)}
                        </Select.Option>
                      ))}
                    </Select>
                    {/* ✅ Reset to Global button (only show if overridden) */}
                    {hasOverride && (
                      <button
                        onClick={() => {
                          setQuestionLanguages(prev => {
                            const newState = { ...prev };
                            delete newState[questionId];
                            return newState;
                          });
                        }}
                        style={{
                          padding: '2px 8px',
                          fontSize: '12px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px',
                          background: 'white',
                          cursor: 'pointer',
                          color: '#666',
                        }}
                        title="Reset to global language"
                      >
                        ↻ Reset
                      </button>
                    )}
                    
                    {/* Solution button for currently selected language */}
                    <Button
                      size="small"
                      onClick={() => openSolutionModal(
                        currentSolution,
                        `Solution — ${question.question_id} (${getLanguageDisplay(selectedLanguage)})`,
                        selectedLanguage
                      )}
                      disabled={!currentSolution}
                      type="primary"
                      ghost
                    >
                      Solution
                    </Button>
                  </div>
                </div>
              }
            >
              {/* Original Question (English) */}
              <div className={styles.questionSection}>
                <h4 className={styles.sectionTitle}>EN - English</h4>
                <LaTeXRenderer 
                  content={originalText || '<em class="no-data">No English text available</em>'}
                  className={styles.questionText}
                />
                
                {/* Display original options if available */}
                {originalOptions.length > 0 && (
                  <div className={styles.optionsContainer}>
                    <h5 className={styles.optionsTitle}>Options:</h5>
                    <ol className={styles.optionsList}>
                      {originalOptions.map((option, idx) => (
                        <li key={idx} className={styles.optionItem}>
                          <LaTeXRenderer 
                            content={option || ''}
                            inline
                          />
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Translated Question */}
              <div className={styles.questionSection}>
                <h4 className={styles.sectionTitle}>
                  Translated ({getLanguageDisplay(selectedLanguage)})
                </h4>
                <LaTeXRenderer 
                  content={translatedText || `<em class="no-data">No translation available in ${getLanguageName(selectedLanguage)}</em>`}
                  className={styles.translatedText}
                />
              </div>

              {/* Local Words */}
              {localWords.length > 0 && (
                <div className={styles.wordsSection}>
                  <h4 className={styles.sectionTitle}>Context Words</h4>
                  <div className={styles.wordsList}>
                    {localWords.map((word: any, idx: number) => (
                      <span key={idx} className={styles.wordTag}>
                        {typeof word === "string" ? word : word.word || word.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Solution Modal */}
      <Modal
        title={solutionTitle}
        open={solutionOpen}
        onCancel={closeSolutionModal}
        footer={[
          <Button key="close" onClick={closeSolutionModal}>
            Close
          </Button>,
        ]}
        width={800}
        destroyOnClose
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

