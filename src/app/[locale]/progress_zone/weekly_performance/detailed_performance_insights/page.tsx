import React from 'react';
import styles from './page.module.css';

const DetailedPerformanceInsightsPage = () => {
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
          <div className={styles.weekSelector}>
            <select className={styles.select}>
              <option>Display 4 Weeks</option>
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
        <div className={styles.mainCard}>
          <div className={styles.sectionsContainer}>
            {/* Weekly Detailed Performance Insights Section */}
            <div className={styles.insightsSection}>
              <h2 className={styles.insightsTitle}>Weekly Detailed Performance Insights</h2>
              <div className={styles.insightsGrid}>
                {/* Quantitative Aptitude Card */}
                <div className={styles.insightCard}>
                  <h3 className={styles.insightTitle}>Quantitative Aptitude</h3>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressCircle}>
                      <svg className={styles.progressSvg} viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className={styles.progressBackground}
                        />
                        {/* Progress circle - 90% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className={`${styles.progressBar} ${styles.progressBarGreen}`}
                          strokeDasharray="251.2"
                          strokeDashoffset="25.12"
                        />
                      </svg>
                      <div className={`${styles.progressText} ${styles.progressTextGreen}`}>90%</div>
                    </div>
                  </div>
                </div>

                {/* Logical Reasoning Card */}
                <div className={styles.insightCard}>
                  <h3 className={styles.insightTitle}>Logical Reasoning</h3>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressCircle}>
                      <svg className={styles.progressSvg} viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className={styles.progressBackground}
                        />
                        {/* Progress circle - 85% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className={`${styles.progressBar} ${styles.progressBarGreen}`}
                          strokeDasharray="251.2"
                          strokeDashoffset="37.68"
                        />
                      </svg>
                      <div className={`${styles.progressText} ${styles.progressTextGreen}`}>85%</div>
                    </div>
                  </div>
                </div>

                {/* Verbal Ability Card */}
                <div className={styles.insightCard}>
                  <h3 className={styles.insightTitle}>Verbal Ability</h3>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressCircle}>
                      <svg className={styles.progressSvg} viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className={styles.progressBackground}
                        />
                        {/* Progress circle - 75% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className={`${styles.progressBar} ${styles.progressBarOrange}`}
                          strokeDasharray="251.2"
                          strokeDashoffset="62.8"
                        />
                      </svg>
                      <div className={`${styles.progressText} ${styles.progressTextOrange}`}>75%</div>
                    </div>
                  </div>
                </div>

                {/* Data Interpretation Card */}
                <div className={styles.insightCard}>
                  <h3 className={styles.insightTitle}>Data Interpretation</h3>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressCircle}>
                      <svg className={styles.progressSvg} viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className={styles.progressBackground}
                        />
                        {/* Progress circle - 70% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className={`${styles.progressBar} ${styles.progressBarRed}`}
                          strokeDasharray="251.2"
                          strokeDashoffset="75.36"
                        />
                      </svg>
                      <div className={`${styles.progressText} ${styles.progressTextRed}`}>70%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Plan Section */}
            <div className={styles.actionPlanSection}>
              <div className={styles.actionPlanContent}>
                {/* Lightbulb Icon */}
                <div className={styles.actionPlanIcon}>
                  <div className={styles.lightbulbContainer}>
                    <div className={styles.lightbulbInner}>
                      <svg className={styles.lightbulbSvg} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 10.2 0 2 2 0 00-2 2v6a2 2 0 01-2 2H9.83a2 2 0 00-1.42.59l-2.83 2.83a1 1 0 01-1.41-1.41l2.83-2.83A2 2 0 006.17 11H5a2 2 0 01-2-2V5a2 2 0 012-2h6z" />
                        <path d="M15 3a1 1 0 011 1v6a1 1 0 01-1 1h-1a1 1 0 100 2h1a3 3 0 003-3V4a1 1 0 00-1-1h-1a1 1 0 100 2h1z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Action Plan Content */}
                <div className={styles.actionPlanText}>
                  <h3 className={styles.actionPlanTitle}>Action Plan:</h3>
                  <ul className={styles.actionPlanList}>
                    <li className={styles.actionPlanItem}>
                      <div className={styles.actionPlanBullet}>
                        <svg className={styles.actionPlanBulletSvg} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className={styles.actionPlanItemText}>Focus on Verbal Ability & DI to gain an extra 40-50 points.</span>
                    </li>
                    <li className={styles.actionPlanItem}>
                      <div className={styles.actionPlanBullet}>
                        <svg className={styles.actionPlanBulletSvg} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className={styles.actionPlanItemText}>Attempt more mock tests to improve speed and accuracy.</span>
                    </li>
                    <li className={styles.actionPlanItem}>
                      <div className={styles.actionPlanBullet}>
                        <svg className={styles.actionPlanBulletSvg} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className={styles.actionPlanItemText}>Analyze mistakes and learn from the top performers.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedPerformanceInsightsPage;
