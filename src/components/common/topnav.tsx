
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Layout, Button, Avatar, Badge, Tooltip, Spin, Input } from "antd";
import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./topnav.module.css";

import NotificationsPopup, {
  NotificationRow as PopupNotificationRow,
} from "@/components/notifications/NotificationsPopup";
import ResumeLearningPopup from "./ResumeLearningPopup";
import icons from '@/app/[locale]/icons/index';
import Image from "next/image";

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

// Search result interface
interface SearchResult {
  id: string;
  title: string;
  description: string;
  path: string;
  type: string;
  section: string;
}

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
  const [resumeLearningOpen, setResumeLearningOpen] = useState(false);

  // search states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // fallback local states (not required for popup but kept)
  const [notifRows, setNotifRows] = useState<NotificationRow[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // server unseen count
  const [unseenCount, setUnseenCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  // last activity states
  const [lastActivity, setLastActivity] = useState<any>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const bellBtnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      if (!notifOpen && !searchOpen) return;
      const target = e.target as Node | null;
      if (!target) return;

      // If click happened outside both popup and bell -> close notifications
      if (
        notifOpen &&
        popupRef.current &&
        !popupRef.current.contains(target) &&
        bellBtnRef.current &&
        !bellBtnRef.current.contains(target)
      ) {
        console.log("[NOTIF] Click outside popup — closing");
        setNotifOpen(false);
      }

      // If click happened outside search -> close search
      if (
        searchOpen &&
        searchRef.current &&
        !searchRef.current.contains(target)
      ) {
        console.log("[SEARCH] Click outside search — closing");
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [notifOpen, searchOpen]);

  // Focus search input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search functionality - ONLY ONE DECLARATION

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: value,
          locale
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };


  // In your search results click handler:
  const handleSearchResultClick = (result: SearchResult) => {
    console.log("[SEARCH] Navigating to:", result.path);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);

    // Only navigate to pages that we know work
    const safeNavigation = () => {
      switch (result.type) {
        case 'study':
          router.push('/study-practice'); // Your actual study page
          break;
        case 'progress':
          router.push('/progress_zone/home'); // Your actual progress page
          break;
        case 'profile':
          router.push('/profile'); // Your actual profile page
          break;
        case 'dashboard':
          router.push('/dashboard/student'); // Your actual dashboard
          break;
        case 'course':
        default:
          router.push('/courses'); // Always fallback to courses
          break;
      }
    };

    safeNavigation();
  };

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

  // Fetch last activities
  const fetchLastActivities = async () => {
    const id_cardno = getIdCardNoFromSession();
    if (!id_cardno) {
      console.log("[RESUME] id_card_no not available in session");
      return;
    }

    setActivityLoading(true);
    try {
      const res = await fetch("/api/user/last-activity/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_card_no: id_cardno }),
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn("[RESUME] Failed to fetch last activities:", res.status);
        return;
      }

      const json = await res.json();
      if (json?.success && json?.data) {
        setLastActivity(json.data);
        console.log("[RESUME] Last activities fetched:", json.data);
      }
    } catch (err) {
      console.error("[RESUME] Error fetching last activities:", err);
    } finally {
      setActivityLoading(false);
    }
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
      fetchCount().catch(() => { });
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
    } catch { }
    try {
      signOut({ callbackUrl: loginUrl, redirect: true });
    } catch {
      window.location.href = loginUrl;
    }
  };

  const handleResumeClick = async () => {
    await fetchLastActivities();
    setResumeLearningOpen(true);
  };

  const handleNavigateToActivity = (type: 'video' | 'material' | 'test', path: string) => {
    console.log("[RESUME] Navigating to:", type, path);
    router.push(path);
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

  // search popup style
  const searchPopupStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    width: "400px",
    zIndex: 1200,
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    border: "1px solid #e7e8ef",
  };

  return (
    <Header className={styles.header} style={{ left: isLeftNavDisabled ? "0" : collapsed ? "76px" : "236px" }}>
      <div className={styles.inner}>
        {/* Left */}
        <div className={styles.left}>
          {isLeftNavDisabled ? (
            <Button onClick={handleBackClick} className={styles.iconButton} type="text">
              <Image src={icons.menu} alt="Back" width={20} height={20} />
            </Button>
          ) : (
            <Button type="text" onClick={() => setCollapsed(!collapsed)} className={styles.iconButton}>
              <Image
                src={collapsed ? icons.menu : icons.menu}
                alt={collapsed ? "Expand menu" : "Collapse menu"}
                width={20}
                height={20}
              />
            </Button>
          )}
          <span className={styles.title}>{pageTitle}</span>
        </div>

        {/* Right */}
        <div className={styles.right}>
          <div className={styles.searchWrap} style={{ position: "relative" }} ref={searchRef}>
            <Tooltip title="Search">
              <button
                className={styles.searchBtn}
                type="button"
                aria-label="Search"
                onClick={() => {
                  const next = !searchOpen;
                  setSearchOpen(next);
                  if (!next) {
                    setSearchQuery("");
                    setSearchResults([]);
                  }
                }}
              >
                <Image src={icons.search} alt="Search" width={20} height={20} />
              </button>
            </Tooltip>

            {searchOpen && (
              <div style={searchPopupStyle}>
                <div className={styles.searchPopup}>
                  <div className={styles.searchInputContainer}>
                    <Input
                      ref={searchInputRef}
                      placeholder="Search study, progress, profile..."
                      value={searchQuery}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchQuery(value);

                        // Simple search without debouncing first
                        if (value.trim()) {
                          setSearchLoading(true);
                          fetch("/api/search", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              query: value,
                              locale
                            }),
                          })
                            .then(res => res.json())
                            .then(data => {
                              setSearchResults(data.results || []);
                              setSearchLoading(false);
                            })
                            .catch(error => {
                              console.error("Search error:", error);
                              setSearchResults([]);
                              setSearchLoading(false);
                            });
                        } else {
                          setSearchResults([]);
                          setSearchLoading(false);
                        }
                      }}
                      prefix={
                        <Image src={icons.search} alt="Search" width={16} height={16} style={{ opacity: 0.5 }} />
                      }
                      className={styles.searchInput}
                      allowClear
                    />
                  </div>

                  {searchLoading && (
                    <div className={styles.searchLoading}>
                      <Spin size="small" />
                      <span>Searching...</span>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className={styles.searchResults}>
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className={styles.searchResultItem}
                          onClick={() => {
                            console.log("[SEARCH] Navigating to:", result.path);
                            setSearchOpen(false);
                            setSearchQuery("");
                            setSearchResults([]);
                            router.push(result.path);
                          }}
                        >
                          <div className={styles.searchResultHeader}>
                            <div className={styles.searchResultTitle}>
                              {result.title}
                            </div>
                            <span
                              className={styles.searchResultType}
                              data-type={result.type.toLowerCase()}
                            >
                              {result.type}
                            </span>
                          </div>
                          <div className={styles.searchResultDescription}>
                            {result.description}
                          </div>
                          <div className={styles.searchResultMeta}>
                            <span className={styles.searchResultSection}>{result.section}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery && !searchLoading && searchResults.length === 0 && (
                    <div className={styles.searchEmpty}>
                      No results found for "{searchQuery}"
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          <button className={styles.resumeBtn} type="button" onClick={handleResumeClick}>
            <span className={styles.resumeIconWrap}>
              <Image src={icons.start} alt="Resume learning" width={20} height={20} />
            </span>
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
                  {countLoading ? (
                    <Spin size="small" />
                  ) : (
                    <Image src={icons.notification} alt="Notifications" width={20} height={20} />
                  )}
                </button>
              </Badge>
            </Tooltip>

            {notifOpen && (
              <div ref={popupRef} style={popupInlineStyle}>
                <NotificationsPopup
                  limit={3}
                  userId={getIdCardNoFromSession() ?? undefined}
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

      <ResumeLearningPopup
        visible={resumeLearningOpen}
        onClose={() => setResumeLearningOpen(false)}
        lastActivity={lastActivity}
        onNavigate={handleNavigateToActivity}
      />
    </Header>
  );
}