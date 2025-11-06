'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Table, Space, Button, Spin, Empty, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { createPortal } from 'react-dom';
import styles from './page.module.css';
import { useSelectedCourse } from '@/store/selectedcourse';
import { useSession } from 'next-auth/react';
import { SetBreadcrumb } from '@/app/[locale]/study_practice/BreadcrumbContext';

/* ---------- Types ---------- */
type ApiWebinar = {
  id: number;
  subject?: string | null;
  topic_name?: string | null;
  topic_datetime?: string | null;
  video_link?: string | null;
  video_url?: string | null; // ✅ Generated video URL from API
  course_ids?: number[] | null;
  area?: string | null;
  level?: string | null;
};

type ApiResult = {
  success?: boolean;
  data?: any;
  webinars?: ApiWebinar[] | null;
  videolectures?: ApiWebinar[] | null; // fallback
};

/* ---------- Row shape ---------- */
type RowShape = {
  key: string;
  id: number;
  topic: string;
  topic_datetime?: string | null;
  video_link?: string | null;
  video_url?: string | null; // ✅ Generated video URL from API
  hasVideo: boolean;
};

/* ---------- Helpers ---------- */
const toNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const getZCourse = (selected: any) => selected?.course ?? selected ?? null;
const getCourseId = (selected: any): number | null => {
  const c = getZCourse(selected);
  if (!c) return null;
  return toNum(c.course_id) ?? toNum(c.id) ?? null;
};
const getCourseName = (selected: any): string => {
  const c = getZCourse(selected);
  if (!c) return 'Webinar Videos';
  const base = String(c.course_name ?? c.name ?? '').trim();
  const variant = String(c.variant ?? c.variants ?? '').trim();
  return (variant ? `${base} (${variant})` : base) || 'Webinar Videos';
};

