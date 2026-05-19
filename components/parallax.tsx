'use client';

import { useEffect, useRef } from 'react';

type ProbeProps = {
  /**
   * When provided, vars are written to the element matching this id.
   * Otherwise vars are written to the closest ancestor `<section>`.
   */
  targetId?: string;
};

function resolveTarget(probe: HTMLElement | null, targetId?: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  if (targetId) return document.getElementById(targetId);
  return (probe?.closest('section') as HTMLElement | null) ?? null;
}

/**
 * Pointer-tracked CSS variables on the parent section (or `targetId` element).
 * Writes `--nx-mx` and `--nx-my` in the range [-1, 1]. Consumers read these
 * via inline `transform: translate3d(calc(var(--nx-mx, 0) * Xpx), ...)`.
 *
 * Smoothed with a low-pass lerp inside rAF. Gated by prefers-reduced-motion.
 */
export function PointerVars({ targetId }: ProbeProps = {}) {
  const probeRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = resolveTarget(probeRef.current as HTMLElement | null, targetId);
    if (!el) return;

    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let currX = 0;
    let currY = 0;
    let active = false;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      active = true;
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const tick = () => {
      if (active) {
        currX += (targetX - currX) * 0.08;
        currY += (targetY - currY) * 0.08;
        el.style.setProperty('--nx-mx', currX.toFixed(3));
        el.style.setProperty('--nx-my', currY.toFixed(3));
        if (
          targetX === 0 &&
          targetY === 0 &&
          Math.abs(currX) < 0.003 &&
          Math.abs(currY) < 0.003
        ) {
          el.style.setProperty('--nx-mx', '0');
          el.style.setProperty('--nx-my', '0');
          active = false;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.style.removeProperty('--nx-mx');
      el.style.removeProperty('--nx-my');
    };
  }, [targetId]);

  return <span ref={probeRef} aria-hidden className="hidden" />;
}

type ScrollProbeProps = ProbeProps & {
  /** Max translateY in px applied at section edge of viewport. Default 60. */
  intensity?: number;
};

/**
 * Scroll-driven CSS variable on the parent section (or `targetId` element).
 * Writes `--nx-sy` in pixels (string), reaching ±intensity at section edges
 * relative to the viewport center. Consumers read this via inline
 * `transform: translate3d(0, var(--nx-sy, 0px), 0)`.
 *
 * Gated by prefers-reduced-motion.
 */
export function ScrollParallax({ targetId, intensity = 60 }: ScrollProbeProps = {}) {
  const probeRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = resolveTarget(probeRef.current as HTMLElement | null, targetId);
    if (!el) return;

    let rafId = 0;
    let scheduled = false;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const denom = (viewportH + rect.height) / 2;
      const center = rect.top + rect.height / 2;
      const progress = denom > 0 ? (center - viewportH / 2) / denom : 0;
      const clamped = Math.max(-1, Math.min(1, progress));
      const y = -clamped * intensity;
      el.style.setProperty('--nx-sy', `${y.toFixed(2)}px`);
    };

    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      rafId = requestAnimationFrame(() => {
        scheduled = false;
        update();
      });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      el.style.removeProperty('--nx-sy');
    };
  }, [targetId, intensity]);

  return <span ref={probeRef} aria-hidden className="hidden" />;
}
