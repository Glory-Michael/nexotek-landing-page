'use client';

import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import type { CSSProperties, MutableRefObject, ReactNode, RefObject } from 'react';

interface IllustrationProps {
  readonly className?: string;
}

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      className={`block ${className ?? ''}`}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

// 0 — Radial burst: detection emanates outward, then reforms.
// Spokes oscillate length around a quiet core.
function PillarBurst({ className }: IllustrationProps) {
  const SPOKES = 18;
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return (
    <Frame className={className}>
      <g>
        {Array.from({ length: SPOKES }).map((_, i) => {
          const a = (i * Math.PI * 2) / SPOKES + 0.08;
          const cx = Math.cos(a);
          const cy = Math.sin(a);
          return (
            <line
              key={i}
              x1={r(18 + cx * 4.2)}
              y1={r(18 + cy * 4.2)}
              x2={r(18 + cx * 14)}
              y2={r(18 + cy * 14)}
              className="nx-pillar-burst__spoke"
              style={{ animationDelay: `${-(i / SPOKES) * 3.2}s` } as CSSProperties}
            />
          );
        })}
      </g>
      <circle cx="18" cy="18" r="2.6" />
      <circle cx="18" cy="18" r="0.9" fill="currentColor" stroke="none" />
    </Frame>
  );
}

// 1 — Sealed vessel: a closed container with a node orbiting inside it.
// Reads as "data circulating on-prem, never exits."
function PillarVessel({ className }: IllustrationProps) {
  return (
    <Frame className={className}>
      {/* Container outline, slightly off-grid for sketch feel */}
      <path d="M10.2 8.5 Q9.4 8 9.6 9.2 L9.3 17.8 Q9.3 28.2 18 29 Q26.7 28.2 26.7 17.8 L26.5 9.2 Q26.7 8 25.8 8.5 Z" />
      <path d="M10.2 11.4 Q18 12.1 25.8 11.3" opacity="0.55" />
      <path d="M10.2 11.4 Q18 10.7 25.8 11.3" opacity="0.55" />
      <g className="nx-pillar-vessel__orbit">
        <circle cx="18" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
      </g>
    </Frame>
  );
}

// 2 — Aperture stack: three iris lenses cascade open in sequence.
// Cameras → ONVIF → edge, signal traversing the layers.
function PillarApertures({ className }: IllustrationProps) {
  return (
    <Frame className={className}>
      {[9, 18, 27].map((cy, i) => (
        <g key={cy}>
          <circle cx="18" cy={cy} r="4.4" opacity="0.85" />
          <circle
            cx="18"
            cy={cy}
            r="2"
            className="nx-pillar-aperture__iris"
            style={{ animationDelay: `${-i * 0.7}s` } as CSSProperties}
          />
          {i < 2 && (
            <line
              x1="18"
              y1={cy + 4.8}
              x2="18"
              y2={cy + 4.2}
              opacity="0.5"
            />
          )}
        </g>
      ))}
    </Frame>
  );
}

// 3 — Folding form: a flat panel rotates around its vertical axis, becoming
// a dimensional plane. Paper report → forensic 3D walkthrough.
function PillarFold({ className }: IllustrationProps) {
  return (
    <Frame className={className}>
      <g className="nx-pillar-fold">
        {/* Outer panel — rotates in 3D via CSS */}
        <rect x="10" y="7" width="16" height="22" rx="0.4" />
        {/* Inner content lines suggesting page → scene */}
        <line x1="13" y1="11" x2="23" y2="11" opacity="0.65" />
        <line x1="13" y1="14" x2="21" y2="14" opacity="0.55" />
        <line x1="13" y1="17" x2="23" y2="17" opacity="0.45" />
        <line x1="13" y1="20" x2="22" y2="20" opacity="0.35" />
        <line x1="13" y1="23" x2="20" y2="23" opacity="0.25" />
      </g>
      {/* Static "shadow" twin behind, hints at the fold reveal */}
      <rect x="11.4" y="8.6" width="16" height="22" rx="0.4" opacity="0.18" />
    </Frame>
  );
}

// 4 — Orbiting nodes: a central node with three satellites at different
// radii orbiting at different speeds. Multiplayer spatial review.
function PillarOrbits({ className }: IllustrationProps) {
  return (
    <Frame className={className}>
      {/* Faint orbit guides */}
      <ellipse cx="18" cy="18" rx="6.5" ry="6.5" opacity="0.25" />
      <ellipse cx="18" cy="18" rx="10.5" ry="4" opacity="0.25" />
      <ellipse cx="18" cy="18" rx="13" ry="9" opacity="0.18" />
      {/* Center node */}
      <circle cx="18" cy="18" r="2.1" fill="currentColor" stroke="none" />
      {/* Orbiting satellites — each on its own animated group */}
      <g className="nx-pillar-orbit-a">
        <circle cx="24.5" cy="18" r="1.3" fill="currentColor" stroke="none" />
      </g>
      <g className="nx-pillar-orbit-b">
        <circle cx="7.5" cy="18" r="1.15" fill="currentColor" stroke="none" />
      </g>
      <g className="nx-pillar-orbit-c">
        <circle cx="18" cy="5" r="1" fill="currentColor" stroke="none" />
      </g>
    </Frame>
  );
}

// 5 — Traced floor: a pentagon site outline with a marker tracing the
// perimeter — site-specific training paths replayed.
function PillarTrace({ className }: IllustrationProps) {
  // Closed pentagon-ish path, slightly irregular for hand-drawn feel
  const pathD = 'M9 11 L19 7 L28 12 L25 27 L11 26 Z';
  return (
    <Frame className={className}>
      <path d={pathD} opacity="0.55" />
      <path
        d={pathD}
        className="nx-pillar-trace__marker"
        pathLength={1}
        strokeWidth={2}
      />
      <circle cx="18" cy="17" r="0.9" opacity="0.7" />
      <line x1="14.5" y1="13" x2="16" y2="14" opacity="0.4" />
      <line x1="20" y1="20" x2="22" y2="22" opacity="0.4" />
    </Frame>
  );
}

// 6 — Stamped seal: concentric rings + radial ticks rotating like a
// notary stamp. IACET / CEU credentialing.
function PillarSeal({ className }: IllustrationProps) {
  const TICKS = 16;
  return (
    <Frame className={className}>
      <g className="nx-pillar-seal">
        <circle cx="18" cy="18" r="13" />
        <circle cx="18" cy="18" r="10" opacity="0.55" />
        <circle cx="18" cy="18" r="7" opacity="0.35" />
        {Array.from({ length: TICKS }).map((_, i) => {
          const a = (i * Math.PI * 2) / TICKS;
          const cx = Math.cos(a);
          const cy = Math.sin(a);
          const r = (n: number) => Math.round(n * 1000) / 1000;
          return (
            <line
              key={i}
              x1={r(18 + cx * 10.5)}
              y1={r(18 + cy * 10.5)}
              x2={r(18 + cx * 12.7)}
              y2={r(18 + cy * 12.7)}
            />
          );
        })}
      </g>
      {/* Inner emblem */}
      <path d="M14.5 18 L17 20.6 L22 15.4" strokeWidth={1.3} />
    </Frame>
  );
}

// 7 — Contour wave: stacked elevation contours undulate softly, like a
// risk-topography read. Carrier underwriting / loss-history signal.
function PillarContours({ className }: IllustrationProps) {
  // Four sinusoidal paths at different vertical offsets, each tagged for
  // staggered animation that produces a "breathing" landscape.
  const wave = (offset: number) =>
    `M5 ${18 + offset} Q11 ${14 + offset} 18 ${18 + offset} T31 ${18 + offset}`;
  return (
    <Frame className={className}>
      <path d={wave(-8)} opacity="0.35" className="nx-pillar-contour-a" />
      <path d={wave(-3)} opacity="0.55" className="nx-pillar-contour-b" />
      <path d={wave(2)} opacity="0.8" className="nx-pillar-contour-c" />
      <path d={wave(7)} opacity="0.55" className="nx-pillar-contour-d" />
      {/* Small marker hovering over a peak */}
      <circle cx="18" cy="8.5" r="0.9" fill="currentColor" stroke="none" />
      <line x1="18" y1="9.5" x2="18" y2="13" opacity="0.5" />
    </Frame>
  );
}

const ILLUSTRATIONS = [
  PillarBurst,
  PillarVessel,
  PillarApertures,
  PillarFold,
  PillarOrbits,
  PillarTrace,
  PillarSeal,
  PillarContours,
] as const;

export function PillarIllustration({
  index,
  className,
}: {
  readonly index: number;
  readonly className?: string;
}) {
  const Component = ILLUSTRATIONS[index % ILLUSTRATIONS.length];
  return <Component className={className} />;
}

// Particle swarm that drifts in a smooth flow field, then periodically morphs
// into a target shape tied to the card's content, holds the form briefly, and
// dissolves back. Cycle: chaos → form → hold → dissolve → chaos … forever.
// The target-shape function is the only thing that changes per card.
type ShapeFn = (index: number, count: number, w: number, h: number, t: number) => {
  x: number;
  y: number;
};

// Shape registry — one entry per card. Each function maps a particle index
// to a target (x, y) on the canvas. The 't' parameter lets the shape have
// internal motion while held; particles slide *along* the curve rather than
// bob vertically at a fixed x, which avoids streaking.

// Card 0 — Real-time / live signal: sine waveform, particles flow rightward.
const WAVE_SLIDE_SPEED = 0.18;
const shapeWaveform: ShapeFn = (i, count, w, h, t) => {
  const uBase = count <= 1 ? 0 : i / (count - 1);
  const u = (uBase + t * WAVE_SLIDE_SPEED) % 1;
  return {
    x: u * w,
    y: h * 0.42 + Math.sin(u * Math.PI * 4) * h * 0.22,
  };
};

// Card 1 — Edge / on-device: tight ring, slow rotation. "Contained."
const shapeRing: ShapeFn = (i, count, w, h, t) => {
  const a = (i / count) * Math.PI * 2 + t * 0.35;
  const r = Math.min(w, h) * 0.34;
  return { x: w * 0.5 + Math.cos(a) * r, y: h * 0.44 + Math.sin(a) * r };
};

// Card 2 — Privacy / sealed: rectangle outline, particles traverse perimeter.
const shapeRect: ShapeFn = (i, count, w, h, t) => {
  const u = ((count <= 1 ? 0 : i / count) + t * 0.1) % 1;
  const rectW = w * 0.66;
  const rectH = h * 0.6;
  const x0 = (w - rectW) * 0.5;
  const y0 = h * 0.44 - rectH * 0.5;
  const perim = 2 * (rectW + rectH);
  const pos = u * perim;
  if (pos < rectW) return { x: x0 + pos, y: y0 };
  if (pos < rectW + rectH) return { x: x0 + rectW, y: y0 + (pos - rectW) };
  if (pos < 2 * rectW + rectH) return { x: x0 + rectW - (pos - rectW - rectH), y: y0 + rectH };
  return { x: x0, y: y0 + rectH - (pos - 2 * rectW - rectH) };
};

// Card 3 — Multi-camera / replicated: grid of cells, particles clustered.
const shapeGrid: ShapeFn = (i, count, w, h, t) => {
  const COLS = 8;
  const ROWS = 5;
  const total = COLS * ROWS;
  const cellIdx = i % total;
  const col = cellIdx % COLS;
  const row = Math.floor(cellIdx / COLS);
  const sub = Math.floor(i / total);
  const ang = sub * 0.9 + t * 0.6 + cellIdx * 0.3;
  const jr = 3;
  return {
    x: w * (0.08 + (col + 0.5) * 0.84 / COLS) + Math.cos(ang) * jr,
    y: h * (0.12 + (row + 0.5) * 0.62 / ROWS) + Math.sin(ang) * jr,
  };
};

// Card 4 — Open standards: plus / cross — two intersecting axes.
const shapeCross: ShapeFn = (i, count, w, h, t) => {
  const u = ((count <= 1 ? 0 : i / count) + t * 0.08) % 1;
  const cx = w * 0.5;
  const cy = h * 0.44;
  const armLen = Math.min(w, h) * 0.38;
  if (u < 0.5) {
    const v = u * 2;
    return { x: cx - armLen + v * armLen * 2, y: cy };
  }
  const v = (u - 0.5) * 2;
  return { x: cx, y: cy - armLen + v * armLen * 2 };
};

// Card 5 — Hardware-agnostic: triangle outline.
const shapeTriangle: ShapeFn = (i, count, w, h, t) => {
  const u = ((count <= 1 ? 0 : i / count) + t * 0.07) % 1;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const r = Math.min(w, h) * 0.4;
  const verts = [
    { x: cx, y: cy - r },
    { x: cx + r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) },
    { x: cx - r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) },
  ];
  const edge = Math.floor(u * 3);
  const tE = u * 3 - edge;
  const va = verts[edge];
  const vb = verts[(edge + 1) % 3];
  return { x: va.x + (vb.x - va.x) * tE, y: va.y + (vb.y - va.y) * tE };
};

// Card 6 — Custom / curved: flowing S-curve.
const shapeArc: ShapeFn = (i, count, w, h, t) => {
  const uBase = count <= 1 ? 0 : i / (count - 1);
  const u = (uBase + t * 0.12) % 1;
  return {
    x: u * w,
    y: h * 0.44 + Math.sin(u * Math.PI * 2) * h * 0.28 - Math.sin(u * Math.PI * 4) * h * 0.08,
  };
};

// Card 7 — Scale: phyllotaxis spiral, slow rotation.
const shapeSpiral: ShapeFn = (i, count, w, h, t) => {
  const ratio = count <= 1 ? 0 : i / count;
  const a = i * 2.39996 + t * 0.5;
  const r = Math.min(w, h) * 0.42 * Math.sqrt(ratio);
  return { x: w * 0.5 + Math.cos(a) * r, y: h * 0.46 + Math.sin(a) * r };
};

const SHAPES: readonly ShapeFn[] = [
  shapeWaveform,
  shapeRing,
  shapeRect,
  shapeGrid,
  shapeCross,
  shapeTriangle,
  shapeArc,
  shapeSpiral,
];

interface SwarmParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// ── Cross-card particle hand-off ──────────────────────────────────────────
// Module-level queue. When a particle exits one card's right or left edge,
// the card pushes a Handoff to its neighbor's queue with the particle's
// y-fraction and velocity. The neighbor drains its queue each frame and
// spawns those particles at the adjacent edge — so particles physically
// "travel" between adjacent cards without smearing across the gap.
interface Handoff {
  fromEdge: 'left' | 'right'; // edge of the receiving card where it should appear
  yFrac: number;              // 0..1 vertical position relative to card height
  vx: number;
  vy: number;
}
const HANDOFF_QUEUE = new Map<string, Handoff[]>();
const HANDOFF_CAP = 60; // cap per key — drop oldest if exceeded

