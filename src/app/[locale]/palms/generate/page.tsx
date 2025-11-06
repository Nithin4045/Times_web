"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Select, Button, Table, Spin, message, Empty, Modal, Tooltip } from "antd";
import { CopyOutlined, TagsOutlined, TranslationOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import "@/app/global.css";
import TranslationModal, { TranslationConfig } from "./components/TranslationModal";
import TaggingDataModal from "./components/TaggingDataModal";
import ReplicateModal from "./components/ReplicateModal";

const { Option } = Select;

type MetaPair = { keyLabel: string; prompt: string };

const DEFAULT_ITEMS: MetaPair[] = [
  {
    keyLabel: "Change Names", prompt: `Replace specific person/organization/entity names with alternatives of the same type.
Match gender-specific pronouns to the new name.
Leave generic references unchanged (e.g., "the student", "the teacher").
Example: "Ravi solved the puzzle" → "Anita solved the puzzle."` },
  {
    keyLabel: "Change Objects", prompt: `Swap physical/tangible objects with similar ones in the same category.
Avoid abstract or purely mathematical replacements.
Maintain realism and contextual relevance.
Example: "A bus leaves the station" → "A train leaves the station."` },
  {
    keyLabel: "Alter Numerical Values", prompt: `Modify numbers while keeping the concept and problem structure intact.
Ensure values remain realistic and logically consistent (e.g., square roots stay perfect squares).
Adjust dependent numbers if calculations are involved.
Example: "Find the square root of 25" → "Find the square root of 16."` },
  {
    keyLabel: "Change Locations", prompt: `Replace locations with another contextually relevant place that fits the setting.
Example: "A tree in the park is 10 m tall" → "A tree in the school garden is 10 m tall."` },
  {
    keyLabel: "Rephrase Sentence Structure", prompt: `Convert passive voice to active voice where appropriate.
Rephrase or rearrange words without altering the meaning.
Skip if rephrasing changes the concept.
Example: "The ball was thrown by Ravi" → "Ravi threw the ball."` },
  {
    keyLabel: "Substitute Units or Dimensions", prompt: `Replace measurement units with valid equivalents (e.g., cm ↔ m, minutes ↔ hours).
Update values accordingly so the question remains valid.
Example: "The table is 120 cm long" → "The table is 1.2 m long."` },
  {
    keyLabel: "Swap Real-World Contexts", prompt: `Replace one real-world situation with another of the same type and complexity.
Maintain logical and conceptual structure.
Example: "A batsman scores runs in a cricket match" → "A striker scores goals in a football match."` },
  {
    keyLabel: "Change Figures/Diagrams", prompt: `Replace a diagram or figure with an equivalent representing the same concept.
Update labels and dimensions to match new values/units.
Example: Rectangle with given sides → Parallelogram with same area concept.` },
  {
    keyLabel: "Synonym & Vocabulary Variation", prompt: `For English/GK/LR questions, replace key words with synonyms while preserving tone and meaning.
Example: "He was elated after winning" → "He was thrilled after winning."` },
  {
    keyLabel: "Question Format Variation", prompt: `Change between question styles without altering the concept (e.g., MCQ ↔ Fill-in-the-blank), keeping the same answer logic.
Example: MCQ "What is the capital of France?" → Fill-in "The capital of France is ____."` },
  {
    keyLabel: "Change Timeframes", prompt: `Adjust time periods or references while keeping context intact (useful for GK, history, or time-based math).
Example: "In 2010, the population was…" → "In 2020, the population was…"` },
];

interface MCQData {
  question_id: string;
  question_text: string | null;
  question_number: number;
  options: any;
  area: string | null;
  solution_text: string | null;
}

export default function GeneratePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [paperIds, setPaperIds] = useState<string[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [mcqs, setMcqs] = useState<MCQData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPaperIds, setLoadingPaperIds] = useState(true);
  const [replicateLoading, setReplicateLoading] = useState(false);
  const [replicateModalOpen, setReplicateModalOpen] = useState(false);
  const [translationModalOpen, setTranslationModalOpen] = useState(false);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [taggingModalOpen, setTaggingModalOpen] = useState(false);
  const [taggingLoading, setTaggingLoading] = useState(false);

  // Helper function to extract options from JSONB field
  const extractOptionsFromJsonb = (optionsJsonb: any): string[] => {
    if (!optionsJsonb) return [];
    
    // If it's already an array, return it
    if (Array.isArray(optionsJsonb)) {
      return optionsJsonb.filter(opt => opt && typeof opt === 'string');
    }
    
    // If it's an object, extract values
    if (typeof optionsJsonb === 'object') {
      return Object.values(optionsJsonb).filter(opt => opt && typeof opt === 'string') as string[];
    }
    
    return [];
  };

  // Helper function to parse HTML and extract question/options for API
  const parseQuestionForAPI = (htmlText: string | null, optionsJsonb: any = null): { question: string; options: string[] } => {
    if (!htmlText) return { question: '', options: [] };

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;

    // Get all paragraph tags
    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
    
    if (paragraphs.length === 0) {
      return { question: htmlText, options: extractOptionsFromJsonb(optionsJsonb) };
    }

    // Remove direction paragraphs
    const contentParagraphs = paragraphs.filter(p => {
      const text = p.textContent?.toLowerCase() || '';
      return !text.includes('directions for question') && 
             !text.includes('direction for question') &&
             text.trim().length > 0;
    });

    if (contentParagraphs.length === 0) {
      return { question: '', options: extractOptionsFromJsonb(optionsJsonb) };
    }

    // Get question text (remove embedded options if they exist)
    const lastParagraph = contentParagraphs[contentParagraphs.length - 1];
    const lastText = lastParagraph.textContent || '';
    const hasOptions = /\([A-D]\)/.test(lastText);

    let questionParagraphs = contentParagraphs;
    if (hasOptions) {
      questionParagraphs = contentParagraphs.slice(0, -1);
    }

    // Format the question text
    const questionText = questionParagraphs.map(p => p.textContent?.trim()).filter(Boolean).join(' ');

    // Use options from JSONB field instead of parsing from text
    const options = extractOptionsFromJsonb(optionsJsonb);

    return {
      question: questionText,
      options: options
    };
  };

  // Helper function to parse and format question text for display
  const parseQuestionText = (htmlText: string | null, optionsJsonb: any = null) => {
    if (!htmlText) return null;

    // Extract question text without options (remove HTML parsing for options)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;
    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
    
    const contentParagraphs = paragraphs.filter(p => {
      const text = p.textContent?.toLowerCase() || '';
      return !text.includes('directions for question') && 
             !text.includes('direction for question') &&
             text.trim().length > 0;
    });

    if (contentParagraphs.length === 0) {
      return <div className={styles.questionContent}>No question text</div>;
    }

    // Get question text (remove options if they're embedded in the last paragraph)
    const lastParagraph = contentParagraphs[contentParagraphs.length - 1];
    const lastText = lastParagraph.textContent || '';
    const hasOptions = /\([A-D]\)/.test(lastText);

    let questionParagraphs = contentParagraphs;
    if (hasOptions) {
      questionParagraphs = contentParagraphs.slice(0, -1);
    }

    const questionText = questionParagraphs.map(p => p.textContent?.trim()).filter(Boolean).join(' ');

    // Use options from JSONB field instead of parsing from text
    const options = extractOptionsFromJsonb(optionsJsonb);

    return (
      <div className={styles.questionContent}>
        <div className={styles.questionText}>{questionText}</div>
        {options.length > 0 && (
          <div className={styles.optionsList}>
            {options.map((option, idx) => (
              <div key={idx} className={styles.optionItem}>
                <span className={styles.optionLabel}>({String.fromCharCode(65 + idx)})</span>
                <span className={styles.optionText}>{option}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper function to parse and format question text only (without options)
  const parseQuestionTextOnly = (htmlText: string | null) => {
    if (!htmlText) return null;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;
    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
    
    const contentParagraphs = paragraphs.filter(p => {
      const text = p.textContent?.toLowerCase() || '';
      return !text.includes('directions for question') && 
             !text.includes('direction for question') &&
             text.trim().length > 0;
    });

    if (contentParagraphs.length === 0) {
      return <div className={styles.questionContent}>No question text</div>;
    }

    // Get question text (remove embedded options if they exist)
    const lastParagraph = contentParagraphs[contentParagraphs.length - 1];
    const lastText = lastParagraph.textContent || '';
    const hasOptions = /\([A-D]\)/.test(lastText);

    let questionParagraphs = contentParagraphs;
    if (hasOptions) {
      questionParagraphs = contentParagraphs.slice(0, -1);
    }

    const questionText = questionParagraphs.map(p => p.textContent?.trim()).filter(Boolean).join(' ');

    return (
      <div className={styles.questionContent}>
        <div className={styles.questionText}>{questionText}</div>
      </div>
    );
  };

  // Helper function to render options separately
  const renderOptions = (optionsJsonb: any) => {
    const options = extractOptionsFromJsonb(optionsJsonb);
    
    if (options.length === 0) {
      return <span className={styles.noData}>No options</span>;
    }

    return (
      <div className={styles.optionsList}>
        {options.map((option, idx) => (
          <div key={idx} className={styles.optionItem}>
            <span className={styles.optionLabel}>({String.fromCharCode(65 + idx)})</span>
            <span className={styles.optionText}>{option}</span>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to clean solution text by removing unwanted HTML and formatting
  const cleanSolutionText = (solutionText: string | null): string => {
    if (!solutionText) return '';

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = solutionText;

    // First, convert superscript to regular text (like 14th, 2nd)
    const supElements = tempDiv.querySelectorAll('sup');
    supElements.forEach(sup => {
      if (sup.parentNode) {
        sup.parentNode.insertBefore(document.createTextNode(sup.textContent || ''), sup);
        sup.remove();
      }
    });

    // Remove unwanted elements completely
    const unwantedSelectors = [
      'div[style*="margin-bottom"]', // Remove divs with margin-bottom styling
      'table', // Remove tables entirely including all content
      'thead', 'tbody', 'tr', 'td', 'th', // Remove table elements
      'script', // Remove any scripts
      'style',  // Remove any style tags
      'div'     // Remove div tags that might contain unwanted content
    ];

    unwantedSelectors.forEach(selector => {
      const elements = tempDiv.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Get all paragraph elements and process them
    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
    
    if (paragraphs.length === 0) {
      // If no paragraphs, return the text content with basic HTML cleaning
      return tempDiv.textContent?.replace(/\s+/g, ' ').trim() || '';
    }

    // Process each paragraph and filter out unwanted content
    const cleanParagraphs = paragraphs.map(p => {
      let text = p.textContent?.trim() || '';
      if (!text) return '';
      
      // Remove unwanted header text
      if (text.includes('Solutions for questions') && text.includes(':')) {
        return '';
      }
      
      // Clean up text by removing extra whitespace and special characters
      text = text.replace(/\s+/g, ' ').trim();
      
      // Skip very short paragraphs that might be artifacts
      if (text.length < 15) {
        return '';
      }
      
      // Skip paragraphs that look like navigation or ending
      if (text.includes('final arrangement') && text.includes('follows')) {
        return '';
      }
      
      return text;
    }).filter(Boolean);

    // Join paragraphs and clean up the final result
    const result = cleanParagraphs.join(' ').replace(/\s+/g, ' ').trim();
    
    // Remove common unwanted endings
    const unwantedEndings = [
      /Dhoni made his debut in \d{4}\s*$/,  // Remove specific player endings
      /The final arrangement is as follows\s*$/,
      /^\s*Given\s+/i  // Sometimes "Given" at start might be unwanted
    ];
    
    let finalResult = result;
    unwantedEndings.forEach(pattern => {
      finalResult = finalResult.replace(pattern, '').trim();
    });
    
    return finalResult;
  };

  // Helper function to truncate text to first 5 lines
  const truncateToFiveLines = (text: string): string => {
    if (!text) return '';
    
    // Estimate characters per line based on typical table cell width (200px)
    // With font-size 12px, roughly 40-45 characters fit per line
    const charsPerLine = 42;
    const maxChars = charsPerLine * 5; // 5 lines
    
    if (text.length <= maxChars) {
      return text;
    }
    
    // Find a good breaking point (end of sentence closest to 5 lines)
    const truncated = text.substring(0, maxChars);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');
    
    // Try to break at a sentence end, then at a word boundary
    if (lastPeriod > maxChars * 0.7) { // If period is in last 30% of text
      return text.substring(0, lastPeriod + 1);
    } else if (lastSpace > maxChars * 0.8) { // If space is in last 20% of text
      return text.substring(0, lastSpace);
    } else {
      return truncated;
    }
  };

  // Prompt settings
  const [promptPairs, setPromptPairs] = useState<MetaPair[]>(DEFAULT_ITEMS);
  const [promptLoading, setPromptLoading] = useState(false);

  // Success modal w/ countdown
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [actionType, setActionType] = useState<'replication' | 'translation' | 'tagging'>('replication');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (redirectRef.current) clearTimeout(redirectRef.current);
    };
  }, []);

  // Fetch paper IDs on component mount
  useEffect(() => {
    fetchPaperIds();
  }, []);

  // Load prompt settings when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      const uid = getNumericUserId();
      if (uid) void loadPromptSettings(uid);
    }
  }, [status]);

  const getNumericUserId = () => {
    const raw = session?.user?.id as unknown as string | number | undefined;
    const num = Number(raw);
    return Number.isFinite(num) ? String(num) : undefined;
  };

  // merge saved prompts into DEFAULT_ITEMS order
  const mergeItems = (saved: MetaPair[]) => {
    const map = new Map<string, string>();
    for (const it of saved || []) {
      if (typeof it?.keyLabel === "string" && typeof it?.prompt === "string") {
        map.set(it.keyLabel, it.prompt);
      }
    }
    return DEFAULT_ITEMS.map((d) => ({
      keyLabel: d.keyLabel,
      prompt: map.get(d.keyLabel) ?? d.prompt,
    }));
  };

  const loadPromptSettings = useCallback(async (uid: string) => {
    setPromptLoading(true);
    try {
      const res = await fetch(`/api/palms/replicate/save_prompt_settings?user_id=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json.items) ? json.items : [];
        setPromptPairs(mergeItems(items));
      } else if (res.status === 404) {
        setPromptPairs(DEFAULT_ITEMS);
      } else {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed to load prompt settings (${res.status})`);
      }
    } catch (e: any) {
      console.error(e);
      setPromptPairs(DEFAULT_ITEMS);
    } finally {
      setPromptLoading(false);
    }
  }, []);

  const startSuccessCountdown = useCallback((type: 'replication' | 'translation' | 'tagging') => {
    setActionType(type);
    setCountdown(5);
    setSuccessModalOpen(true);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1 && countdownRef.current) clearInterval(countdownRef.current);
        return Math.max(0, c - 1);
      });
    }, 1000);

    redirectRef.current = setTimeout(() => {
      router.push("/palms/listofaiquestions");
    }, 5000);
  }, [router]);

  const fetchPaperIds = async () => {
    setLoadingPaperIds(true);
    try {
      const response = await fetch("/api/palms/generate/home");
      const data = await response.json();

      if (data.success && data.paper_ids) {
        setPaperIds(data.paper_ids);
      } else {
        message.error("Failed to load paper IDs");
      }
    } catch (error) {
      console.error("Error fetching paper IDs:", error);
      message.error("Error loading paper IDs");
    } finally {
      setLoadingPaperIds(false);
    }
  };

  const fetchMCQs = async (paperId: string) => {
    setLoading(true);
    setMcqs([]);
    try {
      const response = await fetch("/api/palms/generate/home", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paper_id: paperId }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setMcqs(data.data);
        message.success(`Loaded ${data.count} questions`);
      } else {
        message.error("Failed to load questions");
      }
    } catch (error) {
      console.error("Error fetching MCQs:", error);
      message.error("Error loading questions");
    } finally {
      setLoading(false);
    }
  };

  const handlePaperIdChange = (value: string) => {
    setSelectedPaperId(value);
    fetchMCQs(value);
  };

  const handleTranslate = () => {
    if (!selectedPaperId) {
      message.warning("Please select a paper ID first");
      return;
    }
    if (mcqs.length === 0) {
      message.warning("No questions available to translate");
      return;
    }
    setTranslationModalOpen(true);
  };

  const handleTranslationSubmit = async (config: TranslationConfig) => {
    const uid = getNumericUserId();
    if (!uid) {
      message.error("Please sign in to translate questions");
      return;
    }

    console.log("🌐 Starting translation process for Paper ID:", selectedPaperId);
    console.log("Translation config:", config);

    setTranslationLoading(true);

    try {
      // Step 1: Fetch full MCQ data with options
      console.log("📥 Fetching full MCQ data for translation...");
      const mcqResponse = await fetch("/api/palms/generate/home", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paper_id: selectedPaperId, action: "full" }),
      });

      const mcqData = await mcqResponse.json();

      if (!mcqData.success || !mcqData.data) {
        throw new Error("Failed to fetch full MCQ data");
      }

      console.log(`✅ Fetched ${mcqData.count} MCQs for translation`);

      // Step 1.5: Data is already properly formatted by API, just ensure consistency
      const parsedMcqs = mcqData.data.map((mcq: any) => {
        // API already returns properly formatted question and options from JSONB
        return {
          question_id: mcq.question_id,
          question: mcq.question || '',
          options: Array.isArray(mcq.options) ? mcq.options : [],
          answer: mcq.answer || '',
          solution_text: cleanSolutionText(mcq.solution_text)
        };
      });

      console.log(`✅ Parsed ${parsedMcqs.length} MCQs with separated questions and options`);
      console.log('📊 Sample parsed MCQ for translation:', parsedMcqs[0] ? {
        question_id: parsedMcqs[0].question_id,
        question: parsedMcqs[0].question?.substring(0, 100) + '...',
        options: parsedMcqs[0].options,
        solution_text: parsedMcqs[0].solution_text?.substring(0, 50) + '...'
      } : 'No data');

      // Step 2: Send to translation API
      const formData = new FormData();
      formData.append("input_type", "translate");
      formData.append("user_id", uid);
      formData.append("paper_id", selectedPaperId!);
      formData.append("languages", JSON.stringify(config.languages));
      // Convert arrays of {word, context} into separate arrays for words and contexts
      const normalizeToWordsContexts = (arr: { word: string; context: string }[]) => {
        return {
          words: arr.map((i) => i.word || ""),
          contexts: arr.map((i) => i.context || ""),
        };
      };

      formData.append("local_words", JSON.stringify(normalizeToWordsContexts(config.localWords)));
      formData.append("global_words", JSON.stringify(normalizeToWordsContexts(config.globalWords)));
      formData.append("mcq_s", JSON.stringify(parsedMcqs));

      console.log("📤 Sending translation request...");
      console.log(`📋 Sending ALL ${parsedMcqs.length} MCQs to translation API`);
      console.log(`🌐 Target languages: ${config.languages.join(', ')}`);
      console.log(`📊 Total data being sent:`, {
        mcqs_count: parsedMcqs.length,
        languages: config.languages,
        local_words: config.localWords.length,
        global_words: config.globalWords.length
      });

      const res = await fetch("/api/palms/translation", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 202 && json?.success) {
        console.log("✅ Translation job accepted by server (202)", json);
        message.success(`Translation started for ${mcqData.count} questions in ${config.languages.length} language(s)`);
        setTranslationModalOpen(false);
        startSuccessCountdown('translation');
        return;
      }

      console.log("❌ Server failed to accept translation request", { status: res.status, json });
      Modal.error({
        title: "Failed to start translation",
        content: json?.error || `Server returned ${res.status}`,
      });
    } catch (e: any) {
      console.error("❌ Error during translation", e);
      Modal.error({
        title: "Translation Error",
        content: e?.message || "Could not complete the translation request.",
      });
    } finally {
      setTranslationLoading(false);
      console.log("ℹ️ Translation process finished");
    }
  };

  const handleReplicate = () => {
    if (!selectedPaperId) {
      message.warning("Please select a paper ID first");
      return;
    }
    if (mcqs.length === 0) {
      message.warning("No questions available to replicate");
      return;
    }
    
    // Show the success popup immediately and start replication in background
    startSuccessCountdown('replication');
    
    // Start the replication process in background
    handleReplicateSubmit();
  };

  const handleReplicateSubmit = async () => {
    const uid = getNumericUserId();
    if (!uid) {
      message.error("Please sign in to replicate questions");
      return;
    }

    console.log("🔄 Starting replicate process for Paper ID:", selectedPaperId);

    const cleaned = (promptPairs || []).filter((p) => p?.keyLabel && p?.prompt?.trim());
    if (cleaned.length === 0) {
      message.error("No prompts available.");
      return;
    }

    // Build field_map object like in replicate page
    const fieldMapObj: Record<string, string> = {};
    for (const pair of cleaned) fieldMapObj[pair.keyLabel] = pair.prompt.trim();

    setReplicateLoading(true);

    try {
      // Step 1: Fetch full MCQ data with options
      console.log("📥 Fetching full MCQ data for replication...");
      const mcqResponse = await fetch("/api/palms/generate/home", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paper_id: selectedPaperId, action: "full" }),
      });

      const mcqData = await mcqResponse.json();

      if (!mcqData.success || !mcqData.data) {
        throw new Error("Failed to fetch full MCQ data");
      }

      console.log(`✅ Fetched ${mcqData.count} MCQs with options`);

      // Step 1.5: Data is already properly formatted by API, just ensure consistency
      const parsedMcqs = mcqData.data.map((mcq: any) => {
        // API already returns properly formatted question and options from JSONB
        return {
          question_id: mcq.question_id,
          question: mcq.question || '',
          options: Array.isArray(mcq.options) ? mcq.options : [],
          answer: mcq.answer || '',
          solution_text: cleanSolutionText(mcq.solution_text)
        };
      });

      console.log(`✅ Parsed ${parsedMcqs.length} MCQs with separated questions and options`);
      console.log('📊 Sample parsed MCQ for replication:', parsedMcqs[0] ? {
        question_id: parsedMcqs[0].question_id,
        question: parsedMcqs[0].question?.substring(0, 100) + '...',
        options: parsedMcqs[0].options,
        solution_text: parsedMcqs[0].solution_text?.substring(0, 50) + '...'
      } : 'No data');

      // Step 2: Send to replicate API with full MCQ array
      const formData = new FormData();
      formData.append("input_type", "replicate");
      formData.append("user_id", uid);
      formData.append("field_map", JSON.stringify(fieldMapObj));
      formData.append("paper_id", selectedPaperId!);
      formData.append("mcq_s", JSON.stringify(parsedMcqs)); // Send as JSON array

      console.log("📤 Sending replication request...");

      const res = await fetch("/api/palms/replicate", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 202 && json?.success) {
        console.log("✅ Replicate job accepted by server (202)", json);
        const job_id = json.job_id;
        
        // Keep the success modal open, and show background progress message
        message.loading({ content: `Replication started for ${mcqData.count} questions. Processing...`, key: 'replication', duration: 0 });
        
        // ✅ Poll job status for progress updates
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_SERVER || 'http://localhost:8000'}/process/job/${job_id}`);
            
            if (statusRes.status === 404) {
              // Job not found - stop polling (job completed or never existed)
              console.log('⚠️ Job not found, stopping polling');
              clearInterval(pollInterval);
              message.warning({ content: 'Job status unavailable. Check results in list.', key: 'replication' });
              return;
            }
            
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              const progress = statusData.progress || 0;
              const currentStep = statusData.current_step || 'processing';
              
              // Parse batch info from current_step (e.g., "processing_batch_2_of_5")
              let displayStep = currentStep;
              const batchMatch = currentStep.match(/processing_batch_(\d+)_of_(\d+)/);
              if (batchMatch) {
                const currentBatch = batchMatch[1];
                const totalBatches = batchMatch[2];
                displayStep = `Batch ${currentBatch}/${totalBatches}`;
              } else if (currentStep.includes('_')) {
                displayStep = currentStep.replace(/_/g, ' ');
              }
              
              console.log(`📊 Job progress: ${progress}% - ${currentStep}`);
              message.loading({ 
                content: `Replicating ${mcqData.count} questions: ${progress}% - ${displayStep}`, 
                key: 'replication', 
                duration: 0 
              });
              
              if (statusData.status === 'finished') {
                clearInterval(pollInterval);
                message.success({ content: `Replication completed successfully!`, key: 'replication' });
              } else if (statusData.status === 'failed') {
                clearInterval(pollInterval);
                message.error({ content: `Replication failed: ${statusData.error}`, key: 'replication' });
                setReplicateLoading(false);
              }
            }
          } catch (err) {
            console.error('Error polling job status:', err);
          }
        }, 2000); // Poll every 2 seconds
        
        // ✅ Stop polling after 10 minutes (timeout)
        setTimeout(() => {
          clearInterval(pollInterval);
          message.warning({ content: 'Job is still processing. Please check status later.', key: 'replication' });
        }, 600000); // 10 minutes
        
        return;
      }

      console.log("❌ Server failed to accept replicate request", { status: res.status, json });
      Modal.error({
        title: "Failed to start replication",
        content: json?.error || `Server returned ${res.status}`,
      });
    } catch (e: any) {
      console.error("❌ Error during replication", e);
      Modal.error({
        title: "Replication Error",
        content: e?.message || "Could not complete the replication request.",
      });
    } finally {
      setReplicateLoading(false);
      console.log("ℹ️ Replicate process finished");
    }
  };

  const handleTagging = () => {
    if (!selectedPaperId) {
      message.warning("Please select a paper ID first");
      return;
    }
    if (mcqs.length === 0) {
      message.warning("No questions available to tag");
      return;
    }
    setTaggingModalOpen(true);
  };

  const handleStartTagging = async (selectedCategories: any[]) => {
    const uid = getNumericUserId();
    if (!uid) {
      message.error("Please sign in to tag questions");
      return;
    }

    if (!selectedPaperId) {
      message.error("Please select a paper first");
      return;
    }

    if (!selectedCategories || selectedCategories.length === 0) {
      message.warning("Please select at least one tagging category");
      return;
    }

    console.log("🏷️ Starting tagging process for Paper ID:", selectedPaperId, "User ID:", uid);
    console.log("📋 Selected categories:", selectedCategories);

    setTaggingModalOpen(false);
    setTaggingLoading(true);

    try {
      // Parse questions before sending to API - extract question text and options from JSONB
      const parsedQuestions = mcqs.map((q) => {
        // Use the existing helper function to get clean question text and options from JSONB
        const parsed = parseQuestionForAPI(q.question_text, q.options);
        return {
          question_id: q.question_id,
          question: parsed.question || q.question_text || q.question_id,
          options: parsed.options.length > 0 ? parsed.options : extractOptionsFromJsonb(q.options),
          solution_text: cleanSolutionText(q.solution_text)
        };
      });

      console.log(`✅ Parsed ${parsedQuestions.length} questions for tagging`);
      console.log(`📋 Using ${selectedCategories.length} selected tagging categories`);
      console.log('📊 Sample parsed question for tagging:', parsedQuestions[0] ? {
        question_id: parsedQuestions[0].question_id,
        question: parsedQuestions[0].question?.substring(0, 100) + '...',
        options: parsedQuestions[0].options,
        solution_text: parsedQuestions[0].solution_text?.substring(0, 50) + '...'
      } : 'No data');

      const response = await fetch("/api/palms/start_tagging", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paper_id: selectedPaperId,
          user_id: uid,
          questions: parsedQuestions,
          selected_categories: selectedCategories,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("✅ Tagging completed successfully", result);
        message.success(`Tagging completed for ${result.total_questions} questions`);
        startSuccessCountdown('tagging');
        return;
      } else {
        console.error("❌ Tagging failed", result);
        Modal.error({
          title: "Tagging Failed",
          content: result.error || "Failed to complete tagging process",
        });
      }
    } catch (error: any) {
      console.error("❌ Error during tagging", error);
      Modal.error({
        title: "Tagging Error",
        content: error?.message || "Could not complete the tagging request.",
      });
    } finally {
      setTaggingLoading(false);
      console.log("ℹ️ Tagging process finished");
    }
  };

  // Define table columns
  const columns: ColumnsType<MCQData> = [
    {
      title: "S.No",
      key: "index",
      width: 80,
      align: "center",
      render: (_: any, __: MCQData, index: number) => index + 1,
    },
    {
      title: "Question ID",
      dataIndex: "question_id",
      key: "question_id",
      width: 150,
      render: (text: string) => <span className={styles.questionIdCell}>{text}</span>,
    },
    {
      title: "Question",
      dataIndex: "question_text",
      key: "question_text",
      ellipsis: false,
      render: (text: string | null) => (
        <div className={styles.questionTextCell}>
          {parseQuestionTextOnly(text) || <span className={styles.noData}>No question text</span>}
        </div>
      ),
    },
    {
      title: "Options",
      dataIndex: "options",
      key: "options",
      width: 250,
      ellipsis: false,
      render: (_: any, record: MCQData) => (
        <div className={styles.optionsCell}>
          {renderOptions(record.options)}
        </div>
      ),
    },
    {
      title: "Area",
      dataIndex: "area",
      key: "area",
      width: 180,
      render: (text: string | null) => (
        <span className={text ? styles.areaCell : styles.noData}>
          {text || "Not tagged"}
        </span>
      ),
    },
    {
      title: "Solution",
      dataIndex: "solution_text",
      key: "solution_text",
      width: 200,
      ellipsis: false,
      render: (text: string | null) => {
        const cleanedText = cleanSolutionText(text);
        const truncatedText = cleanedText ? truncateToFiveLines(cleanedText) : '';
        const shouldTruncate = cleanedText && cleanedText.length > truncatedText.length;
        
        return (
          <div className={styles.solutionCell}>
            {cleanedText ? (
              <Tooltip 
                title={shouldTruncate ? cleanedText : undefined}
                placement="topLeft"
                overlayStyle={{ maxWidth: 600, whiteSpace: 'pre-wrap' }}
              >
                <span className={styles.solutionText}>
                  {truncatedText}
                  {shouldTruncate && '...'}
                </span>
              </Tooltip>
            ) : (
              <span className={styles.noData}>No solution</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.controlPanel}>
        <div className={styles.selectContainer}>
          <label className={styles.label}>Select Paper ID:</label>
          <Select
            showSearch
            placeholder="Select a paper ID"
            value={selectedPaperId}
            onChange={handlePaperIdChange}
            loading={loadingPaperIds}
            className={styles.select}
            size="large"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children as unknown as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {paperIds.map((paperId) => (
              <Option key={paperId} value={paperId}>
                {paperId}
              </Option>
            ))}
          </Select>
        </div>

        {selectedPaperId && mcqs.length > 0 && (
          <div className={styles.actionButtons}>
            <Button
              type="primary"
              icon={<TranslationOutlined />}
              onClick={handleTranslate}
              className={styles.translateBtn}
              size="large"
              disabled={replicateLoading || taggingLoading || translationLoading}
            >
              Translate
            </Button>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={handleReplicate}
              className={styles.replicateBtn}
              size="large"
              loading={replicateLoading}
              disabled={replicateLoading || taggingLoading || translationLoading}
            >
              Replicate
            </Button>
            <Button
              type="primary"
              icon={<TagsOutlined />}
              onClick={handleTagging}
              className={styles.taggingBtn}
              size="large"
              loading={taggingLoading}
              disabled={replicateLoading || taggingLoading || translationLoading}
            >
              Tagging
            </Button>
          </div>
        )}
      </div>

      <div className={styles.contentArea}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" tip="Loading MCQs...">
              <div />
            </Spin>
          </div>
        ) : mcqs.length > 0 ? (
          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>
                Questions for Paper ID: <span className={styles.paperIdHighlight}>{selectedPaperId}</span>
              </h2>
              <div className={styles.mcqCount}>
                Total Questions: <strong>{mcqs.length}</strong>
              </div>
            </div>
            <Table
              columns={columns}
              dataSource={mcqs}
              rowKey="question_id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} questions`,
                pageSizeOptions: ["10", "20", "50", "100"],
              }}
              bordered
              className={styles.mcqTable}
              scroll={{ x: 800 }}
            />
          </div>
        ) : selectedPaperId ? (
          <div className={styles.emptyContainer}>
            <Empty description="No questions found for this paper ID" />
          </div>
        ) : (
          <div className={styles.emptyContainer}>
            <Empty description="Please select a paper ID to view questions" />
          </div>
        )}
      </div>

      {/* Success modal with countdown */}
      <Modal
        open={successModalOpen}
        title={
          actionType === 'replication' 
            ? "Replication Started" 
            : actionType === 'translation' 
            ? "Translation Started" 
            : "Tagging Started"
        }
        onCancel={() => setSuccessModalOpen(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <div style={{ opacity: 0.8 }}>Redirecting to view/edit page in {countdown}s…</div>
            <Spin />
          </div>
        }
        centered
      >
        {actionType === 'replication' && (
          <p>
            Your questions are being replicated. We'll take you to the view/edit page so you can see
            questions and transformations as they appear.
          </p>
        )}
        {actionType === 'translation' && (
          <p>
            Your questions are being translated into multiple languages. We'll take you to the view/edit page 
            where you can monitor the translation progress and review the translated questions.
          </p>
        )}
        {actionType === 'tagging' && (
          <p>
            Your questions are being automatically tagged with AI. We'll take you to the view/edit page 
            where you can see the tagged questions and their categories.
          </p>
        )}
      </Modal>

      {/* Translation Modal */}
      <TranslationModal
        open={translationModalOpen}
        onCancel={() => setTranslationModalOpen(false)}
        onTranslate={handleTranslationSubmit}
        loading={translationLoading}
      />

      {/* Tagging Data Modal */}
      <TaggingDataModal
        open={taggingModalOpen}
        onCancel={() => setTaggingModalOpen(false)}
        onStartTagging={handleStartTagging}
      />

      {/* Replicate Modal */}
      <ReplicateModal
        open={replicateModalOpen}
        onCancel={() => setReplicateModalOpen(false)}
        onReplicate={handleReplicateSubmit}
        loading={replicateLoading}
      />
    </div>
  );
}
