'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

export default function QuestionWiseReportPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState('c');

  // Demo calendar data with performance indicators
  const calendarData: Record<string, 'correct' | 'wrong' | null> = {
    '4': 'wrong',
    '5': 'correct',
    '6': 'correct',
    '7': 'correct',
    '8': 'correct',
    '9': 'correct',
    '10': 'correct',
    '11': 'wrong',
    '12': 'correct',
    '13': 'correct',
    '14': 'correct',
    '15': 'wrong',
    '16': 'correct',
    '17': 'wrong',
    '18': 'correct',
    '19': 'correct',
    '23': 'wrong',
  };

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const totalDaysInMonth = 31;
  const firstDayOfMonth = 2; // October 1, 2025 is a Wednesday

  const renderCalendarDays = () => {
    const days = [];
    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const isSunday = (firstDayOfMonth + day - 1) % 7 === 6;
      const status = calendarData[day] || null;
      let icon = null;
      const dayTextColor = isSunday ? styles.sundayText : styles.normalText;

      if (status === 'correct') {
        icon = (
          <div className={styles.correctIcon}>
            <svg className={styles.iconSvg} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      } else if (status === 'wrong') {
        icon = (
          <div className={styles.wrongIcon}>
            <svg className={styles.iconSvg} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      }

      days.push(
        <div key={day} className={styles.calendarDay}>
          <span className={dayTextColor}>{day}</span>
          {icon}
        </div>
      );
    }
    return days;
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Top Header Bar */}
        <div className={styles.headerBar}>
          <div className={styles.headerLeft}>
            <span className={styles.activeTab}>Leaderboard</span>
            <div className={styles.separator}></div>
            <span className={styles.activeTab}>Question of the day</span>
            <div className={styles.separator}></div>
            <span className={styles.inactiveTab}>Report</span>
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

        <hr className={styles.hrRule} />

        <div className={styles.reportCard}>
          {/* Header within the Main Card */}
          <div className={styles.reportHeader}>
            <div className={styles.dateNavigation}>
              <div className={styles.yearNavigation}>
                <button className={styles.navButton}>
                  <svg className={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className={styles.yearText}>2025</span>
                <button className={styles.navButton}>
                  <svg className={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className={styles.monthNavigation}>
                <button className={styles.navButton}>
                  <svg className={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className={styles.monthText}>October</span>
                <button className={styles.navButton}>
                  <svg className={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <button 
              className={styles.reportButton}
              onClick={() => router.push('/challenge_zone/question_of_the_day/day_wise_report')}
            >
              <span>Question wise Report</span>
              <svg className={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Main Content Area: Calendar and Statistics */}
          <div className={styles.reportContent}>
            {/* Calendar Section */}
            <div className={styles.calendarSection}>
              {/* Calendar Grid */}
              <div className={styles.calendarGrid}>
                {daysOfWeek.map((day, index) => (
                  <div key={day} className={`${styles.dayHeader} ${day === 'SUNDAY' ? styles.sundayHeader : ''}`}>
                    {day}
                  </div>
                ))}
                {renderCalendarDays()}
              </div>
            </div>

            {/* Statistics Section */}
            <div className={styles.statsSection}>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>65<span className={styles.statDenominator}>/90</span></span>
                <span className={styles.statLabel}>Correct Answers</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>33</span>
                <span className={styles.statLabel}>Un attempted</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>25<span className={styles.statDenominator}>/90</span></span>
                <span className={styles.statLabel}>Wrong Answers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
