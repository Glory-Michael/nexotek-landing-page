'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  conf: number;
  status: 'ok' | 'warn' | 'alert';
}

interface Tile {
  id: string;
  label: string;
  boxes: Box[];
  /** Static background pattern hint */
  pattern: 'corridor' | 'lobby' | 'parking' | 'scaffold' | 'dock' | 'roofline';
}

const STATUS_COLOR: Record<Box['status'], string> = {
  ok: '#3DB46D',
  warn: '#F4D544',
  alert: '#D9342B',
};

// Box coords are in viewBox 100×75 (matches tile 4:3 aspect, no axis stretch).
// Realistic CCTV proportions: standing person ≈ 1 : 2.5–3 (w:h), side-on
// vehicle ≈ 2 : 1. Each bbox is anchored to a surface in its PatternBg —
// floor, scaffold beam, or parking lot — never floating.
const TILES: Tile[] = [
  {
    // Lobby floor (overlay Y 45–75). Person standing mid-room, feet at Y=61.
    id: 'cam-01',
    label: 'CAM 01 · LOBBY',
    pattern: 'lobby',
    boxes: [
      { x: 43, y: 23, w: 13, h: 38, label: 'PERSON', conf: 0.94, status: 'ok' },
    ],
  },
  {
    // Scaffold beams sit at Y=9,21,33,45,57,69. Workers' feet land ON a beam.
    id: 'cam-02',
    label: 'CAM 02 · SCAFFOLD L3',
    pattern: 'scaffold',
    boxes: [
      { x: 24, y: 27, w: 9,  h: 18, label: 'PPE-OK', conf: 0.91, status: 'ok' }, // feet on Y=45 beam
      { x: 60, y: 39, w: 9,  h: 18, label: 'PPE-OK', conf: 0.88, status: 'ok' }, // feet on Y=57 beam
    ],
  },
  {
    // Dock has 3 bays at x=6/36/66 (28 wide). Truck reversed into middle bay,
    // wheels on dock floor (Y=52.5–75).
    id: 'cam-03',
    label: 'CAM 03 · DOCK',
    pattern: 'dock',
    boxes: [
      { x: 37, y: 48, w: 26, h: 22, label: 'VEHICLE', conf: 0.86, status: 'warn' },
    ],
  },
  {
    // Parking surface fills Y=15–75. Vehicle parked broadside in foreground,
    // wheels at Y=71. Person walking on the lot to the right, feet at Y=72.
    id: 'cam-04',
    label: 'CAM 04 · PARKING',
    pattern: 'parking',
    boxes: [
      { x: 14, y: 53, w: 34, h: 18, label: 'VEHICLE', conf: 0.93, status: 'ok' },
      { x: 72, y: 34, w: 10, h: 38, label: 'PERSON',  conf: 0.87, status: 'warn' },
    ],
  },
  {
    id: 'cam-05',
    label: 'CAM 05 · ROOFLINE',
    pattern: 'roofline',
    boxes: [],
  },
  {
    // Corridor floor recedes from Y=22.5 (vanishing) to Y=45+ (edges/foreground).
    // Person mid-distance walking down the corridor, feet at Y=45.
    id: 'cam-06',
    label: 'CAM 06 · CORRIDOR',
    pattern: 'corridor',
    boxes: [
      { x: 45, y: 13, w: 9, h: 32, label: 'PERSON', conf: 0.96, status: 'ok' },
    ],
  },
];

