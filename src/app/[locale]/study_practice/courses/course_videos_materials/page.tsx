'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Table, Space, Button, Spin, Empty, message, Input } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { createPortal } from 'react-dom';
import styles from './page.module.css';
import { useSelectedCourse } from '@/store/selectedcourse';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';
import {useRouter, usePathname} from 'next/navigation';
import useTestStore from "@/store/evaluate/teststore";
import { SetBreadcrumb } from '@/app/[locale]/study_practice/BreadcrumbContext';
import { SearchOutlined, FilterFilled, CloseOutlined, CheckOutlined } from '@ant-design/icons';

/* ========= Types ========= */
type ApiSchedule = {
  id: number;
  topic_id?: number | null;
  topicId?: number | null;
  material_code?: string | null;
  materialCode?: string | null;
  start_date_time?: string | null;
  startDateTime?: string | null;
  end_date_time?: string | null;
  endDateTime?: string | null;
  live_url?: string | null;
  liveUrl?: string | null;
  video?: string | null;
  video_url?: string | null;
  is_marked_completed?: boolean | null;
  isMarkedCompleted?: boolean | null;
  is_time_completed?: boolean | null;
  isTimeCompleted?: boolean | null;
  is_completed?: boolean | null;
  isCompleted?: boolean | null;
  status?: string | null;
};

type ApiPayload = {
  meta?: any;
  user?: any;
  counts?: any;
  upcoming_schedules?: ApiSchedule[] | null;
  completed_schedules?: ApiSchedule[] | null;
};

type ApiResponseWrapped = {
  success: boolean;
  data?: ApiPayload | null;
  error?: string | null;
};

type ApiResponseUnwrapped = {
  success: boolean;
  meta?: any;
  counts?: any;
  upcoming_schedules?: ApiSchedule[] | null;
  completed_schedules?: ApiSchedule[] | null;
  error?: string | null;
};

type ApiResponse = ApiResponseWrapped | ApiResponseUnwrapped;

/* ========= Helpers ========= */
const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

/** Parse ISO or "YYYY-MM-DD HH:MM[:SS]" as LOCAL time */
const parseLooseDate = (s?: string | null): Date | null => {
  if (!s) return null;
  let str = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(str)) str += ':00';
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) str = str.replace(' ', 'T');

  const d1 = new Date(str);
  if (!Number.isNaN(d1.getTime())) return d1;

  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const [, Y, M, D, h = '0', mi = '0', se = '0'] = m;
    const d = new Date(+Y, +M - 1, +D, +h, +mi, +se);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

const formatDateLocal = (iso?: string | null) => {
  if (!iso) return '—';
  const d = parseLooseDate(iso);
  if (!d) return '—';
  const formatted = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  return formatted;
};

