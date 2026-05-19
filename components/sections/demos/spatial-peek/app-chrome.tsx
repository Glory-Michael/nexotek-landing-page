'use client';

import React, { useEffect, useState } from 'react';
import type { CameraSpec } from './scene';

interface AppChromeProps {
  cameras: CameraSpec[];
  selectedId: string;
  children: React.ReactNode;
}

// Tiny ticker hook: simulates a live event counter incrementing at ~realistic
// site-event rates (1 event every 2-4 seconds). Pure UI flavor — no telemetry.
function useEventTicker(initial = 1247): number {
  const [n, setN] = useState(initial);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setN((v) => v + 1);
      const next = 1800 + Math.random() * 2400;
      window.setTimeout(tick, next);
    };
    const id = window.setTimeout(tick, 2200);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);
  return n;
}

// Latency flicker: jitters ±2ms around a base value, replays every ~600ms.
function useLatencyFlicker(base = 23): number {
  const [v, setV] = useState(base);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setV(base + Math.round((Math.random() - 0.5) * 4));
    }, 600);
    return () => window.clearInterval(id);
  }, [base]);
  return v;
}

export const SpatialPeekChrome: React.FC<AppChromeProps> = ({ cameras, selectedId, children }) => {
  const events = useEventTicker();
  const latency = useLatencyFlicker();
  const selected = cameras.find((c) => c.id === selectedId) ?? cameras[0];
  const activeCount = cameras.filter((c) => c.active).length;
  // Synthetic coverage % so the right panel reads as live.
  const coveragePct = 47 + Math.round((selected.hFovDeg / 100) * 18);

  return (
    <div className="relative h-full w-full">
      {/* Bezel shadow halo */}
      <div className="absolute inset-0 -z-10 rounded-[6px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]" aria-hidden />
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[6px] border-2 border-black bg-neutral-950 text-neutral-100">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950 px-3">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em]">
            <span className="inline-flex h-4 w-4 items-center justify-center border border-neutral-200 text-[8px] font-bold text-neutral-100">
              N
            </span>
            <span className="hidden sm:inline text-neutral-400">SITE ATLAS</span>
            <span className="hidden sm:inline text-neutral-700">/</span>
            <span className="hidden sm:inline text-neutral-400">FLOOR 02</span>
            <span className="hidden md:inline text-neutral-700">/</span>
            <span className="hidden md:inline text-neutral-100">ZONE B</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-500 nx-pulse-dot" />
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-emerald-400">LIVE</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-300">
              <span className="tabular-nums">{activeCount}</span> CAM
            </span>
          </div>
        </header>

        {/* ── Middle row: sidebar | scene | right panel ─────────────────── */}
        <div className="flex min-h-0 flex-1">
          {/* Camera list sidebar */}
          <aside className="hidden w-[140px] shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 md:flex">
            <div className="border-b border-neutral-800 px-3 py-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-500">CAMERAS</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-200">
                <span className="tabular-nums">{cameras.length.toString().padStart(2, '0')}</span> TOTAL
              </p>
            </div>
            <ol className="flex-1 overflow-hidden">
              {cameras.map((c) => {
                const isSelected = c.id === selectedId;
                return (
                  <li
                    key={c.id}
                    className={`flex items-center gap-2 border-b border-neutral-900 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] ${
                      isSelected ? 'bg-neutral-900 text-neutral-100' : 'text-neutral-400'
                    }`}
                  >
                    <span className="relative inline-flex h-2 w-2 shrink-0">
                      {c.active ? (
                        <>
                          <span
                            className="absolute inset-0 rounded-full bg-emerald-500 nx-pulse-dot"
                            style={{ animationDelay: `${Number(c.id) * 0.3}s` }}
                          />
                          <span className="relative inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        </>
                      ) : (
                        <span className="inline-block h-2 w-2 rounded-full bg-neutral-600" />
                      )}
                    </span>
                    <span className="truncate">{c.label}</span>
                  </li>
                );
              })}
            </ol>
            <div className="border-t border-neutral-800 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-600">
              + ADD CAMERA
            </div>
          </aside>

          {/* Scene area */}
          <div className="relative min-h-0 flex-1 overflow-hidden bg-neutral-100">
            {/* Center axis crosshair to read as CAD */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 opacity-[0.06]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            {/* Top-left HUD */}
            <div className="pointer-events-none absolute left-2 top-2 z-20 font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-700">
              <p>VIEW · ISOMETRIC</p>
              <p className="mt-0.5 text-neutral-500">SCALE 1:120</p>
            </div>
            {/* Top-right HUD */}
            <div className="pointer-events-none absolute right-2 top-2 z-20 text-right font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-700">
              <p>FRAME · AUTO-ORBIT</p>
              <p className="mt-0.5 text-neutral-500">
                <span className="tabular-nums">{latency}</span>ms · CACHED
              </p>
            </div>
            {/* Scene itself */}
            <div className="absolute inset-0">{children}</div>
          </div>

          {/* Right selection panel */}
          <aside className="hidden w-[170px] shrink-0 flex-col border-l border-neutral-800 bg-neutral-950 lg:flex">
            <div className="border-b border-neutral-800 px-3 py-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-500">SELECTION</p>
              <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-100">
                {selected.label}
              </p>
            </div>
            <dl className="flex-1 divide-y divide-neutral-900 font-mono text-[10px] uppercase tracking-[0.18em]">
              <Row k="H · FOV" v={`${selected.hFovDeg}°`} />
              <Row k="V · FOV" v={`${selected.vFovDeg}°`} />
              <Row k="TILT" v={`${selected.tiltDeg}°`} />
              <Row k="ROT" v={`${selected.rotationDeg}°`} />
              <Row k="REACH" v={`${selected.reach}m`} />
              <Row k="HEIGHT" v={`${selected.height.toFixed(1)}m`} />
              <div className="px-3 py-2">
                <p className="text-neutral-500">COVERAGE</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="relative h-1.5 flex-1 overflow-hidden border border-neutral-700 bg-neutral-900">
                    <span
                      className="absolute inset-y-0 left-0 bg-emerald-500 transition-[width] duration-500"
                      style={{ width: `${coveragePct}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-neutral-200">{coveragePct}%</span>
                </div>
              </div>
              <div className="px-3 py-2">
                <p className="text-neutral-500">STATUS</p>
                <p className={`mt-1 ${selected.active ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {selected.active ? '● ACTIVE · DETECTING' : '○ MONITORING'}
                </p>
              </div>
            </dl>
          </aside>
        </div>

        {/* ── Footer status bar ──────────────────────────────────────────── */}
        <footer className="flex h-7 shrink-0 items-center justify-between gap-4 border-t border-neutral-800 bg-neutral-950 px-3 font-mono text-[9px] uppercase tracking-[0.22em]">
          <div className="flex items-center gap-3 text-neutral-400">
            <span className="text-emerald-400">▸ DETECTING</span>
            <span className="text-neutral-700">·</span>
            <span>
              <span className="tabular-nums text-neutral-200">{latency}</span>ms LATENCY
            </span>
            <span className="hidden sm:inline text-neutral-700">·</span>
            <span className="hidden sm:inline">
              <span className="tabular-nums text-neutral-200">{events.toLocaleString()}</span> EVT / 24H
            </span>
          </div>
          <div className="hidden items-center gap-3 text-neutral-500 md:flex">
            <span>UPTIME 99.4%</span>
            <span className="text-neutral-700">·</span>
            <span>EDGE-AI · ON-CAM</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex items-center justify-between px-3 py-1.5">
    <dt className="text-neutral-500">{k}</dt>
    <dd className="tabular-nums text-neutral-100">{v}</dd>
  </div>
);
