'use client';

import Link from 'next/link';
import clsx from 'clsx';
import styles from './coursecard.module.css';

export interface CourseCardProps {
  title: string;                     // e.g. "T.I.M.E. Self Study course"
  subtitle?: string;                 // e.g. "Regular 2025"
  validUntil?: string;               // e.g. "5th Apr 2025"
  secondaryLinkText?: string;        // e.g. "Course Details" | "View Performance Reports"
  secondaryLinkHref?: string;
  percent?: number;                  // 0 - 100 (e.g. 76)
  startHref?: string;                // link to start
  startLabel?: string;               // default: "START"
  showCheck?: boolean;               // green check badge (for enrolled/active)
  className?: string;
  onStartClick?: () => void;         // optional handler if you prefer a button
}

export default function CourseCard({
  title,
  subtitle,
  validUntil,
  secondaryLinkText,
  secondaryLinkHref,
  percent = 0,
  startHref = '#',
  startLabel = 'START',
  showCheck = false,
  className,
  onStartClick,
}: CourseCardProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  const StartAction = onStartClick ? (
    <button
      type="button"
      onClick={onStartClick}
      className={styles.startBtn}
      aria-label={`${startLabel} ${title}`}
    >
      {startLabel} <span className={styles.arrow} aria-hidden>→</span>
    </button>
  ) : (
    <Link href={startHref} className={styles.startBtn} aria-label={`${startLabel} ${title}`}>
      {startLabel} <span className={styles.arrow} aria-hidden>→</span>
    </Link>
  );

  return (
    <div className={clsx(styles.card, className)}>
      {/* Optional top-right check */}
      {showCheck && (
        <div className={styles.checkBadge} aria-label="Active">
          ✓
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>

      {validUntil && (
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Valid until :</span>
          <span className={styles.metaValue}>{validUntil}</span>
        </div>
      )}

      {(secondaryLinkText && secondaryLinkHref) && (
        <div className={styles.linkRow}>
          <Link href={secondaryLinkHref} className={styles.inlineLink}>
            {secondaryLinkText}
          </Link>
        </div>
      )}

      <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped}>
        <div className={styles.progressFill} style={{ width: `${clamped}%` }} />
      </div>

      <div className={styles.actionRow}>
        {StartAction}
        <span className={styles.percent}>{clamped}%</span>
      </div>
    </div>
  );
}
