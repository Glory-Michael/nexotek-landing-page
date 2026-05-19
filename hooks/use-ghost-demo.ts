'use client';

import { useEffect, useState, type RefObject } from 'react';

const STORAGE_PREFIX = 'nx-ghost-demo:';

/**
 * Fires `true` exactly once, the first time the observed element enters the
 * viewport on a mobile device. Persists in localStorage under
 * `nx-ghost-demo:<key>` so the demo never replays on the same device.
 *
 * The demo behaviour (what to animate, for how long) is the caller's
 * responsibility — this hook only signals *when* to play. Caller wires the
 * boolean into its own `setTimeout` choreography.
 *
 * Returns `false` on: SSR, desktop (md+), reduced-motion preference, or
 * already-demoed device.
 */
export function useGhostDemo(
  ref: RefObject<Element | null>,
  storageKey: string,
): boolean {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(min-width: 768px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const key = STORAGE_PREFIX + storageKey;
    try {
      if (window.localStorage.getItem(key) === '1') return;
    } catch {
      // Storage may throw in privacy modes — proceed without persistence.
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setPlay(true);
        try {
          window.localStorage.setItem(key, '1');
        } catch {
          // ignore
        }
        obs.disconnect();
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, storageKey]);

  return play;
}
