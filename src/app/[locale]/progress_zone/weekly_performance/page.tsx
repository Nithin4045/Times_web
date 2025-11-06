'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const WeeklyPerformancePage = () => {
  const router = useRouter();

  const handlePerformanceBreakdown = () => {
    router.push('/progress_zone/weekly_performance/performance_analysis');
  };

  const handleDetailedPerformanceInsights = () => {
    router.push('/progress_zone/weekly_performance/detailed_performance_insights');
  };

  const handleWeekByWeekPerformance = () => {
    router.push('/progress_zone/weekly_performance/week_by_week_performance');
  };

  const handleGraphicalInsights = () => {
    router.push('/progress_zone/weekly_performance/week_performance');
  };

  return (
    <div className={styles.page}>
      {/* Top Header Bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <span className={styles.breadcrumbLink}>Leaderboard</span>
          <div className={styles.breadcrumbSeparator}></div>
          <span className={styles.breadcrumbCurrent}>Weekly Performance Analysis</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.courseSelector}>
            <select className={styles.select}>
              <option>CAT 2025 Online Flexi</option>
            </select>
            <div className={styles.selectArrow}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <button className={styles.backButton}>
            <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>
      </div>

      <hr className={styles.hrRule} />

      <div className={styles.contentWrapper}>
        <div className={styles.mainContent}>
          <div className={styles.sectionsContainer}>
          {/* Section 1: Your Weekly Performance Overview */}
          <div className={styles.overviewSection}>
            <div className={styles.overviewHeader}>
              <h2 className={styles.overviewTitle}>Your Weekly Performance Overview</h2>
              <div className={styles.overviewSubtitle}>Active for 5/7 days this week</div>
            </div>
            <div className={styles.overviewGrid}>
              {/* Current Rank Card */}
              <div className={styles.rankCard}>
                <div className={styles.rankText}>
                  Your Current Rank: <span className={styles.rankBadge}>#128</span> out of 8 Tests
                </div>
              </div>

              {/* Recent Improvement Card */}
              <div className={styles.improvementCard}>
                <div className={styles.improvementContent}>
                  <div className={styles.improvementIcon}>
                    <svg className={styles.improvementIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className={styles.improvementText}>Recent Improvement</div>
                    <div className={styles.improvementValue}>
                      <span className={styles.improvementNumber}>+12%</span> accuracy in DILR last week
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestones Achieved Card */}
              <div className={styles.milestonesCard}>
                <div className={styles.milestonesText}>
                  <span className={styles.milestonesBadge}>2/3</span> Milestones Achieved
                </div>
              </div>

              {/* Next Week Goal Card */}
              <div className={styles.goalCard}>
                <div className={styles.goalContent}>
                  <div className={styles.goalIcon}>
                    <svg className={styles.goalIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="12" r="6" stroke="#EF4444" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="12" r="2" fill="#EF4444"/>
                    </svg>
                  </div>
    <div>
                    <div className={styles.goalText}>Next Week Goal</div>
                    <div className={styles.goalValue}>
                      <span className={styles.goalNumber}>50</span> Marks Improvement
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Your detailed performance analysis */}
          <div className={styles.analysisSection}>
            <h2 className={styles.analysisTitle}>Your detailed performance analysis</h2>
            <div className={styles.analysisGrid}>
              <button className={styles.analysisButton} onClick={handlePerformanceBreakdown}>
                <div className={styles.analysisButtonContent}>
                  <span className={styles.analysisButtonText}>Performance Breakdown</span>
                  <svg className={styles.analysisButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button className={styles.analysisButton} onClick={handleGraphicalInsights}>
                <div className={styles.analysisButtonContent}>
                  <span className={styles.analysisButtonText}>Graphical Insights</span>
                  <svg className={styles.analysisButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button className={styles.analysisButton} onClick={handleDetailedPerformanceInsights}>
                <div className={styles.analysisButtonContent}>
                  <span className={styles.analysisButtonText}>Detailed Performance Insights</span>
                  <svg className={styles.analysisButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button className={styles.analysisButton} onClick={handleWeekByWeekPerformance}>
                <div className={styles.analysisButtonContent}>
                  <span className={styles.analysisButtonText}>Week-by-Week Performance</span>
                  <svg className={styles.analysisButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Your Next Steps */}
          <div className={styles.nextStepsSection}>
            <h2 className={styles.nextStepsTitle}>🔥 Your Next Steps</h2>
            <div className={styles.nextStepsCard}>
              <div className={styles.nextStepsContent}>
                {/* Left side - Illustrative graphic */}
                <div className={styles.nextStepsGraphic}>
                  <div className={styles.nextStepsIllustration}>
                    {/* Smartphone */}
                    <div className={styles.smartphone}>
                      <div className={styles.smartphoneContent}>
                        <div className={`${styles.smartphoneDot} ${styles.smartphoneDotBlue}`}></div>
                        <div className={`${styles.smartphoneDot} ${styles.smartphoneDotOrange}`}></div>
                        <div className={`${styles.smartphoneDot} ${styles.smartphoneDotGreen}`}></div>
                      </div>
                    </div>
                    
                    {/* Books */}
                    <div className={styles.books}>
                      <div className={`${styles.book} ${styles.bookRed}`}></div>
                      <div className={`${styles.book} ${styles.bookOrange}`}></div>
                      <div className={`${styles.book} ${styles.bookYellow}`}></div>
                      <div className={`${styles.book} ${styles.bookBlue}`}></div>
                    </div>
                    
                    {/* Coffee cup */}
                    <div className={styles.coffeeCup}></div>
                    
                    {/* Target */}
                    <div className={styles.target}>
                      <div className={styles.targetOuter}>
                        <div className={styles.targetMiddle}>
                          <div className={styles.targetInner}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Action items */}
                <div className={styles.nextStepsActions}>
                  <ol className={styles.nextStepsList}>
                    <li className={styles.nextStepsItem}>
                      <span className={styles.nextStepsBold}>Take More Mock Tests</span> - Improve accuracy & ranking.
                    </li>
                    <li className={styles.nextStepsItem}>
                      <span className={styles.nextStepsBold}>Watch Concept Videos</span> - Strengthen weaker areas.
                    </li>
                    <li className={styles.nextStepsItem}>
                      <span className={styles.nextStepsBold}>Join Weekly Discussions</span> - Gain insights from mentors & peers.
                    </li>
                    <li className={styles.nextStepsItem}>
                      <span className={styles.nextStepsBold}>Challenge Yourself</span> - Aim for a top 50 rank in the next leaderboard update!
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyPerformancePage;
