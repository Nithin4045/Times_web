'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import TopNav from '@/components/common/topnav';
import LeftNav from '@/components/common/leftnav';
import Footer from '@/components/common/Footer';

const TOPBAR_HEIGHT = 56;
const COLLAPSED_WIDTH = 76;
const EXPANDED_WIDTH = 236;
const FOOTER_HEIGHT = 56;

export default function ClientLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem('collapse');
    if (saved !== null) setCollapsed(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem('collapse', JSON.stringify(collapsed));
  }, [collapsed]);

  const isLoginPage =
    pathname === '/login' ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/en/login') ||
    pathname?.startsWith('/te/login') ||
    pathname?.startsWith('/hin/login') ||
    pathname?.startsWith('/tam/login') ||
    pathname?.startsWith('/codecompiler/learn') ||
    pathname?.startsWith('/codecompiler/previewquestion') ||
    pathname?.startsWith('/codecompiler/view-code') ||
    pathname?.startsWith('/codecompiler/evaluate') ||
    pathname?.startsWith('/evaluate/exam') ||
    pathname?.startsWith('/interview/Camera');

  const isLeftNavDisabled = pathname?.startsWith('/interview/Camera') ?? false;

  if (isLoginPage) return <>{children}</>;

  const siderWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  const contentOffset = isLeftNavDisabled ? 0 : siderWidth;

  return (
    <>
      {!isLeftNavDisabled && <LeftNav collapsed={collapsed} />}

      <TopNav
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        username=""
        Photo=""
        logout={() => {}}
        isLeftNavDisabled={!!isLeftNavDisabled}
      />

      <div
        id="app-shell"
        style={{
          position: 'fixed',
          top: TOPBAR_HEIGHT,
          left: contentOffset,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#e6ebee',
          transition: 'left 200ms ease',
        }}
      >
        <div
          id="app-content"
          className="hide-scrollbar"
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px 0 24px',
            paddingBottom: `${FOOTER_HEIGHT + 24}px`,
            width: 'calc(100% - 48px)',
            margin: '0 24px',
          }}
        >
          <main style={{ minWidth: 0 }}>{children}</main>
        </div>

        <Footer collapsed={collapsed} isLeftNavDisabled={!!isLeftNavDisabled} />
      </div>
    </>
  );
}

