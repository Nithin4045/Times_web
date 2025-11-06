'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React, { useState } from 'react';
import styles from './layout.module.css';

// IMPORTANT: only *import* the context here;
// do not re-export hooks from this file.
import { BreadcrumbCtx } from './BreadcrumbContext';

export default function ReferalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [text, setText] = useState<string>('');
  const router = useRouter();
  const pathname = usePathname();

  // With [locale] in the route, pathname will be like: /en/referal
  // Use endsWith so it works for all locales.
  const isReferalIndex = pathname?.endsWith('/referal');

  // Skip wrapper on the referal index page
  if (isReferalIndex) {
    return <>{children}</>;
  }

  return (
    <BreadcrumbCtx.Provider value={{ text, setText }}>
      <div className={styles.wrap}>
        {/* Top bar */}
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <Link href="/referal" className={styles.breadLink}>
              Refer a Friend
            </Link>
            {text && (
              <>
                <span className={styles.sep}> | </span>
                <span className={styles.breadCurrent}>{text}</span>
              </>
            )}
          </div>

          <Button
            type="default"
            className={styles.backBtn}
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </BreadcrumbCtx.Provider>
  );
}
