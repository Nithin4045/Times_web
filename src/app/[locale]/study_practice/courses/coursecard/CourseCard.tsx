'use client';
import { useRouter } from 'next/navigation';
import { CheckCircleFilled } from '@ant-design/icons';
import styles from './page.module.css';
import { useSelectedCourse } from '@/store/selectedcourse';
import type { CourseBundle } from '@/app/[locale]/study_practice/courses/types';

type Props = {
  title: string;
  validUntil?: string;
  percent: number;
  bundle: CourseBundle;
  onOpenDetails?: () => void;
  onStart?: () => void;
  secondaryLinkHref?: string; // kept for display/link fallback but NOT for navigation
  startHref?: string;         // kept for display/link fallback but NOT for navigation
  isExpired?: boolean;
};

export default function CourseCard({
  title,
  validUntil = 'N/A',
  percent,
  bundle,
  onOpenDetails,
  onStart,
  secondaryLinkHref,
  startHref,
  isExpired = false,
}: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const router = useRouter();
  const setSelected = useSelectedCourse((s) => s.setSelected);

  const DETAILS_ROUTE = '/study_practice/courses/course_details';

  const navigateToDetails = () => {
    setSelected(bundle);
    router.push(DETAILS_ROUTE);
  };

  const handleDetails = () => {
    if (onOpenDetails) onOpenDetails();
    navigateToDetails();
  };

  const handleStart = () => {
    if (onStart) onStart();
    navigateToDetails(); // forced: always go to details route
  };

  const rootClass = `${styles.card} ${isExpired ? styles.disabledCard : ''}`;

  const DetailsCTA = () => {
    if (isExpired) {
      return (
        <span
          className={styles.detailsLink}
          aria-disabled="true"
          role="link"
          tabIndex={-1}
          style={{ cursor: 'default', pointerEvents: 'none' }}
        >
          Course Details
        </span>
      );
    }

    // Use callbacks if present, but navigation always goes to DETAILS_ROUTE
    return (
      <a
        href="#"
        className={styles.detailsLink}
        onClick={(e) => { e.preventDefault(); handleDetails(); }}
        role="link"
        aria-label="Course Details"
      >
        Course Details
      </a>
    );
  };

  const StartCTA = () => {
    if (isExpired) {
      return (
        <span
          className={styles.startBtn}
          aria-disabled="true"
          role="button"
          tabIndex={-1}
          style={{ pointerEvents: 'none', opacity: 1 }}
        >
          Expired
        </span>
      );
    }

    return (
      <a
        href="#"
        className={styles.startBtn}
        onClick={(e) => { e.preventDefault(); handleStart(); }}
        role="link"
        aria-label="Start"
      >
        START <span className={styles.arrow}>→</span>
      </a>
    );
  };

  return (
    <article className={rootClass} aria-disabled={isExpired}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.line} />

      {/* <p className={styles.valid}>
        {isExpired ? 'Expired' : `Valid until : ${validUntil || 'N/A'}`}
      </p> */}
      {/* <div className={styles.line} /> */}

      <DetailsCTA />

      <div className={styles.progressBar} aria-hidden={isExpired}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>

      <div className={styles.footer}>
        <StartCTA />
        <div className={styles.percentWrapper}>
          <span className={styles.percent}>{pct}%</span>
          {pct === 100 && (
            <CheckCircleFilled style={{ color: '#30b24a', fontSize: '18px', marginLeft: '6px' }} />
          )}
        </div>
      </div>
    </article>
  );
}

/* ---------- Skeleton ---------- */
function Skeleton() {
  return (
    <article className={`${styles.card} ${styles.skel}`}>
      <div className={styles.skelTitle} />
      <div className={styles.line} />
      {/* <div className={styles.skelValid} /> */}
      {/* <div className={styles.line} /> */}
      <div className={styles.skelLink} />
      <div className={styles.progressBar}>
        <div className={`${styles.progressFill} ${styles.skelFill}`} style={{ width: '60%' }} />
      </div>
      <div className={styles.footer}>
        <div className={styles.skelBtn} />
        <div className={styles.skelPct} />
      </div>
    </article>
  );
}
CourseCard.Skeleton = Skeleton;