'use client';

import { useEffect, useState } from 'react';

// Rotating placeholder examples — implies the palette searches across
// many entity types. Cycles every ~3s; pauses for prefers-reduced-motion.
const PLACEHOLDERS = [
  'incidents · cameras · sites',
  'cam 03 · lift zone',
  'workers in zone b',
  'incident #1247',
  'site atlas · floor 02',
];

function usePlaceholderCycle(): string {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setI((v) => (v + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, []);
  return PLACEHOLDERS[i];
}

interface CommandPalettePeekProps {
  className?: string;
}

export function CommandPalettePeek({ className }: CommandPalettePeekProps) {
  const placeholder = usePlaceholderCycle();
  return (
    <div
      aria-hidden
      className={`pointer-events-none select-none ${className ?? ''}`}
    >
      <div className="border-2 border-black bg-white/95 px-2 py-1.5 shadow-[0_12px_28px_-12px_rgba(0,0,0,0.5)] backdrop-blur-sm dark:border-white/85 dark:bg-neutral-950/90">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 16 16"
            className="h-3 w-3 shrink-0 text-neutral-600 dark:text-neutral-300"
            aria-hidden
          >
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-700 dark:text-neutral-300">
            {placeholder}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-neutral-700 dark:text-neutral-300">
            <kbd className="border border-black/40 bg-white px-1 py-px dark:border-white/40 dark:bg-neutral-800">⌘</kbd>
            <kbd className="border border-black/40 bg-white px-1 py-px dark:border-white/40 dark:bg-neutral-800">K</kbd>
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between border-t border-black/15 pt-1 font-mono text-[8px] uppercase tracking-[0.22em] text-neutral-500 dark:border-white/15 dark:text-neutral-500">
          <span>QUICK NAV</span>
          <span className="flex items-center gap-1">
            <span className="relative inline-flex h-1 w-1">
              <span className="absolute inset-0 rounded-full bg-emerald-500 nx-pulse-dot" />
              <span className="relative inline-block h-1 w-1 rounded-full bg-emerald-500" />
            </span>
            CONNECTED
          </span>
        </div>
      </div>
    </div>
  );
}