function pushHandoff(key: string, h: Handoff): void {
  let list = HANDOFF_QUEUE.get(key);
  if (!list) {
    list = [];
    HANDOFF_QUEUE.set(key, list);
  }
  list.push(h);
  if (list.length > HANDOFF_CAP) list.shift();
}

function drainHandoffs(key: string): Handoff[] {
  const list = HANDOFF_QUEUE.get(key);
  if (!list || list.length === 0) return [];
  HANDOFF_QUEUE.set(key, []);
  return list;
}

interface PillarFlowProtoProps {
  className?: string;
  active?: boolean;
  shapeIndex?: number;
  swarmKey?: string;
  swarmRightKey?: string;
  swarmLeftKey?: string;
  // Offset added to the particle's x before sampling the flow field. Two
  // adjacent cards with different offsets see decorrelated patterns, so the
  // chaos doesn't look like 16 identical copies. Pass `cardIndex * cardWidth`
  // (or any large unique value) from the parent.
  worldOffsetX?: number;
}

export function PillarFlowProto({
  className,
  active = false,
  shapeIndex = 0,
  swarmKey,
  swarmRightKey,
  swarmLeftKey,
  worldOffsetX = 0,
}: PillarFlowProtoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Keep the latest active flag in a ref so the rAF closure always sees it.
  const activeRef = useRef(active);
  activeRef.current = active;
  // Same pattern for the shape function — lets the prop change without
  // re-running the heavy useEffect.
  const shapeFnRef = useRef<ShapeFn>(SHAPES[shapeIndex % SHAPES.length] ?? shapeWaveform);
  shapeFnRef.current = SHAPES[shapeIndex % SHAPES.length] ?? shapeWaveform;
  // Cleared on unmount so keys for unmounted cards don't accumulate stale handoffs.
  const swarmKeyRef = useRef(swarmKey);
  swarmKeyRef.current = swarmKey;
  const swarmRightKeyRef = useRef(swarmRightKey);
  swarmRightKeyRef.current = swarmRightKey;
  const swarmLeftKeyRef = useRef(swarmLeftKey);
  swarmLeftKeyRef.current = swarmLeftKey;
  const worldOffsetRef = useRef(worldOffsetX);
  worldOffsetRef.current = worldOffsetX;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number | null = null;
    let widthCss = 0;
    let heightCss = 0;

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      widthCss = rect.width;
      heightCss = rect.height;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const PARTICLE_COUNT = 650;
    const particles: SwarmParticle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      particles.push({
        x: Math.random() * widthCss,
        y: Math.random() * heightCss,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
      });
    }

    // Smooth pseudo-Perlin flow field — drives the chaos state.
    // Higher frequencies + faster evolution = busier swarm.
    function flowAngle(x: number, y: number, t: number): number {
      const a =
        Math.sin(x * 0.022 + t * 0.75) +
        Math.cos(y * 0.019 - t * 0.6) +
        Math.sin((x + y) * 0.011 + t * 0.4) * 0.6;
      return a * Math.PI;
    }

    function readColor(): string {
      if (!canvas) return 'rgba(0,0,0,0.85)';
      const c = getComputedStyle(canvas).color;
      return c && c !== 'rgba(0, 0, 0, 0)' ? c : 'rgba(0,0,0,0.85)';
    }
    let cachedColor = readColor();
    let colorCheckCounter = 0;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const FADE_ALPHA = 0.09; // short trails — wipe formation streaks quickly
    const POINT_ALPHA = 0.6;
    const DAMPING = 0.88;
    const FLOW_FORCE = 0.18; // slow drifting chaos
    const TARGET_FORCE = 0.075;

    // EASE_RATE: per-frame interpolation toward the active target.
    // 0.05 ≈ ~1s to fully form/dissolve; higher = snappier.
    const EASE_RATE = 0.055;

    let lastTime = performance.now();
    let elapsed = 0;
    let weight = 0; // current target-blend (0 = chaos, 1 = formed)

    function step(now: number) {
      if (!ctx) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      colorCheckCounter += 1;
      if (colorCheckCounter > 30) {
        cachedColor = readColor();
        colorCheckCounter = 0;
      }

      // Smoothly interpolate weight toward the requested state.
      const goal = activeRef.current ? 1 : 0;
      weight += (goal - weight) * EASE_RATE;
      if (Math.abs(goal - weight) < 0.001) weight = goal;

      // Trail fade
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${FADE_ALPHA})`;
      ctx.fillRect(0, 0, widthCss, heightCss);
      ctx.globalCompositeOperation = 'source-over';

      ctx.fillStyle = cachedColor;
      ctx.globalAlpha = POINT_ALPHA;

      // Flow force tapers as the shape locks in — keeps the form crisp.
      const flowGain = FLOW_FORCE * (1 - weight);
      const targetGain = TARGET_FORCE * weight;

      // Heavier damping when forming/held so particles converge instead of
      // oscillating around their target (eliminates residual streaks).
      // 0.88 in chaos → 0.5 fully formed (near critical damping).
      const effectiveDamping = DAMPING - weight * 0.38;

      // Pull any incoming particles handed off from neighbor cards. We
      // consume them as exits happen below (one-in / one-out keeps density
      // constant); leftovers spawn at the appropriate edge after the loop.
      const incoming = swarmKeyRef.current ? drainHandoffs(swarmKeyRef.current) : [];
      const handoffEnabled = !!(swarmRightKeyRef.current || swarmLeftKeyRef.current);

      const wox = worldOffsetRef.current;

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        // Sample the shared flow field at GLOBAL coords so each card sees a
        // different region — chaos no longer looks like 16 identical copies.
        const ang = flowAngle(p.x + wox, p.y, elapsed);
        const fxFlow = Math.cos(ang) * flowGain;
        const fyFlow = Math.sin(ang) * flowGain;

        const tgt = shapeFnRef.current(i, particles.length, widthCss, heightCss, elapsed);

        // Detect target wrap (right edge → left edge). Snap the particle
        // position to follow without producing a canvas-wide streak.
        if (tgt.x < p.x - widthCss * 0.5) {
          p.x -= widthCss;
        }

        const dxT = tgt.x - p.x;
        const dyT = tgt.y - p.y;
        const fxTgt = dxT * targetGain;
        const fyTgt = dyT * targetGain;

        p.vx = p.vx * effectiveDamping + fxFlow + fxTgt;
        p.vy = p.vy * effectiveDamping + fyFlow + fyTgt;
        p.x += p.vx;
        p.y += p.vy;

        if (handoffEnabled) {
          // Horizontal exits → hand off to neighbor card
          if (p.x > widthCss + 1 && swarmRightKeyRef.current) {
            pushHandoff(swarmRightKeyRef.current, {
              fromEdge: 'left',
              yFrac: Math.max(0, Math.min(1, p.y / Math.max(1, heightCss))),
              vx: p.vx,
              vy: p.vy,
            });
            const arrived = incoming.shift();
            if (arrived) {
              p.x = arrived.fromEdge === 'left' ? 0 : widthCss;
              p.y = arrived.yFrac * heightCss;
              p.vx = arrived.vx;
              p.vy = arrived.vy;
            } else {
              p.x = 0;
              p.y = Math.random() * heightCss;
              p.vx = Math.abs(p.vx) * 0.6 || 0.4;
              p.vy = (Math.random() - 0.5) * 0.4;
            }
          } else if (p.x < -1 && swarmLeftKeyRef.current) {
            pushHandoff(swarmLeftKeyRef.current, {
              fromEdge: 'right',
              yFrac: Math.max(0, Math.min(1, p.y / Math.max(1, heightCss))),
              vx: p.vx,
              vy: p.vy,
            });
            const arrived = incoming.shift();
            if (arrived) {
              p.x = arrived.fromEdge === 'left' ? 0 : widthCss;
              p.y = arrived.yFrac * heightCss;
              p.vx = arrived.vx;
              p.vy = arrived.vy;
            } else {
              p.x = widthCss;
              p.y = Math.random() * heightCss;
              p.vx = -Math.abs(p.vx) * 0.6 || -0.4;
              p.vy = (Math.random() - 0.5) * 0.4;
            }
          }
          // Vertical exits → soft wrap (no neighbor above/below)
          if (p.y < -2) p.y += heightCss + 4;
          else if (p.y > heightCss + 2) p.y -= heightCss + 4;
        } else {
          // Standalone card — soft wrap on all edges so chaos circulates.
          if (p.x < -2) p.x += widthCss + 4;
          else if (p.x > widthCss + 2) p.x -= widthCss + 4;
          if (p.y < -2) p.y += heightCss + 4;
          else if (p.y > heightCss + 2) p.y -= heightCss + 4;
        }

        ctx.fillRect(p.x, p.y, 1, 1);
      }

      // Drain any leftover arrivals into random particles at the edge.
      while (incoming.length > 0) {
        const arrived = incoming.shift();
        if (!arrived) break;
        const idx = Math.floor(Math.random() * particles.length);
        const p = particles[idx];
        p.x = arrived.fromEdge === 'left' ? 0 : widthCss;
        p.y = arrived.yFrac * heightCss;
        p.vx = arrived.vx;
        p.vy = arrived.vy;
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(step);
    }

    if (reducedMotion) {
      // Burn in a chaos snapshot and stop.
      for (let f = 0; f < 240; f += 1) {
        elapsed = f / 60;
        for (let i = 0; i < particles.length; i += 1) {
          const p = particles[i];
          const ang = flowAngle(p.x + worldOffsetRef.current, p.y, elapsed);
          p.vx = p.vx * DAMPING + Math.cos(ang) * FLOW_FORCE;
          p.vy = p.vy * DAMPING + Math.sin(ang) * FLOW_FORCE;
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x += widthCss;
          if (p.x > widthCss) p.x -= widthCss;
          if (p.y < 0) p.y += heightCss;
          if (p.y > heightCss) p.y -= heightCss;
        }
      }
      ctx.fillStyle = cachedColor;
      ctx.globalAlpha = POINT_ALPHA;
      for (const p of particles) ctx.fillRect(p.x, p.y, 1, 1);
      ctx.globalAlpha = 1;
    } else {
      rafId = requestAnimationFrame(step);
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
      // Clear any handoffs targeted at this (now-unmounted) card.
      if (swarmKeyRef.current) HANDOFF_QUEUE.delete(swarmKeyRef.current);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        WebkitMaskImage:
          'linear-gradient(to bottom, black 0%, black 62%, transparent 100%)',
        maskImage:
          'linear-gradient(to bottom, black 0%, black 62%, transparent 100%)',
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SwarmCanvas system
// ──────────────────────────────────────────────────────────────────────────
// A single canvas spans the entire marquee row. Particles live in canvas
// coordinates (which match the marquee's local coords). Each PillarCard
// registers its rectangle and active state via SwarmContext. Particles drift
// freely in chaos; when inside an active card's rect, they're pulled toward
// that card's spatial shape function — so particles physically travel
// between cards as they wander out of one and into another.

// Spatial shape functions: input is a particle's position in LOCAL card
// coordinates, output is its target position in the same coordinates. This
// lets any number of particles form the shape based on where they are,
// rather than which slot they occupy.
type SpatialShapeFn = (px: number, py: number, w: number, h: number, t: number) => {
  x: number;
  y: number;
};

// 0 — Waveform: project to wave_y(px); slight rightward advance creates flow.
const spatialWaveform: SpatialShapeFn = (px, _py, w, h) => {
  const u = Math.max(0, Math.min(1, px / w));
  return {
    x: px + 4,
    y: h * 0.42 + Math.sin(u * Math.PI * 4) * h * 0.22,
  };
};

// 1 — Ring: project onto ring; tangential drift gives slow rotation.
const spatialRing: SpatialShapeFn = (px, py, w, h) => {
  const cx = w * 0.5;
  const cy = h * 0.44;
  const r = Math.min(w, h) * 0.34;
  const dx = px - cx;
  const dy = py - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const ang = dist < 0.1 ? 0 : Math.atan2(dy, dx) + 0.045;
  return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
};

// 2 — Rectangle outline: nearest edge + CW perimeter drift.
const spatialRect: SpatialShapeFn = (px, py, w, h) => {
  const rectW = w * 0.66;
  const rectH = h * 0.6;
  const x0 = (w - rectW) * 0.5;
  const y0 = h * 0.44 - rectH * 0.5;
  const x1 = x0 + rectW;
  const y1 = y0 + rectH;
  const cpx = Math.max(x0, Math.min(x1, px));
  const cpy = Math.max(y0, Math.min(y1, py));
  const dL = cpx - x0;
  const dR = x1 - cpx;
  const dT = cpy - y0;
  const dB = y1 - cpy;
  const minD = Math.min(dL, dR, dT, dB);
  let tx;
  let ty;
  if (minD === dT) { tx = cpx + 3; ty = y0; }
  else if (minD === dR) { tx = x1; ty = cpy + 3; }
  else if (minD === dB) { tx = cpx - 3; ty = y1; }
  else { tx = x0; ty = cpy - 3; }
  return { x: Math.max(x0, Math.min(x1, tx)), y: Math.max(y0, Math.min(y1, ty)) };
};

// 3 — Grid: snap to nearest cell center.
const spatialGrid: SpatialShapeFn = (px, py, w, h) => {
  const COLS = 7;
  const ROWS = 4;
  const x0 = w * 0.1;
  const y0 = h * 0.18;
  const cellW = (w * 0.8) / COLS;
  const cellH = (h * 0.55) / ROWS;
  const col = Math.max(0, Math.min(COLS - 1, Math.round((px - x0 - cellW * 0.5) / cellW)));
  const row = Math.max(0, Math.min(ROWS - 1, Math.round((py - y0 - cellH * 0.5) / cellH)));
  return {
    x: x0 + (col + 0.5) * cellW,
    y: y0 + (row + 0.5) * cellH,
  };
};

// 4 — Cross / plus: nearest H or V axis.
const spatialCross: SpatialShapeFn = (px, py, w, h) => {
  const cx = w * 0.5;
  const cy = h * 0.44;
  const armLen = Math.min(w, h) * 0.38;
  const dx = px - cx;
  const dy = py - cy;
  if (Math.abs(dx) > Math.abs(dy)) {
    const tx = Math.max(-armLen, Math.min(armLen, dx));
    return { x: cx + tx, y: cy };
  }
  const ty = Math.max(-armLen, Math.min(armLen, dy));
  return { x: cx, y: cy + ty };
};

// 5 — Triangle outline: nearest edge segment, with CW perimeter drift.
const spatialTriangle: SpatialShapeFn = (px, py, w, h) => {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const r = Math.min(w, h) * 0.4;
  const verts = [
    { x: cx, y: cy - r },
    { x: cx + r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) },
    { x: cx - r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) },
  ];
  let bestD = Infinity;
  let bestX = verts[0].x;
  let bestY = verts[0].y;
  for (let i = 0; i < 3; i += 1) {
    const a = verts[i];
    const b = verts[(i + 1) % 3];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const ab2 = abx * abx + aby * aby;
    if (ab2 < 0.0001) continue;
    let proj = ((px - a.x) * abx + (py - a.y) * aby) / ab2 + 0.02;
    proj = Math.max(0, Math.min(1, proj));
    const tx = a.x + proj * abx;
    const ty = a.y + proj * aby;
    const d = (px - tx) * (px - tx) + (py - ty) * (py - ty);
    if (d < bestD) {
      bestD = d;
      bestX = tx;
      bestY = ty;
    }
  }
  return { x: bestX, y: bestY };
};

// 6 — S-curve: project to sampled curve.
const spatialArc: SpatialShapeFn = (px, py, w, h) => {
  const N = 60;
  let bestD = Infinity;
  let bestX = 0;
  let bestY = 0;
  for (let i = 0; i < N; i += 1) {
    const u = i / (N - 1);
    const sx = u * w;
    const sy = h * 0.44 + Math.sin(u * Math.PI * 2) * h * 0.28 - Math.sin(u * Math.PI * 4) * h * 0.08;
    const d = (px - sx) * (px - sx) + (py - sy) * (py - sy);
    if (d < bestD) {
      bestD = d;
      bestX = sx + 3;
      bestY = sy;
    }
  }
  return { x: bestX, y: bestY };
};

// 7 — Phyllotaxis spiral: project to nearest sampled spiral point.
const spatialSpiral: SpatialShapeFn = (px, py, w, h, t) => {
  const cx = w * 0.5;
  const cy = h * 0.46;
  const maxR = Math.min(w, h) * 0.42;
  const N = 100;
  let bestD = Infinity;
  let bestX = cx;
  let bestY = cy;
  for (let i = 0; i < N; i += 1) {
    const ratio = i / (N - 1);
    const a = i * 2.39996 + t * 0.4;
    const r = maxR * Math.sqrt(ratio);
    const sx = cx + Math.cos(a) * r;
    const sy = cy + Math.sin(a) * r;
    const d = (px - sx) * (px - sx) + (py - sy) * (py - sy);
    if (d < bestD) {
      bestD = d;
      bestX = sx;
      bestY = sy;
    }
  }
  return { x: bestX, y: bestY };
};

const SPATIAL_SHAPES: readonly SpatialShapeFn[] = [
  spatialWaveform,
  spatialRing,
  spatialRect,
  spatialGrid,
  spatialCross,
  spatialTriangle,
  spatialArc,
  spatialSpiral,
];

interface CardSlot {
  rect: { x: number; y: number; w: number; h: number };
  shapeIndex: number;
  active: boolean;
}

interface SwarmCtx {
  setCardRect(key: string, rect: CardSlot['rect']): void;
  setCardActive(key: string, active: boolean): void;
  setCardShape(key: string, shapeIndex: number): void;
  unregisterCard(key: string): void;
}

const SwarmContext = createContext<SwarmCtx | null>(null);
const SwarmCardsRefContext = createContext<MutableRefObject<Map<string, CardSlot>> | null>(null);

export function SwarmProvider({ children }: { readonly children: ReactNode }) {
  const cardsRef = useRef<Map<string, CardSlot>>(new Map());

  const ctx = useMemo<SwarmCtx>(() => ({
    setCardRect: (key, rect) => {
      const existing = cardsRef.current.get(key);
      cardsRef.current.set(key, existing
        ? { ...existing, rect }
        : { rect, shapeIndex: 0, active: false });
    },
    setCardActive: (key, active) => {
      const existing = cardsRef.current.get(key);
      cardsRef.current.set(key, existing
        ? { ...existing, active }
        : { rect: { x: 0, y: 0, w: 0, h: 0 }, shapeIndex: 0, active });
    },
    setCardShape: (key, shapeIndex) => {
      const existing = cardsRef.current.get(key);
      cardsRef.current.set(key, existing
        ? { ...existing, shapeIndex }
        : { rect: { x: 0, y: 0, w: 0, h: 0 }, shapeIndex, active: false });
    },
    unregisterCard: (key) => {
      cardsRef.current.delete(key);
    },
  }), []);

  return (
    <SwarmContext.Provider value={ctx}>
      <SwarmCardsRefContext.Provider value={cardsRef}>
        {children}
      </SwarmCardsRefContext.Provider>
    </SwarmContext.Provider>
  );
}

export function useSwarmRegistration(
  elementRef: RefObject<HTMLElement | null>,
  containerRef: RefObject<HTMLElement | null>,
  key: string,
  shapeIndex: number,
  active: boolean,
) {
  const swarmCtx = useContext(SwarmContext);

  useEffect(() => {
    if (!swarmCtx) return undefined;
    const el = elementRef.current;
    const container = containerRef.current;
    if (!el || !container) return undefined;

    const updateRect = () => {
      const r = el.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      swarmCtx.setCardRect(key, {
        x: r.left - cr.left,
        y: r.top - cr.top,
        w: r.width,
        h: r.height,
      });
    };

    updateRect();
    const ro = new ResizeObserver(updateRect);
    ro.observe(el);
    ro.observe(container);

    return () => {
      ro.disconnect();
      swarmCtx.unregisterCard(key);
    };
  }, [swarmCtx, key, elementRef, containerRef]);

  useEffect(() => {
    if (!swarmCtx) return;
    swarmCtx.setCardActive(key, active);
  }, [swarmCtx, key, active]);

  useEffect(() => {
    if (!swarmCtx) return;
    swarmCtx.setCardShape(key, shapeIndex);
  }, [swarmCtx, key, shapeIndex]);

  return swarmCtx !== null;
}

export function SwarmCanvas({ className }: { readonly className?: string }) {
  const cardsRef = useContext(SwarmCardsRefContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!cardsRef) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let rafId: number | null = null;
    let widthCss = 0;
    let heightCss = 0;
    let particles: SwarmParticle[] = [];

    function setupParticles() {
      // Density tuned so total particles ≈ 250 per ~card-sized cell.
      const target = Math.max(400, Math.min(4000, Math.floor((widthCss * heightCss) / 80)));
      particles = [];
      for (let i = 0; i < target; i += 1) {
        particles.push({
          x: Math.random() * widthCss,
          y: Math.random() * heightCss,
          vx: 0,
          vy: 0,
        });
      }
    }

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const nw = rect.width;
      const nh = rect.height;
      if (nw === widthCss && nh === heightCss) return;
      widthCss = nw;
      heightCss = nh;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setupParticles();
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function flowAngle(x: number, y: number, t: number): number {
      const a = Math.sin(x * 0.008 + t * 0.3) + Math.cos(y * 0.014 - t * 0.22);
      return a * Math.PI;
    }

    function readColor(): string {
      if (!canvas) return 'rgba(0,0,0,0.85)';
      const c = getComputedStyle(canvas).color;
      return c && c !== 'rgba(0, 0, 0, 0)' ? c : 'rgba(0,0,0,0.85)';
    }
    let cachedColor = readColor();
    let colorCheckCounter = 0;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const FADE_ALPHA = 0.09;
    const POINT_ALPHA = 0.55;
    const DAMPING_CHAOS = 0.9;
    const DAMPING_SHAPE = 0.5;
    const FLOW_FORCE = 0.18;
    const TARGET_FORCE = 0.08;

    let lastTime = performance.now();
    let elapsed = 0;

    function step(now: number) {
      if (!ctx || !cardsRef) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      colorCheckCounter += 1;
      if (colorCheckCounter > 30) {
        cachedColor = readColor();
        colorCheckCounter = 0;
      }

      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${FADE_ALPHA})`;
      ctx.fillRect(0, 0, widthCss, heightCss);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = cachedColor;
      ctx.globalAlpha = POINT_ALPHA;

      // Snapshot active cards once per frame (small array, hot loop).
      const cards: CardSlot[] = [];
      cardsRef.current.forEach((c) => {
        if (c.active && c.rect.w > 0) cards.push(c);
      });

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];

        // Find an active card containing this particle (first match wins —
        // cards rarely overlap in the marquee).
        let activeCard: CardSlot | null = null;
        for (let ci = 0; ci < cards.length; ci += 1) {
          const c = cards[ci];
          if (
            p.x >= c.rect.x &&
            p.x < c.rect.x + c.rect.w &&
            p.y >= c.rect.y &&
            p.y < c.rect.y + c.rect.h
          ) {
            activeCard = c;
            break;
          }
        }

        let fxFlow = 0;
        let fyFlow = 0;
        let fxTgt = 0;
        let fyTgt = 0;
        let damping = DAMPING_CHAOS;

        if (activeCard) {
          const shape = SPATIAL_SHAPES[activeCard.shapeIndex % SPATIAL_SHAPES.length];
          const lx = p.x - activeCard.rect.x;
          const ly = p.y - activeCard.rect.y;
          const tgt = shape(lx, ly, activeCard.rect.w, activeCard.rect.h, elapsed);
          fxTgt = (activeCard.rect.x + tgt.x - p.x) * TARGET_FORCE;
          fyTgt = (activeCard.rect.y + tgt.y - p.y) * TARGET_FORCE;
          damping = DAMPING_SHAPE;
        } else {
          const ang = flowAngle(p.x, p.y, elapsed);
          fxFlow = Math.cos(ang) * FLOW_FORCE;
          fyFlow = Math.sin(ang) * FLOW_FORCE;
        }

        p.vx = p.vx * damping + fxFlow + fxTgt;
        p.vy = p.vy * damping + fyFlow + fyTgt;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap at canvas edges so chaos circulates.
        if (p.x < -2) p.x += widthCss + 4;
        else if (p.x > widthCss + 2) p.x -= widthCss + 4;
        if (p.y < -2) p.y += heightCss + 4;
        else if (p.y > heightCss + 2) p.y -= heightCss + 4;

        ctx.fillRect(p.x, p.y, 1, 1);
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(step);
    }

    if (!reducedMotion) {
      rafId = requestAnimationFrame(step);
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [cardsRef]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}

