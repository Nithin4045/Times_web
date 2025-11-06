"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layout, Image, Tooltip, Modal } from "antd";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import { commonStore } from "@/store/common/common";
import styles from "./leftnav.module.css";
import IdCardContent from "@/components/idcard/IdCardContent";
import icons from '@/app/[locale]/icons/index';

// Firebase imports
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const { Sider } = Layout;

export interface MenuItem {
  key: string;
  icon?: React.ReactNode;
  label: string;
  link?: string;
  children?: MenuItem[];
  isLabelOnly?: boolean;
}

interface LeftNavProps {
  collapsed: boolean;
}

const isExternalUrl = (url?: string): boolean => {
  if (!url) return false;
  // Check for http:// or https:// URLs
  return /^https?:\/\//.test(url);
};

const safePath = (p?: string): string => {
  if (!p) return "";
  
  // Handle hash-only URLs (/#something or just /#)
  if (p === "/#" || p.startsWith("/#")) {
    return p;
  }
  
  // Handle URLs with hash fragments (/path/#something)
  if (p.includes("/#")) {
    return p;
  }
  
  // Handle regular paths
  return p.startsWith("/") ? p : `/${p}`;
};
// Custom icon mapper - maps icon names to custom images
const getCustomIcon = (iconName?: string) => {
  if (!iconName) return null;
  
  const normalizedIconName = iconName.toLowerCase().trim();
  
  const iconMap: Record<string, any> = {
    // Dashboard
    'dashboard': icons.dashboard,
    'dashboardoutlined': icons.dashboard,
    
    // Study & Practice
    'study': icons.study,
    'bookoutlined': icons.study,
    'readoutlined': icons.study,
    'studypractice': icons.study,
    'study-practice': icons.study,
    
    // Progress Zone
    'progress': icons.progress,
    'riseoutlined': icons.progress,
    'linechartoutlined': icons.progress,
    'barchartoutlined': icons.progress,
    'progresszone': icons.progress,
    'progress-zone': icons.progress,
    'areachartoutlined': icons.progress,
    'chart': icons.progress,
    
    // Challenge Zone
    'challenge': icons.zone,
    'trophyoutlined': icons.zone,
    'fireoutlined': icons.zone,
    'challengezone': icons.zone,
    'challenge-zone': icons.zone,
    'zone': icons.zone,
    'xone': icons.xone,
    
    // Exclusives
    'exclusive': icons.exclusive,
    'giftoutlined': icons.exclusive,
    'staroutlined': icons.exclusive,
    'exclusives': icons.exclusive,
    
    // My Account
    'account': icons.acount,
    'useroutlined': icons.acount,
    'profileoutlined': icons.acount,
    'myaccount': icons.acount,
    'my-account': icons.acount,
    'acount': icons.acount,
    
    // Batch Schedule
    'batch': icons.batch,
    'batchschedule': icons.batch,
    'batch-schedule': icons.batch,
    
    // File/Documents - CHANGED FROM batch TO study
    'file': icons.study, // Changed from icons.batch
    'fileoutlined': icons.study, // Changed from icons.batch
    'document': icons.study, // Changed from icons.batch
    
    // Notifications
    'notification': icons.notification,
    'notifications': icons.notification,
    'bell': icons.notification,
    
    // Start from last point
    'start': icons.start,
    'startfromlastpoint': icons.start,
    'play': icons.start,
  };
  
  const iconSrc = iconMap[normalizedIconName];
  
  if (iconSrc) {
    // Ensure we have a string URL
    const imageUrl = typeof iconSrc === 'string' ? iconSrc : 
                    iconSrc.src || 
                    (iconSrc.default ? iconSrc.default.src || iconSrc.default : null);
    
    if (imageUrl) {
      return (
        <Image
          src={imageUrl}
          alt={iconName}
          preview={false}
          width={20}
          height={20}
          style={{ objectFit: 'contain' }}
        />
      );
    }
  }
  
  // Fallback - log missing icon for debugging
  console.warn(`Icon not found: ${iconName} (normalized: ${normalizedIconName})`);
  
  return null;
};