function PatternBg({ pattern }: { pattern: Tile['pattern'] }) {
  // Monochrome SVG fills meant to fill the FULL tile (not just the floor area).
  // Color stops: bg #0A0A0A · midtone #141414 · highlight #1E1E1E · line #353535.
  // Designed to feel like a CCTV frame with ceiling/sky + subject + ground.
  const common = 'absolute inset-0';
  switch (pattern) {
    case 'corridor':
      return (
        <svg className={common} viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect width="100" height="100" fill="#0A0A0A" />
          {/* Ceiling */}
          <path d="M0 0 L100 0 L100 38 L50 30 L0 38 Z" fill="#141414" />
          {[18, 30].map((x) => (
            <rect key={`light-${x}`} x={x * 1.3} y="6" width="6" height="2" fill="#2A2A2A" />
          ))}
          {/* Floor */}
          <path d="M0 60 L50 30 L100 60 L100 100 L0 100Z" fill="#141414" />
          <path d="M0 60 L50 30 L100 60" stroke="#353535" strokeWidth="0.5" />
          <path d="M50 30 L50 100" stroke="#353535" strokeWidth="0.4" />
          {/* Wall edge */}
          <line x1="0" y1="38" x2="0" y2="60" stroke="#2A2A2A" strokeWidth="0.4" />
          <line x1="100" y1="38" x2="100" y2="60" stroke="#2A2A2A" strokeWidth="0.4" />
          {/* Doors at distance */}
          <rect x="40" y="42" width="6" height="14" fill="#1A1A1A" stroke="#2A2A2A" strokeWidth="0.3" />
          <rect x="54" y="42" width="6" height="14" fill="#1A1A1A" stroke="#2A2A2A" strokeWidth="0.3" />
          {/* Fade overlay — pushes the abstract bg back so subjects pop */}
          <rect width="100" height="100" fill="#0A0A0A" opacity="0.5" />
        </svg>
      );
    case 'lobby':
      return (
        <svg className={common} viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect width="100" height="100" fill="#0A0A0A" />
          {/* Back wall */}
          <rect x="0" y="22" width="100" height="38" fill="#141414" />
          {/* Ceiling band */}
          <rect x="0" y="0" width="100" height="22" fill="#0F0F0F" />
          <line x1="0" y1="22" x2="100" y2="22" stroke="#2A2A2A" strokeWidth="0.4" />
          {/* Doors */}
          <rect x="14" y="32" width="14" height="28" fill="#0C0C0C" stroke="#353535" strokeWidth="0.4" />
          <rect x="72" y="32" width="14" height="28" fill="#0C0C0C" stroke="#353535" strokeWidth="0.4" />
          {/* Hanging lights */}
          {[20, 50, 80].map((x) => (
            <g key={`l-${x}`}>
              <line x1={x} y1="0" x2={x} y2="8" stroke="#2A2A2A" strokeWidth="0.3" />
              <rect x={x - 4} y="8" width="8" height="2" fill="#1E1E1E" />
            </g>
          ))}
          {/* Floor */}
          <rect x="0" y="60" width="100" height="40" fill="#141414" />
          <line x1="0" y1="60" x2="100" y2="60" stroke="#353535" strokeWidth="0.4" />
          {[25, 50, 75].map((x) => (
            <line key={`fl-${x}`} x1={x} y1="60" x2={x} y2="100" stroke="#2A2A2A" strokeWidth="0.3" />
          ))}
          <rect width="100" height="100" fill="#0A0A0A" opacity="0.5" />
        </svg>
      );
    case 'parking':
      return (
        <svg className={common} viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect width="100" height="100" fill="#0A0A0A" />
          {/* Sky / dusk gradient via two bands */}
          <rect x="0" y="0" width="100" height="14" fill="#0E0E0E" />
          <rect x="0" y="14" width="100" height="6" fill="#141414" />
          {/* Horizon building silhouettes */}
          <path d="M0 20 L8 12 L18 12 L18 20 L34 20 L34 8 L48 8 L48 20 L64 20 L64 14 L78 14 L78 20 L100 20 Z" fill="#161616" />
          {/* Lamp posts */}
          {[10, 40, 70, 95].map((x) => (
            <g key={`lp-${x}`}>
              <line x1={x} y1="20" x2={x} y2="62" stroke="#2A2A2A" strokeWidth="0.3" />
              <circle cx={x} cy="22" r="1" fill="#353535" />
            </g>
          ))}
          {/* Parking lot */}
          <rect x="0" y="20" width="100" height="80" fill="#0F0F0F" />
          {[16, 32, 48, 64, 80].map((x) => (
            <line key={x} x1={x} y1="62" x2={x} y2="98" stroke="#353535" strokeWidth="0.4" />
          ))}
          <line x1="0" y1="62" x2="100" y2="62" stroke="#353535" strokeWidth="0.4" />
          <line x1="0" y1="80" x2="100" y2="80" stroke="#2A2A2A" strokeWidth="0.3" strokeDasharray="2 2" />
          <rect width="100" height="100" fill="#0A0A0A" opacity="0.5" />
        </svg>
      );
    case 'scaffold':
      return (
        <svg className={common} viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect width="100" height="100" fill="#0A0A0A" />
          {/* Sky band */}
          <rect x="0" y="0" width="100" height="12" fill="#0F0F0F" />
          {/* Scaffold trusses — denser cross-grid */}
          {[12, 28, 44, 60, 76, 92].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#353535" strokeWidth="0.5" />
          ))}
          {[10, 30, 50, 70, 90].map((x) => (
            <line key={`v${x}`} x1={x} y1="12" x2={x} y2="100" stroke="#353535" strokeWidth="0.5" />
          ))}
          {/* Diagonal braces */}
          {[12, 28, 44, 60, 76].map((y, i) => (
            <line
              key={`d${y}`}
              x1={i % 2 === 0 ? 10 : 30}
              y1={y}
              x2={i % 2 === 0 ? 30 : 50}
              y2={y + 16}
              stroke="#2A2A2A"
              strokeWidth="0.3"
            />
          ))}
          <rect width="100" height="100" fill="#0A0A0A" opacity="0.5" />
        </svg>
      );
    case 'dock':
      return (
        <svg className={common} viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect width="100" height="100" fill="#0A0A0A" />
          {/* Sky / ceiling */}
          <rect x="0" y="0" width="100" height="28" fill="#0F0F0F" />
          {/* Pipes / conduit on ceiling */}
          <line x1="0" y1="8" x2="100" y2="8" stroke="#2A2A2A" strokeWidth="0.4" />
          <line x1="0" y1="14" x2="100" y2="14" stroke="#2A2A2A" strokeWidth="0.3" />
          <line x1="0" y1="20" x2="100" y2="20" stroke="#2A2A2A" strokeWidth="0.3" />
          {/* Bay doors */}
          {[6, 36, 66].map((x) => (
            <g key={`bay-${x}`}>
              <rect x={x} y="28" width="28" height="42" fill="#141414" stroke="#353535" strokeWidth="0.4" />
              {[34, 40, 46, 52, 58, 64].map((y) => (
                <line key={y} x1={x} y1={y} x2={x + 28} y2={y} stroke="#2A2A2A" strokeWidth="0.25" />
              ))}
            </g>
          ))}
          {/* Floor */}
          <rect x="0" y="70" width="100" height="30" fill="#141414" />
          <line x1="0" y1="70" x2="100" y2="70" stroke="#353535" strokeWidth="0.5" />
          {/* Floor stripes */}
          <line x1="0" y1="84" x2="100" y2="84" stroke="#2A2A2A" strokeWidth="0.3" strokeDasharray="3 3" />
          <rect width="100" height="100" fill="#0A0A0A" opacity="0.5" />
        </svg>
      );
    case 'roofline':
      return (
        <svg className={common} viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect width="100" height="100" fill="#0A0A0A" />
          {/* Sky gradient bands */}
          <rect x="0" y="0" width="100" height="24" fill="#0F0F0F" />
          <rect x="0" y="24" width="100" height="14" fill="#141414" />
          {/* Distant building silhouettes */}
          <path d="M0 40 L10 36 L18 36 L18 40 L30 40 L30 32 L42 32 L42 40 L56 40 L56 36 L66 36 L66 40 L100 40 Z" fill="#161616" />
          {/* Vents / chimneys on roofline */}
          <rect x="22" y="40" width="6" height="10" fill="#1A1A1A" />
          <rect x="60" y="42" width="4" height="8" fill="#1A1A1A" />
          {/* Roof surface */}
          <path d="M0 60 L100 50 L100 100 L0 100 Z" fill="#141414" />
          <line x1="0" y1="60" x2="100" y2="50" stroke="#353535" strokeWidth="0.5" />
          {[20, 40, 60, 80].map((x, i) => (
            <line
              key={`rl-${x}`}
              x1={x}
              y1={60 - i * 0.5}
              x2={x + 2}
              y2={100}
              stroke="#2A2A2A"
              strokeWidth="0.3"
            />
          ))}
          <rect width="100" height="100" fill="#0A0A0A" opacity="0.5" />
        </svg>
      );
  }
}