// ──────────────────────────────────────────────────────────────────────────
// Technical-manual plates — detailed monochrome line illustrations
// ──────────────────────────────────────────────────────────────────────────
// Drawn as if from a 1960s industrial engineering manual: thin ink line
// work, cross-hatching for material shadow, leader-line callouts, a
// dimension bar, and a small italic caption. Inherits `currentColor` so it
// works in both light and dark themes. Micro-animations (REC dot pulse,
// bounding-box breathe) activate when the parent `.group` is hovered.

// ─── Card 2 — Edge compute node (B2 technical-manual etching) ───
export function PillarPlateEdge({ className }: { readonly className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 320 176" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" aria-hidden="true" fill="none">
        <defs>
          <pattern id="p2-hatch" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="2" stroke="currentColor" strokeWidth="0.25" opacity="0.55" />
          </pattern>
        </defs>
        <g stroke="currentColor" fill="none" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="308" height="164" strokeWidth="0.5" opacity="0.85" />
          <rect x="9" y="9" width="302" height="158" strokeWidth="0.25" opacity="0.4" />
          <line x1="11" y1="22" x2="305" y2="22" strokeWidth="0.3" opacity="0.55" />
          <text x="160" y="17" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="6.5" stroke="none" fill="currentColor" opacity="0.7">fig. 02 — edge compute node</text>

          {/* PCB outline */}
          <g transform="translate(50, 40)">
            <rect x="0" y="0" width="220" height="98" rx="3" strokeWidth="0.6" />
            <rect x="0" y="60" width="220" height="38" fill="url(#p2-hatch)" stroke="none" opacity="0.6" />
            {/* Silkscreen */}
            <text x="6" y="9" fontSize="3.6" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.85">NXT-EDGE/1</text>
            <text x="214" y="9" textAnchor="end" fontSize="3" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.65">rev 2.1</text>

            {/* Heatsink with fins */}
            <g transform="translate(60, 18)">
              <rect x="0" y="0" width="100" height="50" rx="1.5" strokeWidth="0.6" />
              <line x1="0" y1="3" x2="100" y2="3" strokeWidth="0.3" />
              <rect x="0" y="40" width="100" height="10" fill="url(#p2-hatch)" stroke="none" />
              <g strokeWidth="0.3" opacity="0.75">
                <line x1="7" y1="5" x2="7" y2="48" />
                <line x1="14" y1="5" x2="14" y2="48" />
                <line x1="21" y1="5" x2="21" y2="48" />
                <line x1="28" y1="5" x2="28" y2="48" />
                <line x1="35" y1="5" x2="35" y2="48" />
                <line x1="42" y1="5" x2="42" y2="48" />
                <line x1="49" y1="5" x2="49" y2="48" />
                <line x1="56" y1="5" x2="56" y2="48" />
                <line x1="63" y1="5" x2="63" y2="48" />
                <line x1="70" y1="5" x2="70" y2="48" />
                <line x1="77" y1="5" x2="77" y2="48" />
                <line x1="84" y1="5" x2="84" y2="48" />
                <line x1="91" y1="5" x2="91" y2="48" />
              </g>
              <rect x="38" y="20" width="24" height="11" strokeWidth="0.3" opacity="0.7" />
              <text x="50" y="28" textAnchor="middle" fontSize="3.5" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">npu-x1</text>
            </g>

            {/* Memory chips */}
            <g transform="translate(12, 28)">
              <rect x="0" y="0" width="36" height="22" rx="0.6" strokeWidth="0.5" />
              <line x1="0" y1="3" x2="36" y2="3" strokeWidth="0.3" />
              <rect x="0" y="14" width="36" height="8" fill="url(#p2-hatch)" stroke="none" />
              <text x="18" y="13" textAnchor="middle" fontSize="2.8" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.85">LPDDR5</text>
              <circle cx="3" cy="3" r="0.6" fill="currentColor" stroke="none" />
            </g>
            <g transform="translate(172, 28)">
              <rect x="0" y="0" width="36" height="22" rx="0.6" strokeWidth="0.5" />
              <line x1="0" y1="3" x2="36" y2="3" strokeWidth="0.3" />
              <rect x="0" y="14" width="36" height="8" fill="url(#p2-hatch)" stroke="none" />
              <text x="18" y="13" textAnchor="middle" fontSize="2.8" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.85">LPDDR5</text>
              <circle cx="3" cy="3" r="0.6" fill="currentColor" stroke="none" />
            </g>

            {/* Status LEDs */}
            <g>
              <circle cx="188" cy="76" r="1.4" strokeWidth="0.4" />
              <circle cx="188" cy="76" r="0.6" fill="currentColor" stroke="none" className="nx-edge-led-b" />
              <circle cx="196" cy="76" r="1.4" strokeWidth="0.4" />
              <circle cx="196" cy="76" r="0.6" fill="currentColor" stroke="none" className="nx-edge-led-b nx-edge-led-b--delay" />
              <text x="188" y="84" textAnchor="middle" fontSize="2.4" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.7">PWR</text>
              <text x="196" y="84" textAnchor="middle" fontSize="2.4" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.7">SYS</text>
            </g>

            {/* Edge connector — bottom pin row */}
            <g transform="translate(34, 88)">
              <rect x="0" y="0" width="152" height="4" strokeWidth="0.4" />
              <line x1="0" y1="0.6" x2="152" y2="0.6" strokeWidth="0.2" opacity="0.5" />
              <g strokeWidth="0.3">
                {Array.from({ length: 21 }).map((_, i) => (
                  <line key={i} x1={i * 7.5 + 4} y1="0" x2={i * 7.5 + 4} y2="4" />
                ))}
              </g>
            </g>

            {/* MIPI connector */}
            <g transform="translate(166, 70)">
              <rect x="0" y="0" width="40" height="6" strokeWidth="0.4" />
              <line x1="2" y1="3" x2="38" y2="3" strokeWidth="0.25" opacity="0.6" />
              <text x="20" y="-1" textAnchor="middle" fontSize="2.4" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.65">MIPI-CSI</text>
            </g>

            {/* Mounting holes */}
            <circle cx="6" cy="92" r="2.4" strokeWidth="0.4" />
            <circle cx="6" cy="92" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="214" cy="92" r="2.4" strokeWidth="0.4" />
            <circle cx="214" cy="92" r="0.8" fill="currentColor" stroke="none" />
          </g>

          {/* Callouts */}
          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="160" cy="58" r="0.5" fill="currentColor" stroke="none" />
            <line x1="160" y1="58" x2="160" y2="32" />
            <line x1="160" y1="32" x2="216" y2="32" />
          </g>
          <text x="160" y="30" fontSize="3.6" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">NPU · 4 TOPS · 8 W</text>

          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="110" cy="130" r="0.5" fill="currentColor" stroke="none" />
            <line x1="110" y1="130" x2="110" y2="146" />
          </g>
          <text x="110" y="152" textAnchor="middle" fontSize="3.5" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">on-device · no cloud</text>

          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="245" cy="118" r="0.5" fill="currentColor" stroke="none" />
            <line x1="245" y1="118" x2="245" y2="146" />
          </g>
          <text x="245" y="152" textAnchor="middle" fontSize="3.5" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">16 GB · LPDDR5</text>

          <g strokeWidth="0.3" opacity="0.55">
            <line x1="50" y1="160" x2="50" y2="164" />
            <line x1="270" y1="160" x2="270" y2="164" />
            <line x1="54" y1="162" x2="266" y2="162" />
            <path d="M 50 162 L 53.5 160.5 L 53.5 163.5 Z" fill="currentColor" stroke="none" />
            <path d="M 270 162 L 266.5 160.5 L 266.5 163.5 Z" fill="currentColor" stroke="none" />
          </g>
          <text x="160" y="160" textAnchor="middle" fontSize="3.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.7">110 mm form factor · Linux 6.x</text>
        </g>
      </svg>
    </div>
  );
}

