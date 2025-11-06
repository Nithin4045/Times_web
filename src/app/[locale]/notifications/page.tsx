'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

type Category = 'GENERAL' | 'ACCOUNT' | 'SHP' | 'OTHER';
type Variant  = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

type Notification = {
  id: number | string;
  title: string;
  body: string;
  category: Category;
  variant: Variant;
  ctaLabel?: string | null;
  ctaUrl?: string | null; // absolute URL or app path
  created_at?: string | null; // optional for sorting
};

export default function NotificationsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState<'GENERAL' | 'ACCOUNT' | 'SHP'>('GENERAL');
  const [rows, setRows] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // try to extract id_card_no from session.user
  const sessionIdCardNo = (() => {
    const u: any = (session as any)?.user ?? {};
    // try multiple likely field names
    return u?.id_card_no ?? u?.idCardNo ?? u?.idCard ?? u?.id_card ?? null;
  })();

  // deep-link tab support
  useEffect(() => {
    const t = (sp.get('tab') || '').toUpperCase();
    if (t === 'GENERAL' || t === 'ACCOUNT' || t === 'SHP') {
      setActiveTab(t as any);
    }
  }, [sp]);

  // fetch notifications using FormData POST; include id_card_no if available
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);

      try {
        // Build FormData (server expects form-data)
        const fd = new FormData();
        // request ALL notifications by default: do not append "limit" if you want all
        // If you want to request a numeric limit change below
        // Example: to request all -> leave limit omitted; to request N -> fd.append('limit', String(N));
        fd.append('limit', String(null)); // sending explicit null as string will be treated as not numeric by server -> we'll remove it below

        // Only append id_cardno if found
        if (sessionIdCardNo) {
          fd.set('id_cardno', String(sessionIdCardNo));
          console.log('[NOTIF_PAGE] Sending id_card_no from session:', sessionIdCardNo);
        } else {
          console.log('[NOTIF_PAGE] No id_card_no in session - fetching global notifications');
        }

        // If you want to request ALL notifications, remove the limit entry
        // server expects missing limit => default or all based on your route. So remove it to request ALL:
        fd.delete('limit'); // remove the placeholder; this requests ALL notifications

        console.log('[NOTIF_PAGE] POST /api/notifications (form-data) payload keys:', Array.from(fd.keys()));

        const res = await fetch('/api/notifications', {
          method: 'POST',
          body: fd,
          cache: 'no-store',
        });

        if (!alive) return;

        if (!res.ok) {
          const txt = `HTTP ${res.status} ${res.statusText}`;
          setError(txt);
          setRows([]);
          return;
        }

        const json = await res.json().catch(() => null);
        console.log('Notification Data: ', json);

        if (!json?.success || !json.data) {
          setRows([]);
          return;
        }

        // json.data is grouped by date keys. Flatten to an array and normalize fields.
        // Support both: grouped object OR flat array:
        let flattenedRaw: any[] = [];
        if (Array.isArray(json.data)) {
          flattenedRaw = json.data;
        } else if (typeof json.data === 'object' && json.data !== null) {
          flattenedRaw = Object.values(json.data).flatMap((v: any) => Array.isArray(v) ? v : []);
        } else {
          flattenedRaw = [];
        }

        const flattened: Notification[] = flattenedRaw
          .map((r: any) => ({
            id: r.id,
            title: r.title,
            body: r.body,
            category: (r.category ?? 'GENERAL') as Category,
            variant: ((r.variant ?? 'INFO') as Variant),
            ctaLabel: r.cta_label ?? r.ctaLabel ?? null,
            ctaUrl: r.cta_url ?? r.ctaUrl ?? null,
            created_at: r.created_at ?? r.createdAt ?? null,
          }));

        // sort newest-first by created_at (fallback to id if missing)
        flattened.sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          if (tb !== ta) return tb - ta;
          const na = Number(a.id as any);
          const nb = Number(b.id as any);
          if (!Number.isNaN(na) && !Number.isNaN(nb)) return nb - na;
          return String(b.id).localeCompare(String(a.id));
        });

        setRows(flattened);
      } catch (err: any) {
        setError(String(err?.message ?? err));
        setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [sessionIdCardNo]);

  const filtered = useMemo(() => {
    if (activeTab === 'GENERAL')  return rows.filter(r => r.category === 'GENERAL');
    if (activeTab === 'ACCOUNT')  return rows.filter(r => r.category === 'ACCOUNT');
    return rows.filter(r => r.category === 'SHP');
  }, [rows, activeTab]);

  const clearAll = () => setRows(prev => prev.filter(r => r.category !== activeTab));
  const dismissOne = (id: number | string) => setRows(prev => prev.filter(r => r.id !== id));

  const handleCta = (url?: string | null) => {
    if (!url) return;
    if (/^https?:\/\//i.test(url)) window.open(url, '_blank', 'noopener,noreferrer');
    else router.push(url);
  };

  const TabBtn = (props: { value: 'GENERAL' | 'ACCOUNT' | 'SHP'; children: React.ReactNode }) => (
    <button
      className={`${styles.tabBtn} ${activeTab === props.value ? styles.tabActive : ''}`}
      onClick={() => setActiveTab(props.value)}
      aria-pressed={activeTab === props.value}
    >
      {props.children}
    </button>
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <h2 className={styles.heading}>Notifications</h2>
        <button className={styles.back} onClick={() => router.back()} aria-label="Back">← Back</button>
      </header>

      {/* Tabs + Clear all */}
      <div className={styles.tabsRow}>
        <div className={styles.tabs}>
          <TabBtn value="GENERAL">General Notifications</TabBtn>
          <TabBtn value="ACCOUNT">Account Alerts</TabBtn>
          <TabBtn value="SHP">SHP Notifications</TabBtn>
        </div>
        <button className={styles.clearAll} onClick={clearAll}>Clear all</button>
      </div>

      {/* List */}
      <section className={styles.list}>
        {loading ? (
          <div className={styles.empty}>Loading notifications…</div>
        ) : error ? (
          <div className={styles.empty}>Error: {error}</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No notifications</div>
        ) : activeTab === 'ACCOUNT' ? (
          filtered.map(n => (
            <article
              key={n.id}
              className={`${styles.alert} ${
                n.variant === 'ERROR'   ? styles.bgError  :
                n.variant === 'SUCCESS' ? styles.bgSuccess: styles.bgInfo
              }`}
            >
              <button
                className={styles.close}
                aria-label="Dismiss notification"
                onClick={() => dismissOne(n.id)}
              >
                ×
              </button>

              <h3 className={styles.cardTitle}>{n.title}</h3>
              <p className={styles.cardBody}>{n.body}</p>

              {n.ctaUrl ? (
                <button
                  type="button"
                  className={styles.ctaBtn}
                  onClick={() => handleCta(n.ctaUrl!)}
                  aria-label={`Open: ${n.ctaLabel || 'CTA Button'}`}
                >
                  {n.ctaLabel || 'CTA Button'} <span className={styles.ctaArrow}>→</span>
                </button>
              ) : null}
            </article>
          ))
        ) : (
          filtered.map(n => (
            <article key={n.id} className={styles.rowCard}>
              <button
                className={styles.close}
                aria-label="Dismiss notification"
                onClick={() => dismissOne(n.id)}
              >
                ×
              </button>

              <h4 className={styles.cardTitle}>{n.title}</h4>
              <p className={styles.cardBody}>{n.body}</p>

              {n.ctaUrl ? (
                <button
                  type="button"
                  className={styles.ctaBtn}
                  onClick={() => handleCta(n.ctaUrl!)}
                  aria-label={`Open: ${n.ctaLabel || 'CTA Button'}`}
                >
                  {n.ctaLabel || 'CTA Button'} <span className={styles.ctaArrow}>→</span>
                </button>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
