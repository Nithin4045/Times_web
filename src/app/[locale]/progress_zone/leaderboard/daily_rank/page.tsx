'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DailyRankPage() {
  const params = useParams();
  const locale = params.locale;
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    // Dynamically import flatpickr
    const loadFlatpickr = async () => {
      const flatpickr = (await import('flatpickr')).default;
      
      // Load CSS dynamically by creating a link element
      if (!document.querySelector('link[href*="flatpickr.min.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
        document.head.appendChild(link);
      }
      
      const inputElement = document.getElementById('dateRangeInput');
      if (!inputElement) return;

      const fp = flatpickr(inputElement, {
        mode: "range",
        dateFormat: "d-m-Y",
        defaultDate: ["10-08-2025", "26-08-2025"],
        static: false,
        appendTo: document.body,
        positionElement: document.getElementById('dateRangeBtn') || undefined,
        onChange: function(selectedDates, dateStr, instance) {
          if (selectedDates.length === 2) {
            const formatDate = (date: Date) => {
              const day = date.getDate();
              const month = date.getMonth() + 1;
              const year = date.getFullYear();
              return `${day}-${month}-${year}`;
            };

            const startDateEl = document.getElementById('startDate');
            const endDateEl = document.getElementById('endDate');
            if (startDateEl && endDateEl) {
              startDateEl.textContent = formatDate(selectedDates[0]);
              endDateEl.textContent = formatDate(selectedDates[1]);
            }

            setShowCalendar(false);
          }
        },
        onOpen: () => {
          setShowCalendar(true);
          // Position the calendar near the button
          const btn = document.getElementById('dateRangeBtn');
          const calendar = document.querySelector('.flatpickr-calendar') as HTMLElement | null;
          if (btn && calendar) {
            const rect = btn.getBoundingClientRect();
            calendar.style.position = 'fixed';
            calendar.style.top = `${rect.bottom + 10}px`;
            calendar.style.left = `${rect.left}px`;
            calendar.style.margin = '0';
          }
        },
        onClose: () => setShowCalendar(false)
      });

      const dateRangeBtn = document.getElementById('dateRangeBtn');
      const input = document.getElementById('dateRangeInput') as HTMLInputElement;

      if (dateRangeBtn) {
        dateRangeBtn.addEventListener('click', () => {
          fp.open();
        });
      }

      return () => {
        fp.destroy();
      };
    };

    const cleanup = loadFlatpickr();

    return () => {
      cleanup.then(clean => clean && clean());
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>
            <span className={styles.highlight}>Leaderboard</span>
            <span> - Performance Analysis</span>
          </h1>
          <Link href={`/${locale}/progress_zone/leaderboard`} className={styles.backButton}>
            <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back
          </Link>
        </div>
        <hr className={styles.headerDivider} />
      </div>

      <div className={styles.dailyRankSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerLeft}>
            <h2 className={styles.sectionTitle}>Daily Rank Analysis</h2>
            <span className={styles.fromLabel}>From</span>
            <span id="startDate" className={styles.dateValue}>10-08-2025</span>
            <span className={styles.toLabel}>To</span>
            <span id="endDate" className={styles.dateValue}>26-8-2025</span>
          </div>
          <div className={styles.datePickerWrapper}>
            <button id="dateRangeBtn" className={styles.dateRangeButton}>
              <span>Select Date Range</span>
              <svg className={styles.calendarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </button>
            <input type="text" id="dateRangeInput" className={styles.dateInput} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon}>
                <svg className={styles.iconSvg} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <div className={styles.statLabel}>Your rank has gone up by</div>
                <div className={styles.statValue}>
                  360 <span className={styles.statUnit}>points</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.statCardSecondary}>
            <div className={styles.statContent}>
              <div className={styles.statIcon}>
                <svg className={styles.iconSvg} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <div className={styles.statLabel}>Total tests in this date range:</div>
                <div className={styles.statValueSecondary}>#128</div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeader}>
                  <th className={styles.headerCell}>S.No</th>
                  <th className={styles.headerCell}>Date</th>
                  <th className={styles.headerCellCenter}>TotalTests</th>
                  <th className={styles.headerCellCenter}>Score</th>
                  <th className={styles.headerCellCenter}>Points</th>
                  <th className={styles.headerCellCenter}>Rank</th>
                  <th className={styles.headerCellCenter}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.tableRow}>
                  <td className={styles.cell}>01.</td>
                  <td className={styles.cellDate}>10-8-2025</td>
                  <td className={styles.cellCenter}>3</td>
                  <td className={styles.cellCenter}>96%</td>
                  <td className={styles.cellCenter}>+80</td>
                  <td className={styles.cellCenter}></td>
                  <td className={styles.cellCenter}>
                    <div className={styles.statusUp}>
                      <svg className={styles.statusIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                      </svg>
                    </div>
                  </td>
                </tr>
                <tr className={styles.tableRow}>
                  <td className={styles.cell}>02.</td>
                  <td className={styles.cellDate}>10-8-2025</td>
                  <td className={styles.cellCenter}>0</td>
                  <td className={styles.cellCenter}>89%</td>
                  <td className={styles.cellCenter}>+60</td>
                  <td className={styles.cellCenter}></td>
                  <td className={styles.cellCenter}>
                    <div className={styles.statusUp}>
                      <svg className={styles.statusIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                      </svg>
                    </div>
                  </td>
                </tr>
                <tr className={styles.tableRow}>
                  <td className={styles.cell}>03.</td>
                  <td className={styles.cellDate}>10-8-2025</td>
                  <td className={styles.cellCenter}>1</td>
                  <td className={styles.cellCenter}>55%</td>
                  <td className={styles.cellCenter}>-25</td>
                  <td className={styles.cellCenter}></td>
                  <td className={styles.cellCenter}>
                    <div className={styles.statusDown}>
                      <svg className={styles.statusIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                      </svg>
                    </div>
                  </td>
                </tr>
                <tr className={styles.tableRow}>
                  <td className={styles.cell}>04.</td>
                  <td className={styles.cellDate}>10-8-2025</td>
                  <td className={styles.cellCenter}>6</td>
                  <td className={styles.cellCenter}>23%</td>
                  <td className={styles.cellCenter}>+36</td>
                  <td className={styles.cellCenter}></td>
                  <td className={styles.cellCenter}>
                    <div className={styles.statusUp}>
                      <svg className={styles.statusIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                      </svg>
                    </div>
                  </td>
                </tr>
                <tr className={styles.tableRow}>
                  <td className={styles.cell}>05.</td>
                  <td className={styles.cellDate}>10-8-2025</td>
                  <td className={styles.cellCenter}>1</td>
                  <td className={styles.cellCenter}>98%</td>
                  <td className={styles.cellCenter}>+55</td>
                  <td className={styles.cellCenter}></td>
                  <td className={styles.cellCenter}>
                    <div className={styles.statusUp}>
                      <svg className={styles.statusIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                      </svg>
                    </div>
                  </td>
                </tr>
                <tr className={styles.tableRow}>
                  <td className={styles.cell}>06.</td>
                  <td className={styles.cellDate}>10-8-2025</td>
                  <td className={styles.cellCenter}>0</td>
                  <td className={styles.cellCenter}>45%</td>
                  <td className={styles.cellCenter}>--</td>
                  <td className={styles.cellCenter}></td>
                  <td className={styles.cellCenter}>
                    <div className={styles.statusUp}>
                      <svg className={styles.statusIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                      </svg>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.loadMoreWrapper}>
            <button className={styles.loadMoreButton}>Load more...</button>
          </div>
        </div>
      </div>

      {/* Action Plan */}
      <div className={styles.actionPlan}>
        <div className={styles.actionContent}>
          <div className={styles.actionIcon}>
            <span className={styles.emoji}>💡</span>
          </div>
          <div className={styles.actionText}>
            <h3 className={styles.actionTitle}>Action Plan:</h3>
            <div className={styles.actionList}>
              <div className={styles.actionItem}>
                <span className={styles.checkmark}>✓</span>
                <span className={styles.actionTextItem}>Focus on Verbal Ability & DI to gain an extra 40-50 points.</span>
              </div>
              <div className={styles.actionItem}>
                <span className={styles.checkmark}>✓</span>
                <span className={styles.actionTextItem}>Attempt more mock tests to improve speed and accuracy.</span>
              </div>
              <div className={styles.actionItem}>
                <span className={styles.checkmark}>✓</span>
                <span className={styles.actionTextItem}>Analyze mistakes and learn from the top performers.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
