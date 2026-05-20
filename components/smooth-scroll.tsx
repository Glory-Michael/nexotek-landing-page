'use client';

import { useEffect } from 'react';

/**
 * Minimal wheel-lerp smooth scroll. Replaces Lenis (~10KB) with ~30 lines.
 *
 * Active only on devices that are NOT touch and NOT reduced-motion. Touch
 * devices get native momentum scrolling — overriding it is the single
 * biggest source of perceived input lag on iOS Safari.
 *
 * Anchor jumps, scrollbar drags, keyboard scrolling, and programmatic
 * scrollTo all fall through to native because they fire scroll events
 * (not wheel events). The lerp only kicks in when the user spins the
 * mouse wheel.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const LERP = 0.14;
    const EPSILON = 0.5;

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let rafId: number | null = null;

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

    const hasNestedScroll = (target: EventTarget | null): boolean => {
      let el = target as HTMLElement | null;
      while (el && el !== document.body && el !== document.documentElement) {
        const style = getComputedStyle(el);
        if (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight
        ) {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      if (hasNestedScroll(e.target)) return;
      e.preventDefault();
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      targetY = Math.max(0, Math.min(max, targetY + e.deltaY));
      if (rafId === null) rafId = requestAnimationFrame(tick);
    };

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
