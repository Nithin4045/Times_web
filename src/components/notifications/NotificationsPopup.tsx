// src/components/notifications/NotificationsPopup.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./NotificationsPopup.module.css";

export type NotificationRow = {
  id: number | string;
  id_card_no?: string | null;
  title: string;
  body: string;
  category?: string | null;
  variant?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  priority?: number | null;
  is_seen?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  color?: string | null; // from notification_styles table
};

type Grouped = {
  date: string;
  items: NotificationRow[];
};

type Props = {
  limit?: number | null; // pass null to request ALL
  userId?: number | string; // here used as id_cardno (string expected)
  onClose?: () => void;
  onItemClick?: (n: NotificationRow) => void;
};

function dateKeyFromIso(iso?: string | null) {
  if (!iso) return "unknown";
  try {
    const d = new Date(iso);
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return String(iso).slice(0, 10);
  }
}

export default function NotificationsPopup({
  limit = 10,
  userId,
  onClose,
  onItemClick,
}: Props) {
  const router = useRouter();
  const [groups, setGroups] = useState<Grouped[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Build FormData
        const fd = new FormData();
        if (userId !== undefined && userId !== null) {
          fd.append("id_cardno", String(userId));
        } else {
          console.warn("[NOTIF_POPUP] userId (id_cardno) not provided — server may return nothing");
        }
        // Only append limit if it's a number; omit if null => server treats as ALL
        if (typeof limit === "number") {
          fd.append("limit", String(limit));
        }

        console.log("[NOTIF_POPUP] POST /api/notifications (form-data)", { id_cardno: userId, limit });

        const res = await fetch("/api/notifications", {
          method: "POST",
          body: fd,
          cache: "no-store",
        });

        if (!alive) return;
        if (!res.ok) {
          const txt = `HTTP ${res.status} ${res.statusText}`;
          console.error("[NOTIF_POPUP] fetch failed:", txt);
          setError(txt);
          setGroups([]);
          return;
        }

        const json = await res.json().catch((e) => {
          console.error("[NOTIF_POPUP] JSON parse failed:", e);
          return null;
        });

        console.log("[NOTIF_POPUP] server response:", json);

        if (!json?.success || !Array.isArray(json.data)) {
          // support older shape { success: true, data: grouped } — but our route returns flat array
          // if data is grouped object, transform accordingly (handle both)
          if (json?.success && typeof json.data === "object" && json.data !== null) {
            // data is grouped object; convert to array by flatten then regroup
            const groupedObj: Record<string, any[]> = json.data;
            const flattened = Object.values(groupedObj).flat();
            processAndSetGroups(flattened);
            return;
          }

          setGroups([]);
          return;
        }

        // json.data is flat array of rows — group them by date key
        const flatRows: NotificationRow[] = (json.data || []).map((r: any) => ({
          id: r.id,
          id_card_no: r.id_card_no ?? r.idCardNo ?? null,
          title: r.title,
          body: r.body,
          category: r.category ?? null,
          variant: r.variant ?? null,
          cta_label: r.cta_label ?? r.ctaLabel ?? null,
          cta_url: r.cta_url ?? r.ctaUrl ?? null,
          priority: typeof r.priority === "number" ? r.priority : (r.priority ? Number(r.priority) : null),
          is_seen: typeof r.is_seen === "boolean" ? r.is_seen : !!r.is_seen,
          created_at: r.created_at ?? r.createdAt ?? null,
          updated_at: r.updated_at ?? r.updatedAt ?? null,
          color: r.color ?? null,
        }));

        console.log("[NOTIF_POPUP] received rows count:", flatRows.length);
        processAndSetGroups(flatRows);
      } catch (err: any) {
        console.error("[NOTIF_POPUP] unexpected error:", err);
        setError(String(err?.message ?? err));
        setGroups([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [limit, userId]);

  function processAndSetGroups(rows: NotificationRow[]) {
    const grouped: Record<string, NotificationRow[]> = {};
    for (const r of rows) {
      const key = dateKeyFromIso(r.created_at ?? null);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }
    // Sort groups descending by date
    const groupedArr: Grouped[] = Object.entries(grouped)
      .map(([dateKey, items]) => ({
        date: dateKey,
        items: items.sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        }),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    console.log("[NOTIF_POPUP] grouped dates:", groupedArr.map((g) => ({ date: g.date, count: g.items.length })));
    setGroups(groupedArr);
  }

  const humanTime = (iso?: string | null | undefined) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return String(iso ?? "");
    }
  };

  const humanWeekday = (iso?: string | null | undefined) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], { weekday: "long" });
    } catch {
      return "";
    }
  };

  const openNotification = (n: NotificationRow) => {
    // mark read locally
    setGroups((prev) => prev.map((g) => ({ ...g, items: g.items.map((it) => (it.id === n.id ? { ...it, is_seen: true } : it)) })));

    if (onItemClick) {
      try {
        onItemClick(n);
      } catch (e) {
        console.error("[NOTIF_POPUP] onItemClick threw", e);
      }
    }

    // mark read server-side (best-effort)
    fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => { });

    if (n.cta_url) {
      if (n.cta_url.startsWith("http")) window.open(n.cta_url, "_blank", "noopener,noreferrer");
      else router.push(n.cta_url);
    } else {
      router.push("/notifications");
    }

    if (onClose) onClose();
  };

  return (
    <div className={styles.popupWrap}>
      <div className={styles.popupCard}>
        <div className={styles.header}>
          <div className={styles.title}>Notifications</div>
          <button
            className={styles.clearAll}
            onClick={async () => {
              setGroups([]);
              try {
                await fetch("/api/notifications/clear", { method: "POST" });
              } catch { }
            }}
          >
            Clear all
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.center}>Loading...</div>
          ) : error ? (
            <div className={styles.centerError}>Error: {error}</div>
          ) : groups.length === 0 ? (
            <div className={styles.center}>No notifications</div>
          ) : (
            <>
              {groups.map((g) => (
                <div key={g.date} className={styles.group}>
                  {g.items.map((n) => (
                    <div key={String(n.id)} className={styles.card} onClick={() => openNotification(n)}>
                      <div className={styles.rowTop}>
                        <span className={`${styles.dot} ${n.is_seen ? styles.dotGray : styles.dotGreen}`} aria-hidden />
                        <div className={styles.titleWrap}>
                          <div className={styles.cardTitle}>{n.title}</div>
                        </div>
                      </div>

                      <div className={styles.cardBody}>{n.body}</div>

                      <div className={styles.metaRow}>
                        <div className={styles.timeText}>{humanTime(n.created_at)}</div>
                        <div className={styles.metaSeparator}>|</div>
                        <div className={styles.weekdayText}>{humanWeekday(n.created_at)}</div>
                      </div>


                      <div className={styles.divider} />
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.viewAll} onClick={() => router.push("/notifications")}>
            View all <span className={styles.arrow}>»</span>
          </button>
        </div>
      </div>
    </div>
  );
}