// ---------- Firebase client config (from env) ----------
const firebaseConfig = {
  apiKey: "AIzaSyAsTq6ckkONL7gAJixAXaCarCLIi8JcYSc",
  authDomain: "times-eda10.firebaseapp.com",
  projectId: "times-eda10",
  storageBucket: "times-eda10.firebasestorage.app",
  messagingSenderId: "176709989258",
  appId: "1:176709989258:web:f34629c6765a0380fa8e73",
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || "";

export default function LeftNav({ collapsed }: LeftNavProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const {
    settingsData,
    leftNavLogo,
    setleftNavLogo,
    leftNavcode,
    setleftNavcode,
    leftNavCollapseLogo,
    setleftNavCollapseLogo,
  } = commonStore();

  const role = session?.user?.role as string | undefined;

  const [rawNav, setRawNav] = useState<any[] | null>(null);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [idCardModalOpen, setIdCardModalOpen] = useState(false);
  const [followUsOpen, setFollowUsOpen] = useState(true);
  const [downloadAppOpen, setDownloadAppOpen] = useState(true);
  const fetchedOnceRef = useRef(false);

  const displayName =
    (session?.user as any)?.firstname || (session?.user as any)?.name || "Student";
  const initial = displayName?.trim()?.charAt(0)?.toUpperCase() || "S";

  // Keep track of sent token so we don't call API repeatedly
  const sentTokenRef = useRef<string | null>(null);
  // To avoid trying repeatedly when permission denied
  const fcmSetupTriedRef = useRef(false);

  // DEBUG: Log session data in sidenav
  useEffect(() => {
    console.log('📐 SIDENAV - Session data:', {
      session,
      user: session?.user,
      role,
      firstname: (session?.user as any)?.firstname,
      lastname: (session?.user as any)?.lastname,
      modules: (session?.user as any)?.modules,
      displayName,
      rawNav
    });
  }, [session, rawNav]);

  useEffect(() => {
    const raw = settingsData?.[0]?.SETTINGS_JSON;
    if (!raw) return;

    const sanitized = String(raw).replace(/'/g, '"').replace(/(\b\w+)\s*:/g, '"$1":');

    try {
      const json = JSON.parse(sanitized) || {};
      const lnLogo = String(json.left_nav_logo ?? "");
      const lnCollapse = String(json.left_nav_collapse_logo ?? "");
      const code = String(json.left_nav_text ?? "");

      const logoPath = lnLogo ? (lnLogo.startsWith("/") ? lnLogo : `/${lnLogo}`) : "";
      const collapsePath = lnCollapse ? (lnCollapse.startsWith("/") ? lnCollapse : `/${lnCollapse}`) : "";

      if (code.trim()) setleftNavcode(code);
      else setleftNavCollapseLogo(collapsePath);

      setleftNavLogo(logoPath);
    } catch (e) {
      console.error("Failed to parse SETTINGS_JSON", e);
    }
  }, [settingsData, setleftNavLogo, setleftNavCollapseLogo, setleftNavcode]);

  useEffect(() => {
    if (!session?.user) return;
    if (fetchedOnceRef.current) return;

    const ac = new AbortController();
    (async () => {
      try {
        const { data } = await axios.get("/api/sideNav", { signal: ac.signal });
        if (!ac.signal.aborted) {
          setRawNav(Array.isArray(data) ? data : []);
          fetchedOnceRef.current = true;
        }
      } catch (e: any) {
        if (!ac.signal.aborted) console.error("sideNav fetch failed", e);
      }
    })();

    return () => ac.abort();
  }, [session?.user]);

  // -----------------------
  // FCM setup effect
  // -----------------------
  useEffect(() => {
    // run once per session when user is present
    if (!session?.user?.id) {
      console.log("[FCM] No session user id; skipping FCM setup.");
      return;
    }
    if (fcmSetupTriedRef.current) {
      console.log("[FCM] FCM setup already attempted in this session; skipping.");
      return;
    }
    fcmSetupTriedRef.current = true;

    const userId = session.user.id;
    let alive = true;

    (async () => {
      console.log("[FCM] Starting FCM setup for userId:", userId);

      try {
        // Basic checks
        if (typeof window === "undefined") {
          console.log("[FCM] Not running in browser; aborting FCM setup.");
          return;
        }
        if (!("serviceWorker" in navigator)) {
          console.warn("[FCM] Service Worker NOT supported in this browser. FCM disabled.");
          return;
        }
        if (!("Notification" in window)) {
          console.warn("[FCM] Notifications API NOT supported in this browser. FCM disabled.");
          return;
        }
        if (!VAPID_KEY) {
          console.error("[FCM] Missing NEXT_PUBLIC_FCM_VAPID_KEY environment variable. Aborting FCM.");
          return;
        }

        console.log("[FCM] Notification.permission:", Notification.permission);
        if (Notification.permission === "default") {
          try {
            console.log("[FCM] Requesting notification permission from user...");
            const perm = await Notification.requestPermission();
            console.log("[FCM] Notification.requestPermission() result:", perm);
            if (perm !== "granted") {
              console.warn("[FCM] User did not grant notification permission. Aborting FCM setup.");
              return;
            }
          } catch (permErr) {
            console.error("[FCM] Error requesting notification permission:", permErr);
            return;
          }
        } else if (Notification.permission === "denied") {
          console.warn("[FCM] Notifications are blocked (denied) in browser settings. Aborting FCM setup.");
          return;
        } else {
          console.log("[FCM] Notification permission already granted.");
        }

        // Initialize firebase app (idempotent)
        try {
          initializeApp(firebaseConfig);
          console.log("[FCM] Firebase initialized (or already initialized).");
        } catch (initErr) {
          // initializeApp throws if already initialized in some environments
          console.log("[FCM] Firebase initializeApp notice:", initErr);
        }

        // Register service worker
        let swRegistration: ServiceWorkerRegistration | undefined;
        try {
          console.log("[FCM] Registering service worker at /firebase-messaging-sw.js ...");
          swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
          console.log("[FCM] Service worker registered:", swRegistration);
        } catch (swErr) {
          console.error("[FCM] Service worker registration failed:", swErr);
          return;
        }

        // Get token
        try {
          console.log("[FCM] Getting FCM token using VAPID key...");
          const messaging = getMessaging();
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swRegistration,
          });

          if (!alive) {
            console.log("[FCM] Component unmounted before token retrieval finished; aborting.");
            return;
          }

          if (!token) {
            console.warn("[FCM] getToken returned null/undefined. Check SW file & VAPID key.");
            return;
          }

          console.log("[FCM] Received FCM token:", token);

          // Avoid posting same token repeatedly in same session
          if (sentTokenRef.current === token) {
            console.log("[FCM] Token already sent to server this session; skipping POST.");
          } else {
            sentTokenRef.current = token;
            console.log("[FCM] Posting token to /api/save-fcm-token with userId:", userId);

            try {
              const res = await fetch("/api/save_fcm_token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, token }),
              });

              let json: any = null;
              try {
                json = await res.json();
              } catch (parseErr) {
                console.warn("[FCM] /api/save-fcm-token returned non-JSON response", parseErr);
              }

              if (!res.ok) {
                console.error("[FCM] /api/save-fcm-token POST failed", {
                  status: res.status,
                  statusText: res.statusText,
                  body: json,
                });
              } else {
                console.log("[FCM] /api/save-fcm-token success:", json);
              }
            } catch (postErr) {
              console.error("[FCM] Error POSTing token to /api/save-fcm-token:", postErr);
            }
          }

          // Setup foreground message handler
          try {
            onMessage(getMessaging(), (payload) => {
              console.log("[FCM] Foreground message received:", payload);
            });
            console.log("[FCM] Foreground message handler attached.");
          } catch (onMsgErr) {
            console.error("[FCM] Failed to attach onMessage handler:", onMsgErr);
          }
        } catch (tokenErr) {
          console.error("[FCM] Error while getting FCM token:", tokenErr);
        }
      } catch (err) {
        console.error("[FCM] Unexpected error during FCM flow:", err);
      }
    })();

    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  const menuItems: MenuItem[] = useMemo(() => {
    if (!rawNav || !role) return [];

    const formatted: MenuItem[] = rawNav.flatMap((item: any) => {
      const subs = Array.isArray(item.SUB_NAME) ? item.SUB_NAME : [];
      const match = subs.find(
        (s: any) => String(s.role ?? "").trim().toUpperCase() === role.trim().toUpperCase()
      );
      if (!match) return [];

      const bookmarks = Array.isArray(match.bookmarks) ? match.bookmarks : [];

      return bookmarks.map((bm: any) => {
        const mainKey = `${item.ID}-${bm.key}`;
        const main: MenuItem = {
          key: mainKey,
          icon: getCustomIcon(bm.icon),
          label: bm.label,
          link: isExternalUrl(bm.link) ? bm.link : safePath(bm.link),
        };

        if (Array.isArray(bm.children) && bm.children.length) {
          main.children = bm.children.map((ch: any) => ({
            key: `${mainKey}-${ch.key}`,
            label: ch.label,
            link: isExternalUrl(ch.link) ? ch.link : safePath(ch.link),
          }));
        }
        return main;
      });
    });

    if (role.trim().toUpperCase() === "STU") {
      const dashIdx = formatted.findIndex(
        (mi) => (mi.label || "").trim().toLowerCase() === "dashboard"
      );

      const myLearningLabel: MenuItem = {
        key: "synthetic-my-learning-label",
        label: "─── MY LEARNING ───",
        isLabelOnly: true,
      };

      if (dashIdx >= 0) formatted.splice(dashIdx + 1, 0, myLearningLabel);
      else formatted.unshift(myLearningLabel);
    }

    return formatted;
  }, [rawNav, role]);

  const hasChildren = (item: MenuItem) => !!item.children?.length;
  const isIdCardPath = (href?: string) => {
    if (!href) return false;
    const normalized = safePath(href);
    return normalized === "/id_card" || normalized === "/id-card" || normalized === "/idcard";
  };
  const isActive = (href?: string) => !!href && (pathname === href || pathname.startsWith(`${href}/`));

  const onParentClick = (item: MenuItem) => {
    const canToggle = hasChildren(item);

    if (!canToggle) {
      if (item.link) {
        if (isIdCardPath(item.link)) {
          setIdCardModalOpen(true);
        } else {
          // Handle hash-only URLs (/#something or /#)
          if (item.link === "/#" || item.link.startsWith("/#")) {
            const hash = item.link.substring(1);
            const currentPath = window.location.pathname;
            const newUrl = `${currentPath}${hash}`;
            window.location.href = newUrl;
          }
          // Handle URLs with hash fragments (/path/#something)
          else if (item.link.includes("/#")) {
            window.location.href = item.link;
          } else {
            router.push(item.link);
          }
        }
      }
      return;
    }

    if (collapsed) return;

    setOpenKeys((curr) => (curr.includes(item.key) ? curr.filter((k) => k !== item.key) : [...curr, item.key]));
  };

  const onLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } finally {
      const base = process.env.NEXT_PUBLIC_BASE_URL || "";
      const loginUrl = `${base.replace(/\/$/, "")}/login`;
      await signOut({ redirect: false });
      router.replace(loginUrl);
    }
  };

  return (
    <Sider
      theme="light"
      trigger={null}
      collapsible
      collapsed={collapsed}
      className={styles.sider}
      width={236}
      collapsedWidth={76}
    >
      {/* Brand */}
      <div className={styles.brand}>
        {collapsed ? (
          leftNavcode ? (
            <p className={styles.brandCode} title={leftNavcode}>
              {leftNavcode}
            </p>
          ) : (
            <Image
              src={leftNavCollapseLogo || "/TIME_Logo_Square.svg"}
              alt="logo small"
              preview={false}
              style={{ width: 48, height: 48 }}
            />
          )
        ) : (
          <Image
            src={leftNavLogo || "/TIME_Logo_Square.svg"}
            alt="logo"
            preview={false}
            style={{ width: 160, height: "auto" }}
          />
        )}
      </div>

      {/* Nav */}
      <nav className={styles.nav} aria-label="Primary">
        {menuItems.map((item) => {
          if (item.isLabelOnly) {
            return (
              <div key={item.key} className={styles.sectionLabel}>
                {item.label}
              </div>
            );
          }

          const open = openKeys.includes(item.key);
          const canToggle = hasChildren(item);
          const parentActive = isActive(item.link);

          const flyout =
            canToggle && collapsed ? (
              <div className={styles.flyout}>
                <ul className={styles.flyoutList} role="list">
                  {item.children!.map((child) => {
                    const active = isActive(child.link);
                    const childIsIdCard = isIdCardPath(child.link);
                    return (
                      <li key={child.key} className={styles.flyoutItem}>
                        {child.link ? (
                          isExternalUrl(child.link) ? (
                            <a
                              href={child.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.flyoutLink}
                            >
                              <span className={styles.flyoutDot} aria-hidden />
                              <span className={styles.flyoutText}>{child.label}</span>
                            </a>
                          ) : (
                            <Link
                              href={child.link}
                              className={styles.flyoutLink}
                              onClick={(e) => {
                                if (childIsIdCard) {
                                  e.preventDefault();
                                  setIdCardModalOpen(true);
                                } else if (child.link === "/#" || child.link?.startsWith("/#")) {
                                  e.preventDefault();
                                  const hash = child.link.substring(1);
                                  const currentPath = window.location.pathname;
                                  const newUrl = `${currentPath}${hash}`;
                                  window.location.href = newUrl;
                                } else if (child.link?.includes("/#")) {
                                  e.preventDefault();
                                  window.location.href = child.link;
                                }
                              }}
                            >
                              <span className={styles.flyoutDot} aria-hidden />
                              <span className={styles.flyoutText}>{child.label}</span>
                            </Link>
                          )
                        ) : (
                          <span className={styles.flyoutLink}>
                            <span className={styles.flyoutDot} aria-hidden />
                            <span className={styles.flyoutText}>{child.label}</span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null;

          const headerBtn = (
            <button
              type="button"
              className={`${styles.groupHeader} ${parentActive ? styles.groupHeaderActive : ""}`}
              onClick={() => onParentClick(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onParentClick(item);
                }
              }}
              aria-expanded={canToggle ? open : undefined}
              aria-controls={canToggle ? `sect-${item.key}` : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.groupLabel}>{item.label}</span>
              {canToggle ? <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} aria-hidden /> : null}
            </button>
          );

          return (
            <div key={item.key} className={styles.group} data-open={open} data-collapsed={collapsed}>
              {collapsed && canToggle ? (
                <Tooltip
                  placement="right"
                  classNames={{ root: styles.lightTooltip }}
                  title={flyout}
                  mouseEnterDelay={0.08}
                  destroyOnHidden
                  arrow={false}
                >
                  <div>{headerBtn}</div>
                </Tooltip>
              ) : (
                <>
                  {headerBtn}
                  {canToggle && (
                    <ul id={`sect-${item.key}`} className={styles.childList} data-open={open} role="list">
                      {item.children!.map((child, index) => {
                        const active = isActive(child.link);
                        const childIsIdCard = isIdCardPath(child.link);
                        return (
                          <li key={`${child.key}-${index}`} className={styles.childItem}>
                            {child.link ? (
                              isExternalUrl(child.link) ? (
                                <a
                                  href={child.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${styles.childLink} ${active ? styles.childLinkActive : ""}`}
                                >
                                  <span className={`${styles.dot} ${active ? styles.dotActive : ""}`} aria-hidden />
                                  <span className={styles.childText}>{child.label}</span>
                                </a>
                              ) : (
                                <Link
                                  href={child.link}
                                  className={`${styles.childLink} ${active ? styles.childLinkActive : ""}`}
                                  onClick={(e) => {
                                    if (childIsIdCard) {
                                      e.preventDefault();
                                      setIdCardModalOpen(true);
                                    } else if (child.link === "/#" || child.link?.startsWith("/#")) {
                                      e.preventDefault();
                                      const hash = child.link.substring(1);
                                      const currentPath = window.location.pathname;
                                      const newUrl = `${currentPath}${hash}`;
                                      window.location.href = newUrl;
                                    } else if (child.link?.includes("/#")) {
                                      e.preventDefault();
                                      window.location.href = child.link;
                                    }
                                  }}
                                >
                                  <span className={`${styles.dot} ${active ? styles.dotActive : ""}`} aria-hidden />
                                  <span className={styles.childText}>{child.label}</span>
                                </Link>
                              )
                            ) : (
                              <span className={styles.childLink}>
                                <span className={styles.dot} aria-hidden />
                                <span className={styles.childText}>{child.label}</span>
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* Social Media & App Downloads Section */}
      <div className={styles.linksSection} data-collapsed={collapsed}>
        {collapsed ? (
          <>
            {/* Collapsed view - icon-only buttons with tooltips showing all links */}
            <Tooltip
              placement="right"
              classNames={{ root: styles.lightTooltip }}
              mouseEnterDelay={0.08}
              arrow={false}
              title={
                <div className={styles.socialPopup}>
                  <div className={styles.popupTitle}>Follow Us</div>
                  <div className={styles.popupSocialIcons}>
                    <a
                      href="https://youtube.com/@time4media"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.popupSocialLink}
                      aria-label="YouTube"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                    <a
                      href="https://www.facebook.com/time4education"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.popupSocialLink}
                      aria-label="Facebook"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                    <a
                      href="https://www.instagram.com/time4mba/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.popupSocialLink}
                      aria-label="Instagram"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              }
            >
              <div className={styles.collapsedIconGroup}>
                <div className={styles.collapsedIcon} aria-label="Social Media">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
              </div>
            </Tooltip>

            <Tooltip
              placement="right"
              classNames={{ root: styles.lightTooltip }}
              mouseEnterDelay={0.08}
              arrow={false}
              title={
                <div className={styles.appPopup}>
                  <div className={styles.popupTitle}>Download App</div>
                  <div className={styles.popupAppLinks}>
                    <a
                      href="https://www.time4education.com/local/timecms/page.php?id=217"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.popupAppLink}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                      </svg>
                      <span>Play Store</span>
                    </a>
                    <a
                      href="https://www.time4education.com/local/timecms/page.php?id=217"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.popupAppLink}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      <span>App Store</span>
                    </a>
                  </div>
                </div>
              }
            >
              <div className={styles.collapsedIconGroup}>
                <div className={styles.collapsedIcon} aria-label="Download App">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                  </svg>
                </div>
              </div>
            </Tooltip>
          </>
        ) : (
          <>
            {/* Expanded view - collapsible sections */}
            <div className={styles.socialBlock}>
              <button
                type="button"
                className={styles.collapsibleHeader}
                onClick={() => setFollowUsOpen(!followUsOpen)}
                aria-expanded={followUsOpen}
              >
                <span className={styles.collapsibleTitle}>Follow Us</span>
                <span className={`${styles.collapsibleChevron} ${followUsOpen ? styles.chevronOpen : ''}`} aria-hidden />
              </button>
              {followUsOpen && (
                <div className={styles.socialIcons}>
                  <a
                    href="https://youtube.com/@time4media"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label="YouTube"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.facebook.com/time4education"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label="Facebook"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/time4mba/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label="Instagram"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                </div>
              )}
            </div>

            {/* App Downloads */}
            <div className={styles.appBlock}>
              <button
                type="button"
                className={styles.collapsibleHeader}
                onClick={() => setDownloadAppOpen(!downloadAppOpen)}
                aria-expanded={downloadAppOpen}
              >
                <span className={styles.collapsibleTitle}>Download App</span>
                <span className={`${styles.collapsibleChevron} ${downloadAppOpen ? styles.chevronOpen : ''}`} aria-hidden />
              </button>
              {downloadAppOpen && (
                <div className={styles.appLinks}>
                  <a
                    href="https://www.time4education.com/local/timecms/page.php?id=217"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.appLink}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                    </svg>
                    <span>Play Store</span>
                  </a>
                  <a
                    href="https://www.time4education.com/local/timecms/page.php?id=217"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.appLink}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <span>App Store</span>
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {collapsed ? (
        <Tooltip
          placement="right"
          classNames={{ root: styles.lightTooltip }}
          mouseEnterDelay={0.08}
          arrow={false}
          title={
            <div className={styles.accountPopup}>
              <div className={styles.accountPopupInner}>
                <div className={styles.accountPopupAvatar}>{initial}</div>
                <div className={styles.accountPopupName}>{displayName}</div>
                <button className={styles.accountPopupLogout} onClick={onLogout}>
                  LOGOUT
                </button>
              </div>
            </div>
          }
        >
          <div className={styles.account} data-collapsed="true">
            <div className={styles.avatar} aria-hidden>
              {initial}
            </div>
          </div>
        </Tooltip>
      ) : (
        <div className={styles.account} data-collapsed="false">
          <div className={styles.accountInner}>
            <div className={styles.avatar} aria-hidden>
              {initial}
            </div>

            <div className={styles.accountText}>
              <div className={styles.accountName}>{displayName}</div>
              <button className={styles.accountLogout} onClick={onLogout}>
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={idCardModalOpen}
        footer={null}
        onCancel={() => setIdCardModalOpen(false)}
        destroyOnHidden
        centered
        width={640}
        styles={{ body: { padding: 0, background: "#f5f7ff" } }}
      >
        {idCardModalOpen ? <IdCardContent variant="modal" /> : null}
      </Modal>
    </Sider>
  );
}
