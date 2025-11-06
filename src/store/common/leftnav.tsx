'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Image, Tooltip } from 'antd';
import axios from 'axios';
import { useSession, signOut } from 'next-auth/react';
import { commonStore } from '@/store/common/common';
import { getAntdIcon } from '@/components/common/iconmapper';
import styles from './leftnav.module.css';

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

const safePath = (p?: string): string => (p ? (p.startsWith('/') ? p : `/${p}`) : '');

export default function LeftNav({ collapsed }: LeftNavProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const {
    settingsData,
    leftNavLogo, setleftNavLogo,
    leftNavcode, setleftNavcode,
    leftNavCollapseLogo, setleftNavCollapseLogo,
  } = commonStore();

  const role = session?.user?.role as string | undefined;

  const [rawNav, setRawNav] = useState<any[] | null>(null);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const fetchedOnceRef = useRef(false);

  const displayName =
    (session?.user as any)?.firstname ||
    (session?.user as any)?.name ||
    'Student';
  const initial = displayName?.trim()?.charAt(0)?.toUpperCase() || 'S';

  useEffect(() => {
    const raw = settingsData?.[0]?.SETTINGS_JSON;
    if (!raw) return;

    const sanitized = String(raw)
      .replace(/'/g, '"')
      .replace(/(\b\w+)\s*:/g, '"$1":');

    try {
      const json = JSON.parse(sanitized) || {};
      const lnLogo = String(json.left_nav_logo ?? '');
      const lnCollapse = String(json.left_nav_collapse_logo ?? '');
      const code = String(json.left_nav_text ?? '');

      const logoPath = lnLogo ? (lnLogo.startsWith('/') ? lnLogo : `/${lnLogo}`) : '';
      const collapsePath = lnCollapse ? (lnCollapse.startsWith('/') ? lnCollapse : `/${lnCollapse}`) : '';

      if (code.trim()) setleftNavcode(code);
      else setleftNavCollapseLogo(collapsePath);

      setleftNavLogo(logoPath);
    } catch (e) {
      console.error('Failed to parse SETTINGS_JSON', e);
    }
  }, [settingsData, setleftNavLogo, setleftNavCollapseLogo, setleftNavcode]);

  useEffect(() => {
    if (!session?.user) return;
    if (fetchedOnceRef.current) return;

    const ac = new AbortController();
    (async () => {
      try {
        const { data } = await axios.get('/api/palms/sideNav', { signal: ac.signal });
        if (!ac.signal.aborted) {
          setRawNav(Array.isArray(data) ? data : []);
          fetchedOnceRef.current = true;
        }
      } catch (e: any) {
        if (!ac.signal.aborted) console.error('sideNav fetch failed', e);
      }
    })();

    return () => ac.abort();
  }, [session?.user]);

  const menuItems: MenuItem[] = useMemo(() => {
    if (!rawNav || !role) return [];

    const formatted: MenuItem[] = rawNav.flatMap((item: any) => {
      const subs = Array.isArray(item.SUB_NAME) ? item.SUB_NAME : [];
      const match = subs.find(
        (s: any) => String(s.role ?? '').trim().toUpperCase() === role.trim().toUpperCase()
      );
      if (!match) return [];

      const bookmarks = Array.isArray(match.bookmarks) ? match.bookmarks : [];

      return bookmarks.map((bm: any) => {
        const mainKey = `${item.ID}-${bm.key}`;
        const main: MenuItem = {
          key: mainKey,
          icon: getAntdIcon(bm.icon),
          label: bm.label,
          link: safePath(bm.link),
        };

        if (Array.isArray(bm.children) && bm.children.length) {
          main.children = bm.children.map((ch: any) => ({
            key: `${mainKey}-${ch.key}`,
            label: ch.label,
            link: safePath(ch.link),
          }));
        }
        return main;
      });
    });

    if (role.trim().toUpperCase() === 'STU') {
      const dashIdx = formatted.findIndex(
        (mi) => (mi.label || '').trim().toLowerCase() === 'dashboard'
      );

      const myLearningLabel: MenuItem = {
        key: 'synthetic-my-learning-label',
        label: '─── MY LEARNING ───',
        isLabelOnly: true,
      };

      if (dashIdx >= 0) formatted.splice(dashIdx + 1, 0, myLearningLabel);
      else formatted.unshift(myLearningLabel);
    }

    return formatted;
  }, [rawNav, role]);

  const hasChildren = (item: MenuItem) => !!item.children?.length;
  const isActive = (href?: string) =>
    !!href && (pathname === href || pathname.startsWith(`${href}/`));

  // NEW: parent click handler
  const onParentClick = (item: MenuItem) => {
    const canToggle = hasChildren(item);

    // If parent has NO children, navigate to its link (if any)
    if (!canToggle) {
      if (item.link) router.push(item.link);
      return;
    }

    // If parent HAS children:
    // - In collapsed mode: do nothing on click (hover shows flyout)
    if (collapsed) return;

    // - In expanded mode: toggle open/close only (no navigation)
    setOpenKeys((curr) =>
      curr.includes(item.key) ? curr.filter((k) => k !== item.key) : [...curr, item.key]
    );
  };

  const onLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } finally {
      const base = process.env.NEXT_PUBLIC_BASE_URL || '';
      const loginUrl = `${base.replace(/\/$/, '')}/login`;
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
              src={leftNavCollapseLogo || '/TIME_Logo_Square.svg'}
              alt="logo small"
              preview={false}
              style={{ width: 48, height: 48 }}
            />
          )
        ) : (
          <Image
            src={leftNavLogo || '/TIME_Logo_Square.svg'}
            alt="logo"
            preview={false}
            style={{ width: 160, height: 'auto' }}
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

          // Flyout content for collapsed mode
          const flyout =
            canToggle && collapsed ? (
              <div className={styles.flyout}>
                <ul className={styles.flyoutList} role="list">
                  {item.children!.map((child) => {
                    const active = isActive(child.link);
                    return (
                      <li key={child.key} className={styles.flyoutItem}>
                        {child.link ? (
                          <Link href={child.link} className={styles.flyoutLink}>
                            <span className={styles.flyoutDot} aria-hidden />
                            <span className={styles.flyoutText}>{child.label}</span>
                          </Link>
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
              className={`${styles.groupHeader} ${parentActive ? styles.groupHeaderActive : ''}`}
              onClick={() => onParentClick(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onParentClick(item);
                }
              }}
              aria-expanded={canToggle ? open : undefined}
              aria-controls={canToggle ? `sect-${item.key}` : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.groupLabel}>{item.label}</span>
              {canToggle ? (
                <span
                  className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
                  aria-hidden
                />
              ) : null}
            </button>
          );

          return (
            <div key={item.key} className={styles.group} data-open={open} data-collapsed={collapsed}>
              {/* Collapsed + children => show tooltip flyout on hover */}
              {collapsed && canToggle ? (
                <Tooltip
                  placement="right"
                  classNames={{ root: styles.lightTooltip }}
                  title={flyout}
                  mouseEnterDelay={0.08}
                  destroyOnHidden
                >
                  <div>{headerBtn}</div>
                </Tooltip>
              ) : (
                <>
                  {headerBtn}
                  {canToggle && (
                    <ul id={`sect-${item.key}`} className={styles.childList} data-open={open} role="list">
                      {item.children!.map((child) => {
                        const active = isActive(child.link);
                        return (
                          <li key={child.key} className={styles.childItem}>
                            {child.link ? (
                              <Link
                                href={child.link}
                                className={`${styles.childLink} ${active ? styles.childLinkActive : ''}`}
                              >
                                <span className={`${styles.dot} ${active ? styles.dotActive : ''}`} aria-hidden />
                                <span className={styles.childText}>{child.label}</span>
                              </Link>
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

      {/* Footer */}
      {collapsed ? (
        <Tooltip placement="right" title={displayName}>
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
    </Sider>
  );
}
  