'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { useParams } from 'next/navigation';

export default function PerformanceBreakdownPage() {
  const params = useParams();
  const locale = params.locale;
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>
            <span className={styles.highlight}>Leaderboard</span>
            <span> - Track Your Progress & Compete!</span>
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

      {/* Performance Breakdown */}
      <div className={`${styles.breakdownCard} ${styles.fadeIn}`}>
        <h2 className={styles.breakdownTitle}>Performance Breakdown</h2>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon}>
                <svg className={styles.icon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <div className={styles.statLabel}>Total Tests:</div>
                <div className={styles.statValue}>#128</div>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon}>
                <svg className={styles.icon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <div className={styles.statLabel}>Top 10 Cutoff Score:</div>
                <div className={styles.statValue}>900+</div>
              </div>
            </div>
          </div>
        </div>

        {/* Last 5 Tests Performance */}
        <h3 className={styles.sectionTitle}>Your last 5 tests performance</h3>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={styles.headerCellLeft}>Rank</th>
                <th className={styles.headerCellCenter}>Score (%)</th>
                <th className={styles.headerCellRight}>Points</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.tableRow}>
                <td className={styles.cell}>Test 128</td>
                <td className={styles.cellCenter}>96% (960)</td>
                <td className={styles.cellRight}>+140 Points</td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.cell}>Test 127</td>
                <td className={styles.cellCenter}>92% (920)</td>
                <td className={styles.cellRight}>+100 Points</td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.cell}>Test 126</td>
                <td className={styles.cellCenter}>90% (900)</td>
                <td className={styles.cellRight}>+90 Points</td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.cell}>Test 125</td>
                <td className={styles.cellCenter}>90% (900)</td>
                <td className={styles.cellRight}>+80 Points</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