// ─── Card 3 — Chain-of-custody ledger ───
export function PillarPlateChain({ className }: { readonly className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 320 176" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" aria-hidden="true" fill="none">
        <defs>
          <pattern id="p3-hatch" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="2" stroke="currentColor" strokeWidth="0.25" opacity="0.5" />
          </pattern>
        </defs>
        <g stroke="currentColor" fill="none" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="308" height="164" strokeWidth="0.5" opacity="0.85" />
          <rect x="9" y="9" width="302" height="158" strokeWidth="0.25" opacity="0.4" />
          <line x1="11" y1="22" x2="305" y2="22" strokeWidth="0.3" opacity="0.55" />
          <text x="160" y="17" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="6.5" stroke="none" fill="currentColor" opacity="0.7">fig. 03 — chain-of-custody ledger</text>

          {/* Stack of four signed document cards */}
          <g transform="translate(36, 30)">
            <rect x="14" y="10" width="180" height="34" strokeWidth="0.5" />
            <rect x="180" y="14" width="14" height="4" fill="url(#p3-hatch)" stroke="none" />
            <g stroke="currentColor" strokeWidth="0.25" opacity="0.5">
              <line x1="20" y1="18" x2="160" y2="18" />
              <line x1="20" y1="22" x2="160" y2="22" />
              <line x1="20" y1="26" x2="120" y2="26" />
            </g>
            <text x="20" y="40" fontSize="3.5" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.85">incident_open · 16:42:08</text>
            <circle cx="172" cy="38" r="3" strokeWidth="0.4" />
            <text x="172" y="39.5" textAnchor="middle" fontSize="2.4" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor">∆</text>

            <rect x="22" y="48" width="180" height="34" strokeWidth="0.5" />
            <rect x="188" y="52" width="14" height="4" fill="url(#p3-hatch)" stroke="none" />
            <g stroke="currentColor" strokeWidth="0.25" opacity="0.5">
              <line x1="28" y1="56" x2="168" y2="56" />
              <line x1="28" y1="60" x2="168" y2="60" />
              <line x1="28" y1="64" x2="128" y2="64" />
            </g>
            <text x="28" y="78" fontSize="3.5" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.85">review_signed · 16:48:14</text>
            <circle cx="180" cy="76" r="3" strokeWidth="0.4" />
            <text x="180" y="77.5" textAnchor="middle" fontSize="2.4" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor">∆</text>

            <rect x="30" y="86" width="180" height="34" strokeWidth="0.5" />
            <rect x="196" y="90" width="14" height="4" fill="url(#p3-hatch)" stroke="none" />
            <g stroke="currentColor" strokeWidth="0.25" opacity="0.5">
              <line x1="36" y1="94" x2="176" y2="94" />
              <line x1="36" y1="98" x2="176" y2="98" />
              <line x1="36" y1="102" x2="136" y2="102" />
            </g>
            <text x="36" y="116" fontSize="3.5" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.85">forensic_archived · 16:52:01</text>
            <circle cx="188" cy="114" r="3" strokeWidth="0.4" className="nx-plate-chain-seal" />
            <text x="188" y="115.5" textAnchor="middle" fontSize="2.4" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor">✓</text>
          </g>

          {/* Connector hash strip */}
          <g strokeWidth="0.3" opacity="0.6">
            <line x1="230" y1="60" x2="262" y2="60" />
            <line x1="230" y1="65" x2="262" y2="65" />
            <line x1="230" y1="70" x2="262" y2="70" />
          </g>
          <text x="246" y="55" textAnchor="middle" fontSize="3.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">sha-256 hash</text>
          <text x="246" y="80" textAnchor="middle" fontSize="2.6" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.55">a1f3…9c4e</text>

          {/* Footer dimension */}
          <g strokeWidth="0.3" opacity="0.55">
            <line x1="50" y1="160" x2="50" y2="164" />
            <line x1="270" y1="160" x2="270" y2="164" />
            <line x1="54" y1="162" x2="266" y2="162" />
            <path d="M 50 162 L 53.5 160.5 L 53.5 163.5 Z" fill="currentColor" stroke="none" />
            <path d="M 270 162 L 266.5 160.5 L 266.5 163.5 Z" fill="currentColor" stroke="none" />
          </g>
          <text x="160" y="160" textAnchor="middle" fontSize="3.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.7">FBI-cleared chain · tamper-evident</text>
        </g>
      </svg>
    </div>
  );
}

// ─── Card 4 — Multi-camera topology ───
export function PillarPlateCamera({ className }: { readonly className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 320 176" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" aria-hidden="true" fill="none">
        <g stroke="currentColor" fill="none" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="308" height="164" strokeWidth="0.5" opacity="0.85" />
          <rect x="9" y="9" width="302" height="158" strokeWidth="0.25" opacity="0.4" />
          <line x1="11" y1="22" x2="305" y2="22" strokeWidth="0.3" opacity="0.55" />
          <text x="160" y="17" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="6.5" stroke="none" fill="currentColor" opacity="0.7">fig. 04 — multi-camera topology</text>

          {/* Central hub */}
          <g transform="translate(140, 78)">
            <rect x="0" y="0" width="40" height="24" rx="1.5" strokeWidth="0.55" />
            <line x1="0" y1="6" x2="40" y2="6" strokeWidth="0.3" />
            <text x="20" y="16" textAnchor="middle" fontSize="3.5" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.85">SWITCH · PoE+</text>
            <text x="20" y="21" textAnchor="middle" fontSize="2.4" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.6">24-port · 2.5G</text>
          </g>

          {/* Four cameras at compass points */}
          {/* helper macro: drawing inline */}
          {[
            { tx: 30, ty: 38, ang: 0 },
            { tx: 250, ty: 38, ang: 0 },
            { tx: 30, ty: 116, ang: 0 },
            { tx: 250, ty: 116, ang: 0 },
          ].map((cam, i) => (
            <g key={i} transform={`translate(${cam.tx} ${cam.ty})`}>
              <rect x="0" y="0" width="32" height="14" rx="1.5" strokeWidth="0.55" />
              <ellipse cx="32" cy="7" rx="2" ry="6" strokeWidth="0.5" />
              <ellipse cx="33" cy="7" rx="1" ry="4" fill="url(#p3-hatch)" stroke="currentColor" strokeWidth="0.3" />
              <circle cx="4" cy="7" r="0.8" strokeWidth="0.3" />
              <circle cx="4" cy="7" r="0.35" fill="currentColor" stroke="none" className="nx-plate-cam-led" style={{ animationDelay: `${i * 0.4}s` } as CSSProperties} />
              <text x="9" y="9" fontSize="2.6" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.7">cam-{`0${i + 1}`}</text>
            </g>
          ))}

          {/* Network lines from cameras to hub */}
          <g stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 2" opacity="0.65" fill="none">
            <path d="M 62 45 L 140 84" />
            <path d="M 250 45 L 180 84" />
            <path d="M 62 123 L 140 96" />
            <path d="M 250 123 L 180 96" />
          </g>

          {/* Pulse markers traveling on links — small dots animated */}
          <g fill="currentColor" stroke="none" className="nx-plate-cam-pulse">
            <circle cx="100" cy="65" r="0.9" />
          </g>

          {/* Callouts */}
          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="62" cy="50" r="0.5" fill="currentColor" stroke="none" />
            <line x1="62" y1="50" x2="62" y2="70" />
          </g>
          <text x="62" y="76" textAnchor="middle" fontSize="3.3" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">ONVIF · H.265</text>

          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="250" cy="50" r="0.5" fill="currentColor" stroke="none" />
            <line x1="250" y1="50" x2="250" y2="70" />
          </g>
          <text x="250" y="76" textAnchor="middle" fontSize="3.3" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">PoE+ · 30 W</text>

          {/* Footer dimension */}
          <g strokeWidth="0.3" opacity="0.55">
            <line x1="50" y1="160" x2="50" y2="164" />
            <line x1="270" y1="160" x2="270" y2="164" />
            <line x1="54" y1="162" x2="266" y2="162" />
            <path d="M 50 162 L 53.5 160.5 L 53.5 163.5 Z" fill="currentColor" stroke="none" />
            <path d="M 270 162 L 266.5 160.5 L 266.5 163.5 Z" fill="currentColor" stroke="none" />
          </g>
          <text x="160" y="160" textAnchor="middle" fontSize="3.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.7">scales 1 → 1,024 cameras per site</text>
        </g>
      </svg>
    </div>
  );
}

// ─── Card 5 — ONVIF interconnect ───
export function PillarPlateInterface({ className }: { readonly className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 320 176" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" aria-hidden="true" fill="none">
        <defs>
          <pattern id="p5-hatch" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="2" stroke="currentColor" strokeWidth="0.25" opacity="0.5" />
          </pattern>
        </defs>
        <g stroke="currentColor" fill="none" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="308" height="164" strokeWidth="0.5" opacity="0.85" />
          <rect x="9" y="9" width="302" height="158" strokeWidth="0.25" opacity="0.4" />
          <line x1="11" y1="22" x2="305" y2="22" strokeWidth="0.3" opacity="0.55" />
          <text x="160" y="17" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="6.5" stroke="none" fill="currentColor" opacity="0.7">fig. 05 — onvif interconnect</text>

          {/* Two facing connectors with cross-section */}
          {/* Left connector */}
          <g transform="translate(48, 60)">
            <rect x="0" y="0" width="60" height="56" strokeWidth="0.6" />
            <rect x="0" y="42" width="60" height="14" fill="url(#p5-hatch)" stroke="none" />
            <text x="30" y="10" textAnchor="middle" fontSize="3.6" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.85">EXT</text>
            {/* Pin array */}
            <g strokeWidth="0.35">
              {Array.from({ length: 4 }).map((_, row) =>
                Array.from({ length: 6 }).map((_, col) => (
                  <circle key={`L${row}-${col}`} cx={8 + col * 9} cy={20 + row * 6} r="1.4" />
                ))
              )}
            </g>
          </g>

          {/* Right connector (mirrored) */}
          <g transform="translate(212, 60)">
            <rect x="0" y="0" width="60" height="56" strokeWidth="0.6" />
            <rect x="0" y="42" width="60" height="14" fill="url(#p5-hatch)" stroke="none" />
            <text x="30" y="10" textAnchor="middle" fontSize="3.6" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.85">CAM</text>
            <g strokeWidth="0.35">
              {Array.from({ length: 4 }).map((_, row) =>
                Array.from({ length: 6 }).map((_, col) => (
                  <circle key={`R${row}-${col}`} cx={8 + col * 9} cy={20 + row * 6} r="1.4" fill="currentColor" stroke="none" />
                ))
              )}
            </g>
          </g>

          {/* Mating arrows */}
          <g strokeWidth="0.45" className="nx-plate-mate" opacity="0.85">
            <path d="M 116 88 L 200 88" strokeDasharray="3 3" />
            <path d="M 196 84 L 204 88 L 196 92" fill="none" />
          </g>

          {/* Stack of labels above */}
          <g fontFamily="monospace" fontSize="3" stroke="none" fill="currentColor">
            <text x="160" y="36" textAnchor="middle" opacity="0.85">Profile S · streaming</text>
            <text x="160" y="42" textAnchor="middle" opacity="0.7">Profile T · advanced</text>
            <text x="160" y="48" textAnchor="middle" opacity="0.55">Profile M · metadata</text>
          </g>

          {/* Callouts */}
          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="78" cy="120" r="0.5" fill="currentColor" stroke="none" />
            <line x1="78" y1="120" x2="78" y2="138" />
          </g>
          <text x="78" y="146" textAnchor="middle" fontSize="3.5" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">any camera vendor</text>

          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="242" cy="120" r="0.5" fill="currentColor" stroke="none" />
            <line x1="242" y1="120" x2="242" y2="138" />
          </g>
          <text x="242" y="146" textAnchor="middle" fontSize="3.5" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">Nexotek stack</text>

          {/* Footer dimension */}
          <g strokeWidth="0.3" opacity="0.55">
            <line x1="50" y1="160" x2="50" y2="164" />
            <line x1="270" y1="160" x2="270" y2="164" />
            <line x1="54" y1="162" x2="266" y2="162" />
            <path d="M 50 162 L 53.5 160.5 L 53.5 163.5 Z" fill="currentColor" stroke="none" />
            <path d="M 270 162 L 266.5 160.5 L 266.5 163.5 Z" fill="currentColor" stroke="none" />
          </g>
          <text x="160" y="160" textAnchor="middle" fontSize="3.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.7">ONVIF · open standards-based</text>
        </g>
      </svg>
    </div>
  );
}

