"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { message as antdMessage } from "antd";
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Radio,
  Select,
  Tooltip,
  Modal,
  Image,
  Checkbox,
} from "antd"; // <-- added Checkbox and Image here
import styles from "./exam.module.css";
import { useSession } from "next-auth/react";
import useTestStore from "@/store/evaluate/teststore";
import useSubjectStore from "@/store/evaluate/subjectid";
import { useRouter } from "next/navigation";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import { commonStore } from "@/store/common/common";
import ReactPlayer from "react-player";
import {
  CheckOutlined,
  FileTextOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import TestSummary from "@/components/evaluate/instructionsPage";
import JSZip from "jszip";
import useNavigationConfirmation from "@/components/common/refresh-back-confirmation";
import InternetSpeedTest from "@/components/evaluate/internetSpeedMeter";

const { Text, Title } = Typography;


/* ================ DragList ================ */
interface DragListProps {
  choices: { key: string; text: string }[]; // e.g. [{key: "A", text: "1"}, ...]
  initialOrder?: string[]; // e.g. ["A","B","C"]
  onChange?: (orderedKeys: string[]) => void;
  readOnly?: boolean;
  dragHandle?: boolean;
}

function DragList({ choices, initialOrder, onChange, readOnly }: DragListProps) {
  // Build initial list (array of {key,text}) using provided initialOrder when available.
  const buildList = useCallback((): { key: string; text: string }[] => {
    if (!initialOrder || initialOrder.length === 0) return choices;
    const byKey = new Map(choices.map((c) => [c.key, c]));
    const ordered: { key: string; text: string }[] = [];
    initialOrder.forEach((k) => {
      const v = byKey.get(k);
      if (v) ordered.push(v);
    });
    // append remaining choices that weren't in initialOrder (safety)
    choices.forEach((c) => {
      if (!ordered.find((x) => x.key === c.key)) ordered.push(c);
    });
    return ordered;
  }, [choices, initialOrder]);

  // Initialize items from buildList (will be stable on first render)
  const [items, setItems] = useState(() => buildList());

  // Use a ref to track if we're in the middle of an internal update
  const isInternalUpdate = useRef(false);

  // Only update items when external props change, not when internal drag operations occur
  useEffect(() => {
    // Skip if this is an internal update from drag operations
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const next = buildList();
    const nextKeys = next.map((i) => i.key).join(",");
    const currentKeys = items.map((i) => i.key).join(",");

    if (nextKeys !== currentKeys) {
      setItems(next);
    }
  }, [buildList, items]);

  // Drag handlers
  const handleDragStart = (ev: React.DragEvent<HTMLDivElement>, index: number) => {
    ev.dataTransfer.setData("text/plain", String(index));
    ev.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (ev: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    ev.preventDefault();
    const srcIndex = Number(ev.dataTransfer.getData("text/plain"));
    if (Number.isNaN(srcIndex)) return;
    if (srcIndex === dropIndex) return;

    // Mark this as an internal update
    isInternalUpdate.current = true;

    const next = items.slice();
    const [moved] = next.splice(srcIndex, 1);
    next.splice(dropIndex, 0, moved);
    setItems(next);

    // Notify parent of the change
    if (onChange) {
      onChange(next.map((i) => i.key));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "6px 0" }}>
      {items.map((it, idx) => (
        <div
          key={it.key}
          draggable={!readOnly}
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, idx)}
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #e8e8e8",
            cursor: readOnly ? "default" : "grab",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
          aria-label={`Draggable option ${it.key}`}
        >
          <div style={{ minWidth: 28, textAlign: "center", fontWeight: 600 }}>{it.key}</div>
          <div style={{ flex: 1 }}>{it.text}</div>
        </div>
      ))}
    </div>
  );
}

interface Question {
  negative_marks?: number;
  question_type: string;
  question_number: number | string;
  user_answer?: string; // we store CSV like "A,C" or single "A"
  attempted?: boolean;
  question: string;
  choice1?: string;
  choice2?: string;
  choice3?: string;
  choice4?: string;
  resource_type: string;
  paragraph: string;
  help_files?: string;
  showCorrectAnswer?: boolean;
  correct_answer?: string;
  subject_id: number;
  topic_id: string | number;
  answer?: string;
  ANSWER?: string;
  rownumber?: number;
  markedForReview?: boolean;
}

interface Subject {
  topic_id: never[];
  subject_id: number;
  subject_description: string;
  duration_min: number;
}

