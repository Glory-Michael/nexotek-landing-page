'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

// ── Demo data: 4 camera tiles drawn from existing Nexotek brand photography ─

interface DetectionBox {
  // Coordinates are 0..1 (fraction of tile)
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  conf: number;
  level: 'detect' | 'alert';
}

interface CameraTile {
  id: string;
  label: string;
  zone: string;
  /** One-line hazard-scenario tag shown beneath the camera label. */
  scenario: string;
  photo: string;
  // Slight ken-burns origin offset so each tile feels distinct
  origin: string;
  active: boolean;
  alerting?: boolean;
  detections: DetectionBox[];
}

// Tile configurations — each is a distinct hazard-detection scenario keyed to
// the photo composition: workers in lift zone, person in restricted corridor,
// nominal data-center monitoring, and dusk perimeter watch. Bbox coordinates
// are positioned so the rendered silhouette sits cleanly inside the bbox
// over the photo backdrop.
const TILES: CameraTile[] = [
  {
    id: '03',
    label: 'CAM 03',
    zone: 'CRANE · LIFT ZONE',
    scenario: 'WORKER IN LIFT ZONE · HAZARD',
    photo: '/brand/photos/construction-crane.jpg',
    origin: '45% 60%',
    active: true,
    alerting: true,
    detections: [
      { x: 0.36, y: 0.46, w: 0.13, h: 0.42, label: 'WORKER', conf: 0.94, level: 'alert' },
      { x: 0.56, y: 0.6, w: 0.16, h: 0.28, label: 'VEHICLE', conf: 0.78, level: 'detect' },
    ],
  },
  {
    id: '07',
    label: 'CAM 07',
    zone: 'NORTH ATRIUM · L3',
    scenario: 'PERSON · RESTRICTED CORRIDOR',
    photo: '/brand/photos/habitation-interior.jpg',
    origin: '55% 50%',
    active: true,
    detections: [
      { x: 0.42, y: 0.5, w: 0.1, h: 0.34, label: 'PERSON', conf: 0.88, level: 'detect' },
    ],
  },
  {
    id: '11',
    label: 'CAM 11',
    zone: 'OPS · RACK 04',
    scenario: 'NOMINAL · NO ANOMALY',
    photo: '/brand/photos/ops-data-center.jpg',
    origin: '50% 50%',
    active: true,
    detections: [],
  },
  {
    id: '14',
    label: 'CAM 14',
    zone: 'PERIMETER · DUSK',
    scenario: 'STRUCTURE · GATE INTRUSION',
    photo: '/brand/photos/hero-crane-silhouette.jpg',
    origin: '50% 55%',
    active: false,
    detections: [
      { x: 0.5, y: 0.46, w: 0.16, h: 0.38, label: 'INTRUDER', conf: 0.71, level: 'detect' },
    ],
  },
];

// ── Live clock ticker: HH:MM:SS UTC, updated each second ──────────────────
function useClock(): string {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!now) return '——:——:——';
  return now.toISOString().slice(11, 19);
}

function useEventCounter(initial = 3241) {
  const [n, setN] = useState(initial);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setN((v) => v + 1);
      window.setTimeout(tick, 1800 + Math.random() * 2400);
    };
    const id = window.setTimeout(tick, 2200);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);
  return n;
}

// ── Detection bbox SVG overlay ─────────────────────────────────────────────

