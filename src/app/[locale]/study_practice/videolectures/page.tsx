'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Table, Space, Button, Spin, Empty, message, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { createPortal } from 'react-dom';
import styles from './page.module.css';
import { useSelectedCourse } from '@/store/selectedcourse';
import { useSession } from 'next-auth/react';
import {SetBreadcrumb} from '@/app/[locale]/study_practice/BreadcrumbContext';

const { Option } = Select;

/* ---------- Types ---------- */
type Material = {
  id: number;
  title?: string | null; // use this for topic display
  material_type?: string | null; // 'VIDEO' | 'PDF' | ...
  url?: string | null;
  path?: string | null;
  level?: string | null;
  duration?: number | null; // assumed seconds (best-effort)
  area?: string | null; // optional area on material if available
  video_url?: string | null; // ✅ Generated video URL from API
};

type VideoLectureRowFromApi = {
  id: number;
  area?: string | null;
  topic?: string | null;
  video_ids?: number[] | null;
  level?: string | null;
};

type ApiResult = {
  videolectures?: VideoLectureRowFromApi[];
  materials?: Material[];
};

type RowShape = {
  key: string;
  id: number;
  // area may still be used for filtering, but it will not be shown in the table
  area?: string | null;
  // topic will be taken from primaryMaterial.title
  topic?: string | null;
  topic_name?: string | null; // ✅ For iframe title
  primaryMaterial?: Material | null;
  material_url?: string | null;
  video_url?: string | null; // ✅ Generated video URL from API
  material_type?: string | null;
  duration?: number | null;
};

/* ---------- Small helpers ---------- */
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
const getBatchId = (selected: any): number | null => {
  const c = getZCourse(selected);
  if (!c) return null;
  return toNum(c.batch_id) ?? toNum(c.batchId) ?? toNum(c.batch?.id) ?? null;
};
const getCourseName = (selected: any): string => {
  const c = getZCourse(selected);
  if (!c) return 'Videos';
  const base = String(c.course_name ?? c.name ?? '').trim();
  const variant = String(c.variant ?? c.variants ?? '').trim();
  return (variant ? `${base} (${variant})` : base) || 'Videos';
};

