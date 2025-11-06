'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import styles from './page.module.css';
import { SetBreadcrumb } from '@/app/[locale]/study_practice/BreadcrumbContext';
import { useTestSelection } from '@/store/testSelection';

type Question = {
  ENGLISH?: {
    QUESTION_TEXT?: string;
    OPT1?: string;
    OPT2?: string;
    OPT3?: string;
    OPT4?: string;
    CORRECT_ANSWER?: string;
    [key: string]: any;
  };
  RIGHT_MARKS?: string | number;
  WRONG_MARKS?: string | number;
  TIME?: string | number;
  [key: string]: any;
};

// Supports either object map of questions or array
type QuestionsData = Record<string, Question> | Question[];

/* ---------- Helpers ---------- */
function asNumber(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toArrayFromQuestions(q: QuestionsData): Question[] {
  if (Array.isArray(q)) return q;
  if (q && typeof q === 'object') return Object.keys(q).map(k => (q as Record<string, Question>)[k]);
  return [];
}

function safeParseSolution(solution: unknown): QuestionsData {
  if (solution == null) return {};
  if (typeof solution === 'string') {
    try {
      const parsed = JSON.parse(solution);
      return parsed as QuestionsData;
    } catch (e) {
      console.warn('[solutions] Failed to parse solution JSON string:', e);
      return {};
    }
  }
  if (typeof solution === 'object') return solution as QuestionsData;
  return {};
}

export default function SolutionsPage() {
  const router = useRouter();
  const params = useParams() as { testId: string };
  const selectedTest = useTestSelection((s) => s.selected);

  // Parse the solution JSON *string*
  const questionsData = useMemo<QuestionsData>(() => {
    return safeParseSolution(selectedTest?.solution);
  }, [selectedTest?.solution]);

  // answers string like "A;B;#;..."
  const userAnswersString = useMemo<string>(() => {
    return (selectedTest?.answers as string) ?? '';
  }, [selectedTest?.answers]);

  const breadcrumbTitle = selectedTest?.name || 'Solutions';

  const [report, setReport] = useState<{
    testRef: string | number;
    area: string;
    totalQuestions: number;
    attempts: number;
    correct: number;
    wrong: number;
    score: number;
    accuracy: number;
    rank: string | number;
    percentile: number;
    timeAllotted: number;
  } | null>(null);

  const [solutionData, setSolutionData] = useState<Array<{
    questionNo: number;
    marksAllotted: number;
    negativeMarks: number;
    yourAnswer: string;
    key: string;
    status: 'correct' | 'wrong' | 'unattempted';
  }>>([]);

  useEffect(() => {
    const qs = toArrayFromQuestions(questionsData);

    // Handle cases like trailing semicolons gracefully
    const answers = userAnswersString
      .split(';')
      .map((a: string) => a.trim())
      .filter((a: string) => a.length > 0 || a === '#');

    let attempts = 0;
    let correct = 0;
    let wrong = 0;
    let score = 0;

    const solutionRows: Array<{
      questionNo: number;
      marksAllotted: number;
      negativeMarks: number;
      yourAnswer: string;
      key: string;
      status: 'correct' | 'wrong' | 'unattempted';
    }> = [];

    qs.forEach((q, idx) => {
      const correctAns = (q?.ENGLISH?.CORRECT_ANSWER ?? '').toString().trim();
      const userAns = answers[idx] ?? '#';
      const rightMarks = asNumber(q?.RIGHT_MARKS, 3);
      const wrongMarks = asNumber(q?.WRONG_MARKS, 1);

      let status: 'correct' | 'wrong' | 'unattempted' = 'unattempted';
      if (userAns !== '#') {
        attempts++;
        if (userAns === correctAns) {
          correct++;
          score += rightMarks;
          status = 'correct';
        } else {
          wrong++;
          score -= wrongMarks;
          status = 'wrong';
        }
      }

      solutionRows.push({
        questionNo: idx + 1,
        marksAllotted: rightMarks,
        negativeMarks: wrongMarks,
        yourAnswer: userAns === '#' ? '—' : userAns,
        key: correctAns || '—',
        status,
      });
    });

    // Generate demo rank and percentile
    const totalStudents = 46038;
    const rank = Math.floor(Math.random() * 30000) + 40000;
    const percentile = ((totalStudents - rank) / totalStudents * 100).toFixed(2);
    const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

    setReport({
      testRef: selectedTest?.id ?? params.testId,
      area: selectedTest?.area ?? 'Verbal Ability',
      totalQuestions: qs.length || 15,
      attempts: attempts || 15,
      correct: correct || 3,
      wrong: wrong || 12,
      score: score || -3,
      accuracy,
      rank: `${rank}/${totalStudents}`,
      percentile: parseFloat(percentile),
      timeAllotted: 30, // Demo time
    });

    setSolutionData(solutionRows);
  }, [questionsData, userAnswersString, params.testId, selectedTest?.id, selectedTest?.area]);

  if (!selectedTest) {
    return (
      <div className={styles.container}>
        <SetBreadcrumb text="Solutions" />
        <p className={styles.testInfo2}>No test selected. Please open a report from the tests list.</p>
      </div>
    );
  }

  if (!report) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <SetBreadcrumb text={breadcrumbTitle} />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <span className={styles.testRef}>Test Ref: {report.testRef}</span>
            <span className={styles.separator}>|</span>
            <span className={styles.areaName}>{report.area}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {/* Type of test */}
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Type of test</div>
          <div className={styles.statValueSmall}>Foundation</div>
        </div>

        {/* No. of Questions */}
        <div className={styles.statCard}>
          <div className={styles.statLabel}>No. of Questions</div>
          <div className={styles.statValue}>{report.totalQuestions}</div>
        </div>

        {/* Time allotted */}
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Time allotted</div>
          <div className={styles.statValue}>{report.timeAllotted}</div>
        </div>

        {/* Attempts */}
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Attempts</div>
          <div className={styles.statValue}>{report.attempts}</div>
        </div>
      </div>

      {/* Second Row */}
      <div className={styles.statsGrid}>
        {/* Score */}
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Score</div>
          <div className={styles.statValue}>{report.score}</div>
        </div>

        {/* Accuracy */}
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Accuracy</div>
          <div className={styles.statValue}>{report.accuracy}%</div>
        </div>

        {/* Rank */}
        <div className={styles.rankCard}>
          <div className={styles.rankValue}>{report.rank}</div>
      </div>

        {/* Percentile */}
        <div className={styles.percentileCard}>
          <div className={styles.percentileLabel}>Percentile</div>
          <div className={styles.percentileValue}>{report.percentile}</div>
        </div>
        </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.solutionsTable}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={styles.headerCell}>Q.No</th>
                <th className={styles.headerCell}>Marks Allotted</th>
                <th className={styles.headerCell}>Negative Marks</th>
                <th className={styles.headerCell}>Your Answer</th>
                <th className={styles.headerCell}>Key</th>
                <th className={styles.headerCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {solutionData.map((row, index) => (
                <tr key={index} className={styles.tableRow}>
                  <td className={styles.tableCell}>{row.questionNo}</td>
                  <td className={styles.tableCell}>{row.marksAllotted}</td>
                  <td className={styles.tableCell}>{row.negativeMarks}</td>
                  <td className={styles.tableCell}>{row.yourAnswer}</td>
                  <td className={styles.tableCell}>{row.key}</td>
                  <td className={styles.tableCell}>
                    <div className={styles.statusContainer}>
                      <div className={`${styles.statusIcon} ${styles[row.status]}`}>
                        {row.status === 'correct' ? (
                          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                          </svg>
                        ) : row.status === 'wrong' ? (
                          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        ) : (
                          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                )}
              </div>
            </div>
                  </td>
                </tr>
          ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