/**
 * Detailed silhouette of the detected subject, rendered inside its bounding
 * box. With the pattern bg now faded (45% black overlay), the subject reads
 * with strong contrast at brighter fills (#4A4A4A base + #6A6A6A highlight
 * rim) without losing the "CCTV monochrome" feel.
 */
function Silhouette({ b }: { b: Box }) {
  const label = b.label.toUpperCase();
  const BASE = '#4A4A4A';
  const HI = '#6A6A6A';
  const SHADOW = '#1A1A1A';
  const X = (rx: number) => b.x + b.w * rx;
  const Y = (ry: number) => b.y + b.h * ry;

  if (label === 'VEHICLE') {
    return (
      <g opacity={0.95}>
        {/* Ground shadow under the vehicle */}
        <ellipse cx={X(0.5)} cy={Y(0.97)} rx={b.w * 0.46} ry={b.h * 0.025} fill="#000" opacity={0.4} />

        {/* Body shell: hood + cabin + bed, profile silhouette */}
        <path
          d={`
            M ${X(0.04)} ${Y(0.62)}
            Q ${X(0.04)} ${Y(0.50)} ${X(0.10)} ${Y(0.50)}
            L ${X(0.20)} ${Y(0.22)}
            Q ${X(0.24)} ${Y(0.16)} ${X(0.30)} ${Y(0.16)}
            L ${X(0.70)} ${Y(0.16)}
            Q ${X(0.76)} ${Y(0.16)} ${X(0.80)} ${Y(0.22)}
            L ${X(0.90)} ${Y(0.50)}
            Q ${X(0.96)} ${Y(0.50)} ${X(0.96)} ${Y(0.62)}
            L ${X(0.96)} ${Y(0.86)}
            Q ${X(0.96)} ${Y(0.92)} ${X(0.90)} ${Y(0.92)}
            L ${X(0.10)} ${Y(0.92)}
            Q ${X(0.04)} ${Y(0.92)} ${X(0.04)} ${Y(0.86)}
            Z
          `}
          fill={BASE}
        />

        {/* Roofline highlight */}
        <path
          d={`M ${X(0.22)} ${Y(0.20)} L ${X(0.78)} ${Y(0.20)}`}
          stroke={HI}
          strokeWidth="0.5"
          fill="none"
        />

        {/* Windshield + side window with pillar mullion */}
        <path
          d={`M ${X(0.26)} ${Y(0.24)} L ${X(0.74)} ${Y(0.24)} L ${X(0.84)} ${Y(0.48)} L ${X(0.16)} ${Y(0.48)} Z`}
          fill={SHADOW}
        />
        <line x1={X(0.50)} y1={Y(0.24)} x2={X(0.50)} y2={Y(0.48)} stroke={BASE} strokeWidth="0.45" />

        {/* Door seam */}
        <line x1={X(0.50)} y1={Y(0.50)} x2={X(0.50)} y2={Y(0.86)} stroke={SHADOW} strokeWidth="0.35" />
        {/* Body waist line */}
        <line x1={X(0.06)} y1={Y(0.68)} x2={X(0.94)} y2={Y(0.68)} stroke={HI} strokeWidth="0.3" opacity={0.7} />

        {/* Headlights + tail lights */}
        <rect x={X(0.06)} y={Y(0.58)} width={b.w * 0.08} height={b.h * 0.06} fill="#D9D9D9" opacity={0.85} />
        <rect x={X(0.86)} y={Y(0.58)} width={b.w * 0.08} height={b.h * 0.06} fill="#FF6F6F" opacity={0.55} />

        {/* Grille slats */}
        {[0.74, 0.78, 0.82].map((ry) => (
          <line key={`gr-${ry}`} x1={X(0.18)} y1={Y(ry)} x2={X(0.32)} y2={Y(ry)} stroke={SHADOW} strokeWidth="0.25" />
        ))}

        {/* Wheel wells */}
        <ellipse cx={X(0.22)} cy={Y(0.92)} rx={b.w * 0.13} ry={b.h * 0.095} fill={SHADOW} />
        <ellipse cx={X(0.78)} cy={Y(0.92)} rx={b.w * 0.13} ry={b.h * 0.095} fill={SHADOW} />

        {/* Wheels — tire + rim + hub */}
        <circle cx={X(0.22)} cy={Y(0.93)} r={b.w * 0.105} fill="#0A0A0A" />
        <circle cx={X(0.78)} cy={Y(0.93)} r={b.w * 0.105} fill="#0A0A0A" />
        <circle cx={X(0.22)} cy={Y(0.93)} r={b.w * 0.055} fill={HI} opacity={0.85} />
        <circle cx={X(0.78)} cy={Y(0.93)} r={b.w * 0.055} fill={HI} opacity={0.85} />
        <circle cx={X(0.22)} cy={Y(0.93)} r={b.w * 0.018} fill={SHADOW} />
        <circle cx={X(0.78)} cy={Y(0.93)} r={b.w * 0.018} fill={SHADOW} />
      </g>
    );
  }

  // PERSON / PPE-OK — anatomical humanoid
  const isPpe = label === 'PPE-OK';
  return (
    <g opacity={0.95}>
      {/* Ground shadow */}
      <ellipse cx={X(0.5)} cy={Y(0.985)} rx={b.w * 0.32} ry={b.h * 0.015} fill="#000" opacity={0.45} />

      {/* Head — tuned for uniform 1:1 axis scaling so it reads round, not oval */}
      <ellipse cx={X(0.5)} cy={Y(0.085)} rx={b.w * 0.32} ry={b.h * 0.068} fill={BASE} />
      <ellipse cx={X(0.5)} cy={Y(0.07)} rx={b.w * 0.22} ry={b.h * 0.028} fill={HI} opacity={0.55} />

      {/* Neck */}
      <rect x={X(0.42)} y={Y(0.15)} width={b.w * 0.16} height={b.h * 0.035} fill={BASE} />

      {/* Torso — broad shoulders, tapered waist */}
      <path
        d={`
          M ${X(0.20)} ${Y(0.20)}
          Q ${X(0.36)} ${Y(0.18)} ${X(0.50)} ${Y(0.185)}
          Q ${X(0.64)} ${Y(0.18)} ${X(0.80)} ${Y(0.20)}
          L ${X(0.72)} ${Y(0.48)}
          L ${X(0.70)} ${Y(0.58)}
          L ${X(0.30)} ${Y(0.58)}
          L ${X(0.28)} ${Y(0.48)}
          Z
        `}
        fill={BASE}
      />
      {/* Shoulder highlight */}
      <path
        d={`M ${X(0.22)} ${Y(0.21)} Q ${X(0.50)} ${Y(0.185)} ${X(0.78)} ${Y(0.21)}`}
        stroke={HI}
        strokeWidth="0.6"
        fill="none"
      />

      {/* Arms hanging at sides — tapered to wrists */}
      <path
        d={`
          M ${X(0.20)} ${Y(0.21)}
          L ${X(0.16)} ${Y(0.36)}
          L ${X(0.14)} ${Y(0.52)}
          L ${X(0.20)} ${Y(0.57)}
          L ${X(0.26)} ${Y(0.52)}
          L ${X(0.26)} ${Y(0.26)}
          Z
        `}
        fill={BASE}
      />
      <path
        d={`
          M ${X(0.80)} ${Y(0.21)}
          L ${X(0.84)} ${Y(0.36)}
          L ${X(0.86)} ${Y(0.52)}
          L ${X(0.80)} ${Y(0.57)}
          L ${X(0.74)} ${Y(0.52)}
          L ${X(0.74)} ${Y(0.26)}
          Z
        `}
        fill={BASE}
      />
      {/* Hands (small ellipses at wrists) */}
      <ellipse cx={X(0.20)} cy={Y(0.58)} rx={b.w * 0.055} ry={b.h * 0.022} fill={BASE} />
      <ellipse cx={X(0.80)} cy={Y(0.58)} rx={b.w * 0.055} ry={b.h * 0.022} fill={BASE} />

      {/* Hips */}
      <path
        d={`M ${X(0.30)} ${Y(0.58)} L ${X(0.70)} ${Y(0.58)} L ${X(0.72)} ${Y(0.63)} L ${X(0.28)} ${Y(0.63)} Z`}
        fill={BASE}
      />

      {/* Legs — tapered with knee subtle indent */}
      <path
        d={`
          M ${X(0.30)} ${Y(0.63)}
          L ${X(0.34)} ${Y(0.78)}
          L ${X(0.35)} ${Y(0.94)}
          L ${X(0.46)} ${Y(0.94)}
          L ${X(0.47)} ${Y(0.78)}
          L ${X(0.48)} ${Y(0.63)}
          Z
        `}
        fill={BASE}
      />
      <path
        d={`
          M ${X(0.52)} ${Y(0.63)}
          L ${X(0.53)} ${Y(0.78)}
          L ${X(0.54)} ${Y(0.94)}
          L ${X(0.65)} ${Y(0.94)}
          L ${X(0.66)} ${Y(0.78)}
          L ${X(0.70)} ${Y(0.63)}
          Z
        `}
        fill={BASE}
      />

      {/* Feet */}
      <ellipse cx={X(0.40)} cy={Y(0.96)} rx={b.w * 0.08} ry={b.h * 0.028} fill={SHADOW} />
      <ellipse cx={X(0.60)} cy={Y(0.96)} rx={b.w * 0.08} ry={b.h * 0.028} fill={SHADOW} />

      {/* PPE-OK: hardhat + hi-vis vest stripes */}
      {isPpe && (
        <>
          {/* Hardhat dome — repositioned for the smaller, higher head */}
          <path
            d={`
              M ${X(0.16)} ${Y(0.10)}
              Q ${X(0.50)} ${Y(-0.02)} ${X(0.84)} ${Y(0.10)}
              L ${X(0.86)} ${Y(0.12)}
              L ${X(0.14)} ${Y(0.12)}
              Z
            `}
            fill="#F4D544"
          />
          {/* Hardhat ridge */}
          <path
            d={`M ${X(0.34)} ${Y(0.045)} Q ${X(0.50)} ${Y(0.005)} ${X(0.66)} ${Y(0.045)}`}
            stroke="#C5A833"
            strokeWidth="0.5"
            fill="none"
          />
          {/* Brim line */}
          <line
            x1={X(0.12)}
            y1={Y(0.12)}
            x2={X(0.88)}
            y2={Y(0.12)}
            stroke="#A98A28"
            strokeWidth="0.4"
          />

          {/* Hi-vis vest — full chest panel with reflective stripes */}
          <path
            d={`
              M ${X(0.24)} ${Y(0.25)}
              Q ${X(0.50)} ${Y(0.235)} ${X(0.76)} ${Y(0.25)}
              L ${X(0.72)} ${Y(0.57)}
              L ${X(0.28)} ${Y(0.57)}
              Z
            `}
            fill="#F4D544"
            opacity={0.92}
          />
          <rect x={X(0.26)} y={Y(0.37)} width={b.w * 0.48} height={b.h * 0.024} fill="#E8E8E8" opacity={0.85} />
          <rect x={X(0.27)} y={Y(0.47)} width={b.w * 0.46} height={b.h * 0.020} fill="#E8E8E8" opacity={0.7} />
        </>
      )}
    </g>
  );
}

