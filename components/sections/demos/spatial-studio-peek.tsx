'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Upload,
} from 'lucide-react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { SpatialStudioCloud } from './spatial-studio-cloud';

// ── Motion params ──────────────────────────────────────────────────────────
// The R3F scene handles its own rotation via useFrame. The React tick below
// only drives the timeline scrubber + drift readout + KF counter.

const TICK_MS = 200; // 5fps is plenty for label tickers
const START_KF = 42;
const END_KF = 120;
const TIMELINE_LOOP_MS = 60_000;

// ── Component ──────────────────────────────────────────────────────────────

interface SpatialStudioPeekProps {
  className?: string;
}

export function SpatialStudioPeek({ className = '' }: SpatialStudioPeekProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsInViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        setIsInViewport(entries[0]?.isIntersecting ?? false);
      },
      { rootMargin: '120px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const sync = () => setIsTabActive(document.visibilityState === 'visible');
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  const shouldAnimate = !reduced && isInViewport && isTabActive;

  useEffect(() => {
    if (!shouldAnimate) return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [shouldAnimate]);

  const elapsed = tick * TICK_MS;
  const progress = (elapsed % TIMELINE_LOOP_MS) / TIMELINE_LOOP_MS;
  const driftMm =
    1.15 + (Math.sin(elapsed * 0.0007) + Math.sin(elapsed * 0.0017)) * 0.15;

  const kfNum = START_KF + Math.floor(progress * (END_KF - START_KF));
  const totalSec = START_KF + progress * (END_KF - START_KF);
  const mm = Math.floor(totalSec / 60);
  const ss = Math.floor(totalSec) % 60;
  const runtime = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  return (
    <div
      ref={containerRef}
      className={`relative h-[360px] w-[560px] overflow-hidden border border-white/15 bg-nx-black text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ${className}`}
      aria-hidden="true"
    >
      {/* Top rail */}
      <div className="flex h-7 items-center justify-between border-b border-white/12 bg-gradient-to-b from-[#0E0E0E] to-black px-2.5">
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-white">
          <Box size={9} className="text-white/55" strokeWidth={1.6} />
          <span className="text-white/55">NX-STUDIO</span>
          <span className="text-white/20">·</span>
          <span className="text-white">INC-2026-05-13</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.24em] text-white/70">
          <span className="relative inline-block h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-[#3DB46D]" />
            <span className="absolute inset-0 rounded-full bg-[#3DB46D] opacity-55 animate-ping" />
          </span>
          CAP·{String(kfNum).padStart(3, '0')}
        </div>
      </div>

      {/* Body */}
      <div className="grid h-[304px] grid-cols-[110px_1fr_110px]">
        <Outliner />
        <Viewport active={shouldAnimate} driftMm={driftMm} kfNum={kfNum} />
        <Properties driftMm={driftMm} />
      </div>

      {/* Timeline */}
      <div className="flex h-7 items-center gap-1.5 border-t border-white/12 bg-gradient-to-t from-[#0E0E0E] to-black px-2 font-mono text-[8px] uppercase tracking-[0.22em] text-white/65">
        <div className="flex items-center gap-1 text-white/55">
          <SkipBack size={9} strokeWidth={1.6} />
          <Play size={10} strokeWidth={1.8} className="text-white" />
          <SkipForward size={9} strokeWidth={1.6} />
        </div>
        <span className="text-white/25">·</span>
        <span className="text-white">
          KF {String(kfNum).padStart(3, '0')}/{END_KF}
        </span>
        <div className="relative mx-1.5 h-px flex-1 bg-white/15">
          <div
            className="absolute left-0 top-0 h-px bg-white"
            style={{ width: `${progress * 100}%` }}
          />
          <div
            className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ left: `${progress * 100}%` }}
          />
        </div>
        <span className="text-white">{runtime}</span>
        <Repeat size={9} strokeWidth={1.6} className="text-white/45" />
      </div>
    </div>
  );
}

// ── Outliner ───────────────────────────────────────────────────────────────

function Outliner() {
  return (
    <div className="overflow-hidden border-r border-white/12 bg-black/40 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/70">
      <OutlinerGroup label="Capture">
        <OutlinerItem label="cam·01" />
        <OutlinerItem label="cam·02" />
        <OutlinerItem label="cam·03" />
        <OutlinerItem label="cam·04" />
      </OutlinerGroup>
      <OutlinerGroup label="Splats">
        <OutlinerItem label="excavator" selected dot />
        <OutlinerItem label="ground·plane" />
        <OutlinerItem label="scaffold" />
      </OutlinerGroup>
      <OutlinerGroup label="Annot.">
        <OutlinerItem label="A · 01" />
        <OutlinerItem label="B · 02" />
      </OutlinerGroup>
      <OutlinerGroup label="Tour">
        <OutlinerItem label="start" />
      </OutlinerGroup>
    </div>
  );
}

function OutlinerGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-1.5">
      <div className="flex items-center gap-1 px-1.5 text-white/40">
        <span>▾</span>
        <span>{label}</span>
      </div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function OutlinerItem({
  label,
  selected = false,
  dot = false,
}: {
  label: string;
  selected?: boolean;
  dot?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-[1px] ${
        selected ? 'bg-white/[0.08] text-white' : 'text-white/65'
      }`}
    >
      <span className={dot ? 'text-white' : 'text-white/30'}>
        {dot ? '●' : '·'}
      </span>
      <span>{label}</span>
    </div>
  );
}

// ── Viewport ───────────────────────────────────────────────────────────────

interface ViewportProps {
  active: boolean;
  driftMm: number;
  kfNum: number;
}

function Viewport({ active, driftMm, kfNum }: ViewportProps) {
  return (
    <div className="relative bg-[#0a0a0a]">
      {/* Static SVG — floor grid + selection corners */}
      <svg
        viewBox="0 0 100 70"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <g stroke="rgba(255,255,255,0.07)" strokeWidth="0.18" fill="none">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={`h${i}`}
              x1={i * 4}
              y1={55 + i * 2.4}
              x2={100 - i * 4}
              y2={55 + i * 2.4}
            />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line key={`v${i}`} x1={i * 16.6} y1="70" x2={50} y2="55" />
          ))}
        </g>
        <g stroke="rgba(255,255,255,0.5)" strokeWidth="0.25" fill="none">
          <path d="M 20 36 L 20 33 L 23 33" />
          <path d="M 77 33 L 80 33 L 80 36" />
          <path d="M 80 54 L 80 57 L 77 57" />
          <path d="M 23 57 L 20 57 L 20 54" />
        </g>
      </svg>

      {/* R3F scene — GPU-rendered rotating point cloud */}
      <div className="pointer-events-none absolute inset-0">
        <SpatialStudioCloud active={active} />
      </div>

      {/* Stats overlay (top-left) */}
      <div className="absolute left-2 top-1.5 flex flex-col gap-0.5 font-mono text-[8px] uppercase tracking-[0.20em] text-white/55">
        <span>MODEL · EXCAVATOR · 384K PTS</span>
        <span>DRIFT · {driftMm.toFixed(2)}MM</span>
        <span>FRAME {String(kfNum).padStart(3, '0')}</span>
      </div>

      {/* Axis gizmo (top-right) */}
      <svg viewBox="0 0 24 24" className="absolute right-1.5 top-1.5 h-6 w-6">
        <g strokeWidth="1.4" strokeLinecap="round" fill="none">
          <line x1="12" y1="12" x2="20" y2="12" stroke="#E89B2C" />
          <line x1="12" y1="12" x2="12" y2="4" stroke="#3DB46D" />
          <line x1="12" y1="12" x2="6.5" y2="18" stroke="#5BB5E8" />
        </g>
        <text
          x="21"
          y="13.7"
          fontSize="3"
          fill="#E89B2C"
          fontFamily="ui-monospace, monospace"
        >
          X
        </text>
        <text
          x="11"
          y="3.6"
          fontSize="3"
          fill="#3DB46D"
          fontFamily="ui-monospace, monospace"
        >
          Y
        </text>
        <text
          x="4"
          y="20.5"
          fontSize="3"
          fill="#5BB5E8"
          fontFamily="ui-monospace, monospace"
        >
          Z
        </text>
      </svg>

      {/* Tool palette */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2.5 border-t border-white/10 bg-black/55 py-1 font-mono text-[8px] uppercase tracking-[0.22em]">
        <span className="text-white">⊕ Orbit</span>
        <span className="text-white/30">·</span>
        <span className="text-white/50">⊟ Pan</span>
        <span className="text-white/30">·</span>
        <span className="text-white/50">⊙ Focus</span>
      </div>
    </div>
  );
}

// ── Properties ─────────────────────────────────────────────────────────────

function Properties({ driftMm }: { driftMm: number }) {
  return (
    <div className="border-l border-white/12 bg-black/40 px-2 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/70">
      <p className="mb-1 text-[8.5px] text-white/45">Point cloud</p>
      <DataRow k="pts" v="384,902" />
      <DataRow k="dens" v="0.91" />
      <DataRow k="drift" v={`${driftMm.toFixed(2)}mm`} />

      <p className="mt-3 mb-1 text-[8.5px] text-white/45">Walkthrough</p>
      <DataRow k="nodes" v="7" />
      <DataRow k="run" v="1:24" />

      <button
        type="button"
        tabIndex={-1}
        className="mt-3 flex w-full items-center justify-center gap-1 border border-white/25 bg-white/[0.04] py-1 text-[9px] uppercase tracking-[0.22em] text-white"
      >
        <Upload size={9} strokeWidth={1.7} />
        Publish
      </button>
    </div>
  );
}

function DataRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between py-[1px]">
      <span className="text-white/55">{k}</span>
      <span className="text-white">{v}</span>
    </div>
  );
}
