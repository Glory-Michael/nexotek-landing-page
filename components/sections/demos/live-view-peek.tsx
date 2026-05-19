'use client';

import { useEffect, useState } from 'react';

/**
 * 1:1 recreation of camect's LiveViewContent + PTZControls — single-camera
 * live view with pan/tilt/zoom directional pad. Operator's "zoom into one
 * camera" surface. Designed as a corner peek alongside the 3D floorplan
 * scene in the ThreadSpatial section.
 *
 * Auto-animates:
 *  - PTZ button cycles between pan/tilt/home/zoom — fires every ~2s as if
 *    the operator is sweeping the camera. The pressed button briefly flashes.
 *  - The faux subject (worker silhouette) drifts in frame to match the
 *    current PTZ direction, with the bbox following.
 *  - REC pulse + scrubber + bitrate counter.
 */

type PtzAction =
  | 'tilt-up'
  | 'tilt-down'
  | 'pan-left'
  | 'pan-right'
  | 'home'
  | 'zoom-in'
  | 'zoom-out';

const PTZ_CYCLE: PtzAction[] = [
  'pan-right',
  'tilt-up',
  'pan-right',
  'zoom-in',
  'home',
  'pan-left',
  'tilt-down',
  'zoom-out',
];

interface LiveViewPeekProps {
  className?: string;
}

