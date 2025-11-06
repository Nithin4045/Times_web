"use client";

import { useState, useEffect, useMemo } from "react";
import { Spin, Table, Button, Empty, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { AlignType } from "rc-table/lib/interface";
import styles from "./page.module.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SetBreadcrumb } from "@/app/[locale]/study_practice/BreadcrumbContext";
import { useSelectedCourse } from "@/store/selectedcourse";
import { useNavSelection } from "@/store/navSelection";
import { useTestSelection, type TestLinkOption } from "@/store/testSelection";

interface Test {
  id: number;
  test_ref: string | number;
  test_link: TestLinkOption[] | null;
  primary_link?: string | null;
  has_primary_link?: boolean;
  solution: string | null;
  description: string | null;
  level: string | null;
  viewedreport: boolean | null;
  name?: string | null;
  area?: string | null;
  submittedAt?: string | null;
  attemptStatus?: string | null;
  submitted_at?: string | null;
  attempt_status?: string | null;
  answers?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_sectional?: boolean | null;
}

type AreaItem = { id: number; area: string };
type LevelItem = { id: number; level: string };
type ComboItem = { id: number; area: string; level: string };

const getZCourse = (selected: any) => selected?.course ?? selected ?? null;
const toStr = (v: any): string => (v ?? "").toString();

function getCourseName(selected: any): string {
  const c = getZCourse(selected);
  if (!c) return "Tests";
  const base = toStr(c.course_name || c.name).trim();
  const variant = toStr(c.variants || c.variant).trim();
  return (variant ? `${base} (${variant})` : base) || "Tests";
}

function uniqueCount(arr: string[]) {
  return new Set(arr.filter(Boolean)).size;
}

function buildSolutionUrl(
  solution: string | null,
  idCard: string | undefined,
): string | null {
  if (!solution || !idCard) return null;
  const hasQuery = /\?/.test(solution);
  const endsWithEq = /idcardno=$/i.test(solution);
  if (endsWithEq) return `${solution}${encodeURIComponent(idCard)}`;
  const joiner = hasQuery ? "&" : "?";
  return `${solution}${joiner}idcardno=${encodeURIComponent(idCard)}`;
}

function fmtDate(val?: string | null) {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function parseDateSortVal(v?: string | null) {
  if (!v) return Number.POSITIVE_INFINITY;
  const t = Date.parse(v);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}
function compareTestRef(a: any, b: any) {
  const na = typeof a === "number" ? a : Number(a);
  const nb = typeof b === "number" ? b : Number(b);
  const aIsNum = typeof na === "number" && !Number.isNaN(na);
  const bIsNum = typeof nb === "number" && !Number.isNaN(nb);
  if (aIsNum && bIsNum) return na - nb;
  const sa = String(a ?? "").toLowerCase();
  const sb = String(b ?? "").toLowerCase();
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

function levelToClass(level?: string | null): string {
  if (!level) return "";
  const l = level.toLowerCase();
  if (l.includes("advanced")) return styles.advanced;
  if (l.includes("intermediate")) return styles.intermediate;
  if (l.includes("foundation") || l.includes("topic")) return styles.foundation;
  return styles.foundation;
}
function getPrimaryTestLink(test: Test | null | undefined): string | null {
  if (!test) return null;
  const direct =
    typeof test.primary_link === "string" && test.primary_link.trim().length > 0
      ? test.primary_link
      : null;
  if (direct) return direct;
  if (Array.isArray(test.test_link)) {
    for (const entry of test.test_link) {
      if (entry && typeof entry === "object") {
        const option = entry as TestLinkOption;
        if (
          option.status &&
          typeof option.test_link === "string" &&
          option.test_link.trim().length > 0
        ) {
          return option.test_link;
        }
      }
    }
  }
  return null;
}

// Demo data generation functions
function generateDemoSolution(test: Test): string {
  // Generate demo questions with solutions
  const questions = [];
  const numQuestions = Math.floor(Math.random() * 10) + 5; // 5-15 questions
  
  for (let i = 1; i <= numQuestions; i++) {
    const questionType = Math.random() > 0.5 ? 'MCQ' : 'Numeric';
    const correctAnswer = questionType === 'MCQ' 
      ? ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
      : Math.floor(Math.random() * 100).toString();
    
    const question = {
      [`qu${i}`]: {
        ENGLISH: {
          QUESTION_TEXT: `<p><b>Question ${i}:</b> This is a demo question for ${test.area || 'Test Area'}. What is the correct answer?</p>`,
          OPT1: questionType === 'MCQ' ? 'Option A' : undefined,
          OPT2: questionType === 'MCQ' ? 'Option B' : undefined,
          OPT3: questionType === 'MCQ' ? 'Option C' : undefined,
          OPT4: questionType === 'MCQ' ? 'Option D' : undefined,
          CORRECT_ANSWER: correctAnswer,
          UNIT: 'Demo Unit',
          SOLUTION: `This is the solution for question ${i}. The correct answer is ${correctAnswer}.`,
          ESSAY_ID: '0',
          EASSY_DETAILS: ' ',
          ESSAY_NAME: 'ESSAY_NAME'
        },
        HINDI: {
          QUESTION_TEXT: ' ',
          CORRECT_ANSWER: ' ',
          UNIT: ' ',
          SOLUTION: '',
          ESSAY_ID: '0',
          EASSY_DETAILS: ' ',
          ESSAY_NAME: 'ESSAY_NAME'
        },
        SUBJECT_ID: '1',
        TOPIC_ID: '1',
        QUESTION_TYPE: questionType,
        RIGHT_MARKS: '4',
        WRONG_MARKS: '1',
        TIME: '120'
      }
    };
    questions.push(question);
  }
  
  return JSON.stringify(Object.assign({}, ...questions));
}

function generateDemoAnswers(test: Test): string {
  // Generate demo answers (mix of correct, wrong, and unattempted)
  const answers = [];
  const numQuestions = Math.floor(Math.random() * 10) + 5; // 5-15 questions
  
  for (let i = 1; i <= numQuestions; i++) {
    const rand = Math.random();
    if (rand < 0.7) {
      // 70% chance of attempting
      const answer = Math.random() > 0.5 
        ? ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
        : Math.floor(Math.random() * 100).toString();
      answers.push(answer);
    } else {
      // 30% chance of not attempting
      answers.push('#');
    }
  }
  
  return answers.join(';');
}

export default function TestListingPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const selected = useSelectedCourse((s) => s.selected);
  const navSel = useNavSelection((s) => s.selected);
  const setSelectedTest = useTestSelection((s) => s.setSelected);

  const title = useMemo(() => {
    const fromNav =
      navSel?.source === "tests" && navSel?.label ? navSel.label : null;
    if (fromNav) return fromNav;
    return getCourseName(selected);
  }, [navSel, selected]);

  // Sectional detection
  const isSectionalPage = useMemo(() => {
    if (!title) return false;
    return String(title).toLowerCase().includes("sectional");
  }, [title]);

  const [activeTab, setActiveTab] = useState<"available" | "completed">(
    "available",
  );

  const [areasAll, setAreasAll] = useState<string[]>([]);
  const [levelsAll, setLevelsAll] = useState<string[]>([]);
  const [combos, setCombos] = useState<ComboItem[]>([]);

  const [levelFilter, setLevelFilter] = useState<string>("");
  const [areaFilter, setAreaFilter] = useState<string>("");

  const [filtersLoading, setFiltersLoading] = useState<boolean>(false);
  const [testsLoading, setTestsLoading] = useState<boolean>(false);
  const [pendingTests, setPendingTests] = useState<Test[]>([]);
  const [completedTests, setCompletedTests] = useState<Test[]>([]);
  const [itemsPerPage] = useState<number>(9);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const availableCount = pendingTests.length;
  const completedCount = completedTests.length;

  // Check if area and level are the same for all combos
  const areaEqualsLevel = useMemo(() => {
    if (combos.length === 0) return false;
    return combos.every(c => c.area === c.level);
  }, [combos]);

  const levelDisabled = useMemo(() => uniqueCount(levelsAll) <= 1, [levelsAll]);

  const areasForLevel = useMemo(() => {
    if (!levelFilter || combos.length === 0) return [];
    const set = new Set<string>();
    for (const c of combos) {
      if (c.level === levelFilter && c.area) set.add(c.area);
    }
    return Array.from(set);
  }, [levelFilter, combos]);

  // Check if all areas have the same name at the current level
  const allAreasSameName = useMemo(() => {
    if (!levelFilter || combos.length === 0) return false;
    const areasAtLevel = combos.filter(c => c.level === levelFilter && c.area);
    if (areasAtLevel.length <= 1) return false;
    const firstArea = areasAtLevel[0].area;
    return areasAtLevel.every(c => c.area === firstArea);
  }, [levelFilter, combos]);

  const areaDisabled = useMemo(() => {
    // If area equals level for all combos, show only one dropdown
    if (areaEqualsLevel) return true;
    // If all areas have the same name, disable the area dropdown
    if (allAreasSameName) return true;
    return uniqueCount(areasForLevel) <= 1;
  }, [areaEqualsLevel, allAreasSameName, areasForLevel]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const zCourse: any = getZCourse(selected);
      const navTestType = Number((navSel?.extra as any)?.test_type_id);
      const effectiveTestTypeId = Number.isFinite(navTestType)
        ? navTestType
        : Number(zCourse?.test_type_id) || 1;

      if (!zCourse) {
        setAreasAll([]);
        setLevelsAll([]);
        setCombos([]);
        setLevelFilter("");
        setAreaFilter("");
        return;
      }

      try {
        setFiltersLoading(true);
        const fd = new FormData();
        fd.append("test_type_id", String(effectiveTestTypeId));
        fd.append("city_id", String(zCourse.city_id));
        fd.append("center_id", String(zCourse.center_id));
        fd.append("course_id", String(zCourse.course_id));
        fd.append("batch_id", String(zCourse.batch_id));
        fd.append(
          "id_card_no",
          String((session?.user as any)?.id_card_no ?? ""),
        );

        // 📊 API INPUT LOGGING - Area/Level API
        const inputData = {
          test_type_id: String(effectiveTestTypeId),
          city_id: String(zCourse.city_id),
          center_id: String(zCourse.center_id),
          course_id: String(zCourse.course_id),
          batch_id: String(zCourse.batch_id),
          id_card_no: String((session?.user as any)?.id_card_no ?? ""),
        };
        
        console.log("🔵 [API INPUT] /api/study_practice/tests/area_level", {
          url: "/api/study_practice/tests/area_level",
          method: "POST",
          formData: inputData,
          zCourse: {
            course_id: zCourse.course_id,
            course_pk: zCourse.course_pk,
            batch_id: zCourse.batch_id,
            city_id: zCourse.city_id,
            center_id: zCourse.center_id,
            test_type_id: zCourse.test_type_id,
            course_name: zCourse.course_name,
            variants: zCourse.variants,
          },
          navTestType,
          effectiveTestTypeId,
        });

        // 📊 SUMMARY LOG - Area/Level Input
        console.log(`📊 [INPUT SUMMARY] Area/Level API: test_type_id=${inputData.test_type_id}, course_id=${inputData.course_id}, batch_id=${inputData.batch_id}, id_card_no=${inputData.id_card_no}`);

        const res = await fetch("/api/study_practice/tests/area_level", {
          method: "POST",
          body: fd,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch areas/levels");

        const json = await res.json();

        // 📊 API OUTPUT LOGGING - Area/Level API
        const areasCount = Array.isArray(json.areas) ? json.areas.length : 0;
        const levelsCount = Array.isArray(json.levels) ? json.levels.length : 0;
        const combosCount = Array.isArray(json.combos) ? json.combos.length : 0;
        
        console.log("🟢 [API OUTPUT] /api/study_practice/tests/area_level", {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          success: json?.success,
          response: json,
          areasCount,
          levelsCount,
          combosCount,
          areas: Array.isArray(json.areas) ? json.areas : [],
          levels: Array.isArray(json.levels) ? json.levels : [],
          combos: Array.isArray(json.combos) ? json.combos : [],
          sampleArea: Array.isArray(json.areas) && json.areas.length > 0 ? json.areas[0] : null,
          sampleLevel: Array.isArray(json.levels) && json.levels.length > 0 ? json.levels[0] : null,
          sampleCombo: Array.isArray(json.combos) && json.combos.length > 0 ? json.combos[0] : null,
        });

        // 📊 SUMMARY LOG - Area/Level Counts
        console.log(`📊 [SUMMARY] Area/Level API Results: ${areasCount} Areas, ${levelsCount} Levels, ${combosCount} Combos`);
        if (!cancelled && json?.success) {
          const areaObjs: AreaItem[] = Array.isArray(json.areas)
            ? json.areas
            : [];
          const levelObjs: LevelItem[] = Array.isArray(json.levels)
            ? json.levels
            : [];
          const comboObjs: ComboItem[] = Array.isArray(json.combos)
            ? json.combos
            : [];

          const nextAreasAll = areaObjs.map((a) => a.area);
          const nextLevelsAll = levelObjs.map((l) => l.level);

          setAreasAll(nextAreasAll);
          setLevelsAll(nextLevelsAll);
          setCombos(comboObjs);

          const chosenLevel =
            levelFilter && nextLevelsAll.includes(levelFilter)
              ? levelFilter
              : (nextLevelsAll[0] ?? "");
          setLevelFilter(chosenLevel);

          const areasForChosenLevel = comboObjs
            .filter((c) => c.level === chosenLevel)
            .map((c) => c.area);
          const uniqueAreasForChosenLevel = Array.from(
            new Set(areasForChosenLevel),
          );
          const chosenArea =
            areaFilter && uniqueAreasForChosenLevel.includes(areaFilter)
              ? areaFilter
              : (uniqueAreasForChosenLevel[0] ?? "");
          setAreaFilter(chosenArea);
        }
      } catch {
        if (!cancelled) {
          setAreasAll([]);
          setLevelsAll([]);
          setCombos([]);
          setLevelFilter("");
          setAreaFilter("");
        }
      } finally {
        if (!cancelled) setFiltersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, navSel, session?.user]);

  useEffect(() => {
    if (!levelFilter) {
      setAreaFilter("");
      return;
    }
    // If area equals level for all combos, set area to the same as level
    if (areaEqualsLevel) {
      setAreaFilter(levelFilter);
      return;
    }
    const validAreas = combos
      .filter((c) => c.level === levelFilter)
      .map((c) => c.area);
    const uniqueAreas = Array.from(new Set(validAreas));
    const newArea = uniqueAreas.includes(areaFilter)
      ? areaFilter
      : (uniqueAreas[0] ?? "");
    setAreaFilter(newArea);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, combos, areaEqualsLevel]);

  const selectedComboId = useMemo(() => {
    if (!areaFilter || !levelFilter || combos.length === 0) return null;
    return (
      combos.find((c) => c.area === areaFilter && c.level === levelFilter)
        ?.id ?? null
    );
  }, [areaFilter, levelFilter, combos]);

  const fetchTests = async () => {
    const id_card_no = (session?.user as any)?.id_card_no;
    if (!id_card_no) return;

    if (!areaFilter || (!levelFilter && isSectionalPage)) {
      setPendingTests([]);
      setCompletedTests([]);
      setCurrentPage(1);
      return;
    }

    setTestsLoading(true);
    try {
      const fd = new FormData();
      fd.append("id_card_no", String(id_card_no));
      fd.append("area_level_id", String(selectedComboId));
      
      // 🆕 Add user's course_id and batch_id for filtering
      // Use the course from selected (which may be batch-specific)
      const zCourse: any = getZCourse(selected);
      
      // Debug: Log what zCourse contains
      console.log('[tests] zCourse object:', {
        course_id: zCourse?.course_id,
        course_pk: zCourse?.course_pk,
        batch_id: zCourse?.batch_id,
        coursename: zCourse?.course_name,
        variants: zCourse?.variants,
        batch_code: zCourse?.batch_code_resolved,
      });
      
      // Use course_pk (numeric ID) if available, fallback to course_id
      const actualCourseId = zCourse?.course_pk || zCourse?.course_id;
      if (actualCourseId) {
        fd.append("course_id", String(actualCourseId));
      }
      
      // 🆕 Add batch_id for variant matching
      if (zCourse?.batch_id) {
        fd.append("batch_id", String(zCourse.batch_id));
      }
      
      // 📊 API INPUT LOGGING - Tests API
      const testsInputData = {
        id_card_no: String(id_card_no),
        area_level_id: String(selectedComboId),
        course_id: actualCourseId ? String(actualCourseId) : undefined,
        batch_id: zCourse?.batch_id ? String(zCourse.batch_id) : undefined,
      };
      
      console.log("🔵 [API INPUT] /api/study_practice/tests/tests", {
        url: "/api/study_practice/tests/tests",
        method: "POST",
        formData: testsInputData,
        filters: {
          areaFilter,
          levelFilter,
          selectedComboId,
          isSectionalPage,
        },
        zCourse: {
          course_id: zCourse?.course_id,
          course_pk: zCourse?.course_pk,
          batch_id: zCourse?.batch_id,
          coursename: zCourse?.course_name,
          variants: zCourse?.variants,
          batch_code: zCourse?.batch_code_resolved,
        },
        session: {
          id_card_no: id_card_no,
          user_id: (session?.user as any)?.id,
        },
      });

      // 📊 SUMMARY LOG - Tests Input
      console.log(`📊 [INPUT SUMMARY] Tests API: id_card_no=${testsInputData.id_card_no}, area_level_id=${testsInputData.area_level_id}, course_id=${testsInputData.course_id}, batch_id=${testsInputData.batch_id}, areaFilter=${areaFilter}, levelFilter=${levelFilter}`);

      const res = await fetch("/api/study_practice/tests/tests", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();

      // 📊 API OUTPUT LOGGING - Tests API
      const pendingCount = Array.isArray(json.pending) ? json.pending.length : 0;
      const completedCount = Array.isArray(json.completed) ? json.completed.length : 0;
      const totalTests = pendingCount + completedCount;
      
      console.log("🟢 [API OUTPUT] /api/study_practice/tests/tests", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        success: json?.success,
        response: json,
        pendingCount,
        completedCount,
        totalTests,
        pending: Array.isArray(json.pending) ? json.pending : [],
        completed: Array.isArray(json.completed) ? json.completed : [],
        samplePending: Array.isArray(json.pending) && json.pending.length > 0 ? json.pending[0] : null,
        sampleCompleted: Array.isArray(json.completed) && json.completed.length > 0 ? json.completed[0] : null,
      });

      // 📊 SUMMARY LOG - Tests Counts
      console.log(`📊 [SUMMARY] Tests API Results: ${pendingCount} Pending, ${completedCount} Completed, ${totalTests} Total Tests`);
      const normalize = (arr: any[]) =>
        Array.isArray(arr)
          ? arr.map((t: any) => ({
              ...t,
              // If t.is_sectional is explicitly provided (boolean) use it,
              // otherwise treat as sectional if test_type === 'Sectional' or test_type_id === 2
              is_sectional:
                (t.is_sectional ?? false) ||
                t.test_type === "Sectional" ||
                t.test_type_id === 2,
            }))
          : [];

      if (json?.success) {
        setPendingTests(normalize(json.pending));
        setCompletedTests(normalize(json.completed));
        setCurrentPage(1);
      } else {
        setPendingTests([]);
        setCompletedTests([]);
        setCurrentPage(1);
      }
    } catch {
      setPendingTests([]);
      setCompletedTests([]);
      setCurrentPage(1);
    } finally {
      setTestsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sessionStatus,
    levelFilter,
    areaFilter,
    selectedComboId,
    isSectionalPage,
  ]);

  const handleStartTest = async (test: Test) => {
    const id_card_no = (session?.user as any)?.id_card_no as string | undefined;
    const launchUrl = getPrimaryTestLink(test);
    if (!id_card_no || !launchUrl) return;

    // ✅ Instantly update UI - move test from pending to completed
    setPendingTests(prev => prev.filter(t => t.id !== test.id));
    setCompletedTests(prev => [{
      ...test,
      attempt_status: 'in_progress', // Mark as in progress
      submitted_at: new Date().toISOString(), // Set current time
    }, ...prev]);
    
    console.log(`✅ Instantly updated UI: Test ${test.id} moved to completed/in-progress`);

    try {
      const fd = new FormData();
      fd.append("id_card_no", id_card_no);
      fd.append("testId", String(test.id));

      // 📊 API INPUT LOGGING - Attempt API
      console.log("🔵 [API INPUT] /api/study_practice/tests/attempt", {
        url: "/api/study_practice/tests/attempt",
        method: "POST",
        formData: {
          id_card_no: id_card_no,
          testId: String(test.id),
        },
        test: {
          id: test.id,
          test_ref: test.test_ref,
          name: test.name,
          area: test.area,
          level: test.level,
        },
      });

      fetch("/api/study_practice/tests/attempt", {
        method: "POST",
        body: fd,
      })
      .then(async (res) => {
        const json = await res.json();
        // 📊 API OUTPUT LOGGING - Attempt API
        console.log("🟢 [API OUTPUT] /api/study_practice/tests/attempt", {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          response: json,
        });
      })
      .catch((error) => {
        console.error("🔴 [API ERROR] /api/study_practice/tests/attempt", error);
      });
    } catch {
      // ignore network/reporting errors
    }

    // Track last taken test
    try {
      const lastActivityData = {
        id_card_no: id_card_no,
        test_id: test.id,
        test_path: window.location.pathname,
        test_title: test.name ?? `Test ${test.test_ref}`,
      };

      // 📊 API INPUT LOGGING - Last Activity API
      console.log("🔵 [API INPUT] /api/user/last-activity/update-test", {
        url: "/api/user/last-activity/update-test",
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: lastActivityData,
        test: {
          id: test.id,
          test_ref: test.test_ref,
          name: test.name,
          area: test.area,
          level: test.level,
        },
      });

      const res = await fetch('/api/user/last-activity/update-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastActivityData),
      });

      const json = await res.json();

      // 📊 API OUTPUT LOGGING - Last Activity API
      console.log("🟢 [API OUTPUT] /api/user/last-activity/update-test", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        response: json,
      });
    } catch (err) {
      console.error("🔴 [API ERROR] /api/user/last-activity/update-test", err);
    }

    setSelectedTest({
      id: test.id,
      name: test.name ?? null,
      primary_link: launchUrl,
      has_primary_link: true,
      test_links: Array.isArray(test.test_link) ? test.test_link : null,
      description: test.description ?? null,
      submitted_at: test.submitted_at ?? test.submittedAt ?? null,
      viewedreport: test.viewedreport ?? null,
      solution: test.solution ?? null,
      attempt_status: test.attempt_status ?? test.attemptStatus ?? null,
      answers: test.answers ?? null,
      area: test.area ?? null,
      level: test.level ?? null,
    });

    window.open(launchUrl, "_blank", "noopener,noreferrer");
  };

  const handleViewReport = async (test: Test) => {
    const id_card_no = (session?.user as any)?.id_card_no as string | undefined;
    if (!id_card_no) return;

    try {
      // Generate demo data for the test report
      const demoSolution = generateDemoSolution(test);
      const demoAnswers = generateDemoAnswers(test);

      setSelectedTest({
        id: test.id,
        name: test.name ?? `Test ${test.test_ref}`,
        primary_link: getPrimaryTestLink(test),
        has_primary_link: Boolean(getPrimaryTestLink(test)),
        test_links: Array.isArray(test.test_link) ? test.test_link : null,
        description: test.description ?? null,
        submitted_at: test.submitted_at ?? test.submittedAt ?? new Date().toISOString(),
        viewedreport: test.viewedreport ?? null,
        solution: demoSolution, // Use demo solution instead of test.solution
        attempt_status: test.attempt_status ?? test.attemptStatus ?? 'completed',
        area: test.area ?? 'Demo Area',
        level: test.level ?? 'Demo Level',
        answers: demoAnswers, // Use demo answers instead of test.answers
      });

      const fd = new FormData();
      fd.append("id_card_no", id_card_no);
      fd.append("test_id", String(test.id));

      // 📊 API INPUT LOGGING - UpdateViewed API
      console.log("🔵 [API INPUT] /api/study_practice/tests/updateViewed", {
        url: "/api/study_practice/tests/updateViewed",
        method: "POST",
        formData: {
          id_card_no: id_card_no,
          test_id: String(test.id),
        },
        test: {
          id: test.id,
          test_ref: test.test_ref,
          name: test.name,
          area: test.area,
          level: test.level,
          viewedreport: test.viewedreport,
        },
      });

      fetch("/api/study_practice/tests/updateViewed", {
        method: "POST",
        body: fd,
      })
      .then(async (res) => {
        const json = await res.json();
        // 📊 API OUTPUT LOGGING - UpdateViewed API
        console.log("🟢 [API OUTPUT] /api/study_practice/tests/updateViewed", {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          response: json,
        });
      })
      .catch((error) => {
        console.error("🔴 [API ERROR] /api/study_practice/tests/updateViewed", error);
      });

      // Navigate to internal report page instead of external link
      router.push('/study_practice/tests/report');

      // COMMENTED OUT: External link navigation
      // const finalUrl = buildSolutionUrl(test.solution, id_card_no);
      // if (finalUrl) window.open(finalUrl, "_blank", "noopener,noreferrer");
    } catch {
      // ignore
    }
  };

  const totalCount = availableCount + completedCount || 1;
  const progress = Math.round((completedCount / totalCount) * 100);

  const columns: ColumnsType<Test> = useMemo(() => {
    const centerAlign = "center" as AlignType;
    const rightAlign = "right" as AlignType;

    const cols: ColumnsType<Test> = [
      {
        title: "Test Ref",
        dataIndex: "test_ref",
        key: "test_ref",
        width: 120,
        render: (v: string | number) => (
          <span style={{ fontWeight: 600 }}>{String(v)}</span>
        ),
      },
      {
        title: "Description",
        dataIndex: "name",
        key: "name",
        ellipsis: true,
        render: (val: string | null) => <span>{val ?? "-"}</span>,
      },
    ];

    // Only add Level column for sectional pages
    if (isSectionalPage) {
      cols.push({
        title: "Level",
        dataIndex: "level",
        key: "level",
        width: 80,
        align: centerAlign,
        render: (_: any, record: Test) => {
          const levelVal =
            (record.level && String(record.level).trim()) || levelFilter || "";
          const cls = levelToClass(levelVal);
          return (
            <span
              aria-hidden="true"
              title={levelVal || ""}
              className={`${styles.levelDot} ${cls}`}
            />
          );
        },
      });
    }

    // Start/End only for non-sectional pages (keeps columns order appropriate)
    if (!isSectionalPage) {
      cols.push(
        {
          title: "Start Date",
          dataIndex: "start_date",
          key: "start_date",
          width: 140,
          render: (val: string | null, record: Test) =>
            record.is_sectional ? "-" : fmtDate(val),
        },
        {
          title: "End Date",
          dataIndex: "end_date",
          key: "end_date",
          width: 140,
          render: (val: string | null, record: Test) =>
            record.is_sectional ? "-" : fmtDate(val),
        },
      );
    }

    cols.push({
      title: "Action",
      key: "action",
      width: 240,
      align: rightAlign,
      render: (_: any, test) => {
        const canStart = Boolean(getPrimaryTestLink(test));
        if (activeTab === "available") {
          return (
            <Tooltip title={canStart ? "" : "No active test link available"}>
              <Button
                disabled={!canStart}
                onClick={() => canStart && handleStartTest(test)}
              >
                Start Test →
              </Button>
            </Tooltip>
          );
        }
        if (test.viewedreport) {
          return (
            <Button onClick={() => handleViewReport(test)}>Viewed →</Button>
          );
        }
        return (
          <Button type="primary" onClick={() => handleViewReport(test)}>
            View Report →
          </Button>
        );
      },
    });

    return cols;
  }, [activeTab, isSectionalPage, levelFilter]);

  const source = useMemo(
    () => (activeTab === "available" ? pendingTests : completedTests),
    [activeTab, pendingTests, completedTests],
  );

  const pageData = useMemo(() => {
    const src = Array.isArray(source) ? [...source] : [];

    if (isSectionalPage) {
      src.sort((a, b) => compareTestRef(a.test_ref, b.test_ref));
    } else {
      src.sort((a, b) => {
        const da = parseDateSortVal(a.start_date);
        const db = parseDateSortVal(b.start_date);
        if (da === db) return compareTestRef(a.test_ref, b.test_ref);
        return da - db;
      });
    }

    const start = (currentPage - 1) * itemsPerPage;
    return src.slice(start, start + itemsPerPage);
  }, [source, currentPage, itemsPerPage, isSectionalPage]);

  if (filtersLoading) {
    return (
      <div className={styles.page}>
        <Spin 
          size="large" 
          tip="Loading..." 
          spinning={true}
          style={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ minHeight: "70vh" }} />
        </Spin>
      </div>
    );
  }

  const noFilters = levelsAll.length === 0 || combos.length === 0;
  const noMatchSelected =
    !noFilters &&
    areaFilter &&
    (isSectionalPage ? levelFilter : true) &&
    source.length === 0;

  return (
    <div className={styles.page}>
      <SetBreadcrumb text={title} />

      <div className={styles.progressRow}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.progressText}>{progress}% Completed</span>
      </div>

      <div className={styles.controls}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "available" ? styles.active : ""}`}
            onClick={() => {
              setActiveTab("available");
              setCurrentPage(1);
            }}
          >
            Available Tests
          </button>
          <button
            className={`${styles.tab} ${activeTab === "completed" ? styles.active : ""}`}
            onClick={() => {
              setActiveTab("completed");
              setCurrentPage(1);
            }}
          >
            Completed Tests
          </button>
        </div>

        <div className={styles.filters}>
          {/* Show Level select when there are multiple levels OR when area equals level */}
          {!levelDisabled && (
            <select
              className={styles.select}
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {levelsAll.length === 0 ? (
                <option value="">No Levels</option>
              ) : (
                levelsAll.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))
              )}
            </select>
          )}

          {/* Show Area select only when there are multiple areas with different names and area doesn't equal level */}
          {!areaDisabled && !allAreasSameName && !areaEqualsLevel && (
            <select
              className={styles.select}
              value={areaFilter}
              onChange={(e) => {
                setAreaFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {areasForLevel.length === 0 ? (
                <option value="">No Areas</option>
              ) : (
                areasForLevel.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))
              )}
            </select>
          )}
        </div>
      </div>

      {noFilters ? (
        <div style={{ padding: "2rem 0" }}>
          <Empty description="No Areas/Levels found for this course" />
        </div>
      ) : (
        <Table<Test>
          rowKey="id"
          className={styles.antTableTight}
          columns={columns}
          dataSource={noMatchSelected ? [] : pageData}
          loading={testsLoading}
          pagination={{
            pageSize: itemsPerPage,
            current: currentPage,
            total: source.length,
            showSizeChanger: false,
            onChange: (page) => setCurrentPage(page),
          }}
          locale={{
            emptyText: noMatchSelected
              ? "No tests available for the selected Area & Level"
              : "No tests available",
          }}
        />
      )}

      {isSectionalPage ? (
        <div className={styles.footer}>
          <div className={styles.legend} style={{ fontSize: "0.85rem" }}>
            <div className={styles.legendItem}>
              <span
                className={`${styles.legendIndicator} ${styles.advanced}`}
                style={{ display: "inline-block" }}
              />{" "}
              <span>Advanced Tests</span>
            </div>
            <div className={styles.legendItem}>
              <span
                className={`${styles.legendIndicator} ${styles.intermediate}`}
                style={{ display: "inline-block" }}
              />{" "}
              <span>Intermediate Tests</span>
            </div>
            <div className={styles.legendItem}>
              <span
                className={`${styles.legendIndicator} ${styles.foundation}`}
                style={{ display: "inline-block" }}
              />{" "}
              <span>Foundation (Topic based) Tests</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