// ─── Card 6 — Secure enclosure (on-prem / privacy) ───
export function PillarPlateVault({ className }: { readonly className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 320 176" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" aria-hidden="true" fill="none">
        <defs>
          <pattern id="p6-hatch" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="2" stroke="currentColor" strokeWidth="0.25" opacity="0.5" />
          </pattern>
        </defs>
        <g stroke="currentColor" fill="none" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="308" height="164" strokeWidth="0.5" opacity="0.85" />
          <rect x="9" y="9" width="302" height="158" strokeWidth="0.25" opacity="0.4" />
          <line x1="11" y1="22" x2="305" y2="22" strokeWidth="0.3" opacity="0.55" />
          <text x="160" y="17" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="6.5" stroke="none" fill="currentColor" opacity="0.7">fig. 06 — secure enclosure</text>

          {/* 19-inch rack / vault */}
          <g transform="translate(106, 34)">
            <rect x="0" y="0" width="108" height="118" rx="2" strokeWidth="0.6" />
            <rect x="0" y="106" width="108" height="12" fill="url(#p6-hatch)" stroke="none" />
            {/* Faceplate seam */}
            <line x1="0" y1="10" x2="108" y2="10" strokeWidth="0.3" />
            <text x="54" y="8" textAnchor="middle" fontSize="3.3" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">nexotek · vault-01</text>

            {/* Rack unit slots */}
            {Array.from({ length: 6 }).map((_, i) => (
              <g key={i} transform={`translate(6, ${16 + i * 14})`}>
                <rect x="0" y="0" width="96" height="10" strokeWidth="0.35" />
                <circle cx="6" cy="5" r="0.9" strokeWidth="0.25" />
                <circle cx="6" cy="5" r="0.35" fill="currentColor" stroke="none" />
                <line x1="12" y1="5" x2="80" y2="5" strokeWidth="0.25" opacity="0.45" />
                <rect x="82" y="2" width="10" height="6" strokeWidth="0.25" opacity="0.65" />
              </g>
            ))}
          </g>

          {/* Lock indicator front-center */}
          <g transform="translate(154, 92)">
            <circle r="9" strokeWidth="0.55" />
            <path d="M -3 -2 L -3 -4 A 3 3 0 0 1 3 -4 L 3 -2" strokeWidth="0.55" />
            <rect x="-5" y="-2" width="10" height="8" rx="1" strokeWidth="0.55" />
            <circle cy="2.5" r="1" fill="currentColor" stroke="none" className="nx-plate-lock" />
          </g>

          {/* Callouts */}
          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="106" cy="50" r="0.5" fill="currentColor" stroke="none" />
            <line x1="106" y1="50" x2="60" y2="50" />
          </g>
          <text x="60" y="48" textAnchor="end" fontSize="3.5" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">TPM 2.0 · FIPS 140-3</text>

          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="214" cy="80" r="0.5" fill="currentColor" stroke="none" />
            <line x1="214" y1="80" x2="266" y2="80" />
          </g>
          <text x="266" y="78" fontSize="3.5" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">air-gapped</text>

          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="160" cy="100" r="0.5" fill="currentColor" stroke="none" />
            <line x1="160" y1="100" x2="160" y2="125" />
          </g>
          <text x="160" y="133" textAnchor="middle" fontSize="3.5" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">hardware-rooted trust</text>

          {/* Footer dimension */}
          <g strokeWidth="0.3" opacity="0.55">
            <line x1="50" y1="160" x2="50" y2="164" />
            <line x1="270" y1="160" x2="270" y2="164" />
            <line x1="54" y1="162" x2="266" y2="162" />
            <path d="M 50 162 L 53.5 160.5 L 53.5 163.5 Z" fill="currentColor" stroke="none" />
            <path d="M 270 162 L 266.5 160.5 L 266.5 163.5 Z" fill="currentColor" stroke="none" />
          </g>
          <text x="160" y="160" textAnchor="middle" fontSize="3.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.7">on-prem · data never leaves your site</text>
        </g>
      </svg>
    </div>
  );
}

// ─── Card 7 — Claims ledger / insurance form ───
export function PillarPlateForm({ className }: { readonly className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 320 176" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" aria-hidden="true" fill="none">
        <defs>
          <pattern id="p7-hatch" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="2" stroke="currentColor" strokeWidth="0.25" opacity="0.5" />
          </pattern>
        </defs>
        <g stroke="currentColor" fill="none" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="308" height="164" strokeWidth="0.5" opacity="0.85" />
          <rect x="9" y="9" width="302" height="158" strokeWidth="0.25" opacity="0.4" />
          <line x1="11" y1="22" x2="305" y2="22" strokeWidth="0.3" opacity="0.55" />
          <text x="160" y="17" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="6.5" stroke="none" fill="currentColor" opacity="0.7">fig. 07 — underwriting ledger</text>

          {/* Form sheet */}
          <g transform="translate(54, 30)">
            <rect x="0" y="0" width="212" height="118" strokeWidth="0.55" />
            {/* Perforation top */}
            <g strokeWidth="0.3" opacity="0.5">
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={i} x1={6 + i * 10} y1="0" x2={10 + i * 10} y2="0" />
              ))}
            </g>
            {/* Header */}
            <line x1="6" y1="12" x2="206" y2="12" strokeWidth="0.4" />
            <text x="10" y="9" fontSize="3.5" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">FORM NX-08 / underwriting</text>
            <text x="206" y="9" textAnchor="end" fontSize="3" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.7">claim #2814-A</text>

            {/* Field rows */}
            {[
              { label: 'policy ref', value: 'NX-2026-08412' },
              { label: 'risk score', value: '0.18 / low' },
              { label: 'site', value: '37.7749 N · 122.4194 W' },
              { label: 'events / 30 d', value: '142 (verified 138)' },
              { label: 'evidence retention', value: '7 years · encrypted' },
            ].map((field, i) => (
              <g key={field.label} transform={`translate(10, ${22 + i * 14})`}>
                <text x="0" y="6" fontSize="3.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.75">{field.label}</text>
                <line x1="60" y1="8" x2="196" y2="8" strokeWidth="0.3" opacity="0.55" />
                <text x="62" y="6" fontSize="3.2" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.95">{field.value}</text>
              </g>
            ))}

            {/* Stamp imprint bottom-right */}
            <g transform="translate(150, 86)" className="nx-plate-stamp">
              <rect x="0" y="0" width="56" height="22" rx="2" strokeWidth="0.55" />
              <rect x="0" y="0" width="56" height="22" rx="2" fill="url(#p7-hatch)" stroke="none" opacity="0.4" />
              <text x="28" y="10" textAnchor="middle" fontSize="3.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">UNDERWRITTEN</text>
              <text x="28" y="17" textAnchor="middle" fontSize="2.6" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.7">2026-05-16 · agent 142</text>
            </g>
          </g>

          {/* Footer dimension */}
          <g strokeWidth="0.3" opacity="0.55">
            <line x1="50" y1="160" x2="50" y2="164" />
            <line x1="270" y1="160" x2="270" y2="164" />
            <line x1="54" y1="162" x2="266" y2="162" />
            <path d="M 50 162 L 53.5 160.5 L 53.5 163.5 Z" fill="currentColor" stroke="none" />
            <path d="M 270 162 L 266.5 160.5 L 266.5 163.5 Z" fill="currentColor" stroke="none" />
          </g>
          <text x="160" y="160" textAnchor="middle" fontSize="3.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.7">verified evidence · insurable risk</text>
        </g>
      </svg>
    </div>
  );
}

// ─── Card 8 — Accredited credential / certificate ───
export function PillarPlateCertificate({ className }: { readonly className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 320 176" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" aria-hidden="true" fill="none">
        <defs>
          <pattern id="p8-hatch" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="2" stroke="currentColor" strokeWidth="0.25" opacity="0.5" />
          </pattern>
        </defs>
        <g stroke="currentColor" fill="none" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="308" height="164" strokeWidth="0.5" opacity="0.85" />
          <rect x="9" y="9" width="302" height="158" strokeWidth="0.25" opacity="0.4" />
          <line x1="11" y1="22" x2="305" y2="22" strokeWidth="0.3" opacity="0.55" />
          <text x="160" y="17" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="6.5" stroke="none" fill="currentColor" opacity="0.7">fig. 08 — accredited credential</text>

          {/* Certificate paper */}
          <g transform="translate(52, 32)">
            <rect x="0" y="0" width="216" height="114" strokeWidth="0.6" />
            {/* Decorative inner border */}
            <rect x="4" y="4" width="208" height="106" strokeWidth="0.3" opacity="0.6" />
            {/* Neoclassical corner flourishes */}
            <g strokeWidth="0.3" opacity="0.55">
              <path d="M 4 4 L 14 4 M 4 4 L 4 14 M 4 4 L 10 10" />
              <path d="M 212 4 L 202 4 M 212 4 L 212 14 M 212 4 L 206 10" />
              <path d="M 4 110 L 14 110 M 4 110 L 4 100 M 4 110 L 10 104" />
              <path d="M 212 110 L 202 110 M 212 110 L 212 100 M 212 110 L 206 104" />
            </g>
            {/* Title */}
            <text x="108" y="22" textAnchor="middle" fontSize="5" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.95">Certificate of Accreditation</text>
            <line x1="60" y1="26" x2="156" y2="26" strokeWidth="0.3" opacity="0.6" />
            {/* Body */}
            <text x="108" y="40" textAnchor="middle" fontSize="3.4" fontFamily="serif" stroke="none" fill="currentColor" opacity="0.85">awarded by the</text>
            <text x="108" y="48" textAnchor="middle" fontSize="4.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.9">International Accreditors for Continuing</text>
            <text x="108" y="55" textAnchor="middle" fontSize="4.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.9">Education &amp; Training (IACET)</text>
            {/* CEU line */}
            <text x="40" y="72" fontSize="3.4" fontFamily="serif" stroke="none" fill="currentColor" opacity="0.75">CEU hours</text>
            <line x1="65" y1="74" x2="100" y2="74" strokeWidth="0.3" />
            <text x="66" y="72" fontSize="3.4" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.95">24.0</text>
            <text x="106" y="72" fontSize="3.4" fontFamily="serif" stroke="none" fill="currentColor" opacity="0.75">expires</text>
            <line x1="124" y1="74" x2="170" y2="74" strokeWidth="0.3" />
            <text x="125" y="72" fontSize="3.4" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.95">2027-05-16</text>

            {/* Signature line */}
            <line x1="22" y1="98" x2="80" y2="98" strokeWidth="0.4" />
            <text x="22" y="103" fontSize="2.6" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.75">director of education</text>

            {/* Embossed seal */}
            <g transform="translate(170, 90)" className="nx-plate-seal">
              <circle r="14" strokeWidth="0.5" />
              <circle r="11" strokeWidth="0.3" opacity="0.7" />
              <circle r="14" fill="url(#p8-hatch)" stroke="none" opacity="0.3" />
              <text textAnchor="middle" y="-2" fontSize="3" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">IACET</text>
              <text textAnchor="middle" y="4" fontSize="2.4" fontFamily="serif" stroke="none" fill="currentColor" opacity="0.75">accredited</text>
              {/* Ribbon tails */}
              <path d="M -4 12 L -6 22 L -2 19 L 0 22 L 0 13" strokeWidth="0.4" />
              <path d="M 4 12 L 6 22 L 2 19 L 0 22" strokeWidth="0.4" />
            </g>
          </g>

          {/* Footer dimension */}
          <g strokeWidth="0.3" opacity="0.55">
            <line x1="50" y1="160" x2="50" y2="164" />
            <line x1="270" y1="160" x2="270" y2="164" />
            <line x1="54" y1="162" x2="266" y2="162" />
            <path d="M 50 162 L 53.5 160.5 L 53.5 163.5 Z" fill="currentColor" stroke="none" />
            <path d="M 270 162 L 266.5 160.5 L 266.5 163.5 Z" fill="currentColor" stroke="none" />
          </g>
          <text x="160" y="160" textAnchor="middle" fontSize="3.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.7">IACET-accredited · CEU-recognized training</text>
        </g>
      </svg>
    </div>
  );
}

