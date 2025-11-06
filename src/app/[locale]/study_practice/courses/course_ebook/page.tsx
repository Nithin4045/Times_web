'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Spin, Empty, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';
import {
    FilePdfOutlined,
    CheckCircleFilled,
    CheckCircleOutlined,
    DownOutlined,
    ArrowRightOutlined,
} from '@ant-design/icons';
import styles from './page.module.css';
import { SetBreadcrumb } from '@/app/[locale]/study_practice/BreadcrumbContext';
import { useSelectedCourse } from '@/store/selectedcourse';

/* ---------- Types ---------- */
type EbookRow = {
    id: number;
    course_id: number;
    area: string;
    topicname?: string | null;
    material_path?: string | null;
    type: 'ebook' | string;
    read?: boolean;
};

type ApiPayload = {
    id_card_no?: string;
    course_id: number;
    type: string;
    materials: EbookRow[];
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

/** URL or path → href */
function toHref(v?: string | null): string {
    if (!v) return '';
    const s = String(v).trim();
    if (!s) return '';
    if (/^(https?:)?\/\//i.test(s) || /^[a-z]+:/i.test(s)) return s;
    if (s.startsWith('/')) return s;
    return `/${s}`;
}

type Group = { area: string; items: EbookRow[] };

export default function CourseEbooksPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const selected = useSelectedCourse((s) => s.selected);

    const idCardNo: string = session?.user?.id_card_no ?? '';

    const [loading, setLoading] = useState(true);
    const [materials, setMaterials] = useState<EbookRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [markingId, setMarkingId] = useState<number | null>(null);

    // expand + per-area paging
    const [open, setOpen] = useState<Record<string, boolean>>({});
    const INITIAL_AREA_FILES = 10;
    const LOAD_STEP = 10;
    const [visibleByArea, setVisibleByArea] = useState<Record<string, number>>({});

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

    // fetch
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);

            const cid = normCourseId(selected);
            if (!cid) {
                setLoading(false);
                setError('Missing course_id from app state');
                return;
            }

            try {
                const form = new FormData();
                form.set('id_card_no', String(idCardNo || ''));
                form.set('course_id', String(cid));
                form.set('type', 'ebook');

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
                    setOpen({});
                    setVisibleByArea({});
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message || 'Failed to load e-books');
                    message.error('Failed to load e-books');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [selected, idCardNo]);

    // group by area
    const groups: Group[] = useMemo(() => {
        const map = new Map<string, EbookRow[]>();
        for (const m of materials) {
            const a = (m.area || 'General').trim();
            if (!map.has(a)) map.set(a, []);
            map.get(a)!.push(m);
        }
        const arr = Array.from(map.entries())
            .map(([area, items]) => ({ area, items }))
            .sort((a, b) => a.area.localeCompare(b.area));
        arr.forEach((g) =>
            g.items.sort((x, y) => (x.topicname || '').localeCompare(y.topicname || ''))
        );
        return arr;
    }, [materials]);

    // open first group by default
    useEffect(() => {
        if (!groups.length) return;
        const firstArea = groups[0].area;
        setOpen((prev) => (firstArea in prev ? prev : { ...prev, [firstArea]: true }));
        setVisibleByArea((prev) =>
            firstArea in prev ? prev : { ...prev, [firstArea]: INITIAL_AREA_FILES }
        );
    }, [groups]);

    // Progress
    const totalFiles = materials.length;
    const readCount = materials.reduce((acc, m) => acc + (m.read ? 1 : 0), 0);
    const percent = totalFiles > 0 ? Math.round((readCount / totalFiles) * 100) : 0;

    // button route with locale
    const locale = pathname?.split('/')?.[1] || '';
    const goToRefMaterials = () => {
        const target = `/study_practice/courses/course_materials`;
        router.push(target);
    };

    const onToggle = (area: string) => {
        setOpen((prev) => ({ ...prev, [area]: !prev[area] }));
        setVisibleByArea((prev) =>
            area in prev ? prev : { ...prev, [area]: INITIAL_AREA_FILES }
        );
    };
    const onLoadMoreFiles = (area: string, total: number) => {
        setVisibleByArea((prev) => {
            const cur = prev[area] ?? INITIAL_AREA_FILES;
            const next = Math.min(cur + LOAD_STEP, total);
            return { ...prev, [area]: next };
        });
    };

    const handleOpenFile = async (it: EbookRow) => {
        const href = toHref(it.material_path);
        if (!href) return;

        try {
            setMarkingId(it.id);

            await fetch('/api/study_practice/courses/course_materials/mark_read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_card_no: idCardNo, material_id: it.id }),
            });

            // Track last read material
            if (idCardNo) {
                await fetch('/api/user/last-activity/update-material', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_card_no: idCardNo,
                        material_id: it.id,
                        material_path: window.location.pathname,
                        material_title: it.topicname ?? 'E-book',
                        material_type: 'ebook',
                    }),
                }).catch(err => console.error('Failed to track last read material:', err));
            }

            // optimistic UI update
            setMaterials((prev) =>
                prev.map((m) => (m.id === it.id ? { ...m, read: true } : m))
            );

            // Open in iframe instead of new tab
            setIframeTitle(it.topicname ?? 'E-book');
            setIframeUrl(href);
        } catch (e) {
            message.error('Failed to mark material as read');
        } finally {
            setMarkingId(null);
        }
    };

    if (loading) {
        return (
            <main className={styles.page} style={{ minHeight: '60vh' }}>
                <SetBreadcrumb text="Study Material E-Books" />
                <div className={styles.center}>
                    <Spin size="large" />
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className={styles.page}>
                <SetBreadcrumb text="Study Material E-Books" />
                <p className={styles.errorText}>Failed to load e-books: {error}</p>
            </main>
        );
    }

    if (!groups.length) {
        return (
            <main className={styles.page}>
                <SetBreadcrumb text="Study Material E-Books" />
                <div className={styles.emptyWrap}>
                    <Empty description="No e-books found" />
                </div>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <SetBreadcrumb text="Study Material E-Books" />
            <div className={styles.topDivider} />

            {/* Progress */}
            <div className={styles.progressWrap} aria-label={`${percent}% completed`}>
                <div className={styles.progressTrack}>
                    <div
                        className={styles.progressBar}
                        style={{ width: `${percent}%` }}
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    />
                </div>
                <div className={styles.progressMeta}>
                    <span className={styles.progressPct}>{percent}%</span>&nbsp;Completed
                </div>
            </div>

            {/* Button */}
            <div className={styles.buttonRow}>
                <button type="button" className={styles.refBtn} onClick={goToRefMaterials}>
                    Reference / Practice Material <ArrowRightOutlined className={styles.arrowIcon} />
                </button>
            </div>

            {/* Accordions */}
            <section className={styles.contentLane}>
                <div className={styles.accList}>
                    {groups.map(({ area, items }) => {
                        const isOpen = !!open[area];
                        const visibleCount = visibleByArea[area] ?? INITIAL_AREA_FILES;
                        const visibleItems = isOpen ? items.slice(0, visibleCount) : [];
                        const hasMore = isOpen && items.length > visibleItems.length;

                        return (
                            <div key={area} className={styles.accCard}>
                                <button
                                    type="button"
                                    className={`${styles.accHead} ${isOpen ? styles.headOpen : ''}`}
                                    onClick={() => onToggle(area)}
                                    aria-expanded={isOpen ? 'true' : 'false'}
                                >
                                    <span className={styles.accTitle}>{area}</span>
                                    <DownOutlined className={`${styles.chev} ${isOpen ? styles.rotate : ''}`} />
                                </button>

                                {isOpen && (
                                    <>
                                        <ul className={styles.accBody}>
                                            {visibleItems.map((it) => {
                                                const href = toHref(it.material_path);
                                                const read = !!it.read;
                                                const isMarking = markingId === it.id;
                                                const canOpen = !!href && !isMarking;

                                                const onRowClick = () => {
                                                    if (!href || isMarking) return;
                                                    handleOpenFile(it);
                                                };

                                                const onRowKey = (e: React.KeyboardEvent<HTMLLIElement>) => {
                                                    if (!href || isMarking) return;
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        handleOpenFile(it);
                                                    }
                                                };

                                                return (
                                                    <li
                                                        key={it.id}
                                                        className={`${styles.row} ${href ? styles.rowClickable : styles.rowDisabled}`}
                                                        onClick={onRowClick}
                                                        onKeyDown={onRowKey}
                                                        role={href ? 'button' : undefined}
                                                        tabIndex={href ? 0 : -1}
                                                        aria-disabled={!href || isMarking}
                                                    >
                                                        <span className={styles.left}>
                                                            <FilePdfOutlined className={styles.pdfIcon} />
                                                            <span className={styles.rowText}>
                                                                {isMarking ? (
                                                                    <>
                                                                        {it.topicname || 'Untitled PDF'}
                                                                        <Spin size="small" className={styles.inlineSpin} />
                                                                    </>
                                                                ) : (
                                                                    it.topicname || 'Untitled PDF'
                                                                )}
                                                            </span>
                                                        </span>
                                                        <span aria-hidden className={styles.right}>
                                                            {read ? (
                                                                <CheckCircleFilled className={styles.okIcon} />
                                                            ) : (
                                                                <CheckCircleOutlined className={styles.missIcon} />
                                                            )}
                                                        </span>
                                                    </li>
                                                );
                                            })}

                                        </ul>

                                        {hasMore && (
                                            <div className={styles.areaLoadMore}>
                                                <button
                                                    type="button"
                                                    className={styles.areaLoadMoreBtn}
                                                    onClick={() => onLoadMoreFiles(area, items.length)}
                                                >
                                                    Load more…
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
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
