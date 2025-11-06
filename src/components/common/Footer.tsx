'use client';

import styles from '@/assets/styles/class/footer.module.css';
import React, { useEffect, useMemo } from 'react';
import { commonStore } from '@/store/common/common';
import footerimg from '@/assets/images/dashboard/footerimage.gif';

interface FooterProps {
  collapsed?: boolean;
  isLeftNavDisabled?: boolean;
}

export default function Footer({ collapsed = true, isLeftNavDisabled = false }: FooterProps) {
  const { settingsData, footerName, setfooterName } = commonStore();

  // Parse settings JSON once per change
  const settings = useMemo(() => {
    const raw = settingsData?.[0]?.SETTINGS_JSON;
    if (!raw) return null;
    try {
      const sanitized = String(raw)
        .replace(/'/g, '"')
        .replace(/(\b\w+)\s*:/g, '"$1":');
      return JSON.parse(sanitized);
    } catch {
      return null;
    }
  }, [settingsData]);

  useEffect(() => {
    if (settings?.footer_text) {
      setfooterName(String(settings.footer_text));
    }
  }, [settings, setfooterName]);

  const footerVisible = Boolean(settings?.footerVisible);
  // Only use `startsWith` if value is a non-empty string
  const leftNavLogo = typeof settings?.left_nav_logo === 'string' && settings.left_nav_logo.length > 0
    ? (settings.left_nav_logo.startsWith('/') ? settings.left_nav_logo : `/${settings.left_nav_logo}`)
    : undefined;

  return (
    <div
      className={styles.footer}
      style={{ left: isLeftNavDisabled ? "0" : collapsed ? "76px" : "236px" }}
    >
      <div className={styles.inner}>
        <h3 className={styles.text}>Copyright©{new Date().getFullYear()} Advanced Eduational Activities Pvt.Ltd.All rights reserved</h3>
        {footerVisible && (
          <img
            src={footerimg.src}
            alt="footer"
            width={100}
            height={50}
            style={{ marginRight: '15px' }}
          />
        )}
      </div>
    </div>
  );
}