// ─── Card 6 — Site-specific training (B2 technical-manual etching) ───
export function PillarPlateTraining({ className }: { readonly className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 320 176" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" aria-hidden="true" fill="none">
        <defs>
          <pattern id="p-training-hatch" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="2" stroke="currentColor" strokeWidth="0.25" opacity="0.5" />
          </pattern>
        </defs>
        <g stroke="currentColor" fill="none" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="308" height="164" strokeWidth="0.5" opacity="0.85" />
          <rect x="9" y="9" width="302" height="158" strokeWidth="0.25" opacity="0.4" />
          <line x1="11" y1="22" x2="305" y2="22" strokeWidth="0.3" opacity="0.55" />
          <text x="160" y="17" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="6.5" stroke="none" fill="currentColor" opacity="0.7">fig. 06 — site-specific training</text>

          {/* Clipboard */}
          <g transform="translate(54, 32)">
            <rect x="36" y="-2" width="32" height="10" rx="1" strokeWidth="0.5" />
            <rect x="44" y="0" width="16" height="5" strokeWidth="0.3" opacity="0.55" />
            <rect x="0" y="6" width="104" height="120" strokeWidth="0.6" />
            <rect x="5" y="12" width="94" height="108" strokeWidth="0.3" opacity="0.5" />

            {/* Task lines */}
            {[
              { y: 22, checked: true, label: 'survey site geometry' },
              { y: 36, checked: true, label: 'capture incident footage' },
              { y: 50, checked: true, label: 'reconstruct 3D scene' },
              { y: 64, checked: false, label: 'operator walkthrough' },
              { y: 78, checked: false, label: 'IACET-aligned review' },
            ].map((task) => (
              <g key={task.y} transform={`translate(10, ${task.y})`}>
                <rect x="0" y="0" width="7" height="7" strokeWidth="0.5" />
                {task.checked && <path d="M 1.5 4 L 3 5.5 L 6 1.5" strokeWidth="0.7" />}
                <text x="11" y="5.4" fontSize="3.3" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity={task.checked ? 0.9 : 0.65}>{task.label}</text>
              </g>
            ))}

            {/* Signature line */}
            <line x1="10" y1="98" x2="80" y2="98" strokeWidth="0.45" />
            <text x="10" y="104" fontSize="2.8" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.65">site supervisor</text>

            {/* Stamp imprint */}
            <g transform="translate(74, 110) rotate(-10)" className="nx-plate-stamp">
              <rect x="-18" y="-7" width="36" height="14" rx="1" strokeWidth="0.6" />
              <rect x="-18" y="-7" width="36" height="14" rx="1" fill="url(#p-training-hatch)" stroke="none" opacity="0.45" />
              <text textAnchor="middle" y="2" fontSize="3.8" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.9">SITE TRAINED</text>
            </g>
          </g>

          {/* 3D scene preview to the right of clipboard */}
          <g transform="translate(178, 38)">
            <rect x="0" y="0" width="116" height="96" strokeWidth="0.55" />
            <rect x="0" y="0" width="116" height="6" fill="url(#p-training-hatch)" stroke="none" opacity="0.4" />
            <text x="58" y="4.5" textAnchor="middle" fontSize="2.6" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.85">scene reconstruction · site-01</text>

            {/* Wireframe scene — perspective ground + cubes */}
            <g strokeWidth="0.3" opacity="0.55">
              <line x1="10" y1="80" x2="106" y2="80" />
              <line x1="20" y1="68" x2="96" y2="68" />
              <line x1="30" y1="56" x2="86" y2="56" />
              <line x1="10" y1="80" x2="50" y2="40" />
              <line x1="106" y1="80" x2="66" y2="40" />
              <line x1="36" y1="80" x2="56" y2="40" />
              <line x1="80" y1="80" x2="60" y2="40" />
            </g>
            {/* small operator figure on the scene */}
            <g transform="translate(46, 58)" fill="currentColor" stroke="none" opacity="0.9">
              <circle cx="2" cy="0" r="1.4" />
              <path d="M 0 2 L 4 2 L 4 10 L 0 10 Z" />
              <path d="M 0 10 L -1 16 L 1 16 Z" />
              <path d="M 4 10 L 5 16 L 3 16 Z" />
            </g>
            {/* Tag */}
            <g strokeWidth="0.3" opacity="0.85">
              <line x1="50" y1="56" x2="80" y2="44" />
              <circle cx="50" cy="56" r="0.5" fill="currentColor" stroke="none" />
            </g>
            <text x="82" y="44" fontSize="2.8" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.85">operator · trainee</text>
          </g>

          {/* Callout */}
          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="118" cy="92" r="0.5" fill="currentColor" stroke="none" />
            <line x1="118" y1="92" x2="118" y2="148" />
          </g>
          <text x="118" y="154" textAnchor="middle" fontSize="3.3" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">site-specific muscle memory</text>

          <g strokeWidth="0.3" opacity="0.55">
            <line x1="50" y1="160" x2="50" y2="164" />
            <line x1="270" y1="160" x2="270" y2="164" />
            <line x1="54" y1="162" x2="266" y2="162" />
            <path d="M 50 162 L 53.5 160.5 L 53.5 163.5 Z" fill="currentColor" stroke="none" />
            <path d="M 270 162 L 266.5 160.5 L 266.5 163.5 Z" fill="currentColor" stroke="none" />
          </g>
          <text x="160" y="160" textAnchor="middle" fontSize="3.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.7">trained on the actual site · same geometry · same blind spots</text>
        </g>
      </svg>
    </div>
  );
}

// Plate registry — index-aligned with PILLAR_DETAILS in comparison-table.tsx.
// PillarPlateVault is intentionally unused for now (no current pillar maps to
// it); kept exported in case a privacy/security pillar is added later.
const PLATES: readonly ((props: { readonly className?: string }) => ReactNode)[] = [
  PillarPlateDetection,   // 0: detection / 3D scene reconstruction
  PillarPlateEdge,        // 1: on-premise / on-device inference
  PillarPlateInterface,   // 2: ONVIF / open standards
  PillarPlateChain,       // 3: forensic walkthrough
  PillarPlateCamera,      // 4: multiplayer / spatial collaboration
  PillarPlateTraining,    // 5: site-specific training
  PillarPlateCertificate, // 6: IACET CEU
  PillarPlateForm,        // 7: insurance underwriting
];

export function PillarPlate({
  index,
  className,
}: {
  readonly index: number;
  readonly className?: string;
}) {
  const Comp = PLATES[index % PLATES.length] ?? PillarPlateDetection;
  return <Comp className={className} />;
}


