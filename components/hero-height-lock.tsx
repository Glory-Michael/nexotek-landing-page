'use client';

import { useEffect } from 'react';

/**
 * Pins the hero-wrapper height to a JS-measured pixel value via the
 * `--nx-hero-h` CSS variable. iOS Safari's bar-collapse animation causes
 * `svh`/`dvh`/`vh` units to flex even when the spec says they shouldn't,
 * which makes the WebGL hero scene visibly shrink/expand mid-scroll.
 *
 * Strategy: measure once on mount, then only re-measure when the viewport
 * WIDTH changes (or on `orientationchange`). Pure height deltas — which is
 * what the Safari bar collapse looks like — are ignored.
 *
 * SSR fallback: the wrapper still ships `h-[calc(100svh-100px)]` as a
 * default; this hook just overrides it with a stable pixel value once
 * hydrated.
 */
export function HeroHeightLock({ offsetPx = 100 }: { offsetPx?: number }) {
  useEffect(() => {
    const root = document.documentElement;
    let lastWidth = window.innerWidth;

    const apply = () => {
      const h = Math.max(0, window.innerHeight - offsetPx);
      root.style.setProperty('--nx-hero-h', `${h}px`);
    };

    apply();

    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      apply();
    };

    const onOrientation = () => {
      lastWidth = window.innerWidth;
      apply();
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrientation);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrientation);
      root.style.removeProperty('--nx-hero-h');
    };
  }, [offsetPx]);

  return null;
}