export function SyntheticCameraGrid({ className = '' }: { className?: string }) {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLUListElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !visible) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 3200);
    return () => window.clearInterval(id);
  }, [reduced, visible]);

  return (
    <ul
      ref={ref}
      className={`grid grid-cols-3 gap-2 ${className}`}
      aria-label="Synthetic detection-grid preview"
    >
      {TILES.map((t, i) => {
        const showBoxes = !reduced ? (tick + i) % 2 === 0 : true;
        return (
          <li
            key={t.id}
            className="relative aspect-[4/3] overflow-hidden border border-white/45 bg-neutral-950"
          >
            <PatternBg pattern={t.pattern} />
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 75"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
            >
              {showBoxes &&
                t.boxes.map((b, j) => (
                  <g key={`${t.id}-b${j}`}>
                    {/* Subject silhouette inside the bbox — viewBox aspect now
                        matches the tile aspect, so x and y units render 1:1
                        and silhouettes/bboxes are no longer stretched. */}
                    <Silhouette b={b} />
                    <rect
                      x={b.x}
                      y={b.y}
                      width={b.w}
                      height={b.h}
                      fill="none"
                      stroke={STATUS_COLOR[b.status]}
                      strokeWidth="0.6"
                    />
                    <text
                      x={b.x}
                      y={b.y - 1}
                      fontSize="2.4"
                      fontFamily="JetBrains Mono, monospace"
                      fill={STATUS_COLOR[b.status]}
                    >
                      {b.label} · {b.conf.toFixed(2)}
                    </text>
                  </g>
                ))}
            </svg>
            <span className="absolute left-2 top-2 font-mono text-[8px] uppercase tracking-[0.22em] text-neutral-400">
              {t.label}
            </span>
            <span
              aria-hidden
              className="absolute right-2 top-2 inline-block h-1 w-1 rounded-full"
              style={{
                background: showBoxes ? '#3DB46D' : '#3A3A3A',
                transition: 'background 240ms',
              }}
            />
          </li>
        );
      })}
    </ul>
  );
}