const parseIsoLoose = (s?: string | null) => {
  if (!s) return null;
  try {
    const d = new Date(String(s));
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

/* ---------- Component ---------- */
export default function Page() {
  const { data: session, status: sessionStatus } = useSession();
  const selected = useSelectedCourse((s) => s.selected);

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [webinars, setWebinars] = useState<ApiWebinar[]>([]);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionTip] = useState('Please wait...');

  // iframe viewer state
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [iframeTitle, setIframeTitle] = useState<string>('');

  const activeCtrlRef = useRef<AbortController | null>(null);

  const idCardNo: string | null = (session as any)?.user?.id_card_no ?? null;
  const courseId = useMemo(() => getCourseId(selected), [selected]);
  const crumbTitle = useMemo(() => getCourseName(selected), [selected]);

  const PAGE_SIZE = 10;

  // Close iframe on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && iframeUrl) {
        setIframeUrl(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [iframeUrl]);

  /* ---------- Fetch webinars ---------- */
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;

    if (!idCardNo || !courseId) {
      setErrorText(!idCardNo ? 'Missing id_card_no from session.' : 'Missing course_id from selection.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText(null);
    if (activeCtrlRef.current && !activeCtrlRef.current.signal.aborted) {
      activeCtrlRef.current.abort();
    }
    const ctrl = new AbortController();
    activeCtrlRef.current = ctrl;

    (async () => {
      try {
        const fd = new FormData();
        fd.set('course_id', String(courseId));

        const res = await fetch('/api/study_practice/get_webinar_videos', {
          method: 'POST',
          body: fd,
          signal: ctrl.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || `HTTP ${res.status}`);
        }

        const json = (await res.json().catch(() => null)) as ApiResult | null;
        
        let arr: ApiWebinar[] = [];
        if (json == null) arr = [];
        else if (Array.isArray((json as any).webinars)) arr = (json as any).webinars;
        else if (Array.isArray((json as any).videolectures)) arr = (json as any).videolectures;
        else if (json.data && Array.isArray((json.data).webinars)) arr = json.data.webinars;
        else if (json.data && Array.isArray((json.data).videolectures)) arr = json.data.videolectures;
        else if (Array.isArray(json)) arr = json as unknown as ApiWebinar[];

        setWebinars(arr ?? []);
      } catch (e: any) {
        if (e?.name === 'AbortError' || ctrl.signal.aborted) return;
        console.error('[WebinarVideos] fetch error:', e);
        setErrorText(e?.message || 'Failed to load webinar videos.');
        message.error('Failed to load webinar videos.');
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      if (!ctrl.signal.aborted) ctrl.abort();
    };
  }, [sessionStatus, idCardNo, courseId]);

  /* ---------- Build rows ---------- */
  const rows = useMemo(() => {
    return (webinars ?? []).map((w) => {
      const topic = (w.topic_name ?? w.subject ?? `Webinar ${w.id}`).toString();
      const video_link = (w.video_link ?? (w as any).video ?? null) as string | null;
      const video_url = w.video_url ?? null; // ✅ Use generated video URL from API
      return {
        key: `w-${w.id}`,
        id: w.id,
        topic,
        topic_datetime: w.topic_datetime ?? null,
        video_link,
        video_url,
        hasVideo: !!(video_url || video_link),
      } as RowShape;
    });
  }, [webinars]);

  /* ---------- Mark seen (optional) ---------- */
  const markSeen = useCallback(async (webinarId: number): Promise<boolean> => {
    if (!idCardNo) return false;
    try {
      const fd = new FormData();
      fd.set('id_card_no', idCardNo);
      fd.set('webinar_id', String(webinarId));
      const res = await fetch('/api/study_practice/webinar_videos/updateseen', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) return false;
      const json = await res.json().catch(() => null);
      return !!(json?.success ?? true);
    } catch (err) {
      console.warn('[markSeen] error', err);
      return false;
    }
  }, [idCardNo]);

  /* ---------- Actions ---------- */
  const handleOpenVideo = useCallback(async (row: RowShape) => {
    const videoUrl = row.video_url || row.video_link;
    if (!videoUrl) return;
    try {
      setActionLoading(true);
      await markSeen(row.id);
      setIframeTitle(row.topic);
      setIframeUrl(videoUrl);
    } catch (err) {
      message.error('Could not open video.');
    } finally {
      setActionLoading(false);
    }
  }, [markSeen]);

  /* ---------- Columns (date/time removed) ---------- */
  const columns: ColumnsType<RowShape> = [
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
      render: (text) => <div className={styles.ellipsis}>{text}</div>,
      width: 760,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      width: 160,
      render: (_, row) => {
        return (
          <div className={styles.actionRight}>
            <Space>
              <Button
                type="primary"
                disabled={!row.hasVideo || actionLoading}
                onClick={() => handleOpenVideo(row)}
              >
                Video →
              </Button>
            </Space>
          </div>
        );
      },
    },
  ];

  /* ---------- Conditional pagination: hide when rows <= PAGE_SIZE ---------- */
  const paginationProp = rows.length > PAGE_SIZE
    ? { pageSize: PAGE_SIZE, size: 'small' as const, position: ['bottomCenter'] as const }
    : false;

  return (
    <main className={styles.page}>
      <SetBreadcrumb text='Webinar Videos' />

      {actionLoading && (
        <div className={styles.overlay}>
          <Spin tip={actionTip} />
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.controlsRow}>
          <div className={styles.leftControls} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* filters removed as requested */}
          </div>
        </div>

        <section className={styles.tableCard}>
          {loading ? (
            <div className={styles.centerPad}>
              <Spin tip="Loading webinar videos..." />
            </div>
          ) : errorText ? (
            <div className={styles.centerPad}>
              <Empty description={errorText} />
            </div>
          ) : rows.length === 0 ? (
            <div className={styles.centerPad}>
              <Empty description="No webinars found" />
            </div>
          ) : (
            <Table<RowShape>
              rowKey="key"
              className={styles.antTableTight}
              tableLayout="fixed"
              dataSource={rows}
              columns={columns}
              rowClassName={() => styles.rowBase}
              scroll={{ y: 'calc(100vh - 260px)', x: '100%' }}
              sticky
            />
          )}
        </section>
      </div>

      {/* Iframe Viewer - Rendered using Portal for proper z-index stacking */}
      {iframeUrl && typeof window !== 'undefined' && createPortal(
        <div 
          className={styles.iframeOverlay}
          onClick={() => setIframeUrl(null)}
        >
          <div 
            className={styles.iframeContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.iframeHeader}>
              <h3 className={styles.iframeTitle}>{iframeTitle}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setIframeUrl(null)}
                aria-label="Close"
                type="button"
              >
                ✕
              </button>
            </div>
            <iframe
              src={iframeUrl}
              className={styles.iframe}
              title={iframeTitle}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
