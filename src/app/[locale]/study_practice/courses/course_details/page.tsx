'use client';

import Link from 'next/link';
import { Spin, Modal } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import IdCardContent from '@/components/idcard/IdCardContent';
import { useSelectedCourse } from '@/store/selectedcourse';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { SetBreadcrumb } from '@/app/[locale]/study_practice/BreadcrumbContext';
import { useSession } from 'next-auth/react';
import { useNavSelection } from '@/store/navSelection';

type QueryObj = Record<string, any>;
type StorageType = 'URL' | 'PATH' | '' | undefined | null;

/* ---------- Item types (now include storage + study_resource_name) ---------- */
type BtnItem = {
  id: string;
  label: string;
  href: string;
  storage?: StorageType; // URL | PATH
  icon_name?: string;
  study_resource_name?: string | null;
};

type TestItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  accent_color?: string;
  href: string;
  storage?: StorageType;
  test_type_id?: number;
  study_resource_name?: string | null;
};

type AccItem = {
  id: string;
  label: string;
  href: string;
  storage?: StorageType;
  query?: QueryObj;
  icon?: string;
  study_resource_name?: string | null;
};

type Accordion = {
  id: string;
  title: string;
  initial_state: 'collapsed' | 'expanded' | string;
  items: AccItem[];
};

type DataShape = {
  page?: { key?: string; title?: string; program_title?: string };
  header?: { breadcrumb: { label: string; href?: string | null }[] };
  tests: {
    gap?: number;
    columns_desktop: number;
    items: TestItem[];
  };
  buttons: {
    items: BtnItem[];
  };
  accordions: Accordion[];
  general_info: {
    title: string;
    links: { label: string; href: string; storage?: StorageType; study_resource_name?: string | null }[];
  };
};

/* ---------- Zustand helpers ---------- */
const getZCourse = (selected: any) => selected?.course ?? selected ?? null;
const toStr = (v: any): string => (v ?? '').toString();

function getCourseName(selected: any): string {
  const c = getZCourse(selected);
  if (!c) return 'Course Details';
  const base = toStr(c.course_name || c.name).trim();
  const variant = toStr(c.variants || c.variant).trim();
  return (variant ? `${base} (${variant})` : base) || 'Course Details';
}

/* ---------- URL helpers ---------- */
function safeHref(storage?: string | null, url?: string | null, path?: string | null): string {
  const s = (storage ?? '').toString().toUpperCase();
  if (s === 'URL') return url || '#';
  if (s === 'PATH') return path || '#';
  // fallback: prefer URL, then PATH
  return url || path || '#';
}

/* ---------- Transform API -> DataShape (now preserving storage & study_resource_name) ---------- */
function transformApiResultToDataShape(result: any): DataShape {
  const testsList = Array.isArray(result?.tests) ? result.tests : [];
  const buttonsList = Array.isArray(result?.buttons) ? result.buttons : [];
  const accList = Array.isArray(result?.accordion) ? result.accordion : [];
  const infoList = Array.isArray(result?.general_info) ? result.general_info : [];

  const tests = {
    gap: 12,
    columns_desktop: 2,
    items: testsList.map((t: any) => {
      const storage = (t.storage ?? '').toString().toUpperCase() as StorageType;
      return {
        id: String(t.id ?? ''),
        title: String(t.label ?? t.type ?? 'Test'),
        subtitle: null,
        accent_color: undefined,
        storage,
        href: safeHref(storage, t.url, t.path),
        test_type_id: Number(t.test_type_id ?? t.testTypeId ?? t.type_id ?? NaN) || undefined,
        study_resource_name: t.study_resource_name ?? null,
      } as TestItem;
    }),
  };

  const buttons = {
    items: buttonsList.map((b: any) => {
      const storage = (b.storage ?? '').toString().toUpperCase() as StorageType;
      return {
        id: String(b.id ?? ''),
        label: String(b.label ?? 'Open'),
        href: safeHref(storage, b.url, b.path),
        storage,
        icon_name: typeof b.icon === 'string' && b.icon.length ? b.icon : undefined,
        study_resource_name: b.study_resource_name ?? null,
      } as BtnItem;
    }),
  };

  const accordions: Accordion[] = accList.map((a: any) => ({
    id: String(a.id ?? ''),
    title: String(a.label ?? 'More'),
    initial_state: 'collapsed',
    items: (Array.isArray(a.accordion_rows) ? a.accordion_rows : []).map((r: any) => {
      const storage = (r.storage ?? '').toString().toUpperCase() as StorageType;
      return {
        id: String(r.id ?? ''),
        label: String(r.text ?? 'Open'),
        href: safeHref(storage, r.url, r.path),
        storage,
        query: undefined,
        study_resource_name: r.study_resource_name ?? null,
      } as AccItem;
    }),
  }));

  const general_info = {
    title: 'General Info',
    links: infoList
      .map((g: any) => {
        const storage = (g.storage ?? '').toString().toUpperCase() as StorageType;
        return {
          label: String(g.label ?? '').trim(),
          href: safeHref(storage, g.url, g.path),
          storage,
          study_resource_name: g.study_resource_name ?? null,
        };
      })
      .filter((x: { label: string }) => x.label.length > 0),
  };

  return {
    page: { key: 'course_details', title: 'Course Details', program_title: undefined },
    header: { breadcrumb: [{ label: 'Course Details', href: null }] },
    tests,
    buttons,
    accordions,
    general_info,
  };
}

