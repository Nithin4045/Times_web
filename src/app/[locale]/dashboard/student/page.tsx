'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Modal, Button, Typography, Space, Divider } from 'antd';
import * as AntIcons from '@ant-design/icons';
import styles from './page.module.css';
import icons from '@/app/[locale]/icons/index';

import type {
  StatItem,
  TileItem,
  DashboardShape,
  ScheduleRow,
  CourseInfo,
  CoursesResponse,
  NextClassRoutingEntry,
} from '../types';

/* ----------------- Types for popup (unchanged) ----------------- */
type RichSpan = { text: string; bold?: boolean; color?: string; style?: React.CSSProperties; };
type RichValue = string | RichSpan[];
type RichLine = RichValue | { value: RichValue; style?: React.CSSProperties };
type PopupConfig = {
  template?: 'MODAL' | 'CARD' | 'INLINE' | 'BANNER' | 'TOAST';
  title?: RichValue; subtitle?: RichValue; body?: RichLine | RichLine[];
  bullets?: RichLine[]; list?: RichLine[];
  tip?: { icon?: string; text?: RichLine };
  rich?: { title?: RichLine; subtitle?: RichLine; body?: RichLine | RichLine[]; bullets?: RichLine[]; tip?: RichLine };
  ctas?: Array<{ id?: string; label: string; href?: string; variant?: 'primary' | 'default' | 'link' | 'dashed' | 'text'; color?: string; textColor?: string; onClose?: boolean; style?: React.CSSProperties; }>;
  colors?: { card?: string; bg?: string; text?: string; accent?: string; };
  styles?: { width?: number; rounded?: number; padding?: number; border?: boolean; divider?: string; shadow?: 'none' | 'sm' | 'md' | 'lg'; iconSize?: number; };
  icon?: string; showIcon?: boolean;
};

