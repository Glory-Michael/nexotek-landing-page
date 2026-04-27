'use client';

import { useEffect } from 'react';

export function ScrollCenter() {
  useEffect(() => {
    const center = () => {
      const el = document.querySelector('.site-main') as HTMLElement | null;
      if (!el) return;
      const overflow = el.scrollHeight - el.clientHeight;
      if (overflow > 0) el.scrollTop = overflow / 2;
    };

    center();

    // iOS fires orientationchange before layout is finalized, so defer slightly
    const onOrientationChange = () => setTimeout(center, 100);
    window.addEventListener('orientationchange', onOrientationChange);
    return () => window.removeEventListener('orientationchange', onOrientationChange);
  }, []);
  return null;
}