function formatDurationSeconds(secondsInput: number | null | undefined): string {
  if (secondsInput === null || secondsInput === undefined || Number.isNaN(Number(secondsInput))) return '—';
  const total = Math.max(0, Math.floor(Number(secondsInput)));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

/* ---------- Component ---------- */
export default function Page() {
  const { data: session, status: sessionStatus } = useSession();
  const selected = useSelectedCourse((s) => s.selected);

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [videoLectures, setVideoLectures] = useState<VideoLectureRowFromApi[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // topic and area filters (dropdowns remain)
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionTip] = useState('Please wait...');

  // iframe viewer state
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [iframeTitle, setIframeTitle] = useState<string>('');

  const idCardNo: string | null = (session as any)?.user?.id_card_no ?? null;
  const courseId = useMemo(() => getCourseId(selected), [selected]);
  const batchId = useMemo(() => getBatchId(selected), [selected]);
  const crumbTitle = useMemo(() => getCourseName(selected), [selected]);

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

  /* ---------- Fetch video lectures & materials ---------- */
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;

    if (!idCardNo || !courseId) {
      setErrorText(!idCardNo ? 'Missing id_card_no from session.' : 'Missing course_id from selection.');
      setLoading(false);
      return;
    }

    let aborted = false;
    const ctrl = new AbortController();

    (async () => {
      setLoading(true);
      setErrorText(null);

      try {
        const fd = new FormData();
        fd.set('id_card_no', idCardNo);
        fd.set('course_id', String(courseId));

        const cityId = toNum((selected as any)?.city_id ?? (selected as any)?.cityId ?? null);
        const centerId = toNum((selected as any)?.center_id ?? (selected as any)?.centerId ?? null);
        const variantId = toNum((selected as any)?.variant_id ?? (selected as any)?.variantId ?? null);
        if (cityId) fd.set('city_id', String(cityId));
        if (centerId) fd.set('center_id', String(centerId));
        if (variantId) fd.set('variant_id', String(variantId));

        // include topic/area filters so server can reduce data if implemented
        if (topicFilter) fd.set('topic', topicFilter);
        if (areaFilter) fd.set('area', areaFilter);

        const res = await fetch('/api/study_practice/videolectures', {
          method: 'POST',
          body: fd,
          signal: ctrl.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || `HTTP ${res.status}`);
        }

        const json = (await res.json().catch(() => null)) as ApiResult | null;
        if (!aborted) {
          setVideoLectures(Array.isArray(json?.videolectures) ? json!.videolectures! : []);
          setMaterials(Array.isArray(json?.materials) ? json!.materials! : []);
        }
      } catch (e: any) {
        if (e?.name === 'AbortError' || ctrl.signal.aborted) return;
        if (!aborted) {
          setErrorText(e?.message || 'Failed to load video lectures.');
          message.error('Failed to load video lectures.');
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
      ctrl.abort();
    };
    // re-run when filters change (server-side filtering)
  }, [sessionStatus, idCardNo, courseId, selected, topicFilter, areaFilter]);

  /* ---------- Build rows ---------- */
  const rows: RowShape[] = useMemo(() => {
    // build materials map for quick lookup
    const matsById = new Map<number, Material>();
    for (const m of materials ?? []) if (typeof m.id === 'number') matsById.set(m.id, m);

    return (videoLectures ?? []).map((vl) => {
      const ids = Array.isArray(vl.video_ids) ? vl.video_ids : [];
      let primary: Material | null = null;
      for (const id of ids) {
        const mm = matsById.get(id);
        if (mm) {
          primary = mm;
          break;
        }
      }

      // topic now comes from primaryMaterial.title if present; otherwise fallback to lecture.topic
      const topicFromMaterial = primary?.title ?? null;
      console.log("Topic Material: ",topicFromMaterial)

      return {
        key: `vl-${vl.id}`,
        id: vl.id,
        area: vl.area ?? null,
        topic: topicFromMaterial ?? vl.topic ?? `Lecture ${vl.id}`,
        topic_name: topicFromMaterial ?? vl.topic ?? `Lecture ${vl.id}`, // ✅ For iframe title
        primaryMaterial: primary,
        material_url: primary?.url ?? primary?.path ?? null,
        video_url: primary?.video_url ?? null, // ✅ Generated video URL from API
        material_type: primary?.material_type ?? null,
        duration: primary?.duration ?? null,
      } as RowShape;
    });
  }, [videoLectures, materials]);

  /* ---------- Filter options ---------- */
  // area options from rows (used only for dropdown filtering)
  const areaOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      const a = (r.area ?? '').toString().trim();
      if (a) s.add(a);
    }
    return Array.from(s).sort();
  }, [rows]);

  // topic options should come from materials.title (and if areaFilter is set restrict to that area)
  const topicOptions = useMemo(() => {
    const s = new Set<string>();
    // if materials have area property use that, otherwise fall back to rows
    for (const m of materials ?? []) {
      if (areaFilter) {
        // try to respect material.area if present; otherwise skip and rely on rows-derived topic
        if (m.area && String(m.area).trim() !== String(areaFilter).trim()) continue;
      }
      const t = (m.title ?? '').toString().trim();
      if (t) s.add(t);
    }

    // fallback: if no materials provided titles for the selected area, derive from rows
    if (s.size === 0) {
      for (const r of rows) {
        if (areaFilter && (r.area ?? '') !== areaFilter) continue;
        const t = (r.topic ?? '').toString().trim();
        if (t) s.add(t);
      }
    }

    return Array.from(s).sort();
  }, [materials, rows, areaFilter]);

  // when area changes ensure current topicFilter is valid
  useEffect(() => {
    if (!areaFilter) return;
    if (!topicFilter) return;
    if (!topicOptions.includes(topicFilter)) {
      setTopicFilter(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaFilter, topicOptions]);

  /* ---------- Filtered rows ---------- */
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (areaFilter && (r.area ?? '') !== areaFilter) return false;
      if (topicFilter && (r.topic ?? '') !== topicFilter) return false;
      return true;
    });
  }, [rows, areaFilter, topicFilter]);

  /* ---------- Mark seen (best-effort) ---------- */
  const markSeen = useCallback(
    async (lectureId: number): Promise<boolean> => {
      if (!idCardNo || !batchId) return false;
      try {
        const fd = new FormData();
        fd.set('id_card_no', idCardNo);
        fd.set('batch_id', String(batchId));
        fd.set('videolecture_id', String(lectureId));
        const res = await fetch('/api/study_practice/videolectures/updateseen', {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) return false;
        const json = await res.json().catch(() => null);
        return !!(json?.success ?? true);
      } catch {
        return false;
      }
    },
    [idCardNo, batchId]
  );

  /* ---------- Track last seen video ---------- */
  const trackLastSeenVideo = useCallback(
    async (row: RowShape) => {
      if (!idCardNo) return;
      try {
        await fetch('/api/user/last-activity/update-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_card_no: idCardNo,
            video_id: row.primaryMaterial?.id ?? row.id,
            video_path: window.location.pathname,
            video_title: row.topic ?? 'Video Lecture',
          }),
        });
      } catch (err) {
        console.error('Failed to track last seen video:', err);
      }
    },
    [idCardNo]
  );

  /* ---------- Open material ---------- */
  const handleOpenMaterial = useCallback(
    async (row: RowShape) => {
      const url = row.material_url;
      if (!url) {
        message.info('No material URL available for this lecture.');
        return;
      }
      try {
        setActionLoading(true);
        await markSeen(row.id);
        await trackLastSeenVideo(row);
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch {
        message.error('Could not open material');
      } finally {
        setActionLoading(false);
      }
    },
    [markSeen, trackLastSeenVideo]
  );

  /* ---------- Open video in iframe ---------- */
  const handleOpenVideo = useCallback(
    async (row: RowShape) => {
      console.log('[handleOpenVideo] Called with row:', row);
      const videoUrl = row.video_url;
      console.log('[handleOpenVideo] Video URL:', videoUrl);
      
      if (!videoUrl) {
        console.log('[handleOpenVideo] No video URL, showing message');
        message.info('No video URL available for this lecture.');
        return;
      }
      try {
        console.log('[handleOpenVideo] Setting iframe URL:', videoUrl);
        setActionLoading(true);
        await markSeen(row.id);
        await trackLastSeenVideo(row);
        setIframeTitle(row.topic_name || 'Video');
        setIframeUrl(videoUrl);
        console.log('[handleOpenVideo] Iframe set successfully');
      } catch (error) {
        console.error('[handleOpenVideo] Error:', error);
        message.error('Could not open video');
      } finally {
        setActionLoading(false);
      }
    },
    [markSeen, trackLastSeenVideo]
  );

  /* ---------- Table columns (Topic, Duration, Action) ---------- */
  const columns: ColumnsType<RowShape> = [
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
      render: (text) => <div className={styles.ellipsis}>{text}</div>,
      width: 480,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      align: 'center',
      render: (d) => formatDurationSeconds(d ?? null),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      width: 160,
      render: (_, row) => {
        const type = row.material_type?.toUpperCase?.() ?? '';
        const hasVideoUrl = !!row.video_url;
        
        // Debug logging
        console.log('Video Action Debug:', {
          id: row.id,
          type,
          hasVideoUrl,
          video_url: row.video_url
        });
        
        // If no video URL, show disabled button
        if (!hasVideoUrl) {
          return (
            <div className={styles.actionRight}>
              <Space>
                <Button disabled>—</Button>
              </Space>
            </div>
          );
        }
        
        return (
          <div className={styles.actionRight}>
            <Space>
              <Button type="primary" onClick={() => handleOpenVideo(row)}>
                Video →
              </Button>
            </Space>
          </div>
        );
      },
    },
  ];

  return (
    <main className={styles.page}>
      <SetBreadcrumb text={crumbTitle} />

      {actionLoading && (
        <div className={styles.overlay}>
          <Spin tip={actionTip} />
        </div>
      )}

      <div className={styles.container}>
        {/* Controls: right side contains Area first, then Topic */}
        <div className={styles.controlsRow}>
          <div className={styles.leftControls} /> {/* intentionally left empty to keep controls right-aligned */}

          <div className={styles.rightFilters} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ marginRight: 8 }} className={styles.filterLabel}>
              Area
            </div>
            <Select
              value={areaFilter ?? undefined}
              onChange={(v) => setAreaFilter(v ?? null)}
              allowClear
              placeholder="All areas"
              style={{ minWidth: 200, marginRight: 12 }}
              dropdownMatchSelectWidth={false}
            >
              {areaOptions.map((a) => (
                <Option key={a} value={a}>
                  {a}
                </Option>
              ))}
            </Select>

            <div style={{ marginRight: 8 }} className={styles.filterLabel}>
              Topic
            </div>
            <Select
              value={topicFilter ?? undefined}
              onChange={(v) => setTopicFilter(v ?? null)}
              allowClear
              placeholder="All topics"
              style={{ minWidth: 240 }}
              dropdownMatchSelectWidth={false}
            >
              {topicOptions.map((t) => (
                <Option key={t} value={t}>
                  {t}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        <section className={styles.tableCard}>
          {loading ? (
            <div className={styles.centerPad}>
              <Spin tip="Loading videos..." />
            </div>
          ) : errorText ? (
            <div className={styles.centerPad}>
              <Empty description={errorText} />
            </div>
          ) : !filteredRows.length ? (
            <div className={styles.centerPad}>
              <Empty description="No videos found" />
            </div>
          ) : (
            <Table<RowShape>
              rowKey="key"
              className={styles.antTableTight}
              tableLayout="fixed"
              dataSource={filteredRows}
              columns={columns}
              pagination={{ pageSize: 8, size: 'small', position: ['bottomCenter'] }}
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
