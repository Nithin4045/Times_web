'use client';

import { useEffect, useMemo, useState } from 'react';
import { Table, Empty, Spin, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';

import styles from './page.module.css';
import { SetBreadcrumb } from '@/app/[locale]/study_practice/BreadcrumbContext';
import { useSelectedCourse } from '@/store/selectedcourse';

/* ---------- Types ---------- */
type LiveSessionRaw = {
  id: number;
  name: string | null;
  description: string | null;
  start_date_time: string;
  end_date_time: string;
  session_link: string;
  batch_id: number;
};

type DBFuncData = {
  id_card_no?: string;
  batch_id?: number | null;
  completed_ids?: number[];
  counts?: { total: number; completed: number; pending: number };
  completed?: LiveSessionRaw[];
  pending?: LiveSessionRaw[];
};

type ApiResponse = { id_card_no: string; data: DBFuncData };

type LiveSession = LiveSessionRaw & {
  attended: boolean;       // true if from 'completed' bucket
  src: 'completed' | 'pending';
};

type SelectedShape = {
  course?: {
    course_id?: number | string;
    batch_id?: number | string;
    city_center?: number | string;
    course_name?: string;
  };
};

/* ---------- Helpers (LOCAL time parsing) ---------- */
const parseLocal = (s: string) => new Date(s.replace(' ', 'T'));

const toNum = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const fmtDateDMY = (d: Date) =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);

