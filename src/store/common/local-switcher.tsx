'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { ChangeEvent, useTransition } from 'react';

export default function LocaleSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const localeActive = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;

    // Check if the current URL includes a locale
    const pathSegments = pathname.split('/');
    const hasLocale = pathSegments[1] === 'en' || pathSegments[1] === 'te' || pathSegments[1] === 'hin' || pathSegments[1] === 'tam';

    // Construct the new path
    const updatedPath = hasLocale
      ? `/${nextLocale}${pathname.replace(/^\/(en|te|hin|tam)/, '')}` // Replace existing locale
      : `/${nextLocale}${pathname}`; // Add locale to path

    // Retain search parameters
    const queryString = searchParams.toString();
    const updatedUrl = queryString ? `${updatedPath}?${queryString}` : updatedPath;

    startTransition(() => {
      router.replace(updatedUrl);
    });
  };

  return (
    <label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Globe Icon */}
        <span style={{ fontSize: '14px', color: '#fff' }}>🌐</span>

        {/* Language Selector */}
        <select
          value={localeActive} // Reflect the current locale
          onChange={onSelectChange}
          disabled={isPending}
          style={{
            color: '#fff',
            backgroundColor: '#244081',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '4px 6px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: isPending ? 'not-allowed' : 'pointer',
            outline: 'none',
            height: '28px',
          }}
        >
          <option value="en" style={{ color: '#fff' }}>English</option>
          {/* <option value="te" style={{ color: '#fff' }}>Telugu</option>
          <option value="hin" style={{ color: '#fff' }}>Hindi</option>
          <option value="tam" style={{ color: '#fff' }}>Tamil</option> */}
        </select>
      </div>
    </label>
  );
}