export function LiveViewPeek({ className }: LiveViewPeekProps) {
  const [action, setAction] = useState<PtzAction>('home');
  const [pressed, setPressed] = useState<PtzAction | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [latency, setLatency] = useState(31);
  const [bitrate, setBitrate] = useState(2.4);

  // Cycle PTZ action every ~2.2s
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    const id = window.setInterval(() => {
      const next = PTZ_CYCLE[i % PTZ_CYCLE.length];
      i++;
      setPressed(next);
      window.setTimeout(() => setPressed(null), 260);
      // Update offsets to "move" the subject in frame
      setAction(next);
      switch (next) {
        case 'pan-right':  setOffsetX((x) => Math.min(x + 6, 18)); break;
        case 'pan-left':   setOffsetX((x) => Math.max(x - 6, -18)); break;
        case 'tilt-up':    setOffsetY((y) => Math.max(y - 4, -10)); break;
        case 'tilt-down':  setOffsetY((y) => Math.min(y + 4, 10)); break;
        case 'zoom-in':    setZoom((z) => Math.min(z + 0.12, 1.45)); break;
        case 'zoom-out':   setZoom((z) => Math.max(z - 0.12, 0.85)); break;
        case 'home':
        default:
          setOffsetX(0);
          setOffsetY(0);
          setZoom(1);
          break;
      }
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  // Latency + bitrate jitter
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setLatency(28 + Math.round(Math.random() * 8));
      setBitrate(2.0 + Math.random() * 0.9);
    }, 800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/50 px-3 py-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-500 nx-pulse-dot" />
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-100">CAM 03</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">LIFT ZONE B · L4</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-slate-500">
            <span className="rounded-sm border border-slate-700 px-1.5 py-0.5 text-slate-300">RTSP</span>
            <span>1080p</span>
          </div>
        </div>

        {/* ── Two-column body: video left, PTZ pad right ──────────── */}
        <div className="grid grid-cols-[1fr_120px]">
          {/* Video viewport */}
          <div className="relative aspect-video bg-black">
            {/* Faux feed: dark gradient + grid + perspective floor */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 70%, #1e293b 0%, #0a0f1a 75%)',
              }}
            />
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full opacity-50"
              aria-hidden
            >
              <path d="M0 65 L100 65 L100 100 L0 100Z" fill="#0f172a" />
              <line x1="0" y1="65" x2="100" y2="65" stroke="#1e293b" strokeWidth="0.5" />
              <line x1="50" y1="65" x2="20" y2="100" stroke="#1e293b" strokeWidth="0.3" />
              <line x1="50" y1="65" x2="80" y2="100" stroke="#1e293b" strokeWidth="0.3" />
            </svg>
            {/* Crane silhouette in background */}
            <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full opacity-30" aria-hidden>
              <path d="M 20 50 L 22 10 L 80 8 L 78 12 L 24 14 L 24 50 Z" fill="#475569" />
              <line x1="22" y1="10" x2="80" y2="8" stroke="#64748b" strokeWidth="0.3" />
            </svg>
            {/* Subject + bbox — translates with PTZ offsets, scales with zoom */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0 h-full w-full transition-transform duration-500"
              style={{
                transform: `translate(${offsetX}%, ${offsetY}%) scale(${zoom})`,
                transformOrigin: '50% 60%',
              }}
              aria-hidden
            >
              <ellipse cx="50" cy="48" rx="3" ry="4" fill="#475569" />
              <path d="M 45 53 L 55 53 L 53 70 L 47 70 Z" fill="#475569" />
              <rect x="46" y="70" width="3" height="14" fill="#475569" />
              <rect x="51" y="70" width="3" height="14" fill="#475569" />
              {/* Hardhat */}
              <path d="M 47 44 A 3 2 0 0 1 53 44" fill="#facc15" />
              {/* Bbox */}
              <rect x="42" y="42" width="16" height="44" fill="none" stroke="#10b981" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="absolute left-2 top-2 z-10 font-mono text-[9px] uppercase tracking-wider text-emerald-300">
              ▸ WORKER · 0.93
            </span>
            {/* Top-right: REC + zoom badge */}
            <div className="absolute right-2 top-2 z-10 flex items-center gap-2 font-mono text-[9px] uppercase text-slate-300">
              <span className="rounded border border-slate-700 bg-slate-900/70 px-1.5 py-0.5">
                {zoom.toFixed(2)}×
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inset-0 rounded-full bg-red-500 nx-pulse-dot" />
                  <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                REC
              </span>
            </div>
            {/* Cardinal indicator showing active PTZ action */}
            <span
              className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-[9px] uppercase text-indigo-300 backdrop-blur-sm"
              key={`act-${action}`}
            >
              ↻ {action.replace('-', ' ')}
            </span>
            {/* Scrubber */}
            <div className="absolute inset-x-2 bottom-2 z-0">
              <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-slate-700/40">
                <span className="absolute inset-y-0 left-0 bg-slate-100 nx-scrub-bar" />
              </div>
            </div>
          </div>

          {/* PTZ Control pad */}
          <div className="flex flex-col items-center justify-center gap-2 border-l border-slate-800 bg-slate-900/30 px-3 py-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">PTZ</p>
            {/* Directional pad */}
            <div className="grid grid-cols-3 grid-rows-3 gap-1">
              <span />
              <PtzButton dir="tilt-up"   pressed={pressed === 'tilt-up'}   />
              <span />
              <PtzButton dir="pan-left"  pressed={pressed === 'pan-left'}  />
              <PtzButton dir="home"      pressed={pressed === 'home'}      home />
              <PtzButton dir="pan-right" pressed={pressed === 'pan-right'} />
              <span />
              <PtzButton dir="tilt-down" pressed={pressed === 'tilt-down'} />
              <span />
            </div>
            {/* Zoom row */}
            <div className="mt-2 flex gap-1.5">
              <PtzButton dir="zoom-out" pressed={pressed === 'zoom-out'} narrow />
              <PtzButton dir="zoom-in"  pressed={pressed === 'zoom-in'}  narrow />
            </div>
            <p className="mt-1 text-center font-mono text-[8px] uppercase tracking-wider text-slate-600">
              HOLD · 0.3s
            </p>
          </div>
        </div>

        {/* ── Footer telemetry ────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
          <span className="flex items-center gap-2">
            <span className="text-emerald-400">▸ STREAMING</span>
            <span className="text-slate-700">·</span>
            <span><span className="tabular-nums text-slate-200">{latency}</span>ms</span>
            <span className="hidden text-slate-700 sm:inline">·</span>
            <span className="hidden sm:inline"><span className="tabular-nums text-slate-200">{bitrate.toFixed(1)}</span> Mbps</span>
          </span>
          <span className="hidden text-slate-600 sm:inline">H.264 · GOP 30 · RTSP</span>
        </div>
      </div>
    </div>
  );
}

// ── PTZ button atom ────────────────────────────────────────────────

function PtzButton({
  dir,
  pressed,
  home = false,
  narrow = false,
}: {
  dir: PtzAction;
  pressed: boolean;
  home?: boolean;
  narrow?: boolean;
}) {
  const Icon = ICONS[dir];
  return (
    <button
      type="button"
      aria-label={dir.replace('-', ' ')}
      aria-pressed={pressed}
      className={`flex items-center justify-center rounded-full border shadow-sm transition-all duration-150 ${
        narrow ? 'h-6 w-9' : 'h-6 w-6'
      } ${
        home
          ? 'border-indigo-500/30 bg-indigo-900/50 text-indigo-200'
          : 'border-slate-600 bg-slate-800 text-slate-200'
      } ${pressed ? 'scale-90 bg-indigo-600 text-white' : ''}`}
    >
      <Icon />
    </button>
  );
}

const ICONS: Record<PtzAction, React.FC> = {
  'tilt-up':   () => <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M3 7 L6 4 L9 7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  'tilt-down': () => <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M3 5 L6 8 L9 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  'pan-left':  () => <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M7 3 L4 6 L7 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  'pan-right': () => <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M5 3 L8 6 L5 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  'home':      () => <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M2 6 L6 2 L10 6 L10 10 L7.5 10 L7.5 7 L4.5 7 L4.5 10 L2 10 Z" fill="currentColor" /></svg>,
  'zoom-in':   () => <svg viewBox="0 0 12 12" className="h-3 w-3"><circle cx="5" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" /><line x1="7" y1="7" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><line x1="3.5" y1="5" x2="6.5" y2="5" stroke="currentColor" strokeWidth="1.2" /><line x1="5" y1="3.5" x2="5" y2="6.5" stroke="currentColor" strokeWidth="1.2" /></svg>,
  'zoom-out':  () => <svg viewBox="0 0 12 12" className="h-3 w-3"><circle cx="5" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" /><line x1="7" y1="7" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><line x1="3.5" y1="5" x2="6.5" y2="5" stroke="currentColor" strokeWidth="1.2" /></svg>,
};
