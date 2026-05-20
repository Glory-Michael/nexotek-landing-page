'use client';

import { useEffect } from 'react';

/**
 * Pins viewport-derived heights to JS-measured pixel values so iOS Safari's
 * bar-collapse animation can't shift section heights mid-scroll. Publishes
 * two CSS variables on `<html>`:
 *
 *   --nx-svh    : stable equivalent of 100svh (window.innerHeight in px)
 *   --nx-hero-h : stable equivalent of (100svh - offsetPx)
 *
 * iOS Safari relayouts `svh`/`dvh`/`vh` units during the bar transition
 * even though the spec implies `svh` should be locked — sticky sections
 * sized in `100svh` visibly shrink/expand each time the bottom bar shows
 * or hides. This component measures once on mount and only re-measures
 * when the viewport WIDTH changes (or on `orientationchange`). Pure
 * height deltas — which is what the bar collapse looks like — are ignored.
 *
 * SSR fallback: callers should use `var(--nx-svh, 100svh)` so the first
 * paint has a sensible value until JS hydrates and pins the pixel value.
 */
export function HeroHeightLock({ offsetPx = 100 }: { offsetPx?: number }) {
  useEffect(() => {
    const root = document.documentElement;
    let lastWidth = window.innerWidth;

    const apply = () => {
      const h = Math.max(0, window.innerHeight);
      root.style.setProperty('--nx-svh', `${h}px`);
      root.style.setProperty('--nx-hero-h', `${Math.max(0, h - offsetPx)}px`);
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
      root.style.removeProperty('--nx-svh');
      root.style.removeProperty('--nx-hero-h');
    };
  }, [offsetPx]);

  return null;
}
