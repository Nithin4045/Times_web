'use client';

import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import styles from './recommendedcourses.module.css';

export type RecommendedItem = {
  id: string | number;
  href?: string;                 // optional link for the whole card
  imageUrl: string;              // course thumbnail
  title: string;                 // e.g. "Online Recorded (Flexi)"
  subtitle?: string;             // e.g. "Courses - OMETs"
  price: number;                 // original price (e.g. 8950)
  dealPrice?: number;            // discounted price (e.g. 5550)
  timeLeftLabel?: string;        // e.g. "2d Left"
};

export interface RecommendedCoursesProps {
  items: RecommendedItem[];
  className?: string;
  onCardClick?: (item: RecommendedItem) => void;
}

/** Single card (exported in case you want to use it standalone) */
export function RecommendedCard({ item, onClick }: { item: RecommendedItem; onClick?: () => void }) {
  const content = (
    <div className={styles.card} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : -1}>
      <div className={styles.thumbWrap}>
        {/* Use next/image for optimization; falls back to <img> sizing */}
        <Image
          className={styles.thumb}
          src={item.imageUrl}
          alt={item.title}
          width={120}
          height={90}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.title}>{item.title}</div>
        {item.subtitle && <div className={styles.subtitle}>{item.subtitle}</div>}

        <div className={styles.bottomRow}>
          <div className={styles.priceCol}>
            <div className={styles.price}>₹{item.price.toLocaleString('en-IN')}</div>
            {typeof item.dealPrice === 'number' && (
              <div className={styles.deal}>For you <span>₹{item.dealPrice.toLocaleString('en-IN')}</span></div>
            )}
          </div>

          {item.timeLeftLabel && (
            <div className={styles.timeLeft} aria-label={`${item.timeLeftLabel} remaining`}>
              {/* tiny clock svg */}
              <svg viewBox="0 0 24 24" width="18" height="18" className={styles.clock} aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className={styles.timeText}>{item.timeLeftLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className={styles.cardLink} aria-label={item.title}>
        {content}
      </Link>
    );
  }
  return content;
}

/** List/row of recommended course cards */
export default function RecommendedCourses({ items, className, onCardClick }: RecommendedCoursesProps) {
  return (
    <div className={clsx(styles.list, className)}>
      {items.map((it) => (
        <RecommendedCard key={it.id} item={it} onClick={onCardClick ? () => onCardClick(it) : undefined} />
      ))}
    </div>
  );
}
