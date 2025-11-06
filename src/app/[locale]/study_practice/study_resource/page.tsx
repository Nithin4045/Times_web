'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Empty, Spin, message, Modal } from 'antd';
import {
  CheckCircleFilled,
  CheckCircleOutlined,
  RightOutlined,
  LoadingOutlined,
  DownOutlined,
} from '@ant-design/icons';

import styles from './page.module.css';
import { SetBreadcrumb } from '@/app/[locale]/study_practice/BreadcrumbContext';
import { useSelectedCourse } from '@/store/selectedcourse';
import { useNavSelection } from '@/store/navSelection';

type StudyResource = {
  id: number;
  type: string;
  category: string | null;
  title: string;
  link_url: string | null;
  content: string | null;
  course_id: number | null;
  seen?: boolean;
  accordion_content?: string | null;
};

type ApiResponse = {
  ok?: boolean;
  count?: number;
  course_id?: number | null;
  course_category?: number | null;
  items?: StudyResource[];
};

const toNum = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const getZCourse = (selected: any) => selected?.course ?? selected ?? null;

const getCourseId = (selected: any): number | null => {
  const c = getZCourse(selected);
  if (!c) return null;
  return (
    toNum(c.course_id) ??
    toNum(c.id) ??
    toNum(selected?.course_id) ??
    toNum(selected?.id) ??
    null
  );
};

const getCourseName = (selected: any): string => {
  const c = getZCourse(selected);
  const base = (c?.course_name ?? c?.name ?? '').toString().trim();
  const variant = (c?.variants ?? '').toString().trim();
  return (variant ? `${base} (${variant})` : base) || 'Study Resources';
};

/** accepts null/undefined */
function isLikelyHtml(s?: string | null): boolean {
  if (!s) return false;
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith('<')) return true;
  return /<(div|p|ul|ol|li|h[1-6]|table|thead|tbody|tr|td|th|span|strong|em|a|iframe|section|article)\b/i.test(
    t,
  );
}

/** parse accordion_content heuristically:
 *  - "Label--<html...>" OR
 *  - "Label<html...>"
 *  - returns {label, html|null}
 */
function parseAccordionContent(raw?: string | null): { label: string; html: string | null } | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  const dashIdx = s.indexOf('--');
  if (dashIdx >= 0) {
    const label = s.slice(0, dashIdx).trim() || 'Details';
    const rest = s.slice(dashIdx + 2).trim();
    const htmlStart = rest.indexOf('<');
    const html = htmlStart >= 0 ? rest.slice(htmlStart).trim() : rest || null;
    return { label, html: html || null };
  }

  const lt = s.indexOf('<');
  if (lt >= 0) {
    const label = s.slice(0, lt).trim() || 'Details';
    const html = s.slice(lt).trim() || null;
    return { label, html };
  }

  return { label: s, html: null };
}

