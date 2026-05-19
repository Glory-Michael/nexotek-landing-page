'use client';

import { useEffect, useState } from 'react';

interface Stat {
  value: string;
  label: string;
}

interface MeterRow {
  label: string;
  pct: number; // 0..100
}

interface IndustryMetrics {
  title: string;
  primaryStats: Stat[];
  meters: MeterRow[];
}

const METRICS: Record<string, IndustryMetrics> = {
  construction: {
    title: 'CONSTRUCTION · NX OPS',
    primaryStats: [
      { value: '12', label: 'SITES' },
      { value: '47', label: 'EVT / 24H' },
      { value: '99.1%', label: 'UPTIME' },
    ],
    meters: [
      { label: 'HAZARD COVERAGE', pct: 88 },
      { label: 'CREDENTIALED LABOR', pct: 94 },
      { label: 'PILOT EXPANSION', pct: 42 },
    ],
  },
  habitation: {
    title: 'HABITATION · NX OPS',
    primaryStats: [
      { value: '8', label: 'PROPERTIES' },
      { value: '23', label: 'EVT / 24H' },
      { value: '99.4%', label: 'UPTIME' },
    ],
    meters: [
      { label: 'COMMON-AREA COVERAGE', pct: 91 },
      { label: 'STAFF CREDENTIALED', pct: 86 },
      { label: 'INTEGRATION READY', pct: 64 },
    ],
  },
};

function useEventCounter(initial: number) {
  const [n, setN] = useState(initial);
  useEffect(() => {
    setN(initial);
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setN((v) => v + 1);
      window.setTimeout(tick, 4000 + Math.random() * 3000);
    };
    const id = window.setTimeout(tick, 3500);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [initial]);
  return n;
}

interface DashboardStatsOverlayProps {
  industryKey: string;
  className?: string;
}

export function DashboardStatsOverlay({ industryKey, className }: DashboardStatsOverlayProps) {
  const metrics = METRICS[industryKey] ?? METRICS.construction;
  // Pull initial event count from the first numeric primary stat that
  // looks like an event count (the second slot in our seed).
  const evtInitial = parseInt(metrics.primaryStats[1]?.value ?? '0', 10) || 0;
  const evtCount = useEventCounter(evtInitial);

  return (
    <div
      aria-hidden
      className={`pointer-events-none select-none ${className ?? ''}`}
    >
      <div className="border-2 border-white/85 bg-black/65 p-3 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-md">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/25 pb-2 font-mono text-[10px] uppercase tracking-[0.22em]">
          <span className="text-white/90">{metrics.title}</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-500 nx-pulse-dot" />
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            LIVE
          </span>
        </div>

        {/* Primary stats row */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {metrics.primaryStats.map((s, i) => {
            const isEvtSlot = i === 1;
            return (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                  {isEvtSlot ? evtCount : s.value}
                </p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-white/55">
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Meters */}
        <div className="space-y-2">
          {metrics.meters.map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em]">
                <span className="text-white/65">{m.label}</span>
                <span className="tabular-nums text-white/85">{m.pct}%</span>
              </div>
              <div className="relative mt-1 h-1 w-full overflow-hidden border border-white/25 bg-black/40">
                <span
                  className="absolute inset-y-0 left-0 bg-white transition-[width] duration-700"
                  style={{ width: `${m.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
