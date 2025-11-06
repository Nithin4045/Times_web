'use client';

import Link from 'next/link';
import { Table, Select, Spin, Empty, message } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { ArrowRightOutlined, KeyOutlined } from '@ant-design/icons';
import { createPortal } from 'react-dom';
import styles from './page.module.css';
import { SetBreadcrumb } from '@/app/[locale]/study_practice/BreadcrumbContext';
import { useSelectedCourse } from '@/store/selectedcourse';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react'; // ✅ add

const { Option } = Select;

/* ---------- Types ---------- */
type MaterialRow = {
  id: number;
  course_id: number;
  area: string;
  topicname?: string | null;
  material_path?: string | null;
  key_path?: string | null;
  solution_path?: string | null;
  type: 'reference_practice_material' | 'ebook' | string;
  read?: boolean; // ✅ the API may return this
};

type ApiPayload = {
  id_card_no?: string;
  course_id: number;
  type: string;
  materials: MaterialRow[];
};

/* ---------- Helpers ---------- */
function normCourseId(selected: any): number | null {
  const candidates = [
    selected?.course?.id,
    selected?.course?.course_id,
    selected?.course?.courseid,
    selected?.id,
    selected?.course_id,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function toHref(v?: string | null): string {
  if (!v) return '';
  const s = String(v).trim();
  if (!s) return '';
  if (/^(https?:)?\/\//i.test(s) || /^[a-z]+:/i.test(s)) return s;
  if (s.startsWith('/')) return s;
  return `/${s}`;
}

export default function ReferenceMaterialPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession(); // ✅ add
  const selected = useSelectedCourse((s) => s.selected);
  const courseName = selected?.course?.course_name ?? 'Reference / Practice Material';

  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('ALL');

  // iframe viewer state
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [iframeTitle, setIframeTitle] = useState<string>('');

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

  const pathname = usePathname();
  const locale = pathname?.split('/')?.[1] || '';
  const goToEbooks = () => router.push(`/study_practice/courses/course_ebook`);

  // Pagination state for Ant Design Table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // robust id_card_no from session
  const idCardNo: string | null =
    (session as any)?.user?.id_card_no ??
    (session as any)?.user?.idCardNo ??
    (session as any)?.user?.id_card ??
    null;

  // Track last read material
  const trackLastReadMaterial = useCallback(async (materialId: number, materialPath: string, materialTitle: string) => {
    if (!idCardNo) return;
    try {
      await fetch('/api/user/last-activity/update-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_card_no: idCardNo,
          material_id: materialId,
          material_path: window.location.pathname,
          material_title: materialTitle,
          material_type: 'course_material',
        }),
      });
    } catch (err) {
      console.error('Failed to track last read material:', err);
    }
  }, [idCardNo]);

  // Handle opening material in iframe
  const handleOpenMaterial = useCallback((url: string, title: string, materialId: number, materialTitle: string) => {
    if (!url) return;
    trackLastReadMaterial(materialId, url, materialTitle);
    setIframeTitle(title);
    setIframeUrl(url);
  }, [trackLastReadMaterial]);

  // Handle opening key in iframe
  const handleOpenKey = useCallback((url: string, title: string) => {
    if (!url) return;
    setIframeTitle(title);
    setIframeUrl(url);
  }, []);

  // Handle opening solution in iframe
  const handleOpenSolution = useCallback((url: string, title: string) => {
    if (!url) return;
    setIframeTitle(title);
    setIframeUrl(url);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (sessionStatus !== 'authenticated') return;

      setLoading(true);
      setError(null);

      const cid = normCourseId(selected);
      if (!cid) {
        setLoading(false);
        setError('Missing course_id from app state');
        return;
      }
      if (!idCardNo) {
        setLoading(false);
        setError('Missing id_card_no from session');
        return;
      }

      try {
        const form = new FormData();
        form.set('id_card_no', idCardNo); // ✅ send id_card_no
        form.set('course_id', String(cid));
        form.set('type', 'reference_practice_material');

        const res = await fetch('/api/study_practice/courses/course_materials', {
          method: 'POST',
          body: form,
          cache: 'no-store',
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${txt || ''}`.trim());
        }

        const json: ApiPayload = await res.json();
        if (!cancelled) {
          setMaterials(Array.isArray(json?.materials) ? json.materials : []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load materials');
          message.error('Failed to load materials');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [selected, sessionStatus, idCardNo]); // ✅ depend on session/idCardNo

  const areaOptions = useMemo(() => {
    const set = new Set<string>();
    for (const m of materials) if (m.area) set.add(m.area);
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [materials]);

  const filtered = useMemo(
    () => (selectedArea === 'ALL' ? materials : materials.filter((m) => m.area === selectedArea)),
    [materials, selectedArea]
  );

  const dataSource = useMemo(
    () =>
      filtered.map((r) => ({
        key: r.id,
        id: r.id,
        area: r.area,
        topic: r.topicname ?? '—',
        materialUrl: toHref(r.material_path),
        keyUrl: toHref(r.key_path),
        solutionUrl: toHref(r.solution_path),
        read: r.read ?? false,
      })),
    [filtered]
  );

  const columns = useMemo(
    () => [
      { title: 'Area', dataIndex: 'area', key: 'area' },
      { title: 'Topic Name', dataIndex: 'topic', key: 'topic' },
      {
        title: 'Action',
        key: 'action',
        align: 'right' as const,
        render: (_: any, row: any) => (
          <div className={styles.actions}>
            <button
              className={`${styles.pill} ${styles.pillGhost} ${!row.materialUrl ? styles.disabled : ''}`}
              onClick={() => {
                if (row.materialUrl) {
                  handleOpenMaterial(row.materialUrl, row.topic, row.id, row.topic);
                }
              }}
              disabled={!row.materialUrl}
            >
              <span>{row.read ? 'Material (Read)' : 'Material'}</span>
              <ArrowRightOutlined className={styles.arrowIcon} />
            </button>

            <button
              className={`${styles.iconCircle} ${!row.keyUrl ? styles.disabled : ''}`}
              aria-label="Key"
              disabled={!row.keyUrl}
              onClick={() => {
                if (row.keyUrl) {
                  handleOpenKey(row.keyUrl, `${row.topic} - Key`);
                }
              }}
            >
              <KeyOutlined />
            </button>

            <button
              className={`${styles.pill} ${styles.pillSolid} ${!row.solutionUrl ? styles.disabled : ''}`}
              disabled={!row.solutionUrl}
              onClick={() => {
                if (row.solutionUrl) {
                  handleOpenSolution(row.solutionUrl, `${row.topic} - Solution`);
                }
              }}
            >
              <span>Solution</span>
              <ArrowRightOutlined className={styles.arrowIcon} />
            </button>
          </div>
        ),
      },
    ],
    [handleOpenMaterial, handleOpenKey, handleOpenSolution]
  );

  <main className={styles.container}>
    <SetBreadcrumb text="Reference / Practice Material" />
    <p className={styles.errorText}>Failed to load materials: {error}</p>
  </main>

  return (
    <main className={styles.container}>
      <SetBreadcrumb text="Reference / Practice Material" />
      <div className={styles.topDivider} />

      <div className={styles.filterRow}>
        <Select value={selectedArea} onChange={setSelectedArea} className={styles.dropdown} popupMatchSelectWidth={false}>
          {areaOptions.map((a) => (
            <Option key={a} value={a}>{a === 'ALL' ? 'All Areas' : a}</Option>
          ))}
        </Select>

        <button type="button" className={styles.dropdownBtn} onClick={goToEbooks}>
          Study Material E-Books <ArrowRightOutlined className={styles.arrowIcon} />
        </button>
      </div>

      <section className={styles.tableCard}>
        <Table
          dataSource={dataSource}
          columns={columns as any}
          className={styles.antTableTight}
          tableLayout="fixed"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: dataSource.length,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            position: ['bottomCenter'],
          }}
          onChange={(pagination) => {
            setCurrentPage(pagination.current || 1);
            if (pagination.pageSize !== pageSize) {
              setPageSize(pagination.pageSize || 10);
              setCurrentPage(1);
            }
          }}
          loading={{ spinning: loading, tip: 'Loading materials...' }}
          locale={{ emptyText: <Empty description="No materials found" /> }}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </section>

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
