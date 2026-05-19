'use client';

import { useSyncExternalStore } from 'react';

const DEFAULT_QUERY = '(max-width: 767px)';

function subscribe(query: string) {
  return (cb: () => void) => {
    if (typeof window === 'undefined') return () => undefined;
    const mq = window.matchMedia(query);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  };
}

function getSnapshot(query: string) {
  return () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Returns true when the viewport matches the given media query.
 * Defaults to the Tailwind `md` breakpoint boundary (`max-width: 767px`).
 *
 * Use to gate desktop-only layouts that don't reflow well below `md`,
 * mirroring the `useReducedMotion` opt-out path.
 */
export function useNarrowViewport(query: string = DEFAULT_QUERY): boolean {
  return useSyncExternalStore(
    subscribe(query),
    getSnapshot(query),
    getServerSnapshot,
  );
}
