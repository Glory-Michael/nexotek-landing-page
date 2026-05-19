'use client';

import { useEffect, useState } from 'react';
import { SwipeDeckPeek } from './swipe-deck-peek';

// ── Mini phase mockups: thin horizontal strips that read as "the product
// view at this point in the loop." Each is keyed off the active phase label.

const DetectMockup: React.FC = () => {
  const [latest, setLatest] = useState(2);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setLatest((v) => (v + 1) % 9), 1800);
    return () => window.clearInterval(id);
  }, []);
  const rows = [
    { cam: 'CAM 03', label: 'WORKER', conf: '0.94', ago: `${latest}s`, lvl: 'alert' as const },
    { cam: 'CAM 07', label: 'PERSON', conf: '0.88', ago: '18s', lvl: 'detect' as const },
    { cam: 'CAM 11', label: 'VEHICLE', conf: '0.71', ago: '42s', lvl: 'detect' as const },
  ];
  return (
    <ol className="w-full space-y-1">
      {rows.map((r, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 border border-current/35 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
        >
          <span className="flex items-center gap-1.5 truncate">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span
                className={`absolute inset-0 rounded-full nx-pulse-dot ${
                  r.lvl === 'alert' ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />
              <span
                className={`relative inline-block h-1.5 w-1.5 rounded-full ${
                  r.lvl === 'alert' ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <span className="font-semibold">{r.cam}</span>
            <span className="text-current/55">·</span>
            <span>{r.label}</span>
            <span className="text-current/45">{r.conf}</span>
          </span>
          <span className="text-current/55 tabular-nums">{r.ago}</span>
        </li>
      ))}
    </ol>
  );
};

const ReconstructMockup: React.FC = () => {
  return (
    <div className="flex w-full items-center gap-3 border border-current/35 p-2">
      <svg viewBox="0 0 80 48" className="h-12 w-20 shrink-0 text-current/70" aria-hidden>
        <g fill="none" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.7">
          <rect x="8" y="10" width="64" height="32" />
          <line x1="8" y1="10" x2="20" y2="2" />
          <line x1="72" y1="10" x2="60" y2="2" />
          <line x1="20" y1="2" x2="60" y2="2" />
          <line x1="8" y1="42" x2="20" y2="34" strokeDasharray="1 1" />
          <line x1="72" y1="42" x2="60" y2="34" strokeDasharray="1 1" />
        </g>
        <g fill="currentColor">
          <rect x="38" y="24" width="4" height="4" />
          <rect x="18" y="14" width="2" height="2" />
          <rect x="58" y="14" width="2" height="2" />
        </g>
        <g fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5">
          <path d="M 19 15 L 36 26" />
          <path d="M 59 15 L 42 26" />
        </g>
      </svg>
      <div className="min-w-0 font-mono text-[10px] uppercase tracking-[0.18em]">
        <p className="font-semibold">SCENE · ZONE B</p>
        <p className="mt-0.5 text-current/55">MESH RESOLVED · 14.2k POINTS</p>
        <p className="mt-0.5 text-current/45">3 CAMERAS · 2 ANCHORED</p>
      </div>
    </div>
  );
};

const TrainMockup: React.FC = () => {
  const [pct, setPct] = useState(68);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setPct((v) => (v >= 92 ? 68 : v + 1));
    }, 350);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="w-full space-y-1.5 border border-current/35 p-2 font-mono text-[10px] uppercase tracking-[0.18em]">
      <div className="flex items-center justify-between">
        <span className="font-semibold">MODULE 04 · LIFT SAFETY</span>
        <span className="text-current/55">IACET CEU 0.4</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden border border-current/40 bg-current/5">
        <span
          className="absolute inset-y-0 left-0 bg-current/85 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-current/55">
        <span>
          <span className="tabular-nums text-current/85">{pct}%</span> CURRICULUM
        </span>
        <span className="tabular-nums">N = 2,431 WORKERS</span>
      </div>
    </div>
  );
};

const ConvergeMockup: React.FC = () => {
  const heights = [10, 14, 8, 16, 20, 28, 24, 18, 22, 30, 26, 32];
  return (
    <div className="w-full border border-current/35 p-2 font-mono text-[10px] uppercase tracking-[0.18em]">
      <div className="flex items-center justify-between">
        <span className="font-semibold">DAILY · 14 SITES</span>
        <span className="text-current/55">3,241 EVT</span>
      </div>
      <div className="mt-1.5 flex h-8 items-end gap-[3px]" aria-hidden>
        {heights.map((h, i) => (
          <span
            key={i}
            className="block w-[6px] bg-current"
            style={{ height: `${h}px`, opacity: 0.4 + (i / heights.length) * 0.6 }}
          />
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between text-current/55">
        <span>00:00</span>
        <span>HAZARDS · 47</span>
        <span>23:59</span>
      </div>
    </div>
  );
};

// SwipeDeckPeek kept available as an alternate DETECT visualization; user
// requested the original DetectMockup as the active version. Swap by changing
// MOCKUPS.DETECT below to SwipeDeckPeek.
const MOCKUPS: Record<string, React.ComponentType> = {
  DETECT: DetectMockup,
  RECONSTRUCT: ReconstructMockup,
  TRAIN: TrainMockup,
  CONVERGE: ConvergeMockup,
};
// Touch reference to keep the import alive for the swap path above.
void SwipeDeckPeek;

interface LoopPhasePeekProps {
  currentLabel: string;
  className?: string;
  /** When true, hide the "PRODUCT VIEW · …" eyebrow so the mockup can sit
   *  inline inside a phase card (which already has its own header chrome). */
  compact?: boolean;
}

export function LoopPhasePeek({ currentLabel, className, compact = false }: LoopPhasePeekProps) {
  const Mockup = MOCKUPS[currentLabel.toUpperCase()] ?? null;
  if (!Mockup) return null;
  return (
    <div
      aria-hidden
      className={`pointer-events-none select-none ${className ?? ''}`}
      key={currentLabel}
    >
      <div className="animate-nx-stage-enter">
        {!compact && (
          <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-current/55">
            PRODUCT VIEW · {currentLabel.toUpperCase()}
          </p>
        )}
        <Mockup />
      </div>
    </div>
  );
}
