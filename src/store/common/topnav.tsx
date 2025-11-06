// src/components/common/topnav.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Layout, Button, Avatar, Badge, Tooltip, Spin } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  BellOutlined,
  MessageOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./topnav.module.css";

import NotificationsPopup, {
  NotificationRow as PopupNotificationRow,
} from "@/components/notifications/NotificationsPopup";

const { Header } = Layout;

interface TopNavProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  username: string;
  Photo: string;
  logout: () => void;
  isLeftNavDisabled?: boolean;
}

// Use the popup's NotificationRow type to avoid mismatches
type NotificationRow = PopupNotificationRow & { isRead?: boolean };

export default function TopNav({
  collapsed,
  setCollapsed,
  username,
  Photo,
  logout,
  isLeftNavDisabled,
}: TopNavProps) {
  const { data: session } = useSession();
  // NOTE: we still keep userId for profile routing etc.
  const userId = session?.user?.id as string | number | undefined;
  const router = useRouter();
  const pathname = usePathname();

  // popup open/close
  const [notifOpen, setNotifOpen] = useState(false);

  // fallback local states (not required for popup but kept)
  const [notifRows, setNotifRows] = useState<NotificationRow[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // server unseen count
  const [unseenCount, setUnseenCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  const bellBtnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const pageTitle = "";

  // Get the display name and initial (same logic as leftnav)
  const displayName = (session?.user as any)?.firstname || (session?.user as any)?.name || username || "Student";
  const initial = displayName?.trim()?.charAt(0)?.toUpperCase() || "S";

  // derive locale from pathname
  const extractLocale = () => {
    if (!pathname) return "en";
    const parts = pathname.split("/").filter(Boolean);
    return parts.length > 0 ? parts[0] : "en";
  };
  const locale = extractLocale();

  // click-away to close popup
  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (!notifOpen) return;
      const target = e.target as Node | null;
      if (!target) return;

      // If click happened outside both popup and bell -> close
      if (
        popupRef.current &&
        !popupRef.current.contains(target) &&
        bellBtnRef.current &&
        !bellBtnRef.current.contains(target)
      ) {
        console.log("[NOTIF] Click outside popup — closing");
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [notifOpen]);

  // Helper: find id_card_no in session.user (tries several common keys)
  const getIdCardNoFromSession = (): string | null => {
    const user = session?.user as any;
    if (!user) return null;
    const candidates = [
      "id_card_no",
      "idCardNo",
      "idCard",
      "id_cardno",
      "cardNo",
      "id_number",
      "idNumber",
    ];
    for (const k of candidates) {
      const v = user[k];
      if (v != null && String(v).trim() !== "") return String(v);
    }
    // fallback: maybe the username equals the id card number
    if (typeof user.name === "string" && /^\d+$/.test(user.name)) return user.name;
    return null;
  };

  // fetch unseen count (sends id_cardno instead of userId)
  useEffect(() => {
    let alive = true;
    const fetchCount = async () => {
      const id_cardno = getIdCardNoFromSession();
      if (!id_cardno) {
        console.log("[NOTIF] id_card_no not available in session — skipping unseen count fetch");
        setUnseenCount(null);
        return;
      }

      setCountLoading(true);
      setNotifError(null);
      console.log(`[NOTIF] Requesting unseen count for id_cardno='${id_cardno}'`);

      try {
        const res = await fetch("/api/notifications/notification_count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_cardno }), // send id_cardno as requested by route
          cache: "no-store",
        });

        if (!alive) return;
        if (!res.ok) {
          const txt = `HTTP ${res.status} ${res.statusText}`;
          console.warn("[NOTIF] unseen count fetch failed:", txt);
          setUnseenCount(null);
          return;
        }

        const json = await res.json().catch((e) => {
          console.warn("[NOTIF] unseen count JSON parse failed:", e);
          return null;
        });

        console.log("[NOTIF] unseen count response:", json);

        if (json?.success && typeof json.unseenCount === "number") {
          setUnseenCount(json.unseenCount);
          console.log(`[NOTIF] unseenCount set to ${json.unseenCount}`);
        } else {
          console.warn("[NOTIF] unexpected response shape - falling back");
          setUnseenCount(null);
        }
      } catch (err: any) {
        console.error("[NOTIF] unseen count error:", err);
        setUnseenCount(null);
      } finally {
        if (alive) setCountLoading(false);
      }
    };

    fetchCount();

    // Optional: refresh unseen count every 60s while the user is active
    const interval = setInterval(() => {
      fetchCount().catch(() => {});
    }, 60000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [session]); // re-run when session changes

  // TopNav's handler for notification click — now correctly typed
  const onNotificationClick = (n: NotificationRow) => {
    console.log("[TOPNAV] notification clicked:", n.id, n.cta_url);
    setNotifOpen(false);

    if (n.cta_url) {
      if (n.cta_url.startsWith("http")) {
        window.open(n.cta_url, "_blank", "noopener,noreferrer");
      } else {
        router.push(n.cta_url);
      }
    } else {
      router.push(`/${locale}/notifications`);
    }
  };

  const handleBackClick = () => {
    const confirmed = window.confirm("Are you sure you want to exit?");
    if (confirmed) window.history.back();
  };

  const handleLogout = () => {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    const loginUrl = `${base.replace(/\/$/, "")}/login`;
    try {
      logout();
    } catch {}
    try {
      signOut({ callbackUrl: loginUrl, redirect: true });
    } catch {
      window.location.href = loginUrl;
    }
  };

  // fallback count from local rows (if any)
  const fallbackCount = notifRows.filter((r) => !r.isRead).length;
  const badgeCount = typeof unseenCount === "number" ? unseenCount : fallbackCount;

  // popup inline style: position absolute inside notifWrap (which has position: relative)
  // top: below the bell (100% of button container) + gap
  // right: 0 -> align popup's right edge with notifWrap's right edge (bell right)
  const popupInlineStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% - 25px)", // 8px gap below the bell
    right: 0,
    zIndex: 1200,
  };

  return (
    <Header className={styles.header} style={{ left: isLeftNavDisabled ? "0" : collapsed ? "76px" : "236px" }}>
      <div className={styles.inner}>
        {/* Left */}
        <div className={styles.left}>
          {isLeftNavDisabled ? (
            <Button onClick={handleBackClick} icon={<ArrowLeftOutlined />} className={styles.iconButton} type="text" />
          ) : (
            <Button type="text" onClick={() => setCollapsed(!collapsed)} className={styles.iconButton} icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} />
          )}
          <span className={styles.title}>{pageTitle}</span>
        </div>

        {/* Right */}
        <div className={styles.right}>
          <button className={styles.resumeBtn} type="button">
            <span className={styles.resumeIconWrap}><span className={styles.chatIcon}><MessageOutlined /></span><span className={styles.clockIcon}><ClockCircleOutlined /></span></span>
            <span>Start From Last Point</span>
          </button>

          <div className={styles.notifWrap} style={{ position: "relative" }}>
            <Tooltip title="Notifications">
              <Badge count={badgeCount} size="small" offset={[-6, 6]}>
                <button
                  ref={bellBtnRef}
                  className={styles.bellBtn}
                  type="button"
                  aria-label="Notifications"
                  onClick={() => {
                    const next = !notifOpen;
                    console.log("[NOTIF] Bell clicked - toggling popup =>", next);
                    setNotifOpen(next);
                  }}
                >
                  {countLoading ? <Spin size="small" /> : <BellOutlined />}
                </button>
              </Badge>
            </Tooltip>

            {notifOpen && (
              <div ref={popupRef} style={popupInlineStyle}>
                <NotificationsPopup
                  limit={3}
                  userId={getIdCardNoFromSession() ?? undefined} // keep prop name but provide id_cardno so popup can be updated to use it
                  onClose={() => setNotifOpen(false)}
                  onItemClick={(n: PopupNotificationRow) => onNotificationClick(n)}
                />
              </div>
            )}
          </div>

          <button className={styles.avatarBtn} type="button" aria-label="Profile" onClick={() => { if (!userId) { router.push("/login"); return; } router.push("/profile"); }}>
            {Photo ? (
              <Avatar size={40} src={`/api/user/image?USER_ID=${userId}&t=${new Date().getTime()}`} />
            ) : (
              <div className={styles.avatarCircle}>
                {initial}
              </div>
            )}
          </button>
        </div>
      </div>
    </Header>
  );
}
