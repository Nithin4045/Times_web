import React from 'react';
import styles from './page.module.css';

const PerformanceAnalysisPage = () => {
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
            {/* Weekly Performance Breakdown Section */}
            <div className={styles.breakdownSection}>
              <h2 className={styles.breakdownTitle}>Weekly Performance Breakdown</h2>
              <div className={styles.breakdownGrid}>
                {/* Total Tests Card */}
                <div className={styles.breakdownCard}>
                  <div className={styles.breakdownContent}>
                    <div className={styles.breakdownIcon}>
                      <svg className={styles.breakdownIconSvg} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className={styles.breakdownText}>
                      Total tests in this week: <span className={styles.breakdownValue}>#128</span>
                    </div>
                  </div>
                </div>

                {/* Top 10 Cutoff Card */}
                <div className={styles.breakdownCard}>
                  <div className={styles.breakdownContent}>
                    <div className={styles.breakdownIcon}>
                      <svg className={styles.breakdownIconSvg} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className={styles.breakdownText}>
                      Top 10 Cutoff Score: <span className={styles.breakdownValue}>900+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Your last 4 weeks performance Section */}
            <div className={styles.performanceSection}>
              <h2 className={styles.performanceTitle}>Your last 4 weeks performance</h2>
              <div className={styles.performanceTable}>
                {/* Table Header */}
                <div className={styles.tableHeader}>
                  <div className={styles.tableHeaderRow}>
                    <div className={styles.tableHeaderCell}>Week (Mon-Sun)</div>
                    <div className={styles.tableHeaderCell}>Score (%)</div>
                    <div className={styles.tableHeaderCell}>Points</div>
                  </div>
                </div>
                
                {/* Table Body */}
                <div className={styles.tableBody}>
                  {/* Week 1 */}
                  <div className={styles.tableRow}>
                    <div className={styles.tableCell}>Week 1</div>
                    <div className={styles.tableCell}>96% (960)</div>
                    <div className={styles.tableCell}>+140 Points</div>
                  </div>
                  
                  {/* Week 2 */}
                  <div className={styles.tableRow}>
                    <div className={styles.tableCell}>Week 2</div>
                    <div className={styles.tableCell}>92% (920)</div>
                    <div className={styles.tableCell}>+100 Points</div>
                  </div>
                  
                  {/* Week 3 */}
                  <div className={styles.tableRow}>
                    <div className={styles.tableCell}>Week 3</div>
                    <div className={styles.tableCell}>90% (900)</div>
                    <div className={styles.tableCell}>+90 Points</div>
                  </div>
                  
                  {/* Week 4 */}
                  <div className={styles.tableRow}>
                    <div className={styles.tableCell}>Week 4</div>
                    <div className={styles.tableCell}>90% (900)</div>
                    <div className={styles.tableCell}>+80 Points</div>
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

export default PerformanceAnalysisPage;