const formatTimeLocal = (iso?: string | null) => {
  if (!iso) return '—';
  const d = parseLooseDate(iso);
  if (!d) return '—';
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(h)}:${pad(m)} ${ampm}`;
};

const toTs = (iso?: string | null) => {
  const d = parseLooseDate(iso ?? null);
  return d ? d.getTime() : NaN;
};

// Zustand helpers
const toNum = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const getZCourse = (selected: any) => selected?.course ?? selected ?? null;

const getBatchId = (selected: any): number | null => {
  const c = getZCourse(selected);
  if (!c) return null;
  return (
    toNum(c.batch_id) ??
    toNum(c.batchId) ??
    toNum(c.batch?.id) ??
    toNum(c.batch?.batch_id) ??
    null
  );
};

const getCourseName = (selected: any): string => {
  const c = getZCourse(selected);
  if (!c) return 'Schedule, Videos, Study Material';
  const base = String(c.course_name ?? c.name ?? '').trim();
  const variant = String(c.variants ?? c.variant ?? '').trim();
  return (variant ? `${base} (${variant})` : base) || 'Schedule, Videos, Study Material';
};

/* ========= Row ========= */
type RowShape = {
  key: string;
  chapter_title?: string;
  topic_id: number;
  topic_name?: string | null;
  topic_idx?: number | null;
  effective_order?: number | null;
  schedule_id: number;
  material_code?: string | null;
  start_date_time?: string | null;
  end_date_time?: string | null;
  live_url?: string | null;
  video_url?: string | null;
  is_live_now?: boolean;
  is_upcoming?: boolean;
  is_time_completed?: boolean;
  is_marked_completed?: boolean;
  is_completed?: boolean;
  status?: string | null;
};


// Progress calculation helper - Focus on continuous missed classes pattern
const calculateProgress = (completedRows: RowShape[], upcomingRows: RowShape[]) => {
  const totalClasses = completedRows.length + upcomingRows.length;
  if (totalClasses === 0) return { percentage: 0, status: 'not-started' };

  // Only count rows that are marked as completed (attended)
  const attendedCount = completedRows.filter(row => row.is_marked_completed).length;
  const percentage = Math.round((attendedCount / totalClasses) * 100);

  // Sort completed rows by date (most recent first)
  const sortedCompletedRows = [...completedRows].sort((a, b) => {
    const aTime = toTs(a.end_date_time) || 0;
    const bTime = toTs(b.end_date_time) || 0;
    return bTime - aTime; // Most recent first
  });

  // Check for continuous missed classes in the most recent sessions
  let continuousMissedCount = 0;
  let maxContinuousMissed = 0;

  for (const row of sortedCompletedRows) {
    if (!row.is_marked_completed) {
      continuousMissedCount++;
      maxContinuousMissed = Math.max(maxContinuousMissed, continuousMissedCount);
    } else {
      // Reset counter when we find an attended class
      continuousMissedCount = 0;
    }
  }

  let status: 'on-track' | 'minor-delay' | 'behind-schedule' | 'not-started';

  if (attendedCount === 0) {
    status = 'not-started';
  } else if (maxContinuousMissed >= 3) {
    // Red: 3 or more continuously missed classes
    status = 'behind-schedule';
  } else if (maxContinuousMissed >= 2) {
    // Yellow: 2 continuously missed classes
    status = 'minor-delay';
  } else {
    // Green: No continuous missed classes or only 1 missed class
    status = 'on-track';
  }

  return {
    percentage,
    status,
    continuousMissedCount: maxContinuousMissed
  };
};

export default function Page() {
  const router = useRouter();
  const {setTestId, setUserTestId} = useTestStore();
  const { data: session, status: sessionStatus } = useSession();
  const selected = useSelectedCourse((s) => s.selected);

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');

  // pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Add state for table filters
  const [tableFilters, setTableFilters] = useState<Record<string, any>>({});

  const [actionLoading, setActionLoading] = useState(false);
  const [actionTip, setActionTip] = useState('Please wait...');

  // iframe viewer state
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [iframeTitle, setIframeTitle] = useState<string>('');

  const activeCtrlRef = useRef<AbortController | null>(null);

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


  const userId = session?.user?.id;
  const handleTakeExam = async () => {
    console.log("called handletake exam ")
    const returnUrl = encodeURIComponent("/study_practice/courses/course_videos_materials");
    if (!userId) {
      message.error("You are not signed in yet. Please try again.");
      return;
    }

    const testId = 1; // could be dynamic later
    message.loading("Assigning test...", 0);
    const now = new Date();
    const validityStart = new Date(now.getTime() - 2 * 60 * 1000);
    const validityEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    try {
      // Step 1️⃣: Assign the test (only once)
      const assignRes = await axios.post("/api/evaluate/assign_user", {
        userId,
        testId,
        validityStart,
        validityEnd,
      });

      const user_test_id = assignRes.data?.user_test?.user_test_id;
      if (!user_test_id) {
        message.destroy();
        message.error("Failed to assign test (no user_test_id returned).");
        return;
      }

      console.log("✅ Assigned user_test_id:", user_test_id);
      setUserTestId(String(user_test_id)); // ✅ Save in Zustand
      setTestId(String(testId));           // ✅ Save in Zustand


      message.destroy();
      message.success("Test assigned successfully.");

      // Step 2️⃣: Fetch test details — only once
      const detailsRes = await axios.get(
        `/api/evaluate/testdetails/v2?userId=${userId}`
      );

      const testDetailsList = detailsRes.data?.data || [];
      const testDetails = testDetailsList.find(
        (t: any) => t.user_test_id === user_test_id
      );

      if (!testDetails) {
        message.error("Test details not found for this user/test.");
        return;
      }

      const { general_data, ip_restriction, ip_addresses } = testDetails;

      // Step 3️⃣: Verify IP restriction if needed
      if (ip_restriction === 1 && ip_addresses) {
        try {
          const ipRes = await axios.get("https://api.ipify.org?format=json");
          const currentIP = ipRes.data.ip;
          const allowedIPs = JSON.parse(ip_addresses);

          if (!allowedIPs.includes(currentIP)) {
            message.error("Access denied: not on allowed network.");
            return;
          }
        } catch (e) {
          console.error("IP check error:", e);
          message.error("Could not verify your IP address.");
          return;
        }
      }

      // Step 4️⃣: Navigate safely
      const destination = general_data
        ? `/evaluate/general?testid=${testId}&userTestId=${user_test_id}`
        : `/evaluate/instructions?testid=${testId}&userTestId=${user_test_id}&returnUrl=${returnUrl}`;

      router.push(destination);
    } catch (err: any) {
      console.error("Assign/Start Test Error:", err);
      message.destroy();
      message.error("Failed to assign or start test.");
    }
  };

  // material prefix
  const MATERIAL_PREFIX = 'https://www.time4education.com/pdf.js-gh-pages/web/viewerappp.php?file=e-books/CAT25handouts/CAT25files/';

  // robust id_card_no from session
  const idCardNo: string | null =
    (session as any)?.user?.id_card_no ??
    (session as any)?.user?.idCardNo ??
    (session as any)?.user?.id_card ??
    null;

  const batchId: number | null = useMemo(() => getBatchId(selected), [selected]);
  const crumbTitle = useMemo(() => getCourseName(selected), [selected]);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;

    if (!idCardNo || !batchId) {
      setErrorText(!idCardNo ? 'Missing id_card_no from session.' : 'Missing batch_id from selection.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText(null);
    if (activeCtrlRef.current && !activeCtrlRef.current.signal.aborted) {
      activeCtrlRef.current.abort('superseded-by-new-request');
    }
    const ctrl = new AbortController();
    activeCtrlRef.current = ctrl;

    (async () => {
      try {
        const form = new FormData();
        form.set('id_card_no', idCardNo);
        form.set('batch_id', String(batchId));

        const res = await fetch('/api/study_practice/courses/course_videos_materials', {
          method: 'POST',
          body: form,
          signal: ctrl.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || `HTTP ${res.status}`);
        }

        const json = (await res.json()) as ApiResponse;
        console.log('[CourseVideosMaterials] raw response:', json);

        // Normalize payload: support both wrapped { success, data: {...} }
        // and unwrapped { success, meta, upcoming_schedules, completed_schedules, counts }
        let normalized: ApiPayload | null = null;

        // wrapped shape: { success: true, data: { ... } }
        if ((json as ApiResponseWrapped).data !== undefined) {
          normalized = (json as ApiResponseWrapped).data ?? null;
          console.debug('[CourseVideosMaterials] using wrapped payload (data)');
        } else {
          // unwrapped shape (some backends return the payload at top-level)
          const maybe = json as ApiResponseUnwrapped;
          if (
            (maybe.upcoming_schedules && Array.isArray(maybe.upcoming_schedules)) ||
            (maybe.completed_schedules && Array.isArray(maybe.completed_schedules)) ||
            maybe.meta !== undefined ||
            maybe.counts !== undefined
          ) {
            normalized = {
              meta: maybe.meta,
              user: undefined,
              counts: maybe.counts,
              upcoming_schedules: maybe.upcoming_schedules ?? [],
              completed_schedules: maybe.completed_schedules ?? [],
            };
            console.debug('[CourseVideosMaterials] using unwrapped payload (top-level)');
          } else {
            normalized = null;
          }
        }

        if (!normalized) throw new Error((json as any).error || 'No data returned');

        // debug logging to ensure payload shape
        console.log('[CourseVideosMaterials] normalized payload counts:',
          { upcoming: normalized.upcoming_schedules?.length ?? 0, completed: normalized.completed_schedules?.length ?? 0 }
        );

        if (!ctrl.signal.aborted) setPayload(normalized);
      } catch (e: any) {
        if (e?.name === 'AbortError' || ctrl.signal.aborted) return;
        console.error('[CourseVideosMaterials] fetch error:', e);
        if (!ctrl.signal.aborted) {
          setErrorText(e?.message || 'Failed to load course content.');
          message.error('Failed to load course content.');
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      if (!ctrl.signal.aborted) ctrl.abort('unmount-or-deps-changed');
    };
  }, [sessionStatus, idCardNo, batchId]);

  /* ----- Build rows from upcoming_schedules / completed_schedules ----- */
  const safeNum = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const safeStr = (v: any): string | null => {
    if (v === null || v === undefined) return null;
    return String(v);
  };

  const mapScheduleToRow = (s: ApiSchedule, chapterTitle = ''): RowShape => {
    const tId = safeNum(s.topic_id ?? (s as any).topicId) ?? -1;
    const startIso = (s.start_date_time ?? (s as any).startDateTime) ?? null;
    const endIso = (s.end_date_time ?? (s as any).endDateTime) ?? null;
    const startTs = toTs(startIso ?? null);
    const endTs = toTs(endIso ?? null);
    const hasStart = Number.isFinite(startTs);
    const hasEnd = Number.isFinite(endTs);

    const isTimeCompleted = hasEnd ? (endTs <= Date.now()) : false;

    const isMarkedCompletedRaw =
      (s as any).is_marked_completed ?? (s as any).isMarkedCompleted ?? (s as any).is_completed ?? (s as any).isCompleted ?? null;
    const isMarkedCompleted = isMarkedCompletedRaw === true;

    const isUpcoming = hasStart ? Date.now() < startTs : !hasEnd;
    const isLiveNow = hasStart && hasEnd ? (startTs <= Date.now() && Date.now() < endTs) : false;

    return {
      key: `${tId}-${safeNum((s as any).id) ?? Math.random()}`,
      chapter_title: chapterTitle,
      topic_id: tId,
      topic_name: safeStr((s as any).topic_name ?? (s as any).topicName) ?? '',
      topic_idx: null,
      effective_order: null,
      schedule_id: safeNum((s as any).id) ?? -tId,
      material_code: safeStr((s as any).material_code ?? (s as any).materialCode) ?? null,
      start_date_time: startIso,
      end_date_time: endIso,
      live_url: safeStr((s as any).live_url ?? (s as any).liveUrl) ?? null,
      video_url: safeStr((s as any).video_url) ?? null,
      is_live_now: isLiveNow,
      is_upcoming: !isTimeCompleted && (isLiveNow || isUpcoming),
      is_time_completed: isTimeCompleted,
      is_marked_completed: isMarkedCompleted,
      is_completed: isMarkedCompleted,
      status: safeStr((s as any).status) ?? null,
    };
  };

  const upcomingRows: RowShape[] = useMemo(() => {
    if (!payload) return [];
    const arr = Array.isArray(payload.upcoming_schedules) ? payload.upcoming_schedules : [];
    const rows = arr.map(s => mapScheduleToRow(s, ''));
    rows.sort((a, b) => {
      if ((a.is_live_now ?? false) !== (b.is_live_now ?? false)) return a.is_live_now ? -1 : 1;
      const at = toTs(a.start_date_time ?? undefined);
      const bt = toTs(b.start_date_time ?? undefined);
      if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
      if (Number.isNaN(at)) return 1;
      if (Number.isNaN(bt)) return -1;
      return at - bt;
    });
    return rows;
  }, [payload]);

  const completedRows: RowShape[] = useMemo(() => {
    if (!payload) return [];
    const arr = Array.isArray(payload.completed_schedules) ? payload.completed_schedules : [];
    const rows = arr.map(s => mapScheduleToRow(s, ''));
    rows.sort((a, b) => {
      const at = toTs(a.end_date_time ?? undefined);
      const bt = toTs(b.end_date_time ?? undefined);
      if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
      if (Number.isNaN(at)) return 1;
      if (Number.isNaN(bt)) return -1;
      return bt - at;
    });
    return rows;
  }, [payload]);

  // Calculate progress
  const progressData = useMemo(() => {
    return calculateProgress(completedRows, upcomingRows);
  }, [completedRows, upcomingRows]);

  // Apply filters to data source
  const filteredDataSource = useMemo(() => {
    let source = tab === 'upcoming' ? upcomingRows : completedRows;

    // Apply filters for completed tab
    if (tab === 'completed') {
      // Apply topic name filter
      if (tableFilters.topic_name && tableFilters.topic_name.length > 0) {
        const searchTerm = tableFilters.topic_name[0].toLowerCase();
        source = source.filter(row =>
          row.topic_name?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply status filter
      if (tableFilters.col_status && tableFilters.col_status.length > 0) {
        const statusFilter = tableFilters.col_status[0];
        source = source.filter(row => {
          if (statusFilter === 'all') return true;
          if (statusFilter === 'attended') return row.is_marked_completed;
          if (statusFilter === 'missed') return !row.is_marked_completed && row.is_time_completed;
          return true;
        });
      }
    }

    return source;
  }, [tab, upcomingRows, completedRows, tableFilters]);

  // Reset to first page when switching tabs or applying filters
  useEffect(() => {
    setCurrentPage(1);
  }, [tab, tableFilters]);

  /* ----- API: update_seen ----- */
  const markSeen = useCallback(async (topicId: number, _scheduleId: number): Promise<boolean> => {
    const idCard = idCardNo;
    if (!idCard || !batchId) {
      console.warn('[markSeen] Missing id_card_no or batch_id', { idCard, batchId });
      return false;
    }
    try {
      const fd = new FormData();
      fd.set('id_card_no', idCard);
      fd.set('batch_id', String(batchId));
      fd.set('topic_id', String(topicId));

      const res = await fetch('/api/study_practice/courses/course_videos_materials/update_seen', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.warn('[markSeen] Non-200 response', { status: res.status, body: txt });
        return false;
      }
      const json = await res.json().catch(() => null);
      return json?.success ?? true;
    } catch (err) {
      console.error('[markSeen] Exception while updating', err);
      return false;
    }
  }, [idCardNo, batchId]);

  /* ----- Actions ----- */
  const handleJoinLive = useCallback(async (row: RowShape) => {
    if (!row.live_url || !row.is_live_now) return;
    try {
      setActionTip('Entering live class...');
      setActionLoading(true);
      const ok = await markSeen(row.topic_id, row.schedule_id);
      if (!ok) throw new Error('Failed to update attendance');
      setIframeTitle(row.topic_name || 'Live Class');
      setIframeUrl(String(row.live_url));
      setActionLoading(false);
    } catch (e: any) {
      message.error(e?.message || 'Could not start live class.');
      setActionLoading(false);
    }
  }, [markSeen]);

  const handlePlayUpcomingVideo = useCallback(async (row: RowShape) => {
    if (!row.video_url) return;
    try {
      setActionTip('Opening video...');
      setActionLoading(true);
      const ok = await markSeen(row.topic_id, row.schedule_id);
      if (!ok) throw new Error('Failed to update watch status');
      setIframeTitle(row.topic_name || 'Video');
      setIframeUrl(String(row.video_url));
      setActionLoading(false);
    } catch (e: any) {
      message.error(e?.message || 'Could not open video.');
      setActionLoading(false);
    }
  }, [markSeen]);

  const handleOpenMaterial = useCallback((materialCode?: string | null, topicName?: string) => {
    if (!materialCode) return;
    const url = MATERIAL_PREFIX + materialCode + '.pdf';
    setIframeTitle(topicName || 'Study Material');
    setIframeUrl(url);
  }, []);

  const handleOpenVideo = useCallback((videoUrl?: string | null, topicName?: string) => {
    if (!videoUrl) return;
    setIframeTitle(topicName || 'Video');
    setIframeUrl(videoUrl);
  }, []);

  /* ----- Columns ----- */
  const TOPIC_COL_WIDTH = 380;
  const COLS = { date: 120, time: 180, topic: TOPIC_COL_WIDTH, status: 80, actionUp: 220, actionDone: 260 };

  const baseCols: ColumnsType<RowShape> = [
    {
      title: 'Date',
      dataIndex: 'start_date_time',
      key: 'col_date',
      width: COLS.date,
      render: (iso) => <div className={styles.nowrap}>{formatDateLocal(iso)}</div>,
    },
    {
      title: 'Time',
      dataIndex: 'start_date_time',
      key: 'col_time',
      width: COLS.time,
      render: (_, row) => (
        <div className={styles.nowrap}>
          {formatTimeLocal(row.start_date_time)}
        </div>
      ),
    },
    {
      title: 'Topic Name',
      dataIndex: 'topic_name',
      key: 'col_topic',
      width: COLS.topic,
      ellipsis: true,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            placeholder="Search topic names"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block', width: 188 }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button
              onClick={() => {
                if (clearFilters) {
                  clearFilters();
                  confirm(); // Submit the filter after clearing
                }
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => {
                close();
              }}
            >
              Close
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value, record) =>
        record.topic_name
          ? record.topic_name.toString().toLowerCase().includes((value as string).toLowerCase())
          : false,
      render: (text, row) => (
        <div>
          <div className={styles.ellipsis}>{text}</div>
          {row.chapter_title ? <div style={{ fontSize: 12, color: '#666' }}>{row.chapter_title}</div> : null}
        </div>
      ),
    },
  ];

  // Status column: only icon (no text)
  const statusCol: ColumnsType<RowShape>[number] = {
    title: 'Status',
    key: 'col_status',
    width: COLS.status,
    align: 'center',
    filters: [
      { text: 'All', value: 'all' },
      { text: 'Attended', value: 'attended' },
      { text: 'Missed', value: 'missed' },
    ],
    filterMultiple: false,
    onFilter: (value, record) => {
      if (value === 'all') return true;
      if (value === 'attended') return record.is_marked_completed;
      if (value === 'missed') return !record.is_marked_completed && record.is_time_completed;
      return true;
    },
    render: (_, row) => {
      const attended = !!row.is_marked_completed;
      const missed = !row.is_marked_completed && !!row.is_time_completed;
      const className = attended ? `${styles.attendBadge} ${styles.attendYes}` : missed ? `${styles.attendBadge} ${styles.attendNo}` : styles.attendBadge;
      const icon = attended ? <CheckOutlined style={{ color: '#52c41a' }} /> : missed ? <CloseOutlined style={{ color: '#ff4d4f' }} /> : '—';
      return (
        <div className={styles.statusCenter}>
          <span className={className} aria-label={attended ? 'attended' : missed ? 'missed' : 'pending'}>
            {icon}
          </span>
        </div>
      );
    },
  };

  const actionColUpcoming: ColumnsType<RowShape>[number] = {
    title: 'Action',
    key: 'col_action_up',
    width: COLS.actionUp,
    fixed: 'right',
    align: 'right',
    render: (_, row) => {
      const hasLive = !!row.live_url;
      const hasVideo = !!row.video_url;

      const joinDisabled = !(hasLive && row.is_live_now) || actionLoading;
      const videoDisabled = actionLoading || (!hasVideo) || (hasLive && !row.is_live_now);

      return (
        <div className={styles.actionRight}>
          <Space size="small">
            {hasLive ? (
              <Button disabled={joinDisabled} onClick={() => handleJoinLive(row)}>
                Join Live →
              </Button>
            ) : (
              <Button disabled type="default">Live →</Button>
            )}
            {!hasLive ? (
              <Button type="primary" disabled={videoDisabled} onClick={() => handlePlayUpcomingVideo(row)}>
                Video →
              </Button>
            ) : (
              <Button type="primary" disabled style={{ opacity: 0.6 }}>
                Video →
              </Button>
            )}
          </Space>
        </div>
      );
    },
  };

  const actionColCompleted: ColumnsType<RowShape>[number] = {
    title: 'Action',
    key: 'col_action_done',
    width: COLS.actionDone,
    fixed: 'right',
    align: 'right',
    render: (_, row) => {
      const hasMaterial = !!row.material_code;
      const hasVideo = !!row.video_url;

      return (
        <div className={styles.actionRight}>
          <Space size="small">
            <Button
              type="primary"
              disabled={!hasMaterial}
              onClick={() => handleOpenMaterial(row.material_code, row.topic_name ?? undefined)}
            >
              Material →
            </Button>
            <Button
              type="primary"
              onClick={() => handleTakeExam()}
            >
              Test→
            </Button>
            <Button
              type="primary"
              disabled={!hasVideo}
              onClick={() => handleOpenVideo(row.video_url, row.topic_name ?? undefined)}
            >
              Video →
            </Button>
          </Space>
        </div>
      );
    },
  };

  const columnsUpcoming: ColumnsType<RowShape> = useMemo(() => [...baseCols, actionColUpcoming], [actionLoading]);
  const columnsCompleted: ColumnsType<RowShape> = useMemo(() => [...baseCols, statusCol, actionColCompleted], [actionLoading]);

  const dataSource = tab === 'upcoming' ? upcomingRows : filteredDataSource;
  const columns = tab === 'upcoming' ? columnsUpcoming : columnsCompleted;
  const scrollX = tab === 'upcoming' ? COLS.date + COLS.time + COLS.topic + COLS.actionUp : COLS.date + COLS.time + COLS.topic + COLS.status + COLS.actionDone;

  /* ----- Pagination handlers ----- */
  const onTableChange = (pagination: TablePaginationConfig, filters: any, sorter: any) => {
    if (pagination.current) setCurrentPage(pagination.current);
    if (pagination.pageSize) setPageSize(pagination.pageSize);

    // Store the current filters
    setTableFilters(filters);
  };

  // custom empty visual so headers remain visible and empty state centers on empty table body
  const localeEmpty = <Empty description={tab === 'upcoming' ? 'No upcoming classes' : 'No completed classes'} />;

  return (
    <main className={styles.page}>
      <SetBreadcrumb text='Schedule, Videos, Study Material' />

      {/* Progress Bar Section */}
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressBar} ${progressData.status === 'on-track' ? styles.progressOnTrack :
              progressData.status === 'minor-delay' ? styles.progressMinorDelay :
                progressData.status === 'behind-schedule' ? styles.progressBehindSchedule :
                  styles.progressNotStarted
            }`}
          style={{ width: `${progressData.percentage}%` }}
        />
      </div>
      <div className={styles.progressHeader}>
        <div className={styles.progressPercent}>
          ({progressData.percentage}%)
        </div>
        
      </div>

      {actionLoading && (
        <div className={styles.overlay}>
          <Spin size="large">
            <div style={{ padding: '24px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <div style={{ marginTop: '8px', color: '#666' }}>{actionTip}</div>
            </div>
          </Spin>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.controlsRow}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'upcoming' ? styles.tabActive : ''} ${tab === 'upcoming' ? 'tabActiveHoverWhite' : ''}`}
              onClick={() => setTab('upcoming')}
              type="button"
            >
              Upcoming Classes
            </button>
            <button
              className={`${styles.tab} ${tab === 'completed' ? styles.tabActive : ''} ${tab === 'completed' ? 'tabActiveHoverWhite' : ''}`}
              onClick={() => setTab('completed')}
              type="button"
            >
              Completed Classes
            </button>
          </div>

          <div className={styles.pills}>
            <Link className={styles.pill} href="/study_practice/courses/course_materials">
              Reference/Practice Material →
            </Link>
            <Link className={styles.pill} href="/study_practice/courses/course_ebook">
              Study Material E-Books →
            </Link>
          </div>
        </div>

        <section className={styles.tableCard}>
          <Table<RowShape>
            rowKey="key"
            className={styles.antTableTight}
            tableLayout="fixed"
            dataSource={dataSource}
            columns={columns}
            loading={{ spinning: loading, tip: 'Loading course content...' }}
            locale={{ emptyText: localeEmpty }}
            pagination={{
              current: currentPage,
              pageSize,
              pageSizeOptions: ['8', '12', '24', '48'],
              showSizeChanger: true,
              position: ['bottomCenter'],
              total: dataSource.length,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            onChange={onTableChange}
            rowClassName={() => styles.rowBase}
            scroll={{ y: 'calc(100vh - 230px)', x: scrollX }}
            sticky
          />
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

      <style jsx>{`
        .tabActiveHoverWhite:hover { color: #fff !important; }
      `}</style>
    </main>
  );
}