const fmtTimeHM = (d: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(d)
    .replace(/\u202F/g, '');

const fmtDuration = (start: Date, end: Date) => {
  const mins = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  return `${(mins / 60).toFixed(1)}Hrs`;
};

const INITIAL_COUNT = 15;
const LOAD_MORE_STEP = 10;

/* ---------- Page ---------- */
export default function LiveSessionsAntTablePage() {
  const { data: session } = useSession();
  const selected = useSelectedCourse((s) => s.selected);

  const z = (selected as SelectedShape) || {};
  const courseId = toNum(z.course?.course_id);
  const batchId = toNum(z.course?.batch_id);
  const cityCenterId = toNum(z.course?.city_center);
  const idCardNo: string = session?.user?.id_card_no ?? '';
  const courseName = z.course?.course_name ?? 'Live Sessions';

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<LiveSession[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [markingId, setMarkingId] = useState<number | null>(null);

  // Fetch (new API that returns { id_card_no, data: { completed[], pending[] } })
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        if (!idCardNo) throw new Error('Missing id_card_no');

        const form = new FormData();
        form.set('id_card_no', idCardNo);

        const res = await fetch('/api/study_practice/get_live_sessions', {
          method: 'POST',
          body: form,
          cache: 'no-store',
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${txt}`);
        }

        const json: ApiResponse = await res.json();
        const data = json?.data ?? {};

        const completed = (data.completed ?? []).map<LiveSession>((s) => ({
          ...s,
          attended: true,
          src: 'completed',
        }));
        const pending = (data.pending ?? []).map<LiveSession>((s) => ({
          ...s,
          attended: false,
          src: 'pending',
        }));

        const all = [...completed, ...pending].sort(
          (a, b) =>
            parseLocal(a.start_date_time).getTime() - parseLocal(b.start_date_time).getTime()
        );

        if (!cancelled) {
          setRows(all);
          setVisibleCount(INITIAL_COUNT);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || 'Failed to fetch live sessions');
          message.error('Failed to fetch live sessions');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, batchId, cityCenterId, idCardNo]);

  const now = Date.now();
  const { upcoming, completed } = useMemo(() => {
    const up: LiveSession[] = [];
    const done: LiveSession[] = [];

    for (const s of rows) {
      const end = parseLocal(s.end_date_time).getTime();
      if (s.src === 'completed') {
        // Always show in Completed
        done.push(s);
      } else {
        // pending
        if (end < now) done.push(s);
        else up.push(s);
      }
    }

    return {
      upcoming: up,
      completed: done.sort(
        (a, b) =>
          parseLocal(a.start_date_time).getTime() - parseLocal(b.start_date_time).getTime()
      ),
    };
  }, [rows, now]);

  // Progress (only past sessions: end < now)
  const completedEligible = useMemo(
    () => completed.filter((s) => parseLocal(s.end_date_time).getTime() < now),
    [completed, now]
  );
  const completedTotal = completedEligible.length;
  const completedAttended = completedEligible.reduce(
    (acc, s) => acc + (s.attended ? 1 : 0),
    0
  );
  const progressPct =
    completedTotal > 0 ? Math.round((completedAttended / completedTotal) * 100) : 0;

  // Table data
  const data = activeTab === 'upcoming' ? upcoming : completed;
  const firstUpcomingId = useMemo(
    () => (upcoming.length ? upcoming[0].id : null),
    [upcoming]
  );
  const visibleData = useMemo(() => data.slice(0, visibleCount), [data, visibleCount]);
  const hasMore = data.length > visibleData.length;

  // Mark-attend then navigate (unchanged)
  const handleJoin = async (row: LiveSession) => {
    if (!row?.session_link) return;
    if (!idCardNo) {
      message.error('Missing user info');
      return;
    }
    try {
      setMarkingId(row.id);
      const res = await fetch('/api/study_practice/get_live_sessions/mark_attend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          id_card_no: idCardNo,
          live_session_id: row.id,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${txt}`);
      }

      // optimistic: mark attended & move to completed partition automatically on next render
      setRows((prev) =>
        prev.map((s) =>
          s.id === row.id ? { ...s, attended: true, src: 'completed' } : s
        )
      );

      window.open(row.session_link, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      message.error('Could not mark attendance. Please try again.');
      console.error('[join][mark_attend] error:', e?.message);
    } finally {
      setMarkingId(null);
    }
  };

  /* ---------- Columns ---------- */
  const columns: ColumnsType<LiveSession & { key: number }> = [
    {
      title: <span className={styles.thText}>Topic</span>,
      dataIndex: 'name',
      key: 'name',
      render: (v: string | null, r) => (
        <span
          className={
            r.id === firstUpcomingId && activeTab === 'upcoming' ? styles.topicBold : undefined
          }
        >
          {v || '—'}
        </span>
      ),
    },
    {
      title: <span className={styles.thText}>Date</span>,
      key: 'date',
      render: (_, r) => <span>{fmtDateDMY(parseLocal(r.start_date_time))}</span>,
    },
    {
      title: <span className={styles.thText}>Time</span>,
      key: 'time',
      align: 'center',
      width: 120,
      render: (_, r) => <span>{fmtTimeHM(parseLocal(r.start_date_time))}</span>,
    },
    {
      title: <span className={styles.thText}>Duration</span>,
      key: 'duration',
      align: 'center',
      width: 120,
      render: (_, r) => (
        <span>{fmtDuration(parseLocal(r.start_date_time), parseLocal(r.end_date_time))}</span>
      ),
    },
    {
      title: (
        <span className={styles.thText}>
          {activeTab === 'upcoming' ? 'Action' : 'Status'}
        </span>
      ),
      key: 'action',
      align: 'right',
      width: 220,
      render: (_, r) => {
        if (activeTab === 'upcoming') {
          const start = parseLocal(r.start_date_time).getTime();
          const end = parseLocal(r.end_date_time).getTime();
          const isLive = now >= start && now <= end;

          const disabled = !isLive || markingId === r.id || r.attended;
          return (
            <button
              type="button"
              disabled={disabled}
              className={`${styles.joinBtn} ${
                r.id === firstUpcomingId ? styles.joinBtnPrimary : ''
              } ${disabled ? styles.joinBtnDisabled : ''}`}
              onClick={() => handleJoin(r)}
              title={isLive ? 'Join Session' : 'Available during live session'}
            >
              {markingId === r.id ? (
                <>
                  <LoadingOutlined /> Updating…
                </>
              ) : (
                <>
                  Join Session <ArrowRightOutlined className={styles.btnArrow} />
                </>
              )}
            </button>
          );
        }

        // Completed tab status rule:
        // ✅ if attended AND end <= now
        // ❌ otherwise (future-ended or missed)
        const endMs = parseLocal(r.end_date_time).getTime();
        const showCheck = r.attended && endMs <= now;

        return showCheck ? (
          <CheckCircleFilled className={styles.okIcon} />
        ) : (
          <CloseCircleFilled className={styles.noIcon} />
        );
      },
    },
  ];

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <main className={styles.container}>
        <SetBreadcrumb text={courseName} />
        <div className={styles.center}><Spin size="large" /></div>
      </main>
    );
  }
  if (err) {
    return (
      <main className={styles.container}>
        <SetBreadcrumb text={courseName} />
        <p className={styles.error}>{err}</p>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <SetBreadcrumb text="Live doubts solving sessions - schedules" />

      {/* Progress (completed sessions only) */}
      <div className={styles.progressWrap}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
        <div className={styles.progressMeta}>
          <span className={styles.progressPct}>{progressPct}%</span>&nbsp;Completed
        </div>
      </div>

      {/* Separate buttons for tabs */}
      <div className={styles.tabBarSeparate}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'upcoming' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('upcoming');
            setVisibleCount(INITIAL_COUNT);
          }}
        >
          Upcoming Sessions
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'completed' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('completed');
            setVisibleCount(INITIAL_COUNT);
          }}
        >
          Completed Sessions
        </button>
      </div>

      {/* Card + Ant Table */}
      <section className={styles.card}>
        {visibleData.length === 0 ? (
          <div className={styles.emptyWrap}>
            <Empty description="No sessions" />
          </div>
        ) : (
          <Table
            dataSource={visibleData.map((r) => ({ ...r, key: r.id }))}
            columns={columns}
            pagination={false}
            className={styles.table}
            rowClassName={(record) =>
              activeTab === 'upcoming' && record.id === firstUpcomingId
                ? styles.rowHighlight
                : ''
            }
          />
        )}

        {hasMore && (
          <div className={styles.loadMore}>
            <button
              type="button"
              onClick={() =>
                setVisibleCount((c) => Math.min(c + LOAD_MORE_STEP, data.length))
              }
              className={styles.loadMoreBtn}
            >
              Load more…
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