const DetectionOverlay: React.FC<{ detections: DetectionBox[] }> = ({ detections }) => {
  if (detections.length === 0) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      {detections.map((d, i) => {
        const stroke = d.level === 'alert' ? '#ef4444' : '#10b981';
        return (
          <g key={i}>
            {/* Corner brackets — only the corners are drawn, not full rectangle */}
            <g
              fill="none"
              stroke={stroke}
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="square"
            >
              {/* TL */}
              <path d={`M ${d.x * 100} ${(d.y + 0.06) * 100} L ${d.x * 100} ${d.y * 100} L ${(d.x + 0.06) * 100} ${d.y * 100}`} />
              {/* TR */}
              <path d={`M ${(d.x + d.w - 0.06) * 100} ${d.y * 100} L ${(d.x + d.w) * 100} ${d.y * 100} L ${(d.x + d.w) * 100} ${(d.y + 0.06) * 100}`} />
              {/* BR */}
              <path d={`M ${(d.x + d.w) * 100} ${(d.y + d.h - 0.06) * 100} L ${(d.x + d.w) * 100} ${(d.y + d.h) * 100} L ${(d.x + d.w - 0.06) * 100} ${(d.y + d.h) * 100}`} />
              {/* BL */}
              <path d={`M ${(d.x + 0.06) * 100} ${(d.y + d.h) * 100} L ${d.x * 100} ${(d.y + d.h) * 100} L ${d.x * 100} ${(d.y + d.h - 0.06) * 100}`} />
            </g>
            {/* Faint outline */}
            <rect
              x={d.x * 100}
              y={d.y * 100}
              width={d.w * 100}
              height={d.h * 100}
              fill={stroke}
              fillOpacity={0.06}
              stroke={stroke}
              strokeOpacity={0.25}
              strokeWidth={0.3}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
    </svg>
  );
};

const DetectionLabels: React.FC<{ detections: DetectionBox[] }> = ({ detections }) => {
  // Absolute-positioned labels rather than SVG text — keeps mono font crisp.
  return (
    <>
      {detections.map((d, i) => (
        <span
          key={i}
          className={`pointer-events-none absolute font-mono text-[8px] uppercase tracking-[0.18em] ${
            d.level === 'alert' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-black'
          } px-1 py-0.5`}
          style={{
            left: `${(d.x + d.w) * 100}%`,
            top: `${d.y * 100}%`,
            transform: 'translate(-100%, -100%)',
          }}
        >
          {d.label} {d.conf.toFixed(2)}
        </span>
      ))}
    </>
  );
};

// ── Single camera tile ─────────────────────────────────────────────────────

const Tile: React.FC<{ tile: CameraTile; clock: string }> = ({ tile, clock }) => {
  const borderClass = tile.alerting
    ? 'border-red-500'
    : tile.active
      ? 'border-white/70'
      : 'border-white/30';
  return (
    <div
      className={`relative overflow-hidden border-2 bg-black ${borderClass}`}
    >
      {/* Photo backdrop */}
      <Image
        src={tile.photo}
        alt=""
        fill
        sizes="(min-width: 1024px) 25vw, 50vw"
        className="nx-photo object-cover"
        style={{ objectPosition: tile.origin }}
      />
      {/* Scanline / vignette */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/30"
      />
      {/* Detection bboxes */}
      <DetectionOverlay detections={tile.detections} />
      <DetectionLabels detections={tile.detections} />
      {/* Top label bar */}
      <div className="absolute inset-x-0 top-0 flex flex-col gap-0.5 bg-black/75 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 truncate">
            {tile.active ? (
              <span className="relative inline-flex h-1.5 w-1.5">
                <span
                  className={`absolute inset-0 rounded-full nx-pulse-dot ${
                    tile.alerting ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                />
                <span
                  className={`relative inline-block h-1.5 w-1.5 rounded-full ${
                    tile.alerting ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                />
              </span>
            ) : (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-500" />
            )}
            <span className="font-semibold">{tile.label}</span>
            <span className="text-white/60">·</span>
            <span className="truncate text-white/70">{tile.zone}</span>
          </span>
          <span className="hidden text-white/55 sm:inline">
            {tile.alerting ? 'ALERT' : tile.active ? 'LIVE' : 'IDLE'}
          </span>
        </div>
        {/* Hazard-scenario tag — small uppercase line that names what the
            tile depicts so readers don't have to infer from the visuals. */}
        <span className={`truncate text-[8px] tracking-[0.22em] ${tile.alerting ? 'text-red-300' : tile.active ? 'text-emerald-300/80' : 'text-white/45'}`}>
          ▸ {tile.scenario}
        </span>
      </div>
      {/* Bottom-right metadata */}
      <div className="absolute bottom-1 right-2 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-white/70">
        <span>{clock} UTC</span>
        <span className="text-white/40">·</span>
        <span>1920×1080</span>
      </div>
      {/* Bottom-left rec dot when active */}
      {tile.active && (
        <div className="absolute bottom-1 left-2 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-white/70">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-red-500 nx-pulse-dot" />
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
          </span>
          REC
        </div>
      )}
      {/* Alert ribbon for the alerting tile */}
      {tile.alerting && (
        <div className="absolute inset-x-0 bottom-0 bg-red-500/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white">
          <span className="font-bold">▸ HAZARD DETECTED</span> · WORKER IN LIFT ZONE
        </div>
      )}
    </div>
  );
};

// ── Main camera grid peek ──────────────────────────────────────────────────

interface CameraGridPeekProps {
  className?: string;
}

export function CameraGridPeek({ className }: CameraGridPeekProps) {
  const clock = useClock();
  const events = useEventCounter();
  const activeCount = TILES.filter((t) => t.active).length;
  const alertCount = TILES.filter((t) => t.alerting).length;
  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden rounded-[6px] border-2 border-white bg-black text-white ${className ?? ''}`}
    >
      {/* Header */}
      <header className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-white/30 bg-black px-3">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em]">
          <span className="inline-flex h-4 w-4 items-center justify-center border-2 border-white text-[8px] font-bold">
            N
          </span>
          <span className="hidden sm:inline text-white/55">VISION</span>
          <span className="hidden sm:inline text-white/30">/</span>
          <span className="hidden sm:inline text-white/55">LIVE FEED</span>
          <span className="hidden md:inline text-white/30">/</span>
          <span className="hidden md:inline text-white">ALL SITES</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-emerald-500 nx-pulse-dot" />
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-emerald-400">DETECTING</span>
          <span className="text-white/30">·</span>
          <span>
            <span className="tabular-nums">{activeCount}</span>/
            <span className="tabular-nums">{TILES.length}</span> CAMS
          </span>
        </div>
      </header>

      {/* 2×2 grid of camera tiles. On narrow viewports we stack 1 col × 4
          rows so each tile has the full container width, otherwise the CAM
          label + zone + scenario lines truncate aggressively. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-4 gap-[2px] bg-white/15 sm:grid-cols-2 sm:grid-rows-2">
        {TILES.map((t) => (
          <Tile key={t.id} tile={t} clock={clock} />
        ))}
      </div>

      {/* Footer status */}
      <footer className="flex h-7 shrink-0 items-center justify-between gap-4 border-t border-white/30 bg-black px-3 font-mono text-[9px] uppercase tracking-[0.22em]">
        <div className="flex items-center gap-3 text-white/55">
          <span className={alertCount > 0 ? 'text-red-400' : 'text-emerald-400'}>
            {alertCount > 0
              ? `▸ ${alertCount} ACTIVE ALERT${alertCount === 1 ? '' : 'S'}`
              : '▸ NOMINAL'}
          </span>
          <span className="hidden sm:inline text-white/20">·</span>
          <span className="hidden sm:inline">
            <span className="tabular-nums text-white/80">{events.toLocaleString()}</span> EVT / 24H
          </span>
        </div>
        <div className="hidden items-center gap-3 text-white/55 md:flex">
          <span>23ms LATENCY</span>
          <span className="text-white/20">·</span>
          <span>EDGE-AI · ON-CAM</span>
        </div>
      </footer>
    </div>
  );
}
