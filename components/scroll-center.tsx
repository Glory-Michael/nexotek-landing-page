'use client';

import { useEffect } from 'react';

export function ScrollCenter() {
  useEffect(() => {
    const el = document.querySelector('.site-main') as HTMLElement | null;
    if (!el) return;
    const overflow = el.scrollHeight - el.clientHeight;
    if (overflow > 0) el.scrollTop = overflow / 2;
  }, []);
  return null;
}
