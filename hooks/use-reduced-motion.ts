'use client';

import { useEffect, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'nx-motion-pref';
const EVENT = 'nx-motion-change';

type MotionPref = 'full' | 'reduced' | 'auto';

function readPref(): MotionPref {
  if (typeof window === 'undefined') return 'auto';
  const v = window.localStorage?.getItem(STORAGE_KEY);
  return v === 'full' || v === 'reduced' ? v : 'auto';
}

function isReduced(pref: MotionPref): boolean {
  if (pref === 'reduced') return true;
  if (pref === 'full') return false;
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function emit(): void {
  window.dispatchEvent(new Event(EVENT));
  document.documentElement.dataset.motion = isReduced(readPref()) ? 'reduced' : 'full';
}

export function setMotionPreference(pref: MotionPref): void {
  if (typeof window === 'undefined') return;
  if (pref === 'auto') window.localStorage?.removeItem(STORAGE_KEY);
  else window.localStorage?.setItem(STORAGE_KEY, pref);
  emit();
}

export function getMotionPreference(): MotionPref {
  return readPref();
}

function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const onChange = () => cb();
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
    mq.removeEventListener('change', onChange);
  };
}

function getSnapshot(): boolean {
  return isReduced(readPref());
}

function getServerSnapshot(): boolean {
  return false; // SSR: assume full motion (matches what client renders before hydration)
}

/**
 * Returns true if the user wants reduced motion.
 *
 * Priority:
 *   1. Visitor-set preference (localStorage `nx-motion-pref`) — full | reduced
 *   2. System preference (`prefers-reduced-motion: reduce`)
 *
 * Updates when the user toggles via `setMotionPreference()`, when the system
 * preference changes, or when another tab updates localStorage.
 */
export function useReducedMotion(): boolean {
  const reduced = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Keep `data-motion` attribute on <html> in sync. Useful for CSS hooks like
  // `html[data-motion="reduced"] .nx-animated { animation: none; }`.
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  }, [reduced]);

  return reduced;
}
