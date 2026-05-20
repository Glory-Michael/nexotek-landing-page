'use client';

import { useEffect } from 'react';

/**
 * Minimal wheel-smoothed scroll. Replaces Lenis with ~50 lines.
 *
 * Behavior:
 * - Bails entirely on (pointer: coarse) — touch devices get native iOS /
 *   Android momentum. Overriding it is the dominant source of perceived
 *   input lag on mobile.
 * - Bails on (prefers-reduced-motion: reduce).
 * - Normalizes wheel deltaMode (Firefox can fire DOM_DELTA_LINE which
 *   would otherwise feel near-frozen).
 * - Uses a high-LERP convergence (0.22) for a snappy front of motion
 *   that matches Lenis's exponential ease-out feel — much faster initial
 *   response than 0.085-style lerps.
 * - Drops native scroll behavior path so wheel deltas accumulate into a
 *   single moving target. Anchor jumps, scrollbar drags, keyboard,
 *   programmatic scrollTo fall through to native because they fire
 *   `scroll` events, not `wheel`.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const LERP = 0.22;
    const EPSILON = 0.4;
    const WHEEL_MULTIPLIER = 1.0;

    // Conventional line-height fallback used by browsers for deltaMode=1.
    const LINE_HEIGHT = 16;

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let rafId: number | null = null;

    const getMax = () =>
      document.documentElement.scrollHeight - window.innerHeight;

    const tick = () => {
      const delta = targetY - currentY;
      if (Math.abs(delta) < EPSILON) {
        currentY = targetY;
        window.scrollTo(0, currentY);
        rafId = null;
        return;
      }
      currentY += delta * LERP;
      window.scrollTo(0, currentY);
      rafId = requestAnimationFrame(tick);
    };

    const normalizeDelta = (e: WheelEvent): number => {
      if (e.deltaMode === 1) return e.deltaY * LINE_HEIGHT;
      if (e.deltaMode === 2) return e.deltaY * window.innerHeight;
      return e.deltaY;
    };

    const onWheel = (e: WheelEvent) => {
      // Pinch zoom / browser shortcuts — never intercept.
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      targetY = Math.max(
        0,
        Math.min(getMax(), targetY + normalizeDelta(e) * WHEEL_MULTIPLIER),
      );
      if (rafId === null) rafId = requestAnimationFrame(tick);
    };

    // Sync target when scroll comes from a non-wheel source (anchor jump,
    // scrollbar drag, keyboard, programmatic scrollTo from app code).
    const onScroll = () => {
      if (rafId === null) {
        targetY = window.scrollY;
        currentY = window.scrollY;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
