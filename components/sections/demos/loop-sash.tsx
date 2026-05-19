'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface LoopSashProps {
  /** Text to render. `{n}` is replaced with the live cycle counter. */
  text: string;
  revolutionMs?: number;
  startingCycle?: number;
  /** Surface to render on — affects color. */
  surface?: 'paper' | 'ink';
  /** Embedded inside another container — drops the band bg + top hairline so
   *  the sash reads as a footer of the surrounding surface, not its own strip. */
  embedded?: boolean;
  className?: string;
  /** External cycle counter. When provided, the sash mirrors this value
   *  instead of computing it from its own mount-time RAF — used to keep the
   *  sash in lock-step with a parent's loop animation. */
  cycle?: number;
  /** External phase (0-1) for the progress bar. Pairs with `cycle`. */
  phase?: number;
}

const HAIRLINE = 'border-t-2 border-b';

export function LoopSash({
  text,
  revolutionMs = 24000,
  startingCycle = 42,
  surface = 'paper',
  embedded = false,
  className = '',
  cycle: cycleProp,
  phase: phaseProp,
}: LoopSashProps) {
  const isControlled = cycleProp !== undefined && phaseProp !== undefined;

  // Deterministic cycle counter: cycles since component mount + baseline.
  const [mountAt] = useState<number>(() =>
    typeof performance !== 'undefined' ? performance.now() : 0,
  );
  const [now, setNow] = useState<number>(mountAt);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || isControlled) return;
    let raf = 0;
    const tick = () => {
      setNow(performance.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, isControlled]);

  const elapsed = Math.max(0, now - mountAt);
  const cycle = cycleProp ?? startingCycle + Math.floor(elapsed / revolutionMs);
  const phase = phaseProp ?? (elapsed % revolutionMs) / revolutionMs;
  const rendered = text.replace(/\{n\}/g, String(cycle).padStart(3, '0'));

  const surfaceClass = embedded
    ? 'text-current border-t border-current/20'
    : surface === 'ink'
      ? `bg-nx-black text-white ${HAIRLINE} border-white/60`
      : `bg-nx-paper text-nx-ink dark:bg-nx-black dark:text-white ${HAIRLINE} border-black/45 dark:border-white/30`;

  return (
    <div
      role="status"
      aria-live="off"
      className={`relative w-full overflow-hidden ${surfaceClass} ${className}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.24em] md:px-12">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: '#3DB46D' }}
          />
          {rendered}
        </span>
        <span aria-hidden className="hidden md:inline opacity-60">
          ON-PREM · 9 STREAMS · NOMINAL
        </span>
      </div>
      {!reduced && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-[3px] bg-current/40"
          style={{ width: `${Math.round(phase * 100)}%`, transition: 'width 120ms linear' }}
        />
      )}
    </div>
  );
}