export function PillarPlateDetection({ className }: { readonly className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 320 176"
        preserveAspectRatio="xMidYMid meet"
        className="block h-full w-full"
        aria-hidden="true"
        fill="none"
      >
        <defs>
          {/* Cross-hatching for material shadow */}
          <pattern id="plate-hatch" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="2" stroke="currentColor" strokeWidth="0.25" opacity="0.55" />
          </pattern>
          {/* CRT-style scanlines on screen */}
          <pattern id="plate-scan" patternUnits="userSpaceOnUse" width="1" height="1.5">
            <line x1="0" y1="0.75" x2="1" y2="0.75" stroke="currentColor" strokeWidth="0.2" opacity="0.32" />
          </pattern>
        </defs>

        <g
          stroke="currentColor"
          fill="none"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Plate border + title rule */}
          <rect x="6" y="6" width="308" height="164" strokeWidth="0.5" opacity="0.85" />
          <rect x="9" y="9" width="302" height="158" strokeWidth="0.25" opacity="0.4" />
          <line x1="11" y1="22" x2="305" y2="22" strokeWidth="0.3" opacity="0.55" />
          <text
            x="160"
            y="17"
            textAnchor="middle"
            fontFamily="serif"
            fontStyle="italic"
            fontSize="6.5"
            stroke="none"
            fill="currentColor"
            opacity="0.7"
          >
            fig. 01 — real-time detection subsystem
          </text>

          {/* ─── Camera assembly (left) ─────────────────────────── */}
          {/* Wall bracket */}
          <g transform="translate(28, 62)">
            <path d="M 0 0 L 0 -12 L 20 -12 L 20 -8 L 4 -8 L 4 0 Z" strokeWidth="0.55" />
            <rect x="4" y="-4" width="14" height="3.5" fill="url(#plate-hatch)" stroke="none" />
            <circle cx="6" cy="-10" r="0.5" fill="currentColor" stroke="none" />
            <circle cx="14" cy="-10" r="0.5" fill="currentColor" stroke="none" />
          </g>

          {/* Camera body */}
          <g transform="translate(28, 62)">
            <rect x="0" y="0" width="58" height="26" rx="2.5" strokeWidth="0.6" />
            <line x1="2" y1="3" x2="56" y2="3" strokeWidth="0.3" />
            <rect x="2" y="17" width="54" height="7.5" fill="url(#plate-hatch)" stroke="none" />
            {/* Vents */}
            <line x1="14" y1="6.5" x2="46" y2="6.5" strokeWidth="0.25" opacity="0.7" />
            <line x1="14" y1="8.5" x2="46" y2="8.5" strokeWidth="0.25" opacity="0.7" />
            {/* Stenciled model */}
            <text
              x="10"
              y="15"
              fontSize="3.6"
              fontFamily="monospace"
              stroke="none"
              fill="currentColor"
              opacity="0.85"
            >
              NXT-CAM/2
            </text>
            {/* Status indicator */}
            <circle cx="50" cy="20" r="1" strokeWidth="0.3" />
            <circle cx="50" cy="20" r="0.45" fill="currentColor" stroke="none" />
          </g>

          {/* Lens housing — cylinder protruding from front */}
          <g transform="translate(86, 75)">
            <ellipse cx="0" cy="0" rx="3.8" ry="14" strokeWidth="0.55" />
            <ellipse cx="1" cy="0" rx="2.4" ry="11.8" strokeWidth="0.4" />
            <ellipse cx="1.8" cy="0" rx="1.1" ry="7.8" fill="url(#plate-hatch)" stroke="currentColor" strokeWidth="0.3" />
            {/* Reflection glint */}
            <ellipse cx="1.7" cy="-3.2" rx="0.4" ry="1.3" fill="currentColor" stroke="none" opacity="0.7" />
            {/* IR LEDs ringing lens */}
            <circle cx="0" cy="-10" r="0.9" strokeWidth="0.3" />
            <circle cx="0" cy="10" r="0.9" strokeWidth="0.3" />
          </g>

          {/* Signal cable: camera → monitor */}
          <path d="M 28 86 C 24 110, 56 128, 132 120 C 162 114, 180 106, 184 102" strokeWidth="0.5" />
          <ellipse cx="80" cy="124" rx="2.2" ry="0.8" strokeWidth="0.3" />

          {/* ─── Monitor assembly (right) ───────────────────────── */}
          <g transform="translate(180, 32)">
            {/* Outer bezel */}
            <rect x="0" y="0" width="124" height="88" rx="2.5" strokeWidth="0.65" />
            {/* Inner bezel double-line for depth */}
            <rect x="2.5" y="2.5" width="119" height="83" strokeWidth="0.3" opacity="0.7" />
            {/* Underside shadow */}
            <rect x="2.5" y="78" width="119" height="7" fill="url(#plate-hatch)" stroke="none" />
            <text
              x="62"
              y="84"
              textAnchor="middle"
              fontSize="3.2"
              fontFamily="serif"
              fontStyle="italic"
              stroke="none"
              fill="currentColor"
              opacity="0.85"
            >
              nexotek
            </text>
            {/* Bezel control buttons */}
            <circle cx="117" cy="20" r="0.8" strokeWidth="0.3" />
            <circle cx="117" cy="26" r="0.8" strokeWidth="0.3" />
            <circle cx="117" cy="32" r="0.8" strokeWidth="0.3" />
            <circle cx="117" cy="38" r="0.8" strokeWidth="0.3" />
            {/* Screen well outline */}
            <rect x="7" y="8" width="108" height="64" strokeWidth="0.5" />
            {/* CRT scanlines */}
            <rect x="7" y="8" width="108" height="64" fill="url(#plate-scan)" stroke="none" />
          </g>

          {/* ─── Screen content ────────────────────────────────── */}
          <g transform="translate(187, 40)">
            {/* Horizon line */}
            <line x1="0" y1="32" x2="100" y2="32" strokeWidth="0.3" opacity="0.55" />
            {/* Perspective floor */}
            <line x1="0" y1="58" x2="40" y2="32" strokeWidth="0.25" opacity="0.4" />
            <line x1="20" y1="58" x2="46" y2="32" strokeWidth="0.25" opacity="0.4" />
            <line x1="80" y1="58" x2="54" y2="32" strokeWidth="0.25" opacity="0.4" />
            <line x1="100" y1="58" x2="60" y2="32" strokeWidth="0.25" opacity="0.4" />
            <line x1="10" y1="56" x2="90" y2="56" strokeWidth="0.25" opacity="0.45" />
            <line x1="22" y1="52" x2="78" y2="52" strokeWidth="0.25" opacity="0.4" />
            <line x1="34" y1="46" x2="66" y2="46" strokeWidth="0.25" opacity="0.32" />

            {/* Figure silhouette */}
            <g transform="translate(46, 30)" fill="currentColor" stroke="none" opacity="0.92">
              <circle cx="2" cy="0" r="1.6" />
              <path d="M 0 2.2 L 4 2.2 L 4 11 L 0 11 Z" />
              <path d="M 0 11 L -1 18 L 1 18 Z" />
              <path d="M 4 11 L 5 18 L 3 18 Z" />
              <path d="M 0 4 L -3 10 L -1.2 10 Z" />
              <path d="M 4 4 L 7 10 L 5.2 10 Z" />
            </g>

            {/* Bounding box — corner brackets */}
            <g className="nx-plate-box" stroke="currentColor" strokeWidth="0.45" fill="none">
              <path d="M 38 26 L 42 26 M 42 26 L 42 22" />
              <path d="M 56 26 L 52 26 M 52 26 L 52 22" />
              <path d="M 38 52 L 42 52 M 42 52 L 42 56" />
              <path d="M 56 52 L 52 52 M 52 52 L 52 56" />
            </g>

            {/* Detection label tied to box */}
            <line x1="56" y1="28" x2="62" y2="28" strokeWidth="0.3" />
            <text x="63" y="29" fontSize="3" fontFamily="monospace" stroke="none" fill="currentColor">
              person · 0.924
            </text>

            {/* HUD: timestamp + REC */}
            <text x="2" y="6" fontSize="3" fontFamily="monospace" stroke="none" fill="currentColor">
              16:42:08.214
            </text>
            <text x="90" y="6" fontSize="3" fontFamily="monospace" stroke="none" fill="currentColor">
              REC
            </text>
            <circle cx="100" cy="5" r="1.1" fill="currentColor" stroke="none" className="nx-plate-rec" />

            {/* HUD: frame counter + geo */}
            <text x="2" y="62" fontSize="2.8" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.75">
              f#02814372 · 4.1 ms
            </text>
            <text
              x="100"
              y="62"
              textAnchor="end"
              fontSize="2.8"
              fontFamily="monospace"
              stroke="none"
              fill="currentColor"
              opacity="0.75"
            >
              37.7749 −122.4194
            </text>
          </g>

          {/* Monitor stand */}
          <g transform="translate(180, 32)">
            <path d="M 55 88 L 69 88 L 71 94 L 53 94 Z" strokeWidth="0.5" />
            <rect x="53" y="94" width="18" height="2.5" fill="url(#plate-hatch)" stroke="currentColor" strokeWidth="0.45" />
            <line x1="46" y1="96.5" x2="78" y2="96.5" strokeWidth="0.5" />
          </g>

          {/* ─── Leader lines + callouts ───────────────────────── */}
          {/* 1080p IR · 100° fov → camera lens */}
          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="91" cy="65" r="0.5" fill="currentColor" stroke="none" />
            <line x1="91" y1="65" x2="106" y2="50" />
            <line x1="106" y1="50" x2="158" y2="50" />
          </g>
          <text x="108" y="48" fontSize="3.6" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">
            1080p IR · 100° fov
          </text>

          {/* ONVIF · RTSP/H.265 → cable */}
          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="98" cy="125" r="0.5" fill="currentColor" stroke="none" />
            <line x1="98" y1="125" x2="98" y2="138" />
          </g>
          <text x="98" y="145" textAnchor="middle" fontSize="3.6" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">
            ONVIF · RTSP/H.265
          </text>

          {/* edge inference · 4 ms → monitor screen */}
          <g strokeWidth="0.3" opacity="0.85">
            <circle cx="222" cy="124" r="0.5" fill="currentColor" stroke="none" />
            <line x1="222" y1="124" x2="222" y2="138" />
          </g>
          <text x="222" y="145" textAnchor="middle" fontSize="3.6" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">
            edge inference · 4 ms
          </text>

          {/* Dimension bar at bottom */}
          <g strokeWidth="0.3" opacity="0.55">
            <line x1="36" y1="158" x2="36" y2="162" />
            <line x1="298" y1="158" x2="298" y2="162" />
            <line x1="40" y1="160" x2="294" y2="160" />
            <path d="M 36 160 L 39.5 158.5 L 39.5 161.5 Z" fill="currentColor" stroke="none" />
            <path d="M 298 160 L 294.5 158.5 L 294.5 161.5 Z" fill="currentColor" stroke="none" />
          </g>
          <text x="167" y="158" textAnchor="middle" fontSize="3.4" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.7">
            end-to-end pipeline · 12 ms p99
          </text>
        </g>
      </svg>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Pillar marks — bold iconic silhouettes for card covers
// ──────────────────────────────────────────────────────────────────────────
// Same ink-line vocabulary as the detailed plates, but radically simplified
// to one dominant silhouette with generous negative space. Reads at a glance;
// the full plate is the reward inside the popup.

function MarkDetection() {
  return (
    <g transform="translate(160, 86)">
      <circle r="42" strokeWidth="1.1" />
      <circle r="28" strokeWidth="0.45" opacity="0.6" />
      <circle r="4" fill="currentColor" stroke="none" />
      <path d="M -52 -8 L -52 -2 L -46 -2 M -52 8 L -52 2 L -46 2" strokeWidth="0.9" />
      <path d="M 52 -8 L 52 -2 L 46 -2 M 52 8 L 52 2 L 46 2" strokeWidth="0.9" />
      <path d="M -8 -52 L -2 -52 L -2 -46 M 8 -52 L 2 -52 L 2 -46" strokeWidth="0.9" />
      <path d="M -8 52 L -2 52 L -2 46 M 8 52 L 2 52 L 2 46" strokeWidth="0.9" />
      <g strokeWidth="0.4" opacity="0.5">
        <line x1="0" y1="-42" x2="0" y2="-36" />
        <line x1="36.4" y1="-21" x2="31.2" y2="-18" />
        <line x1="36.4" y1="21" x2="31.2" y2="18" />
        <line x1="0" y1="42" x2="0" y2="36" />
        <line x1="-36.4" y1="21" x2="-31.2" y2="18" />
        <line x1="-36.4" y1="-21" x2="-31.2" y2="-18" />
      </g>
    </g>
  );
}

function MarkEdge() {
  return (
    <g transform="translate(160, 88)">
      <rect x="-58" y="-32" width="116" height="64" rx="3" strokeWidth="1.1" />
      <rect x="-58" y="14" width="116" height="18" fill="url(#mark-hatch)" stroke="none" />
      <g strokeWidth="0.55" opacity="0.85">
        <line x1="-46" y1="-22" x2="-46" y2="10" />
        <line x1="-36" y1="-22" x2="-36" y2="10" />
        <line x1="-26" y1="-22" x2="-26" y2="10" />
        <line x1="-16" y1="-22" x2="-16" y2="10" />
        <line x1="-6" y1="-22" x2="-6" y2="10" />
        <line x1="4" y1="-22" x2="4" y2="10" />
        <line x1="14" y1="-22" x2="14" y2="10" />
        <line x1="24" y1="-22" x2="24" y2="10" />
        <line x1="34" y1="-22" x2="34" y2="10" />
        <line x1="44" y1="-22" x2="44" y2="10" />
      </g>
      <rect x="-14" y="-6" width="28" height="14" strokeWidth="0.7" />
      <g strokeWidth="0.55">
        {Array.from({ length: 17 }).map((_, i) => (
          <line key={i} x1={-48 + i * 6} y1="32" x2={-48 + i * 6} y2="40" />
        ))}
      </g>
      <circle cx="46" cy="-22" r="2" strokeWidth="0.5" />
      <circle cx="46" cy="-22" r="0.9" fill="currentColor" stroke="none" />
    </g>
  );
}

function MarkChain() {
  return (
    <g transform="translate(160, 86)">
      <g transform="translate(-12, -16)">
        <rect x="-40" y="-26" width="80" height="52" strokeWidth="0.55" opacity="0.6" />
      </g>
      <g transform="translate(-2, -6)">
        <rect x="-40" y="-26" width="80" height="52" strokeWidth="0.8" opacity="0.85" />
        <line x1="-32" y1="-14" x2="20" y2="-14" strokeWidth="0.4" opacity="0.55" />
        <line x1="-32" y1="-8" x2="28" y2="-8" strokeWidth="0.4" opacity="0.55" />
      </g>
      <g transform="translate(8, 4)">
        <rect x="-40" y="-26" width="80" height="52" strokeWidth="1.1" />
        <line x1="-32" y1="-14" x2="20" y2="-14" strokeWidth="0.5" opacity="0.65" />
        <line x1="-32" y1="-8" x2="28" y2="-8" strokeWidth="0.5" opacity="0.65" />
        <line x1="-32" y1="-2" x2="16" y2="-2" strokeWidth="0.5" opacity="0.6" />
        <circle cx="28" cy="14" r="6" strokeWidth="0.7" />
        <circle cx="28" cy="14" r="4" strokeWidth="0.35" opacity="0.55" />
        <text x="28" y="15.5" textAnchor="middle" fontSize="3" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">✓</text>
      </g>
    </g>
  );
}

function MarkCamera() {
  const corners = [
    { tx: -56, ty: -36, flip: 1 },
    { tx: 36, ty: -36, flip: -1 },
    { tx: -56, ty: 28, flip: 1 },
    { tx: 36, ty: 28, flip: -1 },
  ];
  return (
    <g transform="translate(160, 86)">
      <rect x="-12" y="-7" width="24" height="14" rx="1.5" strokeWidth="0.9" />
      <circle cx="0" cy="0" r="2" fill="currentColor" stroke="none" />
      <g strokeWidth="0.45" strokeDasharray="2.5 2.5" opacity="0.7">
        <line x1="-9" y1="-5" x2="-46" y2="-32" />
        <line x1="9" y1="-5" x2="46" y2="-32" />
        <line x1="-9" y1="5" x2="-46" y2="32" />
        <line x1="9" y1="5" x2="46" y2="32" />
      </g>
      {corners.map((c, i) => (
        <g key={i} transform={`translate(${c.tx} ${c.ty})`}>
          <rect x="0" y="0" width="20" height="10" rx="1" strokeWidth="0.85" />
          {c.flip > 0 ? (
            <>
              <ellipse cx="20" cy="5" rx="1.6" ry="4.5" strokeWidth="0.7" />
              <ellipse cx="20.6" cy="5" rx="0.9" ry="3" strokeWidth="0.4" />
            </>
          ) : (
            <>
              <ellipse cx="0" cy="5" rx="1.6" ry="4.5" strokeWidth="0.7" />
              <ellipse cx="-0.6" cy="5" rx="0.9" ry="3" strokeWidth="0.4" />
            </>
          )}
          <circle cx={c.flip > 0 ? 4 : 16} cy="5" r="0.7" fill="currentColor" stroke="none" />
        </g>
      ))}
    </g>
  );
}

function MarkInterface() {
  return (
    <g transform="translate(160, 86)">
      <g transform="translate(-58, -22)">
        <path d="M 0 0 L 36 0 L 42 6 L 42 38 L 36 44 L 0 44 Z" strokeWidth="1.1" />
        <rect x="0" y="34" width="42" height="10" fill="url(#mark-hatch)" stroke="none" />
        <g fill="currentColor" stroke="none">
          {Array.from({ length: 3 }).map((_, row) =>
            Array.from({ length: 4 }).map((_, col) => (
              <circle key={`Lp${row}-${col}`} cx={10 + col * 7} cy={10 + row * 9} r="1.4" />
            ))
          )}
        </g>
      </g>
      <g transform="translate(16, -22)">
        <path d="M 42 0 L 6 0 L 0 6 L 0 38 L 6 44 L 42 44 Z" strokeWidth="1.1" />
        <rect x="0" y="34" width="42" height="10" fill="url(#mark-hatch)" stroke="none" />
        <g strokeWidth="0.6">
          {Array.from({ length: 3 }).map((_, row) =>
            Array.from({ length: 4 }).map((_, col) => (
              <circle key={`Rp${row}-${col}`} cx={10 + col * 7} cy={10 + row * 9} r="1.5" />
            ))
          )}
        </g>
      </g>
      <g strokeWidth="0.7">
        <line x1="-16" y1="0" x2="16" y2="0" strokeDasharray="3 3" opacity="0.8" />
        <path d="M 12 -3 L 16 0 L 12 3" fill="none" />
      </g>
    </g>
  );
}

function MarkVault() {
  return (
    <g transform="translate(160, 92)">
      <path d="M -22 -10 L -22 -34 A 22 22 0 0 1 22 -34 L 22 -10" strokeWidth="1.1" />
      <rect x="-32" y="-10" width="64" height="48" rx="3" strokeWidth="1.1" />
      <rect x="-32" y="28" width="64" height="10" fill="url(#mark-hatch)" stroke="none" />
      <circle cx="0" cy="8" r="4" strokeWidth="0.9" />
      <path d="M 0 12 L -2 22 L 2 22 Z" fill="currentColor" stroke="none" />
      <circle cx="-26" cy="-4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="26" cy="-4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="-26" cy="32" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="26" cy="32" r="0.9" fill="currentColor" stroke="none" />
    </g>
  );
}

function MarkForm() {
  return (
    <g transform="translate(160, 86)">
      <g strokeWidth="0.45" opacity="0.6">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={-44 + i * 6.7} y1="-46" x2={-40 + i * 6.7} y2="-46" />
        ))}
      </g>
      <rect x="-46" y="-42" width="92" height="76" strokeWidth="1.1" />
      <line x1="-38" y1="-32" x2="38" y2="-32" strokeWidth="0.55" />
      <g strokeWidth="0.4" opacity="0.55">
        <line x1="-38" y1="-22" x2="20" y2="-22" />
        <line x1="-38" y1="-14" x2="28" y2="-14" />
        <line x1="-38" y1="-6" x2="24" y2="-6" />
        <line x1="-38" y1="2" x2="18" y2="2" />
        <line x1="-38" y1="10" x2="30" y2="10" />
      </g>
      <g transform="translate(20, 22) rotate(-12)">
        <ellipse rx="20" ry="9" strokeWidth="0.85" />
        <ellipse rx="17" ry="6.5" strokeWidth="0.35" opacity="0.55" />
        <text textAnchor="middle" y="2" fontSize="4.5" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">UNDERWRITTEN</text>
      </g>
    </g>
  );
}

function MarkTraining() {
  // Clipboard with checked item — fits "site-specific training, operators learn
  // on the actual site" without becoming a literal classroom illustration.
  return (
    <g transform="translate(160, 86)">
      {/* clip at top */}
      <rect x="-12" y="-50" width="24" height="9" rx="1.5" strokeWidth="0.9" />
      <rect x="-7" y="-48" width="14" height="4" strokeWidth="0.4" opacity="0.55" />
      {/* clipboard body */}
      <rect x="-34" y="-42" width="68" height="84" rx="2" strokeWidth="1.1" />
      {/* paper inset */}
      <rect x="-29" y="-32" width="58" height="68" strokeWidth="0.4" opacity="0.55" />
      {/* checked task */}
      <rect x="-26" y="-26" width="7" height="7" strokeWidth="0.6" />
      <path d="M -24 -22 L -22 -20 L -18 -25" strokeWidth="0.9" />
      <line x1="-15" y1="-22" x2="22" y2="-22" strokeWidth="0.4" opacity="0.6" />
      {/* checked task 2 */}
      <rect x="-26" y="-14" width="7" height="7" strokeWidth="0.6" />
      <path d="M -24 -10 L -22 -8 L -18 -13" strokeWidth="0.9" />
      <line x1="-15" y1="-10" x2="18" y2="-10" strokeWidth="0.4" opacity="0.6" />
      {/* open task */}
      <rect x="-26" y="-2" width="7" height="7" strokeWidth="0.6" />
      <line x1="-15" y1="2" x2="22" y2="2" strokeWidth="0.4" opacity="0.6" />
      {/* in-progress task */}
      <rect x="-26" y="10" width="7" height="7" strokeWidth="0.6" />
      <line x1="-15" y1="14" x2="14" y2="14" strokeWidth="0.4" opacity="0.6" />
      {/* signature line */}
      <line x1="-26" y1="28" x2="14" y2="28" strokeWidth="0.45" />
      <text x="-26" y="34" fontSize="3" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.7">site-trained · signed</text>
      {/* cross-hatched base */}
      <rect x="-34" y="36" width="68" height="6" fill="url(#mark-hatch)" stroke="none" />
    </g>
  );
}

