'use client';

import dynamic from 'next/dynamic';
import type { Vec2 } from '@/lib/spatial/polygon-clipping';
import type { CameraSpec } from './scene';

// Lazy-load the R3F scene so SSR doesn't try to evaluate three.js.
// Matches the pattern used by splat-viewer-loader.tsx.
const SpatialPeekScene = dynamic(
  () => import('./scene').then((m) => m.SpatialPeekScene),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-neutral-100 dark:bg-neutral-900">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
          LOADING SCENE…
        </span>
      </div>
    ),
  },
);

// ── Demo data ──────────────────────────────────────────────────────────────
// A simple rectangular zone with four ceiling-mounted cameras. Dimensions are
// in meters. Two cameras are flagged "active" (currently detecting) and emit
// green FOV cones; the others are quiet (gray).

const DEMO_ROOM: Vec2[] = [
  [-5.5, -4],
  [5.5, -4],
  [5.5, 4],
  [-5.5, 4],
];

const DEMO_CAMERAS: CameraSpec[] = [
  {
    id: '01',
    label: 'CAM 01 · SOUTH ENTRY',
    x: -4.5,
    z: -3,
    height: 2.8,
    rotationDeg: 35,
    tiltDeg: -14,
    hFovDeg: 86,
    vFovDeg: 54,
    reach: 14,
    active: false,
  },
  {
    id: '02',
    label: 'CAM 02 · NORTH WING',
    x: 4.5,
    z: -3,
    height: 2.8,
    rotationDeg: 145,
    tiltDeg: -12,
    hFovDeg: 92,
    vFovDeg: 58,
    reach: 16,
    active: true,
  },
  {
    id: '03',
    label: 'CAM 03 · LIFT ZONE',
    x: 4.5,
    z: 3,
    height: 2.8,
    rotationDeg: -135,
    tiltDeg: -12,
    hFovDeg: 88,
    vFovDeg: 55,
    reach: 14,
    active: true,
  },
  {
    id: '04',
    label: 'CAM 04 · DOCK BAY',
    x: -4.5,
    z: 3,
    height: 2.8,
    rotationDeg: -35,
    tiltDeg: -14,
    hFovDeg: 90,
    vFovDeg: 55,
    reach: 15,
    active: false,
  },
];

interface SpatialPeekProps {
  className?: string;
}

export function SpatialPeek({ className }: SpatialPeekProps) {
  return (
    <div className={className}>
      <SpatialPeekScene roomPolygon={DEMO_ROOM} wallHeight={3.2} cameras={DEMO_CAMERAS} selectedId="02" />
    </div>
  );
}

export { DEMO_ROOM, DEMO_CAMERAS };
