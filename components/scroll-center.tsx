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

    // orientationchange fires before layout is done; wait for the next resize
    // event which signals the browser has finished reflowing the new dimensions.
    const onOrientationChange = () => {
      const onResize = () => {
        globalThis.removeEventListener('resize', onResize);
        center();
      };
      globalThis.addEventListener('resize', onResize);
    };
    globalThis.addEventListener('orientationchange', onOrientationChange);
    return () => globalThis.removeEventListener('orientationchange', onOrientationChange);
  }, []);
  return null;
}