function MarkCertificate() {
  const scallops = Array.from({ length: 16 }).map((_, i) => {
    const a = (i * Math.PI) / 8;
    return {
      i,
      cx: Math.round(Math.cos(a) * 4200) / 100,
      cy: Math.round(Math.sin(a) * 4200) / 100,
    };
  });
  return (
    <g transform="translate(160, 78)">
      <g strokeWidth="0.55" opacity="0.7">
        {scallops.map((s) => (
          <circle key={s.i} cx={s.cx} cy={s.cy} r="2.6" />
        ))}
      </g>
      <circle r="38" strokeWidth="1.2" />
      <circle r="32" strokeWidth="0.5" opacity="0.6" />
      <circle r="38" fill="url(#mark-hatch)" stroke="none" opacity="0.18" />
      <text textAnchor="middle" y="-2" fontSize="7" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.92">IACET</text>
      <text textAnchor="middle" y="8" fontSize="4" fontFamily="serif" stroke="none" fill="currentColor" opacity="0.7">accredited</text>
      <path d="M -16 36 L -20 64 L -10 58 L -6 64 L -6 38" strokeWidth="0.9" />
      <path d="M 16 36 L 20 64 L 10 58 L 6 64 L 6 38" strokeWidth="0.9" />
    </g>
  );
}

// Index-aligned with PILLAR_DETAILS in comparison-table.tsx.
// MarkVault is intentionally unused for now (no current pillar maps to it);
// kept exported in case a privacy/security pillar is added later.
const MARKS: readonly (() => ReactNode)[] = [
  MarkDetection,    // 0: 3D scene reconstruction from alerts
  MarkEdge,         // 1: on-premise / on-device inference
  MarkInterface,    // 2: ONVIF / open standards / existing cameras
  MarkChain,        // 3: forensic-method 3D walkthrough
  MarkCamera,       // 4: multiplayer 3D walkthroughs / collaboration
  MarkTraining,     // 5: site-specific training on real footage
  MarkCertificate,  // 6: IACET CEUs / accredited credential
  MarkForm,         // 7: insurance underwriting / commercial carrier
];

export function PillarMark({
  index,
  className,
}: {
  readonly index: number;
  readonly className?: string;
}) {
  const Inner = MARKS[index % MARKS.length] ?? MarkDetection;
  return (
    <div className={className}>
      <svg
        viewBox="0 0 320 176"
        preserveAspectRatio="xMidYMid meet"
        className="block h-full w-full"
        aria-hidden="true"
        fill="none"
      >
        <defs>
          <pattern id="mark-hatch" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="2" stroke="currentColor" strokeWidth="0.3" opacity="0.55" />
          </pattern>
        </defs>
        <g stroke="currentColor" fill="none" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
          <Inner />
        </g>
      </svg>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Section-level artifact: closed-loop plate
// ──────────────────────────────────────────────────────────────────────────
// Wide composition (~960×360 viewBox). Three stations — DETECT, RECONSTRUCT,
// TRAIN — connected by forward arrows, with a curved return arc closing the
// loop below. Same line-vocabulary as the per-pillar plates; meant for the
// "Detect. Reconstruct. Train. The loop closes." section. Render at h-64 or
// h-80 in the page layout.

export function PillarPlateLoop({ className }: { readonly className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 960 360"
        preserveAspectRatio="xMidYMid meet"
        className="block h-full w-full"
        aria-hidden="true"
        fill="none"
      >
        <defs>
          <pattern id="loop-hatch" patternUnits="userSpaceOnUse" width="2.5" height="2.5" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="2.5" stroke="currentColor" strokeWidth="0.3" opacity="0.55" />
          </pattern>
        </defs>

        <g stroke="currentColor" fill="none" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="14" y="14" width="932" height="332" strokeWidth="0.6" opacity="0.85" />
          <rect x="18" y="18" width="924" height="324" strokeWidth="0.3" opacity="0.4" />
          <line x1="22" y1="36" x2="938" y2="36" strokeWidth="0.35" opacity="0.55" />
          <text x="480" y="29" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="11" stroke="none" fill="currentColor" opacity="0.75">
            fig. 00 — closed-loop · detect, reconstruct, train
          </text>

          {/* ── STATION 1 · DETECT ─────────────────────────────── */}
          <g transform="translate(56, 70)">
            <rect x="0" y="0" width="220" height="180" rx="3" strokeWidth="0.8" />
            <rect x="0" y="156" width="220" height="24" fill="url(#loop-hatch)" stroke="none" opacity="0.5" />
            <text x="12" y="22" fontSize="6.5" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.75">01 / station</text>
            <text x="208" y="22" textAnchor="end" fontSize="6.5" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.55">edge · real-time</text>
            <line x1="12" y1="30" x2="208" y2="30" strokeWidth="0.3" opacity="0.45" />
            <g transform="translate(110, 92)">
              <circle r="44" strokeWidth="1.1" />
              <circle r="28" strokeWidth="0.45" opacity="0.55" />
              <circle r="4" fill="currentColor" stroke="none" />
              <path d="M -54 -10 L -54 -2 L -46 -2 M -54 10 L -54 2 L -46 2" strokeWidth="0.85" />
              <path d="M 54 -10 L 54 -2 L 46 -2 M 54 10 L 54 2 L 46 2" strokeWidth="0.85" />
              <path d="M -10 -54 L -2 -54 L -2 -46 M 10 -54 L 2 -54 L 2 -46" strokeWidth="0.85" />
              <path d="M -10 54 L -2 54 L -2 46 M 10 54 L 2 54 L 2 46" strokeWidth="0.85" />
            </g>
            <text x="110" y="166" textAnchor="middle" fontSize="13" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor">Detect</text>
            <text x="110" y="176" textAnchor="middle" fontSize="6" fontFamily="serif" stroke="none" fill="currentColor" opacity="0.7">alert + bounded subject</text>
          </g>

          {/* ── STATION 2 · RECONSTRUCT ────────────────────────── */}
          <g transform="translate(370, 70)">
            <rect x="0" y="0" width="220" height="180" rx="3" strokeWidth="0.8" />
            <rect x="0" y="156" width="220" height="24" fill="url(#loop-hatch)" stroke="none" opacity="0.5" />
            <text x="12" y="22" fontSize="6.5" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.75">02 / station</text>
            <text x="208" y="22" textAnchor="end" fontSize="6.5" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.55">forensic · spatial</text>
            <line x1="12" y1="30" x2="208" y2="30" strokeWidth="0.3" opacity="0.45" />
            <g transform="translate(110, 92)">
              <g transform="translate(-14, -18)">
                <rect x="-42" y="-28" width="84" height="56" strokeWidth="0.55" opacity="0.55" />
              </g>
              <g transform="translate(-4, -8)">
                <rect x="-42" y="-28" width="84" height="56" strokeWidth="0.85" opacity="0.85" />
                <line x1="-34" y1="-14" x2="22" y2="-14" strokeWidth="0.45" opacity="0.55" />
                <line x1="-34" y1="-6" x2="30" y2="-6" strokeWidth="0.45" opacity="0.55" />
              </g>
              <g transform="translate(8, 4)">
                <rect x="-42" y="-28" width="84" height="56" strokeWidth="1.1" />
                <line x1="-34" y1="-14" x2="22" y2="-14" strokeWidth="0.5" opacity="0.65" />
                <line x1="-34" y1="-6" x2="30" y2="-6" strokeWidth="0.5" opacity="0.65" />
                <line x1="-34" y1="2" x2="18" y2="2" strokeWidth="0.5" opacity="0.6" />
                <circle cx="30" cy="14" r="6" strokeWidth="0.7" />
                <text x="30" y="15.5" textAnchor="middle" fontSize="3.2" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">✓</text>
              </g>
            </g>
            <text x="110" y="166" textAnchor="middle" fontSize="13" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor">Reconstruct</text>
            <text x="110" y="176" textAnchor="middle" fontSize="6" fontFamily="serif" stroke="none" fill="currentColor" opacity="0.7">3D walkthrough · hash-anchored</text>
          </g>

          {/* ── STATION 3 · TRAIN ──────────────────────────────── */}
          <g transform="translate(684, 70)">
            <rect x="0" y="0" width="220" height="180" rx="3" strokeWidth="0.8" />
            <rect x="0" y="156" width="220" height="24" fill="url(#loop-hatch)" stroke="none" opacity="0.5" />
            <text x="12" y="22" fontSize="6.5" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.75">03 / station</text>
            <text x="208" y="22" textAnchor="end" fontSize="6.5" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.55">IACET · site-specific</text>
            <line x1="12" y1="30" x2="208" y2="30" strokeWidth="0.3" opacity="0.45" />
            <g transform="translate(110, 92)">
              <rect x="-12" y="-54" width="24" height="9" rx="1.5" strokeWidth="0.85" />
              <rect x="-7" y="-52" width="14" height="4" strokeWidth="0.4" opacity="0.55" />
              <rect x="-36" y="-46" width="72" height="88" rx="2" strokeWidth="1.1" />
              <rect x="-30" y="-36" width="60" height="72" strokeWidth="0.4" opacity="0.5" />
              <g strokeWidth="0.55">
                <rect x="-26" y="-28" width="7" height="7" />
                <path d="M -24 -24 L -22 -22 L -18 -27" strokeWidth="0.9" />
                <line x1="-15" y1="-24" x2="22" y2="-24" strokeWidth="0.4" opacity="0.6" />
                <rect x="-26" y="-14" width="7" height="7" />
                <path d="M -24 -10 L -22 -8 L -18 -13" strokeWidth="0.9" />
                <line x1="-15" y1="-10" x2="18" y2="-10" strokeWidth="0.4" opacity="0.6" />
                <rect x="-26" y="0" width="7" height="7" />
                <line x1="-15" y1="4" x2="20" y2="4" strokeWidth="0.4" opacity="0.6" />
                <rect x="-26" y="14" width="7" height="7" />
                <line x1="-15" y1="18" x2="16" y2="18" strokeWidth="0.4" opacity="0.6" />
              </g>
            </g>
            <text x="110" y="166" textAnchor="middle" fontSize="13" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor">Train</text>
            <text x="110" y="176" textAnchor="middle" fontSize="6" fontFamily="serif" stroke="none" fill="currentColor" opacity="0.7">operators · IACET CEUs</text>
          </g>

          {/* Forward arrows between stations */}
          <g strokeWidth="0.55" opacity="0.85">
            <line x1="282" y1="160" x2="362" y2="160" strokeDasharray="4 3" />
            <path d="M 358 156 L 366 160 L 358 164" />
          </g>
          <text x="322" y="152" textAnchor="middle" fontSize="7" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">event hash + frames</text>
          <text x="322" y="180" textAnchor="middle" fontSize="5.5" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.55">sha-256 · t+0</text>

          <g strokeWidth="0.55" opacity="0.85">
            <line x1="596" y1="160" x2="676" y2="160" strokeDasharray="4 3" />
            <path d="M 672 156 L 680 160 L 672 164" />
          </g>
          <text x="636" y="152" textAnchor="middle" fontSize="7" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">scene → ground truth</text>
          <text x="636" y="180" textAnchor="middle" fontSize="5.5" fontFamily="monospace" stroke="none" fill="currentColor" opacity="0.55">geometry · annotations</text>

          {/* Return arc closing the loop */}
          <g strokeWidth="0.55" opacity="0.85">
            <path d="M 794 250 C 794 312, 166 312, 166 250" strokeDasharray="5 4" />
            <path d="M 170 246 L 162 250 L 170 254" />
          </g>
          <text x="480" y="304" textAnchor="middle" fontSize="9" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.85">
            recurrence pattern + corrections feed back to detection
          </text>

          {/* Bottom dimension bar */}
          <g strokeWidth="0.3" opacity="0.55">
            <line x1="56" y1="334" x2="56" y2="338" />
            <line x1="904" y1="334" x2="904" y2="338" />
            <line x1="60" y1="336" x2="900" y2="336" />
            <path d="M 56 336 L 59.5 334.5 L 59.5 337.5 Z" fill="currentColor" stroke="none" />
            <path d="M 904 336 L 900.5 334.5 L 900.5 337.5 Z" fill="currentColor" stroke="none" />
          </g>
          <text x="480" y="334" textAnchor="middle" fontSize="6.5" fontFamily="serif" fontStyle="italic" stroke="none" fill="currentColor" opacity="0.7">
            continuous loop · per incident, per site · tamper-evident
          </text>
        </g>
      </svg>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// ChapterDivider — slim editorial separator between major sections
// ──────────────────────────────────────────────────────────────────────────
// Pair of thin horizontal rules around a small centered ornament. Use between
// major sections to introduce a chapter pause. Accepts optional `roman` and
// `title` — both rendered in italic serif underneath the rule. The ornament
// is a small fleuron drawn in the same line vocabulary as the pillar plates,
// so the divider feels printed-on-the-same-press as the rest of the page.

export function ChapterDivider({
  roman,
  title,
  className,
}: {
  readonly roman?: string;
  readonly title?: string;
  readonly className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex flex-col items-center text-current">
        <svg
          viewBox="0 0 480 36"
          preserveAspectRatio="xMidYMid meet"
          className="block h-9 w-full text-current"
          aria-hidden="true"
          fill="none"
        >
          <g stroke="currentColor" fill="none" strokeLinecap="round">
            <line x1="20" y1="18" x2="208" y2="18" strokeWidth="0.55" opacity="0.6" />
            <line x1="272" y1="18" x2="460" y2="18" strokeWidth="0.55" opacity="0.6" />
            <line x1="20" y1="20" x2="208" y2="20" strokeWidth="0.25" opacity="0.35" />
            <line x1="272" y1="20" x2="460" y2="20" strokeWidth="0.25" opacity="0.35" />
            <g transform="translate(240, 18)">
              <path
                d="M -22 0 C -16 -8, -6 -8, 0 0 C 6 -8, 16 -8, 22 0 C 16 8, 6 8, 0 0 C -6 8, -16 8, -22 0 Z"
                strokeWidth="0.55"
                opacity="0.85"
              />
              <circle r="2.4" fill="currentColor" stroke="none" />
              <line x1="0" y1="-12" x2="0" y2="-7" strokeWidth="0.5" opacity="0.7" />
              <line x1="0" y1="12" x2="0" y2="7" strokeWidth="0.5" opacity="0.7" />
              <line x1="-28" y1="0" x2="-26" y2="0" strokeWidth="0.4" opacity="0.55" />
              <line x1="26" y1="0" x2="28" y2="0" strokeWidth="0.4" opacity="0.55" />
            </g>
          </g>
        </svg>
        {(roman || title) && (
          <p className="mt-3 font-serif text-sm italic tracking-wide opacity-80">
            {roman}
            {roman && title ? '. ' : ''}
            {title}
          </p>
        )}
      </div>
    </div>
  );
}
