'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function QuestionOfTheDayPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState('c');

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Top Header Bar */}
        <div className={styles.headerBar}>
          <div className={styles.headerLeft}>
            <span className={styles.activeTab}>Leaderboard</span>
            <div className={styles.separator}></div>
            <span className={styles.activeTab}>Question of the day</span>
          </div>
          <button 
            className={styles.backButton}
            onClick={() => router.back()}
          >
            <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        {/* HR Rule between rows */}
        <hr className={styles.hrRule} />

        {/* Secondary Header/Status Bar */}
        <div className={styles.statusBar}>
          <div className={styles.statusLeft}>
            <span className={styles.statusLabel}>Today Question:</span>
            <span className={styles.statusText}>Status: Awaiting for your answer</span>
          </div>
          <div className={styles.statusButtons}>
            <button 
              className={styles.statusButton}
              onClick={() => router.push('/challenge_zone/question_of_the_day/question_wise_report')}
            >
              <span>Question wise Report</span>
              <svg className={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              className={styles.statusButton}
              onClick={() => router.push('/challenge_zone/question_of_the_day/day_wise_report')}
            >
              <span>Day wise report</span>
              <svg className={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <div className={styles.questionCard}>
          {/* Information Icon */}
          <div className={styles.infoIcon}>
            <span className={styles.infoText}>i</span>
          </div>

          {/* Question Section */}
          <div className={styles.questionSection}>
            <div className={styles.questionNumber}>Q1</div>
            <p className={styles.questionText}>
              Rising ad clutter on television and growing consumer _______ towards advertising are forcing some big advertisers to think out of the box for delivering their brand messages in a more _______ and compelling format.
            </p>
          </div>

          {/* Multiple Choice Options */}
          <div className={styles.optionsContainer}>
            {/* Option A */}
            <label className={styles.optionLabel}>
              <input 
                type="radio" 
                name="question" 
                value="a" 
                checked={selectedOption === 'a'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className={styles.radioInput}
              />
              <span className={styles.optionText}>a) suspicion... involving</span>
            </label>

            {/* Option B - Correct Answer */}
            <label className={styles.optionLabel}>
              <input 
                type="radio" 
                name="question" 
                value="b" 
                checked={selectedOption === 'b'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className={styles.radioInput}
              />
              <span className={styles.optionText}>b) animosity... obligating</span>
              <div className={styles.correctBadge}>
                <svg className={styles.badgeIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </label>

            {/* Option C - User's Answer (Incorrect) */}
            <label className={styles.optionLabel}>
              <input 
                type="radio" 
                name="question" 
                value="c" 
                checked={selectedOption === 'c'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className={`${styles.radioInput} ${styles.selectedInput}`}
              />
              <span className={styles.optionText}>c) doubts... attractive (Your answer - ❌)</span>
              <div className={styles.wrongBadge}>
                <svg className={styles.badgeIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </label>

            {/* Option D */}
            <label className={styles.optionLabel}>
              <input 
                type="radio" 
                name="question" 
                value="d" 
                checked={selectedOption === 'd'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className={styles.radioInput}
              />
              <span className={styles.optionText}>d) scepticism... engaging</span>
            </label>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className={styles.actionButtons}>
          <button className={styles.submitButton}>
            SUBMIT
          </button>
          <div className={styles.rightButtons}>
            <button className={styles.actionButton}>
              Show Correct Answer
            </button>
            <button className={styles.actionButton}>
              View Solution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}