const ExamPage = () => {
  useNavigationConfirmation();
  let logoName = "";
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentQn, setCurrentQn] = useState(0);
  const [dbData, setDBData] = useState<Question[]>([]);
  const [currentSubject, setCurrentSubject] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);
  const [distractionTime, setDistractionTime] = useState(0);
  const { data: session } = useSession();
  const user_id = session?.user?.id;
  const role = session?.user?.role;
  const { subjectId, setSubjectId } = useSubjectStore();
  const { testId, userTestId } = useTestStore();
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [distractionStartTime, setDistractionStartTime] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isQuestionPaperModalVisible, setIsQuestionPaperModalVisible] = useState(false);
  const [isTestInstructionsVisible, setIsTestInstructionsVisible] = useState(false);
  const safeTestId = testId || "";
  const [selectedTopic, setSelectedTopic] = useState("All");
  const { Option } = Select;
  const minutesLeft = Math.floor(((duration ?? 0) * 60 - seconds) / 60);
  const secondsLeft = Math.floor(((duration ?? 0) * 60 - seconds) % 60);
  const formattedTime = `${String(minutesLeft).padStart(2, "0")}:${String(secondsLeft).padStart(2, "0")}`;
  const [isExpanded, setIsExpanded] = useState(true);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [video, setVideo] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { settingsData } = commonStore();
  let exam_video = 0;
  const [loading, setLoading] = useState(false);
  const [isListeningModalVisible, setIsListeningModalVisible] = useState(false);
  const rawSettingsJson = settingsData[0]?.SETTINGS_JSON || "{}";
  const [hasAccess, setHasAccess] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [submittingSection, setSubmittingSection] = useState(false);

  const submittedSubjectsRef = useRef<Record<number, boolean>>({}); // per-subject submit flag
  const submittingNowRef = useRef(false);                            // block concurrent posts
  const finalizedRef = useRef(false);                                // finalize only once

  const markSubmitted = (sid: number | string) => {
    submittedSubjectsRef.current[Number(sid)] = true;
  };
  const isSubmitted = (sid: number | string) =>
    !!submittedSubjectsRef.current[Number(sid)];

  // Timer ref to manage the single interval instance.
  const timerRef = useRef<number | null>(null);

  const sanitizedJson = rawSettingsJson.replace(/'/g, '"').replace(/(\w+)\s*:/g, '"$1":');


  try {
    const settingsJson = JSON.parse(sanitizedJson);
    exam_video = settingsJson.exam_video;
    logoName = settingsJson.logo_name;
  } catch (error) {
    console.error("Failed to parse SETTINGS_JSON:", error);
  }

  // --------------- helper: build api url to serve file ---------------
  const buildFileApiUrl = (rawPath?: string | null) => {
    if (!rawPath) return null;
    const trimmed = rawPath.replace(/^\/+/, ""); // remove leading slashes
    const parts = trimmed.split("/");
    const filename = parts[parts.length - 1];
    if (!filename) return null;
    return `/api/evaluate/files/${encodeURIComponent(filename)}`;
  };

  // --------------- video recording handlers (unchanged) ---------------
  useEffect(() => {
    if (videoRef.current && video) {
      videoRef.current.srcObject = video;
    }
  }, [video]);

  const startRecording = async () => {
    // guard: if already recording, skip starting again
    if (isRecording) return;

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { ideal: 640 }, height: { ideal: 360 } },
      });
      setHasAccess(true);
      const recorder = new MediaRecorder(videoStream, { mimeType: "video/webm" });
      const localChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) localChunks.push(event.data);
      };

      const handleStop = async () => {
        const blob = new Blob(localChunks, { type: "video/webm" });
        if (blob.size === 0 || exam_video == 0) return;
        const formData = new FormData();
        const fileName = `${Date.now()}.webm`;
        const zip = new JSZip();
        zip.file("video.webm", blob);
        const zippedBlob = await zip.generateAsync({ type: "blob" });

        if (testId && userTestId) {
          formData.append("video", zippedBlob, fileName);
          formData.append("testId", testId);
          formData.append("subjectId", subjectId!.toString());
          formData.append("userTestId", userTestId);
        } else {
          console.error("testId or userTestId is null");
          return;
        }

        try {
          const response = await fetch("/api/evaluate/exam/savevideo", { method: "POST", body: formData });
          if (response.ok) {
            setLoading(false);
            return "success";
          } else {
            return "failed";
          }
        } catch (err) {
          console.error("Error uploading video:", err);
        }

        videoStream.getTracks().forEach((track) => track.stop());
        setMediaRecorder(null);
        setIsRecording(false);
      };

      recorder.onstop = handleStop;
      recorder.start();
      setMediaRecorder(recorder);
      setVideo(videoStream);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing video stream:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) mediaRecorder.stop();
    if (video) {
      video.getTracks().forEach((track) => track.stop());
      setVideo(null);
    }
  };

  // --------------- fetch subjects & questions ---------------
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!testId) return;
      try {
        const response = await fetch(`/api/evaluate/exam/getsubjectslist?testid=${testId}`);
        if (!response.ok) throw new Error("Failed to fetch subjects");
        const data: Subject[] = await response.json();
        setSubjects(data);
        if (data.length > 0) {
          setSubjectId(data[0].subject_id.toString());
          setCurrentSubject(0);
          setDuration(data[0].duration_min || 0);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };
    fetchSubjects();
  }, [testId, setSubjectId]);

  const fetchQuestions = useCallback(async () => {
    if (!subjectId || !user_id) return;
    try {
      const response = await fetch(`/api/evaluate/exam/examquestionsbysubject?testid=${testId}&subjectid=${subjectId}&userid=${user_id}`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data: Question[] = await response.json();

      // Ensure user_answer and markedForReview initialized
      // const updatedQuestions = data.map((q: Question, idx) => ({

      //   ...q,
      //   markedForReview: q.markedForReview ?? false,
      //   user_answer: q.user_answer ?? "", // keep string CSV format
      //   rownumber: q.rownumber ?? idx + 1,
      // }));

      const updatedQuestions = data.map((q: Question, idx) => {
        // canonical keys for present choices
        const keys: string[] = [];
        if (q.choice1) keys.push("A");
        if (q.choice2) keys.push("B");
        if (q.choice3) keys.push("C");
        if (q.choice4) keys.push("D");

        const qType = (q.question_type || "").toString().trim().toUpperCase();
        const isArrange = ["ARRANGE", "ORDER", "DRAG"].includes(qType);

        // default for arrange-type questions is the current keys order (A,B,C,...)
        const defaultArrangeAnswer = isArrange ? keys.join(",") : "";

        // prefer existing non-empty user_answer; otherwise for arrange use default, else empty string
        const existing = q.user_answer ?? "";
        const userAnswer = (existing && existing.toString().trim() !== "")
          ? existing.toString().trim()
          : defaultArrangeAnswer;

        return {
          ...q,
          markedForReview: q.markedForReview ?? false,
          user_answer: userAnswer,
          rownumber: q.rownumber ?? idx + 1,
        };
      });


      setDBData(updatedQuestions);
      setCurrentQn(0);
      setSelectedTopic("All");
      startRecording();
    } catch (error) {
      console.error("Error fetching exam questions:", error);
    }
  }, [subjectId, testId, user_id]);

  useEffect(() => {
    if (subjects.length > 0 && currentSubject < subjects.length) {
      fetchQuestions();
    }
    if (subjects[currentSubject]?.subject_description === "LISTENING") {
      setIsListeningModalVisible(true);
    }
  }, [currentSubject, subjects, fetchQuestions]);


  useEffect(() => {
    // clear previous timer when duration becomes null or changes
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (duration == null) return;

    // reset seconds to 0 whenever duration is newly set (guard: keep existing behaviour when you change subject)
    // Note: you already reset seconds to 0 in submit/subject switch; this is a safe additional measure.
    setSeconds((prev) => {
      // if prev is already 0, leave it; otherwise reset when duration changes
      return prev;
    });

    timerRef.current = window.setInterval(() => {
      setSeconds((prevSeconds) => {
        const next = prevSeconds + 1;
        if (duration !== null && next >= duration * 60) {
          // stop timer and run end-of-section logic once
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // stop recording if enabled
          if (exam_video === 1) {
            try {
              stopRecording();
            } catch (e) {
              console.error("Error stopping recording:", e);
            }
          }
          // call submitCurrentSubject — this is asynchronous; we do not await here inside interval
          // submitCurrentSubject().catch((e) => console.error("submitCurrentSubject failed:", e));
          if (!isSubmitted(subjectId!)) {
            submitCurrentSubject().catch((e) => console.error("submitCurrentSubject failed:", e));
          }
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // Run the effect only when duration or exam_video changes.
    // Do NOT include 'seconds' here to avoid recreating interval every tick.
  }, [duration, exam_video]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setDistractionCount((prev) => prev + 1);
        setDistractionStartTime(Date.now());
      } else if (distractionStartTime) {
        const timeAway = (Date.now() - distractionStartTime) / 1000;
        setDistractionTime((prev) => prev + timeAway);
        setDistractionStartTime(null);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [distractionStartTime]);

  // --------------- answer update helper (multi/single) ---------------
  /**
   * We accept either a string (radio/text) OR an array (checkboxes)
   * If array -> convert to CSV string in canonical order A,B,C,D, uppercase and dedupe.
   */
  const optionOrder = ["A", "B", "C", "D"];

  const normalizeAnswerArray = (arr: any[]): string => {
    const up = (arr || []).map((v) => String(v || "").trim().toUpperCase()).filter(Boolean);
    // dedupe and preserve A,B,C,D order
    const set = new Set(up);
    return optionOrder.filter((o) => set.has(o)).join(",");
  };

  const updateAnswer = (questionIndex: number, value: string | string[]) => {
    const updatedQuestions = [...dbData];
    if (Array.isArray(value)) {
      // checkbox -> array of selected option keys
      updatedQuestions[questionIndex].user_answer = normalizeAnswerArray(value);
    } else {
      // radio or text -> single string (store uppercase)
      updatedQuestions[questionIndex].user_answer = (value ?? "").toString().trim().toUpperCase();
    }
    setDBData(updatedQuestions);
  };

  const getContentByQuestionType = (d: Question, index: number) => {
    const qTypeRaw = (d?.question_type ?? "").toString();
    const qType = qTypeRaw.trim().toUpperCase();

    // helper to build canonical current user answers array for checkbox value
    const checkedValueArr = (d.user_answer || "")
      .toString()
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    // common order used when converting checkbox selections back to CSV
    const optionOrder = ["A", "B", "C", "D"];
    const normalizeAnswerArray = (arr: any[]) => {
      const up = (arr || []).map((v) => String(v || "").trim().toUpperCase()).filter(Boolean);
      const set = new Set(up);
      return optionOrder.filter((o) => set.has(o)).join(",");
    };

    // Choice rendering for MC / MULTICHOICE
    if (qType === "MC" || qType === "MULTICHOICE") {
      const isMulti = qType === "MULTICHOICE"; // explicit check per your request

      // Build options — only include choices that actually exist
      const optionsArray = [
        d.choice1 ? { label: `(A) ${d.choice1}`, value: "A" } : null,
        d.choice2 ? { label: `(B) ${d.choice2}`, value: "B" } : null,
        d.choice3 ? { label: `(C) ${d.choice3}`, value: "C" } : null,
        d.choice4 ? { label: `(D) ${d.choice4}`, value: "D" } : null,
      ].filter(Boolean) as { label: string; value: string }[];

      if (isMulti) {
        // Checkbox UI
        return (
          <Checkbox.Group
            options={optionsArray}
            value={checkedValueArr}
            onChange={(checkedValues) => {
              const csv = normalizeAnswerArray(checkedValues as string[]);
              updateAnswer(index, checkedValues as string[]); // still update state with helper
              // updateAnswer already normalizes to CSV and writes to dbData, so this is optional duplication
            }}
            style={{ display: "flex", flexDirection: "column", padding: "0px 10px 10px 10px" }}
          />
        );
      } else {
        // Single choice radio UI
        return (
          <Radio.Group
            onChange={(e) => updateAnswer(index, e.target.value)}
            value={d.user_answer || null}
            style={{ display: "flex", flexDirection: "column", padding: "0px 10px 10px 10px" }}
          >
            {d.choice1 && <Radio value="A">{`(A) ${d.choice1}`}</Radio>}
            {d.choice2 && <Radio value="B">{`(B) ${d.choice2}`}</Radio>}
            {d.choice3 && <Radio value="C">{`(C) ${d.choice3}`}</Radio>}
            {d.choice4 && <Radio value="D">{`(D) ${d.choice4}`}</Radio>}
          </Radio.Group>
        );
      }
    }

    // TEXTAREA / TEXT handling (unchanged)
    if (qType === "TEXTAREA") {
      return (
        <FormControl fullWidth>
          <TextField
            id={`question-${d.question_number}`}
            multiline
            rows={8}
            variant="outlined"
            aria-label="With textarea"
            onChange={(e) => updateAnswer(index, e.target.value)}
            onPaste={(e) => e.preventDefault()}
            placeholder="Enter your answer here"
            fullWidth
            value={dbData[index]?.user_answer || ""}
            style={{ display: "flex", flexDirection: "column", padding: "0px", margin: "0" }}
          />
        </FormControl>
      );
    }

    if (qType === "TEXT") {
      return (
        <FormControl fullWidth>
          <TextField
            id={`question-${d.question_number}`}
            variant="outlined"
            aria-label="Text input"
            onChange={(e) => updateAnswer(index, e.target.value)}
            onPaste={(e) => e.preventDefault()}
            placeholder="Enter your answer"
            fullWidth
            value={dbData[index]?.user_answer || ""}
          />
        </FormControl>
      );
    }

    if (qType === "ARRANGE" || qType === "ORDER" || qType === "DRAG") {
      // build choices from available choice1..choice4 (or more)
      const choiceEntries = [
        d.choice1 ? { key: "A", text: d.choice1 } : null,
        d.choice2 ? { key: "B", text: d.choice2 } : null,
        d.choice3 ? { key: "C", text: d.choice3 } : null,
        d.choice4 ? { key: "D", text: d.choice4 } : null,
      ].filter(Boolean) as { key: string; text: string }[];

      // initial order from user's previous answer or default A,B,C,...
      const initialOrderArr = (d.user_answer && d.user_answer.toString().trim() !== "")
        ? d.user_answer.toString().split(",").map(s => s.trim().toUpperCase()).filter(Boolean)
        : choiceEntries.map(c => c.key);

      return (
        <div>
          <p style={{ marginBottom: 8, color: "#333" }}>Drag to reorder into correct sequence</p>
          <DragList
            choices={choiceEntries}
            initialOrder={initialOrderArr}
            onChange={(orderedKeys) => {
              // convert to CSV and save to dbData
              const csv = orderedKeys.join(",");
              updateAnswer(index, csv); // reuse your updateAnswer (it uppercases)
            }}
          />
          <div style={{ marginTop: 8 }}>
            {/* <small style={{ color: "#777" }}>Your order: {(d.user_answer || initialOrderArr.join(",")).toString()}</small>
             */}
            <small style={{ color: "#777" }}>
              {d.user_answer ? `Your order: ${d.user_answer}` : "Not answered"}
            </small>
          </div>
        </div>
      );
    }

    // unknown type -> show admin message
    return <p>Oops. Something is not correct. Please contact the administrator.</p>;
  };

  const renderChoices = (question: Question, idx?: number) => {
    // pass index so updateAnswer knows which element to update
    const index = typeof idx === "number" ? idx : dbData.findIndex((q) => q === question);
    return getContentByQuestionType(question, index);
  };

  // --------------- resource header rendering (SMALLER IMAGE handling) ---------------
  const getHeaderByResourceType = (question: Question | undefined) => {
    if (!question) return null;
    switch ((question.resource_type || "").toUpperCase()) {
      case "IMAGE": {
        // const apiUrl = buildFileApiUrl(question.paragraph) || buildFileApiUrl(question.help_files);
        const apiUrl = buildFileApiUrl(question.help_files);
        if (!apiUrl) return null;
        // limit image size so it doesn't overflow — keep aspect ratio using maxWidth/maxHeight
        return (
          <div className={`${styles["responsive-image2"]}`} style={{ display: "flex", justifyContent: "center" }}>
            <Image
              key={apiUrl}
              src={apiUrl}
              alt="help file"
              style={{ maxWidth: "420px", maxHeight: "360px", objectFit: "contain", borderRadius: 6 }}
              preview={{ mask: null }}
            />
          </div>
        );
      }
      case "AUDIO": {
        const apiUrl = buildFileApiUrl(question.help_files);
        if (!apiUrl) return null;
        return (
          <audio key={apiUrl} controls controlsList="nodownload" style={{ width: "100%" }}>
            <source src={apiUrl} />
          </audio>
        );
      }
      case "VIDEO": {
        const apiUrl = buildFileApiUrl(question.help_files);
        if (!apiUrl) return null;
        return (
          <video controls style={{ maxWidth: "100%", height: "auto" }}>
            <source src={apiUrl} />
            Your browser does not support the video tag.
          </video>
        );
      }
      case "PARA": {
        const apiUrl =
          buildFileApiUrl(question.help_files) ;

        return (
          <>
            <div dangerouslySetInnerHTML={{ __html: question.paragraph || "" }} />
            {apiUrl && (
              <div className={styles["responsive-image1"]}>
                <Image
                  key={apiUrl}
                  src={apiUrl}
                  alt="help file"
                  style={{ maxWidth: "420px", objectFit: "contain" }}
                  preview={{ mask: null }}
                />
              </div>
            )}
          </>
        );
      }
      default:
        return <p>Oops. Something is not correct. Please contact administrator</p>;
    }
  };

  // --------------- UI helpers ---------------
  const getQuestionColor = (index: number) => {
    if (dbData[index]?.user_answer && dbData[index]?.markedForReview) return "purple";
    if (index === currentQn) return "#007BFF";
    if (dbData[index]?.user_answer) return "#28a745";
    if (dbData[index]?.markedForReview) return "purple";
    return "#dc3545";
  };

  const handleQuestionChange1 = (questionNumber: number) => {
    setCurrentQn(questionNumber - 1);
  };

  const clearResponse = (questionIndex: number) => {
    const updatedQuestions = [...dbData];
    updatedQuestions[questionIndex].user_answer = "";
    setDBData(updatedQuestions);
  };

  const toggleMarkForReview = (questionIndex: number) => {
    const updatedQuestions = [...dbData];
    updatedQuestions[questionIndex].markedForReview = !updatedQuestions[questionIndex].markedForReview;
    setDBData(updatedQuestions);
  };


  const submitCurrentSubject = async (): Promise<void> => {
    // ✅ Early exits with void
    if (!testId) { antdMessage.error("Technical error: missing test id"); return; }
    if (!subjectId) { antdMessage.error("Select a subject before submitting"); return; }
    if (!userTestId) { antdMessage.error("Technical error: missing user test id"); return; }
    if (!session?.user?.id) { antdMessage.error("Not signed in"); return; }
    if (isSubmitted(subjectId)) return;
    if (submittingNowRef.current) return;

    try {
      submittingNowRef.current = true;
      setLoading(true);

      const answers = dbData.map((q) => ({
        question_number: q.question_number,
        question: q.question,
        choice1: q.choice1,
        choice2: q.choice2,
        choice3: q.choice3,
        choice4: q.choice4,
        question_type: q.question_type,
        SUBJECT_ID: q.subject_id,
        topic_id: q.topic_id,
        Paragraph: q.paragraph,
        resource_type: q.resource_type,
        help_files: q.help_files,
        answer: (q as any).answer ?? (q as any).ANSWER ?? null,
        rownumber: q.rownumber,
        user_answer: q.user_answer ?? "",
        negative_marks: q.negative_marks,
      }));

      const answeredCount = answers.filter(a => String(a.user_answer || "").trim() !== "").length;

      if (answeredCount > 0) {
        const payload = {
          test_id: String(testId),
          subject_id: String(subjectId),
          answers,
          user_test_id: String(userTestId),
          timer_value: formattedTime,
          user_id: session.user.id,
        };

        const resp = await fetch("/api/evaluate/exam/submitexams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        let respJson: any = {};
        try { respJson = await resp.json(); } catch { }

        if (!resp.ok) {
          antdMessage.error(respJson?.message || `Submission failed (${resp.status})`);
          return; // ❗ stay on same subject if submit failed
        }
      } else {
        console.log("[submitCurrentSubject] Skipped POST because answers are empty");
      }

      // mark and advance/finalize
      markSubmitted(subjectId);

      const nextIdx = currentSubject + 1;
      if (nextIdx < subjects.length) {
        setCurrentSubject(nextIdx);
        setSubjectId(String(subjects[nextIdx].subject_id));
        setDuration(subjects[nextIdx].duration_min);
        setSeconds(0);
      } else {
        await finalizeExam();
      }
    } catch (err) {
      console.error("Error submitting exam:", err);
      antdMessage.error("Error submitting exam. Check console for details.");
    } finally {
      submittingNowRef.current = false;
      setLoading(false);
    }
  };

  const submitDistractionData = async () => {
    try {
      const response = await fetch("/api/evaluate/exam/distractioncount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_id: testId,
          user_id: user_id,
          distCount: distractionCount,
          distSecs: distractionTime,
          user_test_id: userTestId,
        }),
      });

      if (!response.ok) {
        if (role === "ADM") fetchLinkedTestDetails();
        throw new Error("Failed to submit distraction data");
      }
      await fetchTestResults();
    } catch (error) {
      console.error("Error submitting distraction data:", error);
    }
  };

  const fetchTestResults = async (retryCount = 1) => {
    try {
      const response = await fetch(`/api/evaluate/exam/gettestresults?testid=${testId}&userid=${user_id}`);
      if (!response.ok) {
        if (retryCount > 0) return fetchTestResults(retryCount - 1);
        throw new Error("Failed to fetch test results after retries");
      }
      await fetchLinkedTestDetails();
    } catch (error) {
      console.error("Error fetching test results:", error);
    }
  };

  const fetchLinkedTestDetails = async () => {
    if (!user_id) return;
    try {
      const response = await fetch(`/api/evaluate/getlinkedtest?test_id=${testId}`);
      const data = await response.json();
      if (data && data.linkedTestDetails && Array.isArray(data.linkedTestDetails) && data.linkedTestDetails.length > 0) {
        const testDetails = data.linkedTestDetails[0];
        const { TEST_ID, TEST_TYPE, TEST_TITLE } = testDetails;
        const url = `/codecompiler/home/test-pattern?TEST_ID=${TEST_ID.toString()}&TEST_TYPE=${TEST_TYPE}&TEST_TITLE=${TEST_TITLE}`;
        router.replace(url);
      } else {
        if (role === "ADM") router.push("/evaluate/admin/addTestDetails");
        else router.push("/evaluate/testdetails");
      }
    } catch (err) {
      console.log("Error fetching linked test: " + err);
    }
  };

  const finalizeExam = async () => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;

    try {
      if (exam_video === 1) stopRecording();
      await submitDistractionData();
    } finally {
      stopRecording();
    }
  };



  const currentQuestion = dbData[currentQn] || ({} as Question);

  const renderQuestionPaper = () => (
    <Modal
      title="Question Paper"
      open={isQuestionPaperModalVisible}
      onCancel={() => setIsQuestionPaperModalVisible(false)}
      onOk={() => setIsQuestionPaperModalVisible(false)}
      width={800}
    >
      {dbData.map((question, index) => (
        <div key={index} style={{ marginBottom: "20px", padding: "10px", borderBottom: "1px solid #ddd" }}>
          <Text strong>{`Q${index + 1}: ${question.question}`}</Text>
          {renderChoices(question, index)}
          <Text type="secondary">{`Your Answer: ${question.user_answer || "Not Answered"}`}</Text>
        </div>
      ))}
    </Modal>
  );

  return (
    <>
      <div className={styles.internetcontainer}>
        <InternetSpeedTest />
      </div>
      <div className={`${styles["evaluate-container"]}`}>
        <Row className={`${styles["evaluate-container-subject"]}`}>
          <Col span={12}>
            <Row>
              <Col>
                <h6 className={styles["evaluate-text-muted-1"]}>
                  SUBJECT - {subjects[currentSubject]?.subject_description || "No Subject"}
                </h6>
              </Col>
            </Row>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Row align="middle" justify="end" gutter={16}>
              <Row>
                <FileTextOutlined style={{ fontSize: 20, cursor: "pointer" }} onClick={() => setIsTestInstructionsVisible(true)} />
                <h6 className={styles["evaluate-text-muted"]} style={{ marginLeft: 4, marginRight: 10, cursor: "pointer", color: "grey" }} onClick={() => setIsTestInstructionsVisible(true)}>Instructions</h6>
              </Row>

              <Modal open={isTestInstructionsVisible} onCancel={() => setIsTestInstructionsVisible(false)} footer={null} width={800}>
                <TestSummary testId={safeTestId} />
              </Modal>

              <Row>
                <FileTextOutlined style={{ fontSize: 20, cursor: "pointer" }} onClick={() => setIsQuestionPaperModalVisible(true)} />
                <h6 className={styles["evaluate-text-muted"]} style={{ marginLeft: 4, cursor: "pointer", color: "grey" }} onClick={() => setIsQuestionPaperModalVisible(true)}>Question Paper</h6>
              </Row>

              <Col>
                <h6 className={styles["evaluate-text-muted"]} style={{ margin: 0 }}>
                  Time Left: {formattedTime}
                </h6>
              </Col>
            </Row>
          </Col>
          {renderQuestionPaper()}
        </Row>

        <Card className={`${styles.evaluatecardheading}`}>
          <header className={`${styles.evaluatequestionheading}`}>{getHeaderByResourceType(currentQuestion)}</header>
        </Card>

        <Card className={`${styles.evaluatecardquestion}`}>
          <Row gutter={16} align="top">
            <Col xs={isExpanded ? 16 : 23} sm={isExpanded ? 16 : 23} md={isExpanded ? 18 : 23}>
              <Card className={`${styles.evaluatequestioncard}`}>
                <Title level={5} className={`${styles.evaluatequestion}`}>
                  <div>
                    <span style={{ fontWeight: "bold", marginRight: "4px", color: "#555" }}>({currentQn + 1}/{dbData.length}).</span> {currentQuestion.question || "No question available"}
                  </div>
                </Title>

                {renderChoices(currentQuestion, currentQn)}

                <div style={{ marginTop: "16px" }} />
                <Col style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Button type="primary" className={`${styles.evaluate}`} style={{ backgroundColor: "#8956a9", marginBottom: "1rem" }} onClick={() => toggleMarkForReview(currentQn)}>
                    {dbData[currentQn]?.markedForReview ? "Unmark For Review" : "Mark For Review"}
                  </Button>
                  <Button className="primary-btn" type="default" onClick={() => clearResponse(currentQn)} style={{ marginLeft: "8px", marginBottom: "1rem" }}>Clear Response</Button>
                </Col>

                {currentQuestion?.negative_marks && currentQuestion.negative_marks != 0 && (
                  <Col>
                    <h6 className={styles["evaluate-text-muted-2"]} style={{ color: "grey" }}>Negative Marks: {currentQuestion.negative_marks}</h6>
                  </Col>
                )}
              </Card>
            </Col>

            <Col style={{ boxShadow: "none" }} xs={isExpanded ? 6 : 1} sm={isExpanded ? 6 : 1} md={isExpanded ? 6 : 1}>
       
              {isExpanded && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "30px 0",
                    }}
                  >
                    <Title
                      level={5}
                      style={{ textAlign: "center", color: "grey", margin: "0", marginTop: "0px" }}
                    >
                      {subjects[currentSubject]?.subject_description}
                    </Title>

                    <Select
                      value={selectedTopic ?? "All"}
                      onChange={(value) => setSelectedTopic(String(value))}
                      style={{ width: 120, marginBottom: "10px" }}
                    >
                      <Option value="All" key="All">
                        All Topics
                      </Option>

                      {Array.from(
                        new Set(
                          dbData
                            .map((q) => q.topic_id)
                            .filter((t) => t !== null && t !== undefined) // remove null/undefined
                            .map((t) => String(t)) // convert to string
                        )
                      ).map((topic) => (
                        <Option key={topic} value={topic}>
                          {topic}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginTop: "0px" }}>
                    {dbData.map((question, index) => {
                      // const isEditable = selectedTopic === "All" || question.topic_id === selectedTopic;
                      const isEditable =
                        selectedTopic === "All" || String(question.topic_id) === String(selectedTopic);
                      return (
                        <Button key={question.question_number} style={{ backgroundColor: isEditable ? getQuestionColor(index) : "lightgrey", position: "relative", color: isEditable ? "#fff" : "#888", padding: "8px", textAlign: "center", cursor: isEditable ? "pointer" : "not-allowed" }} onClick={() => isEditable && handleQuestionChange1(index + 1)} disabled={!isEditable}>
                          {index + 1}
                          {question.user_answer && question.markedForReview && <CheckOutlined style={{ position: "absolute", top: "4px", right: "4px", fontSize: "14px", color: "#fff" }} />}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <Row gutter={[16, 16]} style={{ paddingTop: "20px" }}>
                    <Col span={12} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px" }}>
                      <div style={{ backgroundColor: "#007BFF", width: "18px", height: "18px", borderRadius: "50%" }} />
                      <span>Current</span>
                    </Col>
                    <Col span={12} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px" }}>
                      <div style={{ backgroundColor: "#28a745", width: "18px", height: "18px", borderRadius: "50%" }} />
                      <span>Answered</span>
                    </Col>
                    <Col span={12} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px" }}>
                      <div style={{ backgroundColor: "#dc3545", width: "18px", height: "18px", borderRadius: "50%" }} />
                      <span>Unanswered</span>
                    </Col>
                    <Col span={12} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px" }}>
                      <div style={{ backgroundColor: "purple", width: "18px", height: "18px", borderRadius: "50%" }} />
                      <span>Marked for Review</span>
                    </Col>
                    <Col span={24} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px" }}>
                      <div style={{ backgroundColor: "purple", width: "18px", height: "18px", borderRadius: "50%", position: "relative" }}>
                        <CheckOutlined style={{ position: "absolute", top: "3px", right: "3px", fontSize: "12px", fontWeight: "bolder", color: "#fff" }} />
                      </div>
                      <span>Answered & Marked for Review</span>
                    </Col>
                  </Row>
                </>
              )}
            </Col>
          </Row>
        </Card>

        <Card className={`${styles.evaluatecardbuttons}`}>
          <Row justify={"space-between"}>
            <Row className={styles["evlauate-submit-buttons"]}>
              <Button onClick={() => setCurrentQn((prev) => Math.max(prev - 1, 0))} disabled={currentQn === 0} style={{ marginLeft: "1rem", marginTop: "5px", marginBottom: "5px", fontWeight: "500", backgroundColor: "#8956a9", color: "white" }}>
                Previous Question
              </Button>
              <Button onClick={() => setCurrentQn((prev) => Math.min(prev + 1, dbData.length - 1))} disabled={currentQn === dbData.length - 1} style={{ marginLeft: "5px", marginTop: "5px", backgroundColor: "#8956a9", fontWeight: "500", color: "white" }}>
                Next Question
              </Button>
            </Row>
            <Row>
              <Button type="primary" onClick={() => setIsModalVisible(true)} style={{ marginTop: "5px", backgroundColor: "#8356a9", marginRight: "1rem", fontWeight: "500" }}>
                Submit Section
              </Button>
              <Modal
                title={
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#555555",
                      textTransform: "uppercase",
                      textAlign: "left",
                    }}
                  >
                    Submitting Current Section
                  </div>
                }
                open={isModalVisible}
                onOk={async () => {
                  try {
                    setSubmittingSection(true);         // show spinner on OK button
                    setIsModalVisible(false);           // close the modal immediately
                    if (exam_video === 1) stopRecording();
                    await submitCurrentSubject();       // wait for submit to finish
                  } finally {
                    setSubmittingSection(false);        // hide spinner
                  }
                }}
                confirmLoading={submittingSection}       // ✅ built-in loading for OK
                onCancel={() => setIsModalVisible(false)}
                okText="Submit"
                cancelText="Cancel"
                style={{ top: 0, width: "100vw", height: "100vh", maxWidth: "none", padding: 0, margin: 0 }}
                centered
              >
                <div style={{ padding: "20px", backgroundColor: "#f0f0f0", borderRadius: "8px" }}>
                  <p style={{ textAlign: "left", fontSize: "18px", lineHeight: "1.8", color: "#555", margin: 0 }}>
                    You are about to submit this section. Please take a moment to review your answers to
                    ensure they are accurate and complete before proceeding.
                  </p>
                </div>
              </Modal>
            </Row>
          </Row>
        </Card>

        {/* Loading modal (same as your existing) */}
        <Modal open={loading} footer={null} closable={false} centered width="100%" height="100%">
          <div className={styles.centerContainer}>
            <img src="/loading.svg" alt="Loading" className={styles.loadingImage} />
            <p style={{ fontWeight: "bold" }}>Don't close this window or refresh the page while loading</p>
          </div>
        </Modal>

        {/* Distraction Info + video stream */}
        <Row className={styles["evaluate-distraction-text"]}>
          <Col span={12}>
            <Text className={styles["evaluate-distraction-text"]} style={{ margin: "1rem 1rem ", color: "grey" }}>
              Distraction Count: {distractionCount} for {Math.floor(distractionTime)} Seconds
            </Text>
          </Col>
          <Col span={12}>
            {video && <video ref={videoRef} className={styles["video-element"]} autoPlay muted />}
          </Col>
        </Row>
      </div>
    </>
  );
};

export default ExamPage;

