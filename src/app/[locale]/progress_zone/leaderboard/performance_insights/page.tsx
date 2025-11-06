'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { useParams } from 'next/navigation';

export default function PerformanceInsightsPage() {
  const params = useParams();
  const locale = params.locale;

  return (
    <div className={styles.container}>
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

      <h2 className={styles.pageTitle}>Detailed Performance Insights</h2>

      <div className={styles.cardsGrid}>
        {/* Quantitative Aptitude */}
        <div className={`${styles.performanceCard} ${styles.fadeIn}`}>
          <h3 className={styles.cardTitle}>Quantitative Aptitude</h3>
          <div className={styles.progressWrapper}>
            <svg width="160" height="160" className={styles.progressSvg}>
              <circle cx="80" cy="80" r="70" fill="none" stroke="#E5E7EB" strokeWidth="20"/>
              <circle className={styles.progressRing} cx="80" cy="80" r="70" fill="none" stroke="#22C55E" strokeWidth="20" strokeDasharray="439.6" strokeDashoffset="43.96" strokeLinecap="round"/>
            </svg>
            <div className={styles.percentage}>90%</div>
          </div>
        </div>

        {/* Logical Reasoning */}
        <div className={`${styles.performanceCard} ${styles.fadeIn}`} style={{ animationDelay: '0.1s' }}>
          <h3 className={styles.cardTitle}>Logical Reasoning</h3>
          <div className={styles.progressWrapper}>
            <svg width="160" height="160" className={styles.progressSvg}>
              <circle cx="80" cy="80" r="70" fill="none" stroke="#E5E7EB" strokeWidth="20"/>
              <circle className={styles.progressRing} cx="80" cy="80" r="70" fill="none" stroke="#84CC16" strokeWidth="20" strokeDasharray="439.6" strokeDashoffset="65.94" strokeLinecap="round"/>
            </svg>
            <div className={styles.percentage} style={{ color: '#84CC16' }}>85%</div>
          </div>
        </div>

        {/* Verbal Ability */}
        <div className={`${styles.performanceCard} ${styles.fadeIn}`} style={{ animationDelay: '0.2s' }}>
          <h3 className={styles.cardTitle}>Verbal Ability</h3>
          <div className={styles.progressWrapper}>
            <svg width="160" height="160" className={styles.progressSvg}>
              <circle cx="80" cy="80" r="70" fill="none" stroke="#E5E7EB" strokeWidth="20"/>
              <circle className={styles.progressRing} cx="80" cy="80" r="70" fill="none" stroke="#F59E0B" strokeWidth="20" strokeDasharray="439.6" strokeDashoffset="109.9" strokeLinecap="round"/>
            </svg>
            <div className={styles.percentage} style={{ color: '#F59E0B' }}>75%</div>
          </div>
        </div>

        {/* Data Interpretation */}
        <div className={`${styles.performanceCard} ${styles.fadeIn}`} style={{ animationDelay: '0.3s' }}>
          <h3 className={styles.cardTitle}>Data Interpretation</h3>
          <div className={styles.progressWrapper}>
            <svg width="160" height="160" className={styles.progressSvg}>
              <circle cx="80" cy="80" r="70" fill="none" stroke="#E5E7EB" strokeWidth="20"/>
              <circle className={styles.progressRing} cx="80" cy="80" r="70" fill="none" stroke="#EF4444" strokeWidth="20" strokeDasharray="439.6" strokeDashoffset="131.88" strokeLinecap="round"/>
            </svg>
            <div className={styles.percentage} style={{ color: '#EF4444' }}>70%</div>
          </div>
        </div>
      </div>

      {/* Action Plan */}
      <div className={`${styles.actionPlan} ${styles.fadeIn}`} style={{ animationDelay: '0.4s' }}>
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