export default function StudyResourcesPage() {
  const { data: session } = useSession();
  const selected = useSelectedCourse((s) => s.selected);

  const navSel = useNavSelection((s) => s.selected);
  const navHistory = useNavSelection((s) => s.history);

  const searchParams = useSearchParams();

  const courseId = getCourseId(selected);
  const courseName = getCourseName(selected);
  const idCardNo: string =
    (session?.user as any)?.id_card_no ?? (session?.user as any)?.idCardNo ?? '';

  const pageId = (searchParams.get('id') ?? '').trim();
  const pageName = (searchParams.get('name') ?? courseName).trim();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<StudyResource[]>([]);

  // selected title (defaults to first unique)
  const [selectedTitle, setSelectedTitle] = useState<string | undefined>(undefined);

  const [visibleCount, setVisibleCount] = useState(15);
  const [markingId, setMarkingId] = useState<number | null>(null);

  // modal for fallback content opening
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');

  useEffect(() => {
    console.group('[NAV & Course Store]');
    console.log('navSelection.selected:', navSel ?? null);
    console.log('navSelection.history(len):', Array.isArray(navHistory) ? navHistory.length : 0);
    console.log('selectedCourse:', selected ?? null);
    console.groupEnd();
  }, [navSel, navHistory, selected]);

  // Fetch resources using study_resource_name (from navSel) and course_id
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const studyResourceName = (navSel as any)?.study_resource_name ?? null;

      if (!courseId) {
        setErr('Missing course selection. Please select a course first.');
        setLoading(false);
        return;
      }

      if (!studyResourceName) {
        // don't explode — just clear and wait for selection
        console.warn(
          '[StudyResourcesPage] study_resource_name missing in nav selection; skipping fetch.',
        );
        setRows([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErr(null);

        const form = new FormData();
        form.set('type', String(studyResourceName));
        form.set('course_id', String(courseId));

        console.log('[StudyResourcesPage] request:', { type: studyResourceName, course_id: courseId });

        const res = await fetch('/api/study_practice/get_study_resource', {
          method: 'POST',
          body: form,
          cache: 'no-store',
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${txt}`);
        }

        const json: ApiResponse = await res.json();
        if (!cancelled) {
          const items = Array.isArray(json?.items) ? json.items : [];
          setRows(items);
          setVisibleCount(15);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || 'Failed to load resources');
          message.error('Failed to load resources');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, navSel]);

  // unique titles derived from rows
  const uniqueTitles = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => {
      const t = (r.title ?? '').toString().trim();
      if (t) s.add(t);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  // default select first unique title
  useEffect(() => {
    if (uniqueTitles.length > 0 && !selectedTitle) {
      setSelectedTitle(uniqueTitles[0]);
    }
  }, [uniqueTitles, selectedTitle]);

  const itemsForTitle = useMemo(() => {
    if (!selectedTitle) return [];
    return rows.filter((r) => (r.title ?? '').toString().trim() === selectedTitle);
  }, [rows, selectedTitle]);

  const directHtmlItems = useMemo(() => {
    return itemsForTitle.filter((it) => isLikelyHtml(it.content));
  }, [itemsForTitle]);

  type ParsedAccordion = { id: string; label: string; html: string; srcId: number };
  const accordionItems = useMemo(() => {
    const parsed: ParsedAccordion[] = [];
    itemsForTitle.forEach((it, idx) => {
      const raw = it.accordion_content ?? null;
      const p = parseAccordionContent(raw);
      if (p && p.html) {
        parsed.push({ id: `${it.id}-${idx}`, label: p.label, html: p.html, srcId: it.id });
      }
    });
    return parsed;
  }, [itemsForTitle]);

  const [openAcc, setOpenAcc] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const o: Record<string, boolean> = {};
    accordionItems.forEach((ai) => {
      if (!(ai.label in o)) o[ai.label] = false;
    });
    setOpenAcc(o);
  }, [accordionItems]);

  function toggleAccordion(label: string) {
    setOpenAcc((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  const markSeenThenOpen = async (item: StudyResource) => {
    if (!idCardNo) {
      message.warning('Missing user id. Cannot mark as seen.');
      return;
    }

    try {
      setMarkingId(item.id);

      const form = new FormData();
      form.set('id_card_no', idCardNo);
      form.set('study_resource_id', String(item.id));
      if (courseId) form.set('course_id', String(courseId));

      await fetch('/api/study_practice/get_study_resource/mark_seen', {
        method: 'POST',
        body: form,
        cache: 'no-store',
      });

      setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, seen: true } : r)));
    } catch {
      // ignore
    } finally {
      setMarkingId(null);
    }

    const url = (item.link_url || '').trim();
    const content = (item.content || '').trim();

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (content) {
      setModalTitle(item.title || 'Details');
      setModalContent(content);
      setModalOpen(true);
    } else {
      message.info('No content or link available for this item.');
    }
  };

  if (loading) {
    return (
      <main className={styles.container}>
        <SetBreadcrumb text={pageName} />
        <div className={styles.center}>
          <Spin size="large" />
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main className={styles.container}>
        <SetBreadcrumb text={pageName} />
        <p className={styles.errorText}>Failed to load: {err}</p>
      </main>
    );
  }

  if (uniqueTitles.length === 0) {
    return (
      <main className={styles.container}>
        <SetBreadcrumb text={pageName} />
        <div className={styles.emptyWrap}>
          <Empty description="No study contents available" />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <SetBreadcrumb text={pageName} />

      {/* Titles selector (like your old tabs) */}
      <div className={styles.tabs} style={{ marginBottom: 12 }}>
        {uniqueTitles.map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.tabBtn} ${selectedTitle === t ? styles.tabActive : ''}`}
            onClick={() => setSelectedTitle(t)}
            style={{ marginRight: 8 }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Title heading */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>{selectedTitle}</h2>
      </div>

      {/* Render direct HTML items */}
      {directHtmlItems.length > 0 && (
        <section className={styles.card} style={{ marginBottom: 16 }}>
          {directHtmlItems.map((it) => (
            <div key={`direct-${it.id}`} style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{it.title}</div>
              <div dangerouslySetInnerHTML={{ __html: it.content ?? '' }} />
            </div>
          ))}
        </section>
      )}

      {/* Render accordion items grouped by label (updated UI) */}
      {accordionItems.length > 0 && (
        <section className={styles.card}>
          {Array.from(
            accordionItems.reduce((m, a) => {
              if (!m.has(a.label)) m.set(a.label, []);
              m.get(a.label)!.push(a);
              return m;
            }, new Map<string, ParsedAccordion[]>()),
          ).map(([label, group]) => {
            const isOpen = !!openAcc[label];
            return (
              <div key={`acc-group-${label}`} className={styles.accWrap}>
                {/* pill header */}
                <button
                  type="button"
                  onClick={() => toggleAccordion(label)}
                  className={`${styles.accRow} ${isOpen ? styles.accOpen : ''}`}
                  aria-expanded={isOpen}
                >
                  <span className={styles.accTitle}>{label}</span>
                  <span className={styles.chevBox}>
                    <DownOutlined className={`${styles.chevIcon} ${isOpen ? styles.rotate : ''}`} />
                  </span>
                </button>

                {isOpen && (
                  <div className={styles.accBody}>
                    {group.map((g, idx) => (
                      <div key={`${label}-${idx}`} className={styles.accBodyItem}>
                        <div dangerouslySetInnerHTML={{ __html: g.html }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Nothing to show */}
      {directHtmlItems.length === 0 && accordionItems.length === 0 && (
        <div className={styles.emptyWrap}>
          <Empty description="No content available for this title" />
        </div>
      )}

      <Modal open={modalOpen} title={modalTitle} onCancel={() => setModalOpen(false)} footer={null} width={720}>
        <div className={styles.modalBody}>
          {isLikelyHtml(modalContent) ? (
            <div dangerouslySetInnerHTML={{ __html: modalContent }} />
          ) : (
            modalContent.split('\n').map((p, i) => <p key={i}>{p}</p>)
          )}
        </div>
      </Modal>
    </main>
  );
}
