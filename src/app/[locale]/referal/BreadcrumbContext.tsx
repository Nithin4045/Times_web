'use client';

import React, { createContext, useContext, useEffect } from 'react';

export type BCContextType = {
  text: string;
  setText: (v: string) => void;
};

export const BreadcrumbCtx = createContext<BCContextType | null>(null);

/** Hook pages can use to update/read the breadcrumb text */
export function useBreadcrumb() {
  const ctx = useContext(BreadcrumbCtx);
  if (!ctx) throw new Error('useBreadcrumb must be used inside referal/layout');
  return ctx;
}

/** Mount this in a page to set the breadcrumb text */
export function SetBreadcrumb({ text }: { text: string }) {
  const { setText } = useBreadcrumb();
  useEffect(() => setText(text), [text, setText]);
  return null;
}
