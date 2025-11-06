'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

type ScheduleItem = {
  id: number;
  course: string;
  topic_name: string | null;
  batch_code: string | null;
  material_code: string | null;
  scheduled_date_time: string | null; // ISO string
  live_url?: string | null;
  video?: string | null;
};

type ApiResponse = {
  variant: string;
  course: string;
  input_batch: string;
  resolved_batch: string;
  merged: boolean;
  count: number;
  data: ScheduleItem[];
};

const TZ = 'Asia/Kolkata';

function valueOrNA(v: any): string {
  if (v === null || v === undefined) return 'N/A';
  const s = String(v).trim();
  return s.length ? s : 'N/A';
}

// Format: Wed, 20 Aug 2025 • 12:30 PM IST
function formatDateTime(iso: string | null): string {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  const date = new Intl.DateTimeFormat('en-IN', {
    timeZone: TZ,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-IN', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return `${date} • ${time} IST`;
}

// Derive your materials URL from the code
function buildMaterialUrl(code: string | null | undefined): string | null {
  if (!code) return null;
  // TODO: replace with your actual route/pattern if different
  return `/materials/${encodeURIComponent(code)}`;
}

export default function CourseSchedulePage() {
  const sp = useSearchParams();
  const variant = (sp.get('variant') || '').trim();
  const course = (sp.get('course') || '').trim();
  const batch = (sp.get('batch') || '').trim();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const titleText = useMemo(() => {
    const parts = [
      course ? `${course}` : 'N/A',
      variant ? `(${variant})` : '',
    ].filter(Boolean);
    return parts.join(' ');
  }, [course, variant]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      setData(null);

      if (!variant || !course || !batch) {
        setErr('Missing inputs: variant, course, batch');
        setLoading(false);
        return;
      }

      try {
        const q = new URLSearchParams({ variant, course, batch }).toString();
        const res = await fetch(`/api/study_practice/course_schedule?${q}`, { method: 'GET' });
        const json: ApiResponse = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setErr((json as any)?.error || `Request failed with ${res.status}`);
        } else {
          setData(json);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [variant, course, batch]);

  const header = (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <span
          className={
            variant?.toUpperCase() === 'ONLINELIVE'
              ? `${styles.pill} ${styles.pillLive}`
              : variant?.toUpperCase().includes('FLEXI')
              ? `${styles.pill} ${styles.pillFlexi}`
              : `${styles.pill} ${styles.pillOffline}`
          }
          title={valueOrNA(variant)}
        >
          {valueOrNA(variant)}
        </span>

        <h1 className={styles.title} title={titleText}>
          {titleText || 'Course Schedule'}
        </h1>
      </div>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Input Batch:</span>
          <span className={styles.metaValue}>{valueOrNA(data?.input_batch ?? batch)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Resolved Batch:</span>
          <span className={styles.metaValue}>
            {valueOrNA(data?.resolved_batch ?? batch)}
            {data?.merged ? <em className={styles.mergedNote}>&nbsp;(merged)</em> : null}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Total Sessions:</span>
          <span className={styles.metaValue}>{data?.count ?? 'N/A'}</span>
        </div>
      </div>
    </header>
  );

  const skeletons = Array.from({ length: 4 }).map((_, i) => (
    <div key={`sk-${i}`} className={styles.skelCard} aria-hidden>
      <div className={styles.skelLineWide} />
      <div className={styles.skelLine} />
      <div className={styles.skelMetaRow}>
        <div className={styles.skelChip} />
        <div className={styles.skelChip} />
      </div>
      <div className={styles.skelTrack} />
      <div className={styles.skelActions}>
        <div className={styles.skelBtn} />
        <div className={styles.skelBtn} />
        <div className={styles.skelBtnGhost} />
      </div>
    </div>
  ));

  if (loading) {
    return (
      <main className={styles.container}>
        {header}
        <section className={styles.grid}>{skeletons}</section>
      </main>
    );
  }

  if (err) {
    return (
      <main className={styles.container}>
        {header}
        <div className={styles.errorBox}>
          <strong>Oops!</strong> {err}
        </div>
      </main>
    );
  }

  const items = data?.data ?? [];

  return (
    <main className={styles.container}>
      {header}

      {items.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📚</div>
          <div className={styles.emptyText}>No sessions scheduled yet.</div>
          <div className={styles.emptySub}>Please check back later.</div>
        </div>
      ) : (
        <section className={styles.grid}>
          {items.map((s) => {
            const topic = valueOrNA(s.topic_name);
            const when = formatDateTime(s.scheduled_date_time);
            const batchShow = valueOrNA(s.batch_code);
            const matCode = valueOrNA(s.material_code);
            const matUrl = buildMaterialUrl(s.material_code);
            const liveUrl = s.live_url || null;
            const videoUrl = s.video || null;

            // Button enable/disable logic by variant
            const isLiveVariant = variant.toUpperCase() === 'ONLINELIVE';
            const showLive = !!liveUrl && isLiveVariant;
            const showVideo = !!videoUrl; // Flexi & post-live
            const showMaterial = !!matUrl;

            return (
              <article key={s.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.when}>{when}</div>
                  <div className={styles.topic} title={topic}>{topic}</div>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.badge}>Batch: {batchShow}</span>
                  <span className={styles.badge}>Material: {matCode}</span>
                </div>

                <div className={styles.actions}>
                  <a
                    className={`${styles.btn} ${styles.btnPrimary} ${showLive ? '' : styles.btnDisabled}`}
                    href={showLive ? liveUrl! : undefined}
                    target={showLive ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    aria-disabled={!showLive}
                    title={showLive ? 'Join Live Class' : 'Live link N/A'}
                  >
                    Join Live
                  </a>

                  <a
                    className={`${styles.btn} ${styles.btnSecondary} ${showVideo ? '' : styles.btnDisabled}`}
                    href={showVideo ? videoUrl! : undefined}
                    target={showVideo ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    aria-disabled={!showVideo}
                    title={showVideo ? 'Watch Recording' : 'Recording N/A'}
                  >
                    Watch Recording
                  </a>

                  <a
                    className={`${styles.btn} ${styles.btnGhost} ${showMaterial ? '' : styles.btnDisabled}`}
                    href={showMaterial ? matUrl! : undefined}
                    target={showMaterial ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    aria-disabled={!showMaterial}
                    title={showMaterial ? 'Open Study Material' : 'Material N/A'}
                  >
                    Material
                  </a>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