/* ----------------- Helpers ----------------- */
function normalizeApiPayload(payload: any): DashboardShape | null {
  if (!payload) return null;
  if (payload.content && typeof payload.content === 'object') return payload.content as DashboardShape;
  if (Array.isArray(payload.items) && payload.items.length) {
    const it = payload.items[0];
    if (it?.content_json && typeof it.content_json === 'object') return it.content_json as DashboardShape;
    if (it?.content && typeof it.content === 'object') return it.content as DashboardShape;
  }
  if (typeof payload === 'object' && (payload.greeting || payload.nextClass || payload.stats || payload.tiles)) {
    return payload as DashboardShape;
  }
  return null;
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function resolveBannerLabel(_variant?: string, labels?: Record<string, string>): string {
  if (!labels) return 'Your Next Live Class';      // <— default instead of ''
  return labels['DEFAULT'] ?? 'Your Next Live Class';
}

function buildInternalCourseHref(userCourseId?: number | null) {
  const base =
    (typeof process !== 'undefined' && (process as any)?.env?.NEXT_PUBLIC_BASE_URL) ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  if (!base || !userCourseId) return '#';
  const left = String(base).replace(/\/+$/, '');
  return `${left}/dashboard/course/${userCourseId}`;
}

function fillTemplatePath(
  template: string,
  ctx: { course?: CourseInfo | null; schedule?: ScheduleRow | null }
): string {
  if (!template) return '#';
  let out = template;
  out = out.replace('{course.course}', String(ctx.course?.user_course_id ?? ''));
  out = out.replace('{schedule.id}', String(ctx.schedule?.id ?? ''));
  out = out.replace('{schedule.batch_code}', String(ctx.schedule?.batch_code ?? ''));
  out = out.replace('{schedule.material_code}', String(ctx.schedule?.material_code ?? ''));
  out = out.replace('{schedule.course}', String(ctx.schedule?.course ?? ''));
  return out;
}

function resolveJoinHref(
  variant: string | undefined,
  schedule: ScheduleRow | null | undefined,
  course: CourseInfo | null | undefined,
  routing?: Record<string, NextClassRoutingEntry>
): string {
  const v = (variant ?? '').toUpperCase();
  if (v === 'ONLINELIVE' && schedule?.live_url) return schedule.live_url;

  if (routing) {
    const entry = routing[v] ?? routing['DEFAULT'];
    if (entry?.url) {
      if (entry.url === 'live_url') return schedule?.live_url || '#';
      return entry.url;
    }
    if (entry?.path) return fillTemplatePath(entry.path, { course, schedule });
  }
  return buildInternalCourseHref(course?.user_course_id ?? null);
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Live';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/* ----------------- Popup rendering ----------------- */
function getIconByName(name?: string, style?: React.CSSProperties) {
  if (!name) return null;
  const Cmp: any = (AntIcons as any)?.[name];
  return Cmp ? <Cmp style={style} /> : null;
}
function renderRich(value?: RichValue, extra?: React.CSSProperties) {
  if (!value) return null;
  if (typeof value === 'string') return <span style={extra}>{value}</span>;
  return (
    <>
      {(value as RichSpan[]).map((s, i) => (
        <span
          key={i}
          style={{
            ...(s.color ? { color: s.color } : {}),
            ...(s.bold ? { fontWeight: 700 } : {}),
            ...(s.style ?? {}),
            ...(extra ?? {}),
          }}
        >
          {s.text}
        </span>
      ))}
    </>
  );
}
function toLine(v?: RichLine): { value?: RichValue; style?: React.CSSProperties } {
  if (!v) return {};
  if (typeof v === 'string' || Array.isArray(v)) return { value: v, style: undefined };
  if (typeof (v as any).value !== 'undefined') return v as any;
  return { value: v as any, style: undefined };
}
function shadowStyle(kind?: 'none' | 'sm' | 'md' | 'lg'): React.CSSProperties | undefined {
  switch (kind) {
    case 'sm': return { boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' };
    case 'md': return { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' };
    case 'lg': return { boxShadow: '0 10px 24px rgba(0,0,0,0.16)' };
    default: return undefined;
  }
}
function btnStyle(bg?: string, text?: string, style?: React.CSSProperties): React.CSSProperties | undefined {
  if (!bg && !text && !style) return undefined;
  return { ...(bg ? { background: bg, borderColor: bg } : {}), ...(text ? { color: text } : {}), ...(style ?? {}) };
}
function MessageBody({ cfg }: { cfg: PopupConfig }) {
  const accent = cfg.colors?.accent ?? '#5c52f3';
  const textCol = cfg.colors?.text ?? '#1f2430';
  const iconSize = cfg.styles?.iconSize ?? 18;

  const titleLine = toLine(cfg.rich?.title ?? cfg.title);
  const subtitleLine = toLine(cfg.rich?.subtitle ?? cfg.subtitle);
  const bodyRaw = cfg.rich?.body ?? cfg.body;
  const bodyLines = Array.isArray(bodyRaw) ? (bodyRaw as RichLine[]).map(toLine) : [toLine(bodyRaw)];
  const bulletsRaw = cfg.rich?.bullets ?? cfg.bullets ?? cfg.list ?? [];
  const bullets = (bulletsRaw as RichLine[]).map(toLine);
  const tipLine = toLine(cfg.rich?.tip ?? cfg.tip?.text);
  const tipIconName = cfg.tip?.icon ?? 'BulbOutlined';
  const showHeaderIcon = !!cfg.icon && cfg.showIcon === true;

  return (
    <div style={{ color: textCol }}>
      <Space align="start" style={{ width: '100%' }}>
        {showHeaderIcon && (
          <span
            aria-hidden
            style={{
              display: 'inline-flex', width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, background: `${accent}1A`, color: accent, flex: '0 0 auto', pointerEvents: 'none', userSelect: 'none'
            }}
          >
            {getIconByName(cfg.icon, { fontSize: iconSize })}
          </span>
        )}
        <div style={{ flex: 1 }}>
          {titleLine.value && (
            <Typography.Title level={3} style={{ margin: 0, ...(titleLine.style ?? {}) }}>
              {renderRich(titleLine.value)}
            </Typography.Title>
          )}
          {subtitleLine.value && (
            <Typography.Text style={subtitleLine.style}>
              <strong>{renderRich(subtitleLine.value)}</strong>
            </Typography.Text>
          )}
          {bodyLines.some(l => l.value) && <div style={{ height: 8 }} />}
          {bodyLines.map((ln, i) =>
            ln.value ? (
              <Typography.Paragraph key={i} style={{ margin: 0, whiteSpace: 'pre-line', ...(ln.style ?? {}) }}>
                {renderRich(ln.value)}
              </Typography.Paragraph>
            ) : null
          )}
          {bullets.length > 0 && (
            <ul style={{ margin: '12px 0 0 0', padding: 0, listStyle: 'none' }}>
              {bullets.map((ln, i) =>
                ln.value ? (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '8px 0', ...(ln.style ?? {}) }}>
                    <span aria-hidden style={{ width: 6, height: 6, marginTop: 8, borderRadius: '50%', background: accent, flex: '0 0 auto' }} />
                    <span>{renderRich(ln.value)}</span>
                  </li>
                ) : null
              )}
            </ul>
          )}
          {tipLine.value && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, ...(tipLine.style ?? {}) }}>
              <span
                aria-hidden
                style={{
                  display: 'inline-flex', width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, background: `${accent}1A`, color: accent, flex: '0 0 auto', pointerEvents: 'none', userSelect: 'none'
                }}
              >
                {getIconByName(tipIconName, { fontSize: 14 })}
              </span>
              <Typography.Text>{renderRich(tipLine.value)}</Typography.Text>
            </div>
          )}
        </div>
      </Space>
      <Divider style={{ margin: '16px 0 0' }} />
    </div>
  );
}

