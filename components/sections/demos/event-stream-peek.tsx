'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

// ── Lane definitions ───────────────────────────────────────────────────────

interface LaneSpec {
  label: string;
  baseRate: number;
  spikeChance: number;
}

const LANES: LaneSpec[] = [
  { label: 'PPE',     baseRate: 0.42, spikeChance: 0.07 },
  { label: 'VEHICLE', baseRate: 0.34, spikeChance: 0.04 },
  { label: 'WORKER',  baseRate: 0.55, spikeChance: 0.05 },
  { label: 'ENTRY',   baseRate: 0.22, spikeChance: 0.03 },
];

const BARS_PER_LANE = 24;
const STEP_MS = 1400;

// ── Helpers ────────────────────────────────────────────────────────────────

function seededBars(seed: number, lane: LaneSpec): number[] {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: BARS_PER_LANE }, () => sample(lane, r));
}

function sample(lane: LaneSpec, rng: () => number = Math.random): number {
  const spike = rng() < lane.spikeChance ? 0.45 + rng() * 0.45 : 0;
  return Math.min(1, lane.baseRate * (0.35 + rng() * 1.35) + spike);
}

// ── Inner content ──────────────────────────────────────────────────────────

/**
 * Detection Activity chart content. Fills `h-full` of its parent — used
 * inside ScreenDeck as a rotating operator screen alongside Decision Panel /
 * Recordings / Alert History. Wrap with card chrome via EventStreamPeek when
 * a standalone surface is needed.
 */
export function DetectionActivityChart() {
  const reduced = useReducedMotion();
  const [lanes, setLanes] = useState<number[][]>(() =>
    LANES.map((lane, idx) => seededBars(20260513 + idx * 137, lane)),
  );
  const [totalEvents, setTotalEvents] = useState(284);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setLanes((prev) =>
        prev.map((bars, laneIdx) => [...bars.slice(1), sample(LANES[laneIdx])]),
      );
      setTotalEvents((t) => t + Math.floor(Math.random() * 3) + 1);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div className="flex h-full flex-col gap-3 bg-nx-black p-4 text-white">
      {/* Header — matches the other ScreenDeck operator screens */}
      <div className="flex items-center gap-2 border-b border-white/15 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-none bg-emerald-500/15 text-emerald-300">
          <Activity size={14} />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-white">
            Detection · 24h
          </div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-500">
            All sites · live stream
          </div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
          <span className="relative inline-block h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-emerald-300" />
            <span className="absolute inset-0 rounded-full bg-emerald-300 opacity-55 animate-ping" />
          </span>
          Live
        </span>
      </div>

      {/* Lanes — flex-1 fills the remaining height */}
      <div className="flex flex-1 flex-col justify-evenly gap-2">
        {LANES.map((lane, idx) => (
          <Lane key={lane.label} label={lane.label} bars={lanes[idx]} />
        ))}
      </div>

      {/* Footer — running event total */}
      <div className="flex items-center justify-between border-t border-white/15 pt-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-neutral-500">
          Events · 24h
        </span>
        <span className="text-[14px] font-semibold text-white">
          {totalEvents.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ── Lane ───────────────────────────────────────────────────────────────────

function Lane({ label, bars }: { label: string; bars: number[] }) {
  const total = bars.reduce((a, b) => a + b, 0);
  return (
    <div className="grid grid-cols-[58px_1fr] items-center gap-2">
      <div className="flex flex-col">
        <span className="font-mono text-[9px] uppercase tracking-[0.20em] text-white/80">
          {label}
        </span>
        <span className="font-mono text-[8.5px] text-white/40">
          {total.toFixed(0)} ev
        </span>
      </div>
      <div className="relative h-9 overflow-hidden">
        <div
          className="absolute inset-0 grid items-end"
          style={{ gridTemplateColumns: `repeat(${BARS_PER_LANE}, minmax(0, 1fr))` }}
        >
          {bars.map((v, i) => {
            const heightPct = Math.max(5, v * 100);
            const opacity = v > 0.7 ? 1 : v > 0.4 ? 0.7 : 0.42;
            return (
              <div key={i} className="flex h-full items-end px-[0.5px]">
                <div
                  className="w-full bg-white transition-[height,opacity] duration-300 ease-out"
                  style={{ height: `${heightPct}%`, opacity }}
                />
              </div>
            );
          })}
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-px bg-white/25" />
      </div>
    </div>
  );
}

// ── Standalone card wrapper ────────────────────────────────────────────────

interface EventStreamPeekProps {
  className?: string;
}

/**
 * Standalone Detection Activity card. The homepage now consumes
 * `DetectionActivityChart` inside ScreenDeck's rotation, so this wrapper is
 * kept for any future standalone use.
 */
export function EventStreamPeek({ className = '' }: EventStreamPeekProps) {
  return (
    <div
      className={`relative h-[360px] w-[340px] overflow-hidden border border-white/15 bg-nx-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ${className}`}
      aria-hidden="true"
    >
      <DetectionActivityChart />
    </div>
  );
}
