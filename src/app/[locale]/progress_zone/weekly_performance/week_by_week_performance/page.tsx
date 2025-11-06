import React from 'react';
import styles from './page.module.css';

const WeekByWeekPerformancePage = () => {
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
          <button className={styles.dateRangeButton}>
            <svg className={styles.dateRangeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Select Date Range</span>
          </button>
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
            {/* Performance Overview Section */}
            <div className={styles.overviewSection}>
              <h2 className={styles.overviewTitle}>Week-by-Week Performance From 10-08-2025 To 26-8-2025</h2>
              <div className={styles.overviewGrid}>
                {/* Rank Improvement Card */}
                <div className={styles.overviewCard}>
                  <div className={styles.overviewContent}>
                    <div className={styles.overviewIcon}>
                      <svg className={styles.overviewIconSvg} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className={styles.overviewText}>
                      Your rank has gone up by <span className={`${styles.overviewValue} ${styles.overviewValueGreen}`}>360</span> points
                    </div>
                  </div>
                </div>

                {/* Total Tests Card */}
                <div className={styles.overviewCard}>
                  <div className={styles.overviewContent}>
                    <div className={styles.overviewIcon}>
                      <svg className={styles.overviewIconSvg} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className={styles.overviewText}>
                      Total tests in this date range: <span className={`${styles.overviewValue} ${styles.overviewValuePurple}`}>#128</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Performance Table */}
            <div className={styles.tableSection}>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr className={styles.tableHeaderRow}>
                      <th className={styles.tableHeaderCell}>S.No</th>
                      <th className={styles.tableHeaderCell}>Date Range</th>
                      <th className={styles.tableHeaderCell}>Total Tests</th>
                      <th className={styles.tableHeaderCell}>Score</th>
                      <th className={styles.tableHeaderCell}>Points</th>
                      <th className={styles.tableHeaderCell}>Status</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {/* Row 1 */}
                    <tr className={styles.tableRow}>
                      <td className={styles.tableCell}>01.</td>
                      <td className={styles.tableCell}>10-8-2025 - 17-8-2025</td>
                      <td className={styles.tableCell}>3</td>
                      <td className={styles.tableCell}>96%</td>
                      <td className={`${styles.tableCell} ${styles.tableCellBold} ${styles.tableCellGreen}`}>+55</td>
                      <td className={styles.tableCell}>
                        <svg className={`${styles.statusIcon} ${styles.statusIconGreen}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </td>
                    </tr>
                    
                    {/* Row 2 */}
                    <tr className={styles.tableRow}>
                      <td className={styles.tableCell}>02.</td>
                      <td className={styles.tableCell}>10-8-2025 - 17-8-2025</td>
                      <td className={styles.tableCell}>3</td>
                      <td className={styles.tableCell}>96%</td>
                      <td className={`${styles.tableCell} ${styles.tableCellBold} ${styles.tableCellGreen}`}>+55</td>
                      <td className={styles.tableCell}>
                        <svg className={`${styles.statusIcon} ${styles.statusIconGreen}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </td>
                    </tr>
                    
                    {/* Row 3 */}
                    <tr className={styles.tableRow}>
                      <td className={styles.tableCell}>03.</td>
                      <td className={styles.tableCell}>10-8-2025 - 17-8-2025</td>
                      <td className={styles.tableCell}>3</td>
                      <td className={styles.tableCell}>96%</td>
                      <td className={`${styles.tableCell} ${styles.tableCellBold} ${styles.tableCellRed}`}>-20</td>
                      <td className={styles.tableCell}>
                        <svg className={`${styles.statusIcon} ${styles.statusIconRed}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </td>
                    </tr>
                    
                    {/* Row 4 */}
                    <tr className={styles.tableRow}>
                      <td className={styles.tableCell}>04.</td>
                      <td className={styles.tableCell}>10-8-2025 - 17-8-2025</td>
                      <td className={styles.tableCell}>3</td>
                      <td className={styles.tableCell}>96%</td>
                      <td className={`${styles.tableCell} ${styles.tableCellBold} ${styles.tableCellGreen}`}>+55</td>
                      <td className={styles.tableCell}>
                        <svg className={`${styles.statusIcon} ${styles.statusIconGreen}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </td>
                    </tr>
                    
                    {/* Row 5 */}
                    <tr className={styles.tableRow}>
                      <td className={styles.tableCell}>05.</td>
                      <td className={styles.tableCell}>10-8-2025 - 17-8-2025</td>
                      <td className={styles.tableCell}>3</td>
                      <td className={styles.tableCell}>96%</td>
                      <td className={`${styles.tableCell} ${styles.tableCellBold} ${styles.tableCellGreen}`}>+30</td>
                      <td className={styles.tableCell}>
                        <svg className={`${styles.statusIcon} ${styles.statusIconRed}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </td>
                    </tr>
                    
                    {/* Row 6 */}
                    <tr className={styles.tableRow}>
                      <td className={styles.tableCell}>06.</td>
                      <td className={styles.tableCell}>10-8-2025 - 17-8-2025</td>
                      <td className={styles.tableCell}>3</td>
                      <td className={styles.tableCell}>96%</td>
                      <td className={`${styles.tableCell} ${styles.tableCellBold} ${styles.tableCellGreen}`}>+55</td>
                      <td className={styles.tableCell}>
                        <svg className={`${styles.statusIcon} ${styles.statusIconGreen}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Load more button */}
              <div className={styles.loadMoreContainer}>
                <button className={styles.loadMoreButton}>
                  Load more...
                </button>
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

export default WeekByWeekPerformancePage;
