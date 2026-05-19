'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { NxIcon } from '@/components/brand/nx-icon';
import type { FloorplanSceneKind } from './floorplan-scene-3d';

/**
 * 1:1 chrome recreation of camect-webapp's compact FloorplanWidget — the
 * "3D View" dashboard widget (header toolbar / spatial viewport /
 * environment tabs). Replaces AlertQueuePeek in the Vision section: the
 * alert-triage angle was redundant with OperatorCli to its left, so this
 * puts the *spatial* angle (cameras-in-space, default stored 3D
 * environment) front and center instead.
 *
 * The 3D viewport renders a NEW procedural scene (FloorplanScene3D) that
 * mirrors camect's built-in default environments — an Office and an
 * Outdoor "Streetview" — by primitive composition, the same way
 * SiteAssets3D builds those environments in camect. We do NOT reuse the
 * hero's InteractiveSkyline here; that's a different default space and
 * would conflate the two stories.
 */

const FloorplanScene3D = dynamic(
  () =>
    import('./floorplan-scene-3d').then((m) => ({ default: m.FloorplanScene3D })),
  { ssr: false },
);

interface FloorplanPeekProps {
  className?: string;
}

interface EnvOption {
  id: string;
  label: string;
  kind: FloorplanSceneKind;
  badge: string;
  cameraCount: number;
}

const ENVIRONMENTS: EnvOption[] = [
  { id: 'scaffold-l3', label: 'Scaffold · L3', kind: 'office',  badge: 'INDOOR',  cameraCount: 1 },
  { id: 'yard-north',  label: 'Yard · North',  kind: 'outdoor', badge: 'OUTDOOR', cameraCount: 1 },
];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export function FloorplanPeek({ className = '' }: FloorplanPeekProps) {
  const [envIndex, setEnvIndex] = useState(0);
  const reduced = usePrefersReducedMotion();
  const active = ENVIRONMENTS[envIndex];

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(
      () => setEnvIndex((i) => (i + 1) % ENVIRONMENTS.length),
      9000,
    );
    return () => window.clearInterval(timer);
  }, [reduced]);

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded border border-white/15 bg-black shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] ${className}`}
      style={{ minHeight: 460 }}
    >
      {/* Header toolbar — mirrors camect FloorplanWidget compact mode. The
          non-essential mode chips (360°, Walls, Reset) drop out below sm
          so the row never pushes past the mobile viewport; Splat stays as
          the active-state indicator. */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-white/15 bg-white/[0.03] px-3 py-2 sm:gap-2">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-indigo-400/40 bg-indigo-400/10 text-indigo-200">
          <NxIcon name="globe" size={11} aria-label="Spatial environment" />
        </span>
        <span className="mr-auto font-mono text-[11px] uppercase tracking-[0.18em] text-white sm:text-xs sm:tracking-[0.22em]">
          3D View
        </span>
        <span className="hidden sm:contents">
          <ToolbarChip label="360°" />
          <ToolbarChip label="Walls" />
          <ToolbarChip label="Reset" />
        </span>
        <ToolbarChip label="Splat" active />
        <span className="ml-1 hidden font-mono text-[10px] uppercase tracking-[0.22em] text-indigo-300 md:inline">
          Open Editor
        </span>
      </div>

      {/* 3D viewport — the default stored space (FloorplanScene3D) */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
        <div className="absolute inset-0">
          <FloorplanScene3D kind={active.kind} />
        </div>

        {/* Vignette to lift overlay HUD over the scene */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)',
          }}
        />

        {/* Site label — top-left HUD chip */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/85">
          <span className="rounded-sm border border-white/20 bg-black/55 px-2 py-0.5 backdrop-blur-sm">
            SPACE · {active.label.toUpperCase()}
          </span>
          <span className="rounded-sm border border-white/15 bg-black/40 px-2 py-0.5 backdrop-blur-sm text-white/55">
            {active.badge} · {active.cameraCount} CAM · LIVE
          </span>
        </div>

        {/* Compass / scale chip — bottom-right HUD */}
        <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-sm border border-white/15 bg-black/55 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/55 backdrop-blur-sm">
          <span>N ↑</span>
          <span className="h-3 w-px bg-white/20" aria-hidden />
          <span>5 m</span>
          <span className="ml-1 inline-block h-px w-6 bg-white/40" aria-hidden />
        </div>
      </div>

      {/* Environment tab strip — mirrors camect's floor-environments
          selector. On mobile we drop the right-aligned "DEFAULT · ..."
          repeater (which duplicates the active chip's own label) and
          disable horizontal scroll so the chips fit cleanly within the
          mockup. Above sm the repeater reappears as a quiet status note. */}
      <div className="flex shrink-0 items-center gap-1 overflow-hidden border-t border-white/15 bg-white/[0.03] px-2.5 py-1.5">
        {ENVIRONMENTS.map((env, i) => {
          const isActive = i === envIndex;
          return (
            <button
              key={env.id}
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={() => setEnvIndex(i)}
              className={`shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
                isActive
                  ? 'border-indigo-400/45 bg-indigo-500/15 text-indigo-100'
                  : 'border-white/15 bg-transparent text-white/55'
              }`}
            >
              {env.label}
            </button>
          );
        })}
        <span className="ml-auto hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.22em] text-white/40 sm:inline">
          DEFAULT · {active.label.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function ToolbarChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
        active
          ? 'border-indigo-400/45 bg-indigo-500/15 text-indigo-100'
          : 'border-white/15 bg-transparent text-white/55'
      }`}
    >
      {label}
    </span>
  );
}
