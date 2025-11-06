'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './page.module.css';

export default function LeaderboardPage() {
  const params = useParams();
  const locale = params.locale;

  return (
    <div className={styles.container}>
      <div>
        {/* Header */}
        <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>
            <span className={styles.highlight}>Leaderboard</span>
            <span> - Track Your Progress & Compete!</span>
          </h1>
          <Link href=".." className={styles.backButton}>
            <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back
          </Link>
        </div>
        <hr className={styles.headerDivider} />
      </div>

      {/* Welcome Message */}
      <div className={styles.welcomeSection}>
        <p className={styles.welcomeText}>
          <strong>Welcome to Leaderboard,</strong> Your performance is improving, and here's how you compare with others in your batch.
        </p>
        <p className={styles.welcomeText}>
          Stay motivated, analyze your ranking, and keep working towards the top!
        </p>
      </div>

      {/* Info Cards */}
      <div className={styles.infoCard}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>
              <span className={styles.emoji}>🆔</span>
            </div>
            <div>
              <div className={styles.infoLabel}>Student ID:</div>
              <div className={styles.infoValue}>[XXXXXX]</div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>
              <span className={styles.emoji}>📅</span>
            </div>
            <div>
              <div className={styles.infoLabel}>Date:</div>
              <div className={styles.infoValue}>[March 18, 2025]</div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>
              <span className={styles.emoji}>📚</span>
            </div>
            <div>
              <div className={styles.infoLabel}>Course:</div>
              <div className={styles.infoValue}>CAT 2025 Flexi Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Performance Overview</h2>
          <div className={styles.activeDays}>
            <span className={styles.activeDaysLabel}>Active for </span>
            <span className={styles.activeDaysValue}>15</span>
            <span className={styles.activeDaysLabel}>/</span>
            <span className={styles.activeDaysMax}>20</span>
            <span className={styles.activeDaysLabel}> days this month</span>
          </div>
        </div>

        <div className={styles.performanceGrid}>
          {/* Current Rank */}
          <div className={styles.performanceCard}>
            <div className={styles.rankDisplay}>
              <span className={styles.rankLabel}>Your Current Rank:</span>
              <span className={styles.rankBadge}>#128</span>
              <span className={styles.rankTotal}>out of 220 Tests</span>
            </div>
          </div>

          {/* Milestones */}
          <div className={styles.performanceCard}>
            <div className={styles.milestonesDisplay}>
              <div className={styles.milestonesValue}>5/8</div>
              <div className={styles.milestonesLabel}>Milestones Achieved</div>
            </div>
          </div>
        </div>

        <div className={styles.performanceGrid}>
          {/* Recent Improvement */}
          <div className={styles.improvementCard}>
            <div className={styles.improvementContent}>
              <div className={`${styles.improvementIcon} ${styles.iconYellow}`}>
                <span className={styles.emoji}>📊</span>
              </div>
              <div>
                <p className={styles.improvementLabel}>Recent Improvement</p>
                <div className={styles.improvementValue}>
                  <span className={styles.improvementNumber}>+12</span>
                  <span className={styles.improvementPercent}>%</span>
                  <span className={styles.improvementText}>accuracy in DILR last week</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Goal */}
          <div className={styles.improvementCard}>
            <div className={styles.improvementContent}>
              <div className={`${styles.improvementIcon} ${styles.iconPink}`}>
                <span className={styles.emoji}>🎯</span>
              </div>
              <div>
                <p className={styles.improvementLabel}>Next Goal</p>
                <div className={styles.improvementValue}>
                  <span className={styles.improvementNumber}>50</span>
                  <span className={styles.improvementTextGoal}>Marks Improvement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Performance */}
      <div className={styles.section}>
        <hr className={styles.sectionDivider} />
        <h2 className={styles.sectionTitle}>Your detailed performance analysis</h2>
        <div className={styles.detailGrid}>
          <Link href={`/${locale}/progress_zone/leaderboard/performance_breakdown`} className={styles.detailLink}>
            <span className={styles.detailLinkText}>Performance Breakdown</span>
            <svg className={styles.detailArrow} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
          <Link href={`/${locale}/progress_zone/leaderboard/graphical_insights`} className={styles.detailLink}>
            <span className={styles.detailLinkText}>Graphical Insights</span>
            <svg className={styles.detailArrow} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
          <Link href={`/${locale}/progress_zone/leaderboard/performance_insights`} className={styles.detailLink}>
            <span className={styles.detailLinkText}>Detailed Performance Insights</span>
            <svg className={styles.detailArrow} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
        </div>
        <div className={styles.detailLinkWrapper}>
          <Link href={`/${locale}/progress_zone/leaderboard/daily_rank`} className={styles.detailLinkFull}>
            <span className={styles.detailLinkText}>Check your daily rank</span>
            <svg className={styles.detailArrow} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Next Steps */}
      <div className={styles.nextStepsSection}>
        <hr className={styles.sectionDivider} />
        <div className={styles.nextStepsContent}>
          <div className={styles.nextStepsIcon}>
            <div className={styles.nextStepsImage}>
              <span className={styles.emojiLarge}>📱</span>
            </div>
          </div>
          <div className={styles.nextStepsText}>
            <h2 className={styles.nextStepsTitle}>
              <span className={styles.emoji}>🔥</span>
              <span>Your Next Steps</span>
            </h2>
            <div className={styles.stepsList}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <div className={styles.stepContent}>
                  <strong>Take More Mock Tests -</strong>
                  <span> Improve accuracy & ranking.</span>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <div className={styles.stepContent}>
                  <strong>Watch Concept Videos -</strong>
                  <span> Strengthen weaker areas.</span>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <div className={styles.stepContent}>
                  <strong>Join Weekly Discussions -</strong>
                  <span> Gain insights from mentors & peers.</span>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>4</span>
                <div className={styles.stepContent}>
                  <strong>Challenge Yourself -</strong>
                  <span> Aim for a top 50 rank in the next leaderboard update!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
