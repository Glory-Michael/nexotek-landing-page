'use client';

import { useEffect, useState } from 'react';

/**
 * 1:1 recreation of camect's SwipeDeck — Tinder-style alert-review card.
 * 3 cards stacked behind the front card; front card shows the alert clip
 * with a progress bar and "Looping" chip. Auto-swipes right (confirm) or
 * left (dismiss) every ~3s and replays.
 *
 * Used as the DETECT-phase mockup inside the LoopSequence section.
 */

interface SwipeAlert {
  id: number;
  cam: string;
  label: string;
  conf: string;
}

const ALERTS: SwipeAlert[] = [
  { id: 1, cam: 'CAM 03 · LIFT',     label: 'WORKER', conf: '0.94' },
  { id: 2, cam: 'CAM 07 · SCAFFOLD', label: 'PPE-OFF', conf: '0.88' },
  { id: 3, cam: 'CAM 11 · DOCK',     label: 'VEHICLE', conf: '0.78' },
  { id: 4, cam: 'CAM 04 · YARD',     label: 'LOAD', conf: '0.82' },
];

export function SwipeDeckPeek({ className }: { className?: string }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'review' | 'swiping-right' | 'swiping-left'>('enter');
  const [progress, setProgress] = useState(0);

  // Card cycle: enter → review (with progress bar filling) → swipe → next card
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setPhase('review');
      setProgress(50);
      return;
    }

    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        // Enter phase
        setPhase('enter');
        setProgress(0);
        await wait(380);
        if (cancelled) return;

        // Review phase — progress bar fills 0 → 100
        setPhase('review');
        const start = performance.now();
        const reviewMs = 2200;
        await new Promise<void>((resolve) => {
          const step = (t: number) => {
            if (cancelled) return resolve();
            const p = Math.min(100, ((t - start) / reviewMs) * 100);
            setProgress(p);
            if (p < 100) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        });
        if (cancelled) return;

        // Swipe phase — alternate right/left based on idx
        const dir = (idx % 2 === 0 ? 'swiping-right' : 'swiping-left') as
          | 'swiping-right'
          | 'swiping-left';
        setPhase(dir);
        await wait(520);
        if (cancelled) return;

        // Advance to next card
        setIdx((i) => (i + 1) % ALERTS.length);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [idx]);

  const alert = ALERTS[idx];
  const isSwipingRight = phase === 'swiping-right';
  const isSwipingLeft = phase === 'swiping-left';

  return (
    <div className={`relative mx-auto w-full max-w-[260px] ${className ?? ''}`}>
      {/* Back cards — stacked behind */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-2 right-2 top-0 z-0 scale-[0.965] rounded-2xl border border-slate-800 bg-slate-900/40 opacity-50"
        style={{ aspectRatio: '16 / 9' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-2 right-2 top-1.5 z-0 scale-[0.985] rounded-2xl border border-slate-800 bg-slate-900/60 opacity-85"
        style={{ aspectRatio: '16 / 9' }}
      />

      {/* Front (active) card */}
      <div
        key={alert.id}
        className="relative z-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 transition-all duration-500"
        style={{
          aspectRatio: '16 / 9',
          transform: isSwipingRight
            ? 'translateX(140%) rotate(15deg)'
            : isSwipingLeft
              ? 'translateX(-140%) rotate(-15deg)'
              : 'translateX(0) rotate(0)',
          opacity: phase === 'enter' ? 0 : isSwipingRight || isSwipingLeft ? 0 : 1,
        }}
      >
        {/* Faux video frame */}
        <div className="absolute inset-0 bg-slate-900">
          <div
            aria-hidden
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
              backgroundSize: '10px 10px',
            }}
          />
          {/* Floor */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
            <path d="M0 68 L100 68 L100 100 L0 100Z" fill="#0f172a" opacity={0.7} />
            <line x1="0" y1="68" x2="100" y2="68" stroke="#1e293b" strokeWidth="0.5" />
          </svg>
          {/* Subject silhouette + bbox */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden>
            <ellipse cx="50" cy="40" rx="5" ry="6" fill="#475569" />
            <path d="M 42 50 L 58 50 L 55 72 L 45 72 Z" fill="#475569" />
            <rect x="44" y="72" width="4" height="18" fill="#475569" />
            <rect x="52" y="72" width="4" height="18" fill="#475569" />
            <path d="M 45 36 A 5 3 0 0 1 55 36" fill="#facc15" />
            <rect x="36" y="32" width="28" height="60" fill="none" stroke="#f87171" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Progress bar at top */}
        <div className="absolute inset-x-0 top-0 z-20 h-0.5 bg-white/15">
          <div
            className="h-full bg-indigo-400 transition-[width]"
            style={{ width: `${progress}%`, transitionDuration: '100ms' }}
          />
        </div>

        {/* "Looping" chip top-left */}
        <div className="pointer-events-none absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-indigo-500/90 px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wider text-white">
          <svg viewBox="0 0 10 10" className="h-2 w-2" aria-hidden>
            <path d="M2 4 A 3 3 0 0 1 8 4 M 8 4 L 6 2 M 8 4 L 10 2" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          LOOPING
        </div>

        {/* Restart button top-right */}
        <button
          type="button"
          aria-label="Restart clip"
          className="pointer-events-none absolute right-2 top-2 z-20 rounded-full bg-slate-900/80 p-1 text-slate-200 backdrop-blur-sm"
        >
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
            <path d="M3 3 L3 6 L6 6 M3 6 A 3 3 0 1 0 6 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Bottom label */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-t from-slate-950 to-transparent px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider">
          <span className="truncate text-slate-200">{alert.cam}</span>
          <span className="shrink-0 rounded border border-red-500/40 bg-red-500/15 px-1.5 py-0.5 text-red-300">
            {alert.label} · {alert.conf}
          </span>
        </div>
      </div>

      {/* Swipe indicator overlay */}
      {(isSwipingRight || isSwipingLeft) && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-1 z-30 flex items-center justify-center rounded-2xl"
          style={{
            aspectRatio: '16 / 9',
            background: isSwipingRight ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)',
            border: `2px solid ${isSwipingRight ? 'rgba(16,185,129,0.6)' : 'rgba(244,63,94,0.6)'}`,
          }}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-xl ${
              isSwipingRight ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'
            }`}
          >
            <svg viewBox="0 0 16 16" className="h-5 w-5" aria-hidden>
              {isSwipingRight ? (
                <path d="M3 8 L7 12 L13 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 4 L12 12 M12 4 L4 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              )}
            </svg>
          </div>
        </div>
      )}

      {/* Caption beneath the deck */}
      <p className="mt-2 text-center font-mono text-[8px] uppercase tracking-wider text-current/55">
        ▸ SWIPE · CONFIRM (→) · DISMISS (←)
      </p>
    </div>
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
