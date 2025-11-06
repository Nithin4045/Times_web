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
    SOLUTION?: string;
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
      console.warn('[analysis] Failed to parse solution JSON string:', e);
      return {};
    }
  }
  if (typeof solution === 'object') return solution as QuestionsData;
  return {};
}

export default function QuestionAnalysisPage() {
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

  const breadcrumbTitle = selectedTest?.name || 'Questionwise Analysis';

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questionStatuses, setQuestionStatuses] = useState<Array<'correct' | 'wrong' | 'unattempted'>>([]);

  useEffect(() => {
    const qs = toArrayFromQuestions(questionsData);
    const answers = userAnswersString
      .split(';')
      .map((a: string) => a.trim())
      .filter((a: string) => a.length > 0 || a === '#');

    const statuses: Array<'correct' | 'wrong' | 'unattempted'> = [];

    qs.forEach((q, idx) => {
      const correctAns = (q?.ENGLISH?.CORRECT_ANSWER ?? '').toString().trim();
      const userAns = answers[idx] ?? '#';

      if (userAns === '#') {
        statuses.push('unattempted');
      } else if (userAns === correctAns) {
        statuses.push('correct');
      } else {
        statuses.push('wrong');
      }
    });

    setQuestionStatuses(statuses);
  }, [questionsData, userAnswersString]);

  const questions = toArrayFromQuestions(questionsData);
  const answers = userAnswersString
    .split(';')
    .map((a: string) => a.trim())
    .filter((a: string) => a.length > 0 || a === '#');

  const currentQ = questions[currentQuestion];
  const userAnswer = answers[currentQuestion] ?? '#';
  const correctAnswer = currentQ?.ENGLISH?.CORRECT_ANSWER ?? '';
  const isCorrect = userAnswer === correctAnswer;
  const isUnattempted = userAnswer === '#';

  const isFirstQuestion = currentQuestion === 0;
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestion(currentQuestion - 1);
      setShowSolution(false);
      setShowAnswer(false);
    }
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestion(currentQuestion + 1);
      setShowSolution(false);
      setShowAnswer(false);
    }
  };

  const handleJumpToQuestion = (questionIndex: number) => {
    setCurrentQuestion(questionIndex);
    setShowSolution(false);
    setShowAnswer(false);
  };

  const handleShowAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const handleShowSolution = () => {
    setShowSolution(!showSolution);
  };

  if (!selectedTest) {
    return (
      <div className={styles.container}>
        <SetBreadcrumb text="Questionwise Analysis" />
        <p className={styles.testInfo2}>No test selected. Please open a report from the tests list.</p>
      </div>
    );
  }

  if (!currentQ) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <SetBreadcrumb text={breadcrumbTitle} />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <span className={styles.testRef}>Test Ref: {selectedTest.id}</span>
            <span className={styles.separator}>|</span>
            <span className={styles.areaName}>{selectedTest.area || 'Verbal Ability'}</span>
            <span className={styles.separator}>|</span>
            <span className={styles.analysisTitle}>Questionwise Analysis</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Question Panel */}
        <div className={styles.questionPanel}>
          {/* Question Header */}
            <div className={styles.questionHeader}>
            <h2 className={styles.questionNumber}>Q{currentQuestion + 1}</h2>
            <div className={styles.questionIcon}>
              <span className={styles.iconEmoji}>💡</span>
            </div>
            </div>

          {/* Question Text */}
          <div className={styles.questionText}>
            <div 
              dangerouslySetInnerHTML={{ 
                __html: currentQ?.ENGLISH?.QUESTION_TEXT || 'Demo question text here...' 
              }}
            />
          </div>

          {/* Options */}
              <div className={styles.optionsContainer}>
            {['A', 'B', 'C', 'D'].map((option, index) => {
              const optionText = currentQ?.ENGLISH?.[`OPT${index + 1}`] || `Option ${option}`;
              const isSelected = userAnswer === option;
              const isCorrectOption = correctAnswer === option;
              const showCorrectAnswer = showAnswer && isCorrectOption;
              const showUserAnswer = isSelected && !isUnattempted;

              return (
                <label key={option} className={styles.optionLabel}>
                  <input 
                    type="radio" 
                    name="answer" 
                    checked={isSelected}
                    readOnly
                    className={styles.radioInput}
                  />
                          <span className={styles.optionText}>
                    {option.toLowerCase()}) {optionText}
                    {showUserAnswer && (
                      <span className={`${styles.answerBadge} ${styles[isCorrect ? 'correct' : 'wrong']}`}>
                        (Your answer - {isCorrect ? '✅' : '❌'})
                      </span>
                    )}
                    {showCorrectAnswer && (
                      <span className={`${styles.answerBadge} ${styles.correct}`}>
                        (Correct Answer - ✅)
                      </span>
                            )}
                          </span>
                </label>
              );
            })}
              </div>

          {/* Solution Display */}
          {showSolution && currentQ?.ENGLISH?.SOLUTION && (
            <div className={styles.solutionContainer}>
              <h4 className={styles.solutionTitle}>Solution:</h4>
              <div 
                className={styles.solutionText}
                dangerouslySetInnerHTML={{ 
                  __html: currentQ.ENGLISH.SOLUTION || 'Solution not available.' 
                }}
              />
                </div>
              )}

          {/* Buttons */}
          <div className={styles.buttonContainer}>
            <div className={styles.leftButtons}>
              <button 
                className={styles.actionButton}
                onClick={handleShowAnswer}
              >
                {showAnswer ? 'Hide Correct Answer' : 'Show Correct Answer'}
                </button>
              <button 
                className={styles.actionButton}
                onClick={handleShowSolution}
              >
                  {showSolution ? 'Hide Solution' : 'View Solution'}
                </button>
              </div>
            <div className={styles.rightButtons}>
              <button 
                className={styles.navButton}
                onClick={handlePrevious}
                disabled={isFirstQuestion}
              >
                PREVIOUS
                </button>
              <button 
                className={styles.navButton}
                onClick={handleNext}
                disabled={isLastQuestion}
              >
                NEXT
                </button>
              </div>
            </div>
        </div>

        {/* Jump to Question Panel */}
        <div className={styles.jumpPanel}>
          <h3 className={styles.jumpTitle}>Jump to Question</h3>
          <div className={styles.jumpGrid}>
            {questions.map((_, index) => (
              <button
                key={index}
                className={`${styles.jumpButton} ${styles[questionStatuses[index] || 'unattempted']} ${
                  index === currentQuestion ? styles.active : ''
                }`}
                onClick={() => handleJumpToQuestion(index)}
              >
                {index + 1}
              </button>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}
