'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

/**
 * 1:1 recreation of camect's DashboardView — operator's overview panel.
 * Tier 1: Operation Mode (ARM/DISARM toggle). Tier 2: Status indicators
 * (Hub, Cameras, Hazards). Tier 3: Daily summary with stats + recent
 * activity feed. Auto-animates: ARM toggle flips, status pills pulse,
 * event counter ticks, new activity rows insert at top.
 *
 * Designed as a per-industry corner peek for the WhoWeServe section —
 * data swaps when the active industry tab changes (via `industryKey` prop).
 */

interface IndustryData {
  brand: string;
  mode: 'ARMED' | 'DISARMED';
  hubOnline: boolean;
  camerasOffline: number;
  hazardsToday: number;
  workersOnSite: number;
  sites: number;
  uptimePct: string;
  weather: { temp: string; cond: string; risk: 'LOW' | 'ELEV.' | 'HIGH' };
  alertsByType: Array<{ label: string; count: number; tone: 'critical' | 'high' | 'medium' }>;
  recentEvents: Array<{ time: string; cam: string; label: string }>;
}

const DATA: Record<string, IndustryData> = {
  construction: {
    brand: 'NX OPS · CONSTRUCTION',
    mode: 'ARMED',
    hubOnline: true,
    camerasOffline: 1,
    hazardsToday: 12,
    workersOnSite: 247,
    sites: 12,
    uptimePct: '99.1%',
    weather: { temp: '52°F', cond: 'PARTLY CLOUDY', risk: 'ELEV.' },
    alertsByType: [
      { label: 'PPE missing',         count: 5, tone: 'high' },
      { label: 'Worker in lift zone', count: 3, tone: 'critical' },
      { label: 'Unsecured load',      count: 2, tone: 'high' },
      { label: 'Vehicle proximity',   count: 2, tone: 'medium' },
    ],
    recentEvents: [
      { time: '12s',  cam: 'CAM 03 · LIFT',     label: 'Worker in lift zone' },
      { time: '1m',   cam: 'CAM 07 · SCAFFOLD', label: 'PPE missing · hardhat' },
      { time: '3m',   cam: 'CAM 11 · DOCK',     label: 'Vehicle near worker' },
      { time: '8m',   cam: 'CAM 04 · YARD',     label: 'Unsecured load' },
    ],
  },
  habitation: {
    brand: 'NX OPS · HABITATION',
    mode: 'ARMED',
    hubOnline: true,
    camerasOffline: 0,
    hazardsToday: 4,
    workersOnSite: 38,
    sites: 8,
    uptimePct: '99.4%',
    weather: { temp: '54°F', cond: 'CLEAR · CALM', risk: 'LOW' },
    alertsByType: [
      { label: 'Trespass · corridor',  count: 2, tone: 'high' },
      { label: 'After-hours motion',   count: 1, tone: 'medium' },
      { label: 'Loitering · garage',   count: 1, tone: 'medium' },
    ],
    recentEvents: [
      { time: '6m',  cam: 'CAM 02 · ATRIUM',   label: 'Trespass · corridor' },
      { time: '24m', cam: 'CAM 08 · GARAGE',   label: 'Loitering detected' },
      { time: '41m', cam: 'CAM 14 · PERIM',    label: 'After-hours motion' },
    ],
  },
};

const TONE_META: Record<'critical' | 'high' | 'medium', { dot: string; chip: string }> = {
  critical: { dot: 'bg-red-500',    chip: 'border-red-500/35 bg-red-500/10 text-red-300' },
  high:     { dot: 'bg-orange-400', chip: 'border-orange-400/35 bg-orange-400/10 text-orange-300' },
  medium:   { dot: 'bg-amber-300',  chip: 'border-amber-300/35 bg-amber-300/10 text-amber-200' },
};

interface DashboardPeekProps {
  industryKey: string;
  className?: string;
}

