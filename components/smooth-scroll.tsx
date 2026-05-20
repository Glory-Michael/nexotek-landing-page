'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Lenis smooth scroll for non-touch devices only.
 *
 * Touch devices (iOS / Android / iPadOS in tablet mode) get native
 * momentum scrolling — overriding it is the dominant source of
 * perceived input lag on mobile.
 *
 * On Mac trackpads Lenis still adds ~1 frame of latency vs raw native,
 * but in exchange you get the "weighted startup-website" scroll feel
 * (exponential ease-out, sub-pixel motion, velocity-smoothed wheel
 * deltas). That tradeoff is intentional.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.35,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      lerp: 0.085,
      wheelMultiplier: 0.95,
      smoothWheel: true,
    });

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