/* ----------------- Component ----------------- */
export default function DashboardPage() {
  const { data: session } = useSession();
  const userId: number | undefined = (session?.user as any)?.id;

  /* courses */
  const [coursesStatus, setCoursesStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [coursesResp, setCoursesResp] = useState<CoursesResponse | null>(null);
  const [coursesErrorMsg, setCoursesErrorMsg] = useState<string | null>(null);

  const pathname = usePathname();
  const role: string | undefined = (session?.user as any)?.role;
  const router = useRouter();

  // DEBUG: Log session data
  useEffect(() => {
    console.log('🎯 DASHBOARD - Session data:', {
      session,
      user: session?.user,
      userId,
      role,
      firstname: (session?.user as any)?.firstname,
      lastname: (session?.user as any)?.lastname,
      modules: (session?.user as any)?.modules,
      mobile: (session?.user as any)?.mobile,
      email: (session?.user as any)?.email
    });
  }, [session]);

  /* pages_json */
  const [jsonStatus, setJsonStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [data, setData] = useState<DashboardShape | null>(null);

  /* First-time login popup */
  const [popupConfig, setPopupConfig] = useState<PopupConfig | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupLoading, setPopupLoading] = useState(false);

  // Load page JSON
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setJsonStatus('loading');
        const params = new URLSearchParams({ placement: 'DASHBOARD' });
        const res = await fetch(`/api/utils/pages_json?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('failed_pages_json');
        const payload = await res.json();
        const normalized = normalizeApiPayload(payload);
        if (mounted) { setData(normalized); setJsonStatus('success'); }
      } catch {
        if (mounted) { setData(null); setJsonStatus('error'); }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // First-time login popup
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams({
          placement: 'DASHBOARD_WELCOME',
          userId: String(userId),
          ...(role ? { role: role } : {}),
        });
        const res = await fetch(`/api/custom_page?${qs.toString()}`, { cache: 'no-store' });
        if (cancelled || !res.ok || res.status === 204) return;
        const body = await res.json().catch(() => null);
        const item = body?.items?.[0];
        if (!item) return;
        let config: PopupConfig;
        try { config = typeof item.contentjson === 'string' ? JSON.parse(item.contentjson) : item.contentjson; }
        catch { return; }
        if (cancelled) return;
        setPopupConfig(config);
        setShowPopup(true);
      } catch { }
    })();
    return () => { cancelled = true; };
  }, [userId, role, pathname]);

  // Load courses
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = (session?.user as any) || {};
        const idCardNo = u.id_card_no || u.idCardNo || '';
        if (!idCardNo) return;

        setCoursesStatus('loading');

        // build form data
        const formData = new FormData();
        formData.append("id_card_no", String(idCardNo));

        const res = await fetch(`/api/get_users_course_details`, {
          method: "POST",
          body: formData,
          cache: "no-store",
        });

        if (!res.ok) {
          let details = '';
          try {
            const body = await res.json();
            details = body?.error || body?.message || '';
          } catch { }
          throw new Error(details || `courses_api_${res.status}`);
        }

        const payload: CoursesResponse = await res.json();
        if (mounted) {
          setCoursesResp(payload);
          setCoursesErrorMsg(null);
          setCoursesStatus('success');
        }
      } catch (e: any) {
        if (mounted) {
          setCoursesResp(null);
          setCoursesErrorMsg(e?.message || 'Failed to load courses');
          setCoursesStatus('error');
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  /* derived */
  const loadingAny = jsonStatus === 'loading' || coursesStatus === 'loading';
  const nextClass = coursesResp?.next_class ?? null;
  const enrolledCount = coursesResp?.courses_count ?? 0;

  // Build comma-separated list of course names from the courses API (optional: safer root-level read)
  const courseNamesCsv = useMemo(() => {
    const arr = (coursesResp?.courses ?? [])
      .map((c: any) => c?.course_name) // <-- root-level course_name
      .filter(Boolean) as string[];
    const unique = Array.from(new Set(arr));
    return unique.join(', ');
  }, [coursesResp?.courses]);

  // --- replace this helper ---
  function estimateCourseProgress(c: any): number {
    // ✅ 1) Prefer backend-provided nested progress.percentage
    const pct1 = Number(c?.progress?.percentage);
    if (Number.isFinite(pct1)) return Math.max(0, Math.min(100, Math.round(pct1)));

    // 2) Fallback: some older responses might still send overall_percentage
    const pct2 = Number(c?.overall_percentage);
    if (Number.isFinite(pct2)) return Math.max(0, Math.min(100, Math.round(pct2)));

    // 3) Last resort: compute from chapters if present
    const chapters = Array.isArray(c?.chapters) ? c.chapters : [];
    const totalTopics = chapters.reduce(
      (acc: number, ch: any) => acc + (Array.isArray(ch?.topics) ? ch.topics.length : 0),
      0
    );
    if (totalTopics <= 0) return 0;

    const completedCount = Array.isArray(c?.completed_topics) ? c.completed_topics.length : 0;
    return Math.round((completedCount / totalTopics) * 100);
  }

  // --- overallCompletion stays, but now reads the right value via estimateCourseProgress ---
  const overallCompletion = useMemo(() => {
    const list = (coursesResp?.courses ?? []) as any[];
    if (!list.length) return 0;

    let total = 0;
    for (const course of list) {
      total += estimateCourseProgress(course);
    }
    return Math.round(total / list.length);
  }, [coursesResp?.courses]);

  // Merge stats, adding enrolled, time, and completion
  const mergedStats: StatItem[] = useMemo(() => {
    const base = Array.isArray(data?.stats) ? [...data!.stats] : [];

    const idxEnrolled = base.findIndex((s) => s.key === 'enrolled');
    if (idxEnrolled >= 0) base[idxEnrolled] = { ...base[idxEnrolled], value: enrolledCount };

    const idxCompletion = base.findIndex((s) => s.key === 'completion');
    if (idxCompletion >= 0) {
      base[idxCompletion] = { ...base[idxCompletion], value: overallCompletion, suffix: '%' };
    }


    return base;
  }, [data, enrolledCount, overallCompletion]);

  const displayName = useMemo(() => {
    const u = (session?.user as any) || {};
    const first = u.firstname?.trim?.() || u.firstName?.trim?.();
    const last = u.lastname?.trim?.() || u.lastName?.trim?.();
    if (first || last) return [first, last].filter(Boolean).join(' ');
    if (u.name) return u.name;
    if (u.email) return u.email.split('@')[0];
    return data?.greeting?.userName || '';
  }, [session, data]);

  // Greeting: use time-based period; show course names CSV instead of examTag
  const greetingPeriod = useMemo(() => {
    const raw = (data?.greeting?.title ?? getTimeGreeting())?.trim();
    if (typeof raw === 'string' && raw.length) {
      return raw
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }
    return raw;
  }, [data?.greeting?.title]);
  const greetingExamTag = courseNamesCsv; // comma-separated courses

  // Banner
  const bannerVariant = nextClass?.course?.variants || data?.nextClass?.mode;
  const bannerLabel = resolveBannerLabel(bannerVariant, data?.nextClass?.labels);
  const bannerName = nextClass?.topic?.topic_name || data?.nextClass?.name || '';
  const bannerStartISO = nextClass?.schedule?.scheduled_date_time || '';
  const [countdown, setCountdown] = useState<string>(data?.nextClass?.startsIn || '');
  useEffect(() => {
    if (!bannerStartISO) { setCountdown(''); return; }
    const startAt = Date.parse(bannerStartISO);
    const tick = () => setCountdown(formatCountdown(startAt - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [bannerStartISO]);

  const bannerHref = resolveJoinHref(
    bannerVariant,
    nextClass?.schedule ?? null,
    nextClass?.course ?? null,
    data?.nextClass?.routing
  );
  const isExternal =
    /^https?:\/\//i.test(bannerHref) &&
    (typeof window === 'undefined' || !bannerHref.startsWith((window as any)?.location?.origin ?? ''));
  const bannerCtaDisabled = !bannerHref || bannerHref === '#';

  const showBannerSkeleton = loadingAny;
  const showBannerError = (coursesStatus === 'error') && !nextClass;

  const handleCtaClick = async (cta: any) => {
    if (cta.onClose) {
      setPopupLoading(true);
      try {
        const formData = new FormData();
        formData.append('user_id', String(userId));
        await fetch('/api/utils/first_time_login', { method: 'PATCH', body: formData });
      } catch (error) {
        console.error('Failed to update first_time_login:', error);
      } finally {
        setPopupLoading(false);
        setShowPopup(false);
      }
    }
  };

  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          {loadingAny ? (
            <div className={`${styles.greetingSkeleton} ${styles.skeleton}`} aria-busy="true" aria-label="Loading greeting">
              <div className={`${styles.skelLine} ${styles.greetLine1}`} />
            </div>
          ) : (
            <h1 className={styles.greeting}>
              {greetingPeriod}
              {displayName ? (<>, <span className={styles.name}>{displayName}</span>!</>) : '!'}
            </h1>
          )}

          {/* Banner */}
          {showBannerSkeleton ? (
            <div className={`${styles.banner} ${styles.bannerSkeleton} ${styles.skeleton}`}>
              <div className={styles.bannerLeft}>
                <span className={styles.bannerLabel}>
                  {bannerLabel || 'Your Next Live Class'}
                </span>
                <span className={styles.bannerClass}>
                  {bannerName || ''}
                </span>
              </div>

              <div className={styles.skelTimer} />
              <div className={styles.skelBtn} />
            </div>
          ) : showBannerError ? (
            <div className={styles.bannerError}>Couldn't load your course details. {coursesErrorMsg}</div>
          ) : nextClass ? (
            <div className={styles.banner}>
              <div className={styles.bannerLeft}>
                <span className={styles.bannerLabel}>Your next live class,</span>
                <span className={styles.bannerClass}>{bannerName || '[Class Name Comes Here]'}</span>
              </div>
              <div className={styles.bannerTimer}>{countdown || '23:34:15'}</div>
              {bannerCtaDisabled ? (
                <span className={`${styles.bannerCta} ${styles.bannerCtaDisabled}`} aria-disabled="true">
                  <span>→</span> Join Now
                </span>
              ) : (
                <a className={styles.bannerCta} href={bannerHref} {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}>
                  <span>→</span> Join Now
                </a>
              )}
            </div>
          ) : null}
        </header>

        <div className={styles.bannerDivider} />


        {/* Stats */}
        <section className={styles.statsGrid}>
          {loadingAny
            ? Array.from({ length: Math.max(4, (data?.stats?.length ?? 4)) }).map((_, i) => (
              <article key={`skel-stat-${i}`} className={`${styles.statCard} ${styles.skeleton}`}>
                <div className={styles.statVisual}><div className={styles.skelCircle} /></div>
                <div><div className={`${styles.skelLine} ${styles.skelStatTitle}`} /></div>
              </article>
            ))
            : (mergedStats ?? []).map((s) => (
              <article key={s.key} className={styles.statCard}>
                <div className={styles.statVisual}>
                  {/* Replace circle with batch image for batch schedule stat */}
                  {s.key === 'batch' || s.label?.toLowerCase().includes('batch') ? (
                    <img
                      src={icons.batch}
                      alt={s.label}
                      className={styles.statImage}
                      style={{ width: '70px', height: '70px', objectFit: 'contain',padding:'5px' }}
                    />
                  ) : (
                    <div className={styles.valueCircle}>
                      <span className={styles.valueText}>
                        {String(s.value)}
                        {s.suffix && <span className={styles.valueSuffix}>{s.suffix}</span>}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.statLabel}>{s.label}</div>
              </article>
            ))}
        </section>

        <div className={styles.sectionDivider} />

        {/* Tiles */}
        <section className={styles.tileGrid}>
          {loadingAny
            ? Array.from({ length: Math.max(4, (data?.tiles?.length ?? 4)) }).map((_, i) => (
              <div key={`skel-tile-${i}`} className={`${styles.tileCard} ${styles.skeleton}`}>
                <div className={styles.skelTileImg} />
                <div className={styles.tileContent}>
                  <div className={`${styles.skelLine} ${styles.skelTileTitle}`} />
                  <div className={`${styles.skelLine} ${styles.skelTileDesc}`} />
                </div>
              </div>
            ))
            : (data?.tiles ?? []).map((t: TileItem) => (
              <a key={t.key} className={styles.tileCard} href={t.href}>
                {t.image ? (
                  <img className={styles.tileImageTopRight} src={t.image} alt={t.title} loading="lazy" />
                ) : null}
                <div className={styles.tileContent}>
                  <div className={styles.tileTitle}>{t.title}</div>
                  <div className={styles.tileDesc}>{t.desc}</div>
                </div>
              </a>
            ))}
        </section>
      </main>

      {/* First-time login popup */}
      {popupConfig && (
        <Modal
          open={showPopup}
          onCancel={() => { /* locked by design: close with CTA only */ }}
          footer={null}
          maskClosable={false}
          closable={false}
          width={popupConfig.styles?.width ?? 720}
          styles={{
            content: {
              borderRadius: popupConfig.styles?.rounded ?? 12,
              padding: popupConfig.styles?.padding ?? 24,
              background: popupConfig.colors?.card ?? '#fff',
              ...(popupConfig.styles?.border ? { border: `1px solid ${popupConfig.styles?.divider ?? 'rgba(0,0,0,0.08)'}` } : {}),
              ...shadowStyle(popupConfig.styles?.shadow),
            },
          }}
          destroyOnHidden
        >
          <MessageBody cfg={popupConfig} />
          {Array.isArray(popupConfig.ctas) && popupConfig.ctas.length > 0 && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              {popupConfig.ctas.map((c, i) => (
                <Button
                  key={c.id ?? i}
                  type={c.variant ?? 'default'}
                  href={c.href}
                  onClick={() => handleCtaClick(c)}
                  loading={popupLoading && c.onClose}
                  disabled={popupLoading}
                  style={btnStyle(c.color, c.textColor, c.style)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