export function DashboardPeek({ industryKey, className }: DashboardPeekProps) {
  const data = DATA[industryKey] ?? DATA.construction;

  const [mode, setMode] = useState<'ARMED' | 'DISARMED'>(data.mode);
  const [eventCount, setEventCount] = useState(data.hazardsToday * 14);
  const [recent, setRecent] = useState(data.recentEvents);
  const [armPressed, setArmPressed] = useState(false);

  // Reset when industry changes
  useEffect(() => {
    setMode(data.mode);
    setEventCount(data.hazardsToday * 14);
    setRecent(data.recentEvents);
  }, [industryKey, data]);

  // ARM/DISARM toggle cycles every ~7s
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setArmPressed(true);
      window.setTimeout(() => setArmPressed(false), 220);
      window.setTimeout(() => setMode((m) => (m === 'ARMED' ? 'DISARMED' : 'ARMED')), 280);
    }, 7000);
    return () => window.clearInterval(id);
  }, []);

  // Event counter ticks up
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setEventCount((v) => v + 1);
      window.setTimeout(tick, 2200 + Math.random() * 2200);
    };
    const t = window.setTimeout(tick, 2800);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [industryKey]);

  // New activity row inserts at top every ~5s
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    const id = window.setInterval(() => {
      const cycle = data.recentEvents;
      const next = cycle[i % cycle.length];
      i++;
      setRecent((prev) => [{ ...next, time: 'now' }, ...prev].slice(0, 4));
    }, 5000);
    return () => window.clearInterval(id);
  }, [data]);

  const armed = mode === 'ARMED';

  return (
    <div className={`relative ${className ?? ''}`}>
      <div
        className={`overflow-hidden rounded-none border bg-nx-black text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ${armed ? 'border-white/15' : 'border-red-500/25'}`}
      >
        {/* ── Tier 1 · Operation Mode ──────────────────────────────── */}
        <div className={`flex items-center justify-between gap-3 px-4 py-3 ${armed ? 'bg-nx-ink-2/50' : 'bg-red-950/30'}`}>
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-none ${armed ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300'}`}>
              <Activity className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Operation Mode</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-lg font-bold uppercase tracking-tight ${armed ? 'text-white' : 'text-red-300'}`}>
                  {armed ? 'Armed' : 'Disarmed'}
                </span>
                {data.hubOnline && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inset-0 rounded-full bg-emerald-500 nx-pulse-dot" />
                      <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Online
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* ARM/DISARM toggle */}
          <div className="flex shrink-0 rounded-none border border-white/20 bg-nx-ink-3/80 p-0.5">
            <button
              type="button"
              aria-pressed={armed}
              className={`rounded-none px-2.5 py-1 text-[10px] font-bold tracking-wide transition-all ${armed ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40' : 'text-neutral-500'} ${armed && armPressed ? 'scale-95' : ''}`}
            >
              ARM
            </button>
            <button
              type="button"
              aria-pressed={!armed}
              className={`rounded-none px-2.5 py-1 text-[10px] font-bold tracking-wide transition-all ${!armed ? 'bg-red-500/20 text-red-200 ring-1 ring-red-500/40' : 'text-neutral-500'} ${!armed && armPressed ? 'scale-95' : ''}`}
            >
              DISARM
            </button>
          </div>
        </div>

        {/* ── Tier 2 · Status indicators row ───────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/15 bg-nx-ink-2/30 px-4 py-2 text-[11px]">
          <StatusPill
            tone={data.hubOnline ? 'online' : 'error'}
            label="Hub"
            value={data.hubOnline ? 'Online' : 'Offline'}
          />
          <span className="h-3 w-px bg-white/15" aria-hidden />
          <StatusPill
            tone={data.camerasOffline > 0 ? 'warning' : 'online'}
            label="Cams off"
            value={data.camerasOffline.toString()}
          />
          <span className="h-3 w-px bg-white/15" aria-hidden />
          <StatusPill tone="warning" label="Hazards · 24h" value={data.hazardsToday.toString()} />
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-neutral-500">
            <svg viewBox="0 0 14 14" className="h-3 w-3" aria-hidden>
              <circle cx="7" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M7 1 L7 3 M7 11 L7 13 M1 7 L3 7 M11 7 L13 7" stroke="currentColor" strokeWidth="1" />
            </svg>
            {data.weather.temp} · {data.weather.cond}
          </span>
        </div>

        {/* ── Tier 3 · Three-column body ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)_180px]">
          {/* KPI stats column */}
          <div className="border-r border-white/15 px-3 py-3">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-neutral-500">Today</p>
            <Kpi label="Sites" value={data.sites} />
            <Kpi label="Workers" value={data.workersOnSite} />
            <Kpi label="Events · 24h" value={eventCount.toLocaleString()} />
            <div className="mt-3 border-t border-white/15 pt-2">
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">Uptime</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{data.uptimePct}</p>
            </div>
          </div>

          {/* Alerts by type — daily summary */}
          <div className="border-r border-white/15 px-3 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
              <svg viewBox="0 0 12 12" className="h-3 w-3 text-red-400" aria-hidden>
                <path d="M6 1 L11 10 L1 10 Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <line x1="6" y1="4.5" x2="6" y2="7" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
              </svg>
              Alerts by type
            </p>
            <ul className="space-y-1.5">
              {data.alertsByType.map((a, i) => {
                const meta = TONE_META[a.tone];
                return (
                  <li
                    key={a.label}
                    className={`flex items-center justify-between gap-2 rounded border px-2 py-1 ${meta.chip}`}
                    style={{ opacity: 1, transitionDelay: `${i * 60}ms` }}
                  >
                    <span className="inline-flex items-center gap-1.5 text-[10.5px]">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {a.label}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums">{a.count}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Recent activity feed */}
          <div className="px-3 py-3">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-neutral-500">Recent activity</p>
            <ol className="space-y-1">
              {recent.map((e, i) => (
                <li
                  key={`${e.cam}-${e.label}-${i}`}
                  className={`border-b border-white/15/60 pb-1 text-[10.5px] last:border-0 ${e.time === 'now' ? 'animate-nx-alert-in' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">{e.cam}</span>
                    <span className="font-mono text-[9px] text-neutral-500 tabular-nums">{e.time}</span>
                  </div>
                  <p className="mt-0.5 truncate text-neutral-300">{e.label}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-t border-white/15 bg-nx-black px-4 py-1.5 font-mono text-[9px] uppercase tracking-wider text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-500 nx-pulse-dot" />
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-emerald-400">CONNECTED</span>
            <span className="text-neutral-600">·</span>
            <span>{data.brand}</span>
          </span>
          <span className="hidden text-neutral-500 sm:inline">RISK · {data.weather.risk}</span>
        </div>
      </div>
    </div>
  );
}

// ── Atoms ──────────────────────────────────────────────────────────

function StatusPill({ tone, label, value }: { tone: 'online' | 'warning' | 'error'; label: string; value: string }) {
  const dotClass = tone === 'online' ? 'bg-emerald-500' : tone === 'warning' ? 'bg-amber-400' : 'bg-red-500';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative inline-flex h-1.5 w-1.5">
        <span className={`absolute inset-0 rounded-full nx-pulse-dot ${dotClass}`} />
        <span className={`relative inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
      </span>
      <span className="text-neutral-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </span>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <span className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</span>
      <span className="font-display text-lg font-bold tabular-nums text-white">{value}</span>
    </div>
  );
}