function extractPayload(json: any): DataShape | null {
  const result = json?.result;
  if (!result || typeof result !== 'object') return null;
  return transformApiResultToDataShape(result);
}

/* ========= Page ========= */
export default function CourseDetailsPage() {
  const { data: session } = useSession();
  const selected = useSelectedCourse((s) => s.selected);

  // compute once per render
  const c = useMemo(() => getZCourse(selected) || {}, [selected]);
  const u = useMemo(() => ((session?.user as any) || {}), [session]);
  const courseName = useMemo(() => getCourseName(selected), [selected]);

  // Helper to replace <Idcardno> placeholders with session user's id_card_no
  const fillIdCard = (href?: string | null) => {
    if (!href || typeof href !== 'string') return href || '#';
    // Replace any occurrence (case-insensitive) of <Idcardno> with encoded id_card_no (or empty string if missing)
    try {
      const idVal = (u?.id_card_no ?? '') as string;
      const encoded = encodeURIComponent(String(idVal));
      return href.replace(/<Idcardno>/gi, encoded);
    } catch (err) {
      return href;
    }
  };


  const isIdCardHref = (href?: string | null) => {
    if (!href) return false;
    try {
      const base = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost';
      const url = new URL(href, base);
      const normalized = url.pathname.replace(/\/+$/, '') || '/';
      return normalized === '/id_card' || normalized === '/id-card' || normalized === '/idcard';
    } catch {
      const fallback = href.trim().replace(/\/+$/, '');
      return fallback === '/id_card' || fallback === 'id_card' || fallback === '/id-card' || fallback === 'id-card' || fallback === '/idcard' || fallback === 'idcard';
    }
  };
  const [data, setData] = useState<DataShape | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [idCardModalOpen, setIdCardModalOpen] = useState(false);

  const navSel = useNavSelection((s) => s.selected);
  const setNav = useNavSelection((s) => s.setSelected);

  useEffect(() => {
    if (navSel) {
      console.log('[ZUSTAND:NAV selected] =\n', JSON.stringify(navSel, null, 2));
    } else {
      console.log('[ZUSTAND:NAV selected] = null');
    }
  }, [navSel]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);

        const fd = new FormData();
        if (c.id_card_no || u.id_card_no) fd.append('id_card_no', c.id_card_no || u.id_card_no);
        if (c.batch_id) fd.append('batch_id', String(c.batch_id));
        if (c.center_id) fd.append('center_id', String(c.center_id));
        if (c.city_id) fd.append('city_id', String(c.city_id));
        if (c.course_id) fd.append('course_id', String(c.course_id));

        console.log('[CourseDetailsPage] POST FormData:', {
          id_card_no: c.id_card_no || u.id_card_no || '',
          batch_id: c.batch_id ?? '',
          center_id: c.center_id ?? '',
          city_id: c.city_id ?? '',
          course_id: c.course_id ?? '',
        });

        const res = await fetch('/api/study_practice/courses/course_details', {
          method: 'POST',
          body: fd,
          cache: 'no-store',
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        console.log('[CourseDetailsPage] Raw API response:', json);

        const payload = extractPayload(json);
        console.log('[CourseDetailsPage] Transformed payload:', payload);

        if (!cancelled) setData(payload);
      } catch (e: any) {
        console.error('[CourseDetailsPage] Error:', e);
        if (!cancelled) setError(e?.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [c, u]);

  const ACCORDIONS: Accordion[] = useMemo(
    () => (data?.accordions ?? []) as Accordion[],
    [data],
  );

  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!ACCORDIONS.length) return;
    const o: Record<string, boolean> = {};
    ACCORDIONS.forEach((a) => (o[a.id] = a.initial_state === 'expanded'));
    setOpen(o);
  }, [ACCORDIONS]);

  if (loading) {
    return (
      <main className={styles.container} style={{ minHeight: '60vh' }}>
        <SetBreadcrumb text={courseName} />
        <div className={styles.center}>
          <Spin size="large" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className={styles.container}>
        <SetBreadcrumb text={courseName} />
        <p className={styles.errorText}>Failed to load course details: {error ?? 'Unknown error'}</p>
      </main>
    );
  }

  const noTests = (data?.tests?.items?.length ?? 0) === 0;
  const noButtons = (data?.buttons?.items?.length ?? 0) === 0;
  const noAcc = (ACCORDIONS?.length ?? 0) === 0;
  const noInfo = (data?.general_info?.links?.length ?? 0) === 0;

  if (noTests && noButtons && noAcc && noInfo) {
    return (
      <main className={styles.container} style={{ minHeight: '50vh' }}>
        <SetBreadcrumb text={courseName} />
        <div className={styles.center}>
          <p className={styles.errorText}>No course details found.</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className={styles.container}>
        <SetBreadcrumb text={courseName} />

        {/* Divider below breadcrumb, above tests */}
        {!noTests && <div className={styles.hairline} />}

        {/* Tests grid (navigates by storage) */}
      {!noTests && (
        <section className={styles.tileGrid}>
          {data!.tests.items.map((t) => {
            const filledHref = fillIdCard(t.href);
            return (
              <Link
                key={t.id}
                href={filledHref}
                className={styles.testCard}
                onClick={(e) => {
                  const idCardLink = isIdCardHref(filledHref);
                  if (idCardLink) {
                    e.preventDefault();
                    setIdCardModalOpen(true);
                  }
                  console.debug('[click:test] sending to nav store:', { id: t.id, title: t.title, href: filledHref, study_resource_name: t.study_resource_name });
                  setNav({
                    id: String(t.id),
                    test_type_id: t.test_type_id,
                    label: t.title,
                    href: filledHref,
                    source: 'tests',
                    extra: { ...t, href: filledHref },
                    study_resource_name: t.study_resource_name ?? null,
                  });
                }}
              >
                <div className={styles.testContent}>
                  <span className={styles.testTitle}>{t.title}</span>
                  <span className={styles.testArrow}>→</span>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {/* Buttons list (icon shown only if provided) */}
      {!noButtons && (
        <section className={styles.itemGridSolo} aria-label="Buttons">
          {data!.buttons.items.map((b) => {
            const filledHref = fillIdCard(b.href);
            return (
              <Link
                key={b.id}
                href={filledHref}
                className={`${styles.linkRow} ${!b.icon_name ? styles.linkRowNoIcon : ''}`}
                onClick={(e) => {
                  const idCardLink = isIdCardHref(filledHref);
                  if (idCardLink) {
                    e.preventDefault();
                    setIdCardModalOpen(true);
                  }
                  console.debug('[click:button] sending to nav store:', { id: b.id, label: b.label, href: filledHref, study_resource_name: b.study_resource_name });
                  setNav({
                    id: String(b.id),
                    label: b.label,
                    href: filledHref,
                    source: 'buttons',
                    extra: { ...b, href: filledHref },
                    study_resource_name: b.study_resource_name ?? null,
                  });
                }}
              >
                {b.icon_name && (
                  <span className={styles.linkIconBox} aria-hidden>
                    <span className={styles.linkIconText}>{b.icon_name}</span>
                  </span>
                )}
                <span className={styles.linkText}>{b.label}</span>
                <span className={styles.linkArrow} aria-hidden>→</span>
              </Link>
            );
          })}
        </section>
      )}

      {/* Accordions */}
      {!noAcc && (
        <section className={styles.accList}>
          {ACCORDIONS.map((a) => {
            const isOpen = open[a.id];
            return (
              <div key={a.id} className={`${styles.accWrap} ${isOpen ? styles.open : ''}`}>
                <button
                  type="button"
                  className={styles.accRow}
                  onClick={() => setOpen((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                  aria-expanded={isOpen ? 'true' : 'false'}
                  aria-controls={`acc-body-${a.id}`}
                  id={`acc-head-${a.id}`}
                >
                  <span className={styles.accTitle}>{a.title}</span>
                  <DownOutlined className={`${styles.chevIcon} ${isOpen ? styles.rotate : ''}`} />
                </button>

                {isOpen && (
                  <ul
                    id={`acc-body-${a.id}`}
                    role="region"
                    aria-labelledby={`acc-head-${a.id}`}
                    className={styles.itemGrid}
                  >
                    {a.items.map((it) => {
                      const filledHref = fillIdCard(it.href);
                      return (
                        <li key={it.id || it.label} className={styles.gridItem}>
                          <Link
                            href={filledHref}
                            className={styles.itemRow}
                            onClick={(e) => {
                              const idCardLink = isIdCardHref(filledHref);
                              if (idCardLink) {
                                e.preventDefault();
                                setIdCardModalOpen(true);
                              }
                              console.log("IT Details: ", it);
                              console.debug('[click:accordion] sending to nav store:', { id: it.id, label: it.label, href: filledHref, study_resource_name: it.study_resource_name });
                              setNav({
                                id: String(it.id),
                                label: it.label,
                                href: filledHref,
                                source: 'accordion',
                                extra: { ...it, href: filledHref },
                                study_resource_name: it.study_resource_name ?? null,
                              });
                            }}
                          >
                            <span className={styles.bullet}>
                              <RightOutlined className={styles.bulletIcon} />
                            </span>
                            <span className={styles.itemText}>
                              {it.label}
                              {it.icon === 'NEW' && <span className={styles.badge}>NEW</span>}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* General Info */}
      {!noInfo && (
        <section className={styles.infoInline}>
          <div className={styles.infoTitle}>{data!.general_info.title}</div>
          <nav className={styles.infoRow} aria-label="General Info">
            {data!.general_info.links.map((lnk) => {
              const filledHref = fillIdCard(lnk.href);
              return (
                <Link
                  key={lnk.label}
                  href={filledHref}
                  className={styles.infoLink}
                  onClick={(e) => {
                    const idCardLink = isIdCardHref(filledHref);
                    if (idCardLink) {
                      e.preventDefault();
                      setIdCardModalOpen(true);
                    }
                    console.debug('[click:general_info] sending to nav store:', { label: lnk.label, href: filledHref, study_resource_name: lnk.study_resource_name });
                    setNav({
                      id: filledHref,
                      label: lnk.label,
                      href: filledHref,
                      source: 'general_info',
                      extra: { ...lnk, href: filledHref },
                      study_resource_name: lnk.study_resource_name ?? null,
                    });
                  }}
                >
                  {lnk.label}
                </Link>
              );
            })}
          </nav>
        </section>
      )}
    </main>
    <Modal
      open={idCardModalOpen}
      footer={null}
      onCancel={() => setIdCardModalOpen(false)}
      destroyOnHidden
      centered
      width={640}
      styles={{ body: { padding: 0, background: '#f5f7ff' } }}
    >
      {idCardModalOpen ? <IdCardContent variant="modal" /> : null}
    </Modal>
    </>
  );
}
