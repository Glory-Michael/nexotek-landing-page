'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useNarrowViewport } from '@/hooks/use-narrow-viewport';
import { SectionShell } from './section-shell';
import { PillarMark, PillarPlate } from './pillar-illustrations';
import type { ComparisonSection } from '@/types/landing-page';

interface Pillar {
  title: string;
  badge?: string;
  description?: string;
  detail?: string;
}

function buildPillar(
  label: string | undefined,
  responseRaw: string | undefined,
  detailRaw: string | undefined,
): Pillar | null {
  const title = (label ?? '').trim();
  const raw = (responseRaw ?? '').trim();
  if (!title && !raw) return null;

  const badge = /\(([^)]+)\)/.exec(raw)?.[1]?.trim();

  const stripped = raw
    .replace(/\([^)]+\)/g, '')
    .replace(/[✓✗×]/g, '')
    .trim();
  const description = stripped.length >= 8 ? stripped : undefined;
  const detail = detailRaw?.trim() || undefined;

  return {
    title: title || stripped,
    badge,
    description,
    detail,
  };
}

export function ComparisonTable({ block }: Readonly<{ block: ComparisonSection }>) {
  const columns = block.columns ?? [];
  const rows = block.rows ?? [];

  const flaggedUsIdx = columns.findIndex((c) => c.isUs);
  const usIdx = flaggedUsIdx >= 0 ? flaggedUsIdx : Math.max(0, columns.length - 1);

  const pillars: Pillar[] = rows
    .map((row) => buildPillar(row.label, row.cells?.[usIdx]?.value, row.detail))
    .filter((p): p is Pillar => p !== null && p.title.length > 0);

  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const openPillar = openIdx === null ? null : pillars[openIdx];

  return (
    <SectionShell
      anchorId={block.anchorId ?? '#why'}
      surface="paper"
      eyebrow={block.title || 'Why Nexotek'}
      leadSentence={block.leadSentence}
    >
      <PillarMarquee pillars={pillars} onOpen={setOpenIdx} />
      {openPillar && openIdx !== null && (
        <PillarDialog
          pillar={openPillar}
          index={openIdx}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </SectionShell>
  );
}

interface PillarMarqueeProps {
  readonly pillars: Pillar[];
  readonly onOpen: (idx: number) => void;
}

function PillarMarquee({ pillars, onOpen }: PillarMarqueeProps) {
  const reduced = useReducedMotion();
  // The auto-scrolling marquee assumes users can hover/focus to pause and read.
  // On touch viewports there's no hover and the moving cards are hard to tap,
  // so below `md` we drop to the same swipeable snap-x list the reduced-motion
  // path already uses.
  const isNarrow = useNarrowViewport();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [scrollIdx, setScrollIdx] = useState(0);

  if (pillars.length === 0) return null;

  if (reduced || isNarrow) {
    return (
      <div>
        {/* Bleed the wrapper so the absolute-positioned chevron sits at the
            true viewport edge — the previous structure had the wrapper at the
            content edge, so the arrow appeared ~24px inside the screen. */}
        <div className="relative -mx-6 md:-mx-12">
          <div
            className="overflow-x-auto px-6 md:px-12"
            onScroll={(e) => {
              // Track which card is active in the snap list to drive the dot indicator.
              const el = e.currentTarget;
              const child = el.querySelector('li');
              const cardWidth = child ? (child as HTMLElement).offsetWidth + 16 : 1;
              setScrollIdx(Math.round(el.scrollLeft / cardWidth));
            }}
          >
            <ol className="flex snap-x snap-mandatory gap-4 pb-4 pr-10 md:gap-6">
              {pillars.map((p, i) => (
                <li key={`static-${p.title}`} className="snap-start">
                  <PillarCard pillar={p} index={i} forceExpanded={false} onOpen={onOpen} />
                </li>
              ))}
            </ol>
          </div>
          {/* Faint right-edge chevron + fade — soft bounce until the user
              scrolls past the first card, then opacity → 0 so the dot
              indicator carries the affordance from there. The chevron's
              container now matches the bleed, so it lands at the actual
              screen edge. */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 transition-opacity duration-300 md:hidden ${
              scrollIdx === 0 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-nx-paper to-transparent dark:from-nx-black" />
            <svg
              viewBox="0 0 12 16"
              className="nx-comparison-arrow relative h-5 w-4 text-black/55 dark:text-white/65"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 4 L8 8 L2 12" />
            </svg>
          </div>
        </div>
        {/* Pagination indicator — gives mobile users an explicit affordance
            for the horizontal scroll. */}
        <div
          className="mt-3 flex items-center justify-center gap-1.5 md:hidden"
          aria-hidden
        >
          {pillars.map((p, i) => (
            <span
              key={`dot-${p.title}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === scrollIdx
                  ? 'w-4 bg-black/70 dark:bg-white/80'
                  : 'w-1.5 bg-black/25 dark:bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  const doubled = [...pillars, ...pillars];
  const total = doubled.length;

  return (
    <div
      className="nx-card-marquee-wrap nx-card-marquee-mask -mx-6 overflow-hidden px-0 md:-mx-12"
      ref={scrollerRef}
    >
      <ol className="nx-card-marquee flex w-max gap-4 md:gap-6">
        {doubled.map((p, i) => {
          const originalIdx = i % pillars.length;
          const cardKey = `marquee-${i}-${p.title}`;
          const swarmKey = `swarm-${i}`;
          const swarmRightKey = `swarm-${(i + 1) % total}`;
          const swarmLeftKey = `swarm-${(i - 1 + total) % total}`;
          // Approximate card-width + gap so the flow field is roughly continuous
          // across the row (each card samples a different region of the field).
          const worldOffsetX = i * 304;
          return (
            <li key={cardKey}>
              <PillarCard
                pillar={p}
                index={originalIdx}
                swarmKey={swarmKey}
                swarmRightKey={swarmRightKey}
                swarmLeftKey={swarmLeftKey}
                worldOffsetX={worldOffsetX}
                onFocusChange={(focused) =>
                  setFocusedKey(focused ? cardKey : (cur) => (cur === cardKey ? null : cur))
                }
                forceExpanded={focusedKey === cardKey}
                onOpen={onOpen}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

interface PillarCardProps {
  readonly pillar: Pillar;
  readonly index: number;
  readonly forceExpanded: boolean;
  readonly onFocusChange?: (focused: boolean) => void;
  readonly onOpen: (idx: number) => void;
  // When in the marquee, these route particle hand-offs to neighbors and
  // give each card a unique flow-field offset so chaos doesn't repeat.
  readonly swarmKey?: string;
  readonly swarmRightKey?: string;
  readonly swarmLeftKey?: string;
  readonly worldOffsetX?: number;
}

function PillarCard({
  pillar,
  index,
  forceExpanded,
  onFocusChange,
  onOpen,
  swarmKey,
  swarmRightKey,
  swarmLeftKey,
  worldOffsetX,
}: PillarCardProps) {
  const numLabel = String(index + 1).padStart(2, '0');
  const hasDescription = Boolean(pillar.description);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Drives the swarm to form its target shape when the card is engaged.
  const swarmActive = hovered || focused || forceExpanded;

  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => {
        setFocused(true);
        onFocusChange?.(true);
      }}
      onBlur={() => {
        setFocused(false);
        onFocusChange?.(false);
      }}
      aria-label={`${pillar.title} — click to expand`}
      className={`group relative flex h-72 w-72 cursor-pointer flex-col overflow-hidden rounded-sm border border-black/10 bg-white/40 p-6 text-left outline-none backdrop-blur-[1px] transition-all duration-300 hover:-translate-y-0.5 hover:border-black/30 hover:bg-white/70 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] focus-visible:border-black/40 focus-visible:ring-2 focus-visible:ring-black/30 motion-reduce:transition-none dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/30 dark:hover:bg-white/[0.06] md:h-80 md:w-80 md:p-7 ${
        forceExpanded ? 'border-black/30 dark:border-white/30' : ''
      }`}
    >
      <div className="relative z-10 flex items-start justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-500 tabular-nums dark:text-neutral-400">
          {numLabel}
        </span>
        {pillar.badge && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-600 dark:text-neutral-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-black/60 dark:bg-white/60" />
            {pillar.badge}
          </span>
        )}
      </div>

      <div className="mt-auto">
        <PillarMark
          index={index}
          className="mb-5 h-32 w-full text-black/65 transition-colors duration-300 group-hover:text-black/90 group-focus-within:text-black/90 dark:text-white/65 dark:group-hover:text-white/90 dark:group-focus-within:text-white/90 md:h-36"
        />

        <h3 className="font-serif text-2xl font-light leading-[1.15] text-black dark:text-white md:text-[28px]">
          {pillar.title}
        </h3>

        {hasDescription && (
          <div
            className={`grid transition-all duration-300 motion-reduce:transition-none ${
              forceExpanded
                ? 'mt-4 grid-rows-[1fr] opacity-100'
                : 'mt-0 grid-rows-[0fr] opacity-0 group-hover:mt-4 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:mt-4 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100'
            }`}
          >
            <p className="overflow-hidden font-sans text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {pillar.description}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Mini-graphs ───────────────────────────────────────────────────────────
// Dot-matrix / LiDAR point-cloud schematics. Each pillar is composed from
// dotted primitives (lines, polylines, rects, circles, arcs) sampled into
// arrays of points at module load and rendered as small <circle> elements
// that inherit currentColor — same paper/ink theming as before, but the
// dense dot composition reads as a tiny scan/sketch instead of a thin
// outline drawing.

type Pt = readonly [number, number];

function ptLine(x1: number, y1: number, x2: number, y2: number, step: number): Pt[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const n = Math.max(1, Math.round(dist / step));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([x1 + dx * t, y1 + dy * t]);
  }
  return out;
}

function ptPath(points: Pt[], step: number, closed = false): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    out.push(...ptLine(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], step));
  }
  if (closed && points.length > 1) {
    const last = points.at(-1)!;
    const first = points[0];
    out.push(...ptLine(last[0], last[1], first[0], first[1], step));
  }
  return out;
}

function ptRect(x: number, y: number, w: number, h: number, step: number): Pt[] {
  return ptPath(
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    step,
    true,
  );
}

function ptCircle(cx: number, cy: number, r: number, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

function ptArc(cx: number, cy: number, r: number, a0: number, a1: number, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

function ptCursor(cx: number, cy: number): Pt[] {
  return ptPath(
    [
      [cx, cy],
      [cx, cy + 5.5],
      [cx + 2, cy + 3.6],
      [cx + 3.5, cy + 5.8],
      [cx + 4.4, cy + 5.2],
      [cx + 2.9, cy + 3.1],
      [cx + 5.2, cy + 2.6],
    ],
    0.6,
    true,
  );
}

function ptBezier(p0: Pt, p1: Pt, p2: Pt, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const mt = 1 - t;
    out.push([mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0], mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1]]);
  }
  return out;
}

interface PillarShape {
  readonly base: Pt[];
  readonly accent: Pt[];
  readonly strokes?: ReadonlyArray<{ d: string; w?: number; dash?: string }>;
  readonly labels?: ReadonlyArray<{ x: number; y: number; text: string; size?: number }>;
}

const PILLAR_SHAPES: readonly PillarShape[] = [
  // 0 — Alert burst → navigable 3D scene
  {
    base: [
      ...ptRect(3, 3, 30, 30, 1.2),
      ...ptRect(48, 3, 49, 30, 1.2),
      ...ptCircle(18, 18, 4, 18),
      ...ptCircle(18, 18, 7, 28),
      ...ptPath([[64, 11], [78, 11], [84, 16], [84, 26], [70, 26], [64, 21]], 1, true),
      ...ptLine(64, 11, 70, 16, 1),
      ...ptLine(70, 16, 84, 16, 1),
      ...ptLine(70, 16, 70, 26, 1),
      ...ptLine(78, 11, 78, 16, 1),
      ...ptCircle(74, 22, 3, 16),
      ...ptLine(36, 18, 46, 18, 1.2),
      ...ptLine(50, 32, 50, 30, 0.8),
      ...ptLine(50, 30, 52, 30, 0.8),
    ],
    accent: [[18, 18], [74, 22], [40, 18]],
    strokes: [{ d: 'M44 16 L46 18 L44 20', w: 0.7 }],
  },
  // 1 — On-prem (no cloud egress)
  {
    base: [
      ...ptRect(3, 6, 42, 26, 1.2),
      ...ptRect(10, 13, 22, 17, 1.2),
      ...ptLine(10, 17, 32, 17, 1.2),
      ...ptLine(10, 21, 32, 21, 1.2),
      ...ptLine(10, 25, 32, 25, 1.2),
      ...ptArc(21, 12, 4, Math.PI, 2 * Math.PI, 18),
      ...ptLine(46, 19, 73, 19, 1.4),
      ...ptPath(
        [
          [78, 18],
          [78, 15],
          [80, 13],
          [83, 13],
          [85, 11],
          [88, 11],
          [91, 13],
          [93, 15],
          [93, 18],
          [91, 20],
          [81, 20],
          [78, 18],
        ],
        1,
        false,
      ),
    ],
    accent: [
      [12.5, 15], [14, 15], [12.5, 19], [14, 19], [12.5, 23], [14, 23],
      [21, 10], [21, 14],
    ],
    strokes: [
      { d: 'M55 11 L68 27', w: 1.1 },
      { d: 'M68 11 L55 27', w: 1.1 },
      { d: 'M71 17 L73 19 L71 21', w: 0.7 },
    ],
    labels: [{ x: 6, y: 10.5, text: 'ON-PREM', size: 2.4 }],
  },
  // 2 — Camera stack → ONVIF/RTSP → edge inference
  {
    base: [
      ...[10, 30, 50].flatMap((cx, i) => [
        ...ptRect(cx - 7, 6, 14, 9, 1.2),
        ...ptRect(cx - 9, 8, 3, 5, 1),
        ...ptCircle(cx - 7.5, 10.5, 1.4, 10),
        ...ptLine(cx, 15, cx, 20, 1),
        ...ptLine(cx - 2, 20, cx + 2, 20, 1),
        ...ptLine(cx - 9, 10.5, cx - 14, 8.5 + i * 1.2, 1.6),
        ...ptLine(cx - 9, 10.5, cx - 14, 12.5 + i * 1.2, 1.6),
      ]),
      ...ptLine(10, 20, 10, 24, 1),
      ...ptLine(30, 20, 30, 24, 1),
      ...ptLine(50, 20, 50, 24, 1),
      ...ptLine(10, 24, 60, 24, 1.1),
      ...ptRect(60, 22, 14, 6, 1.1),
      ...ptLine(74, 25, 82, 25, 1.1),
      ...ptRect(82, 22, 14, 6, 1.1),
      ...ptLine(84, 24, 94, 24, 1.1),
      ...ptLine(84, 26, 94, 26, 1.1),
    ],
    accent: [[15, 8.5], [35, 8.5], [55, 8.5], [67, 25], [89, 25]],
    labels: [{ x: 84, y: 33, text: 'EDGE', size: 2.5 }],
  },
  // 3 — Paper report → forensic 3D walkthrough
  {
    base: [
      ...ptPath([[4, 4], [22, 4], [26, 8], [26, 32], [4, 32]], 1.2, true),
      ...ptLine(22, 4, 22, 8, 1),
      ...ptLine(22, 8, 26, 8, 1),
      ...ptLine(7, 12, 22, 12, 1.1),
      ...ptLine(7, 15, 22, 15, 1.1),
      ...ptLine(7, 18, 20, 18, 1.1),
      ...ptLine(7, 21, 22, 21, 1.1),
      ...ptLine(7, 24, 17, 24, 1.1),
      ...ptLine(7, 27, 22, 27, 1.1),
      ...ptCircle(20, 29, 1.5, 8),
      ...ptLine(29, 18, 40, 18, 1.2),
      ...ptPath([[46, 12], [64, 8], [80, 12], [80, 26], [64, 30], [46, 26]], 1.1, true),
      ...ptLine(46, 12, 64, 16, 1.1),
      ...ptLine(64, 16, 80, 12, 1.1),
      ...ptLine(64, 16, 64, 30, 1.1),
      ...ptLine(53, 13.5, 53, 27, 1.1),
      ...ptLine(72, 14, 72, 28, 1.1),
      ...ptLine(46, 19, 80, 19, 1.1),
      ...ptLine(58, 9, 58, 14.5, 1),
      ...ptLine(70, 6, 70, 22, 1),
      ...ptLine(88, 32, 88, 28, 0.8),
      ...ptLine(88, 28, 92, 28, 0.8),
    ],
    accent: [[58, 14.5], [70, 22], [65, 25], [75, 23], [20, 29]],
    strokes: [{ d: 'M37 16 L40 18 L37 20', w: 0.7 }],
  },
  // 4 — Multiplayer 3D review
  {
    base: [
      ...ptRect(3, 3, 94, 30, 1.4),
      ...ptLine(5, 28, 95, 28, 1.4),
      ...ptPath([[40, 18], [58, 14], [70, 18], [70, 26], [58, 30], [40, 26]], 1.1, true),
      ...ptLine(40, 18, 58, 22, 1.1),
      ...ptLine(58, 22, 70, 18, 1.1),
      ...ptLine(58, 22, 58, 30, 1.1),
      ...ptCursor(12, 8),
      ...ptCursor(50, 11),
      ...ptCursor(82, 6),
      ...ptRect(20, 6, 9, 4, 1),
      ...ptRect(58, 9, 9, 4, 1),
      ...ptRect(73, 13, 9, 4, 1),
      ...ptLine(14, 14, 44, 22, 2.2),
      ...ptLine(52, 17, 58, 22, 1.6),
      ...ptLine(84, 12, 68, 22, 2.2),
    ],
    accent: [[50, 20], [64, 24], [12, 8], [50, 11], [82, 6]],
  },
  // 5 — Generic mock-up → real jobsite reconstruction
  {
    base: [
      ...ptPath([[5, 18], [5, 10], [12, 5], [19, 10], [19, 18]], 1.1, true),
      ...ptLine(34, 30, 97, 30, 1.2),
      ...ptLine(36, 32, 40, 30, 1.1),
      ...ptLine(44, 32, 48, 30, 1.1),
      ...ptLine(52, 32, 56, 30, 1.1),
      ...ptLine(60, 32, 64, 30, 1.1),
      ...ptLine(68, 32, 72, 30, 1.1),
      ...ptLine(76, 32, 80, 30, 1.1),
      ...ptLine(84, 32, 88, 30, 1.1),
      ...ptLine(92, 32, 96, 30, 1.1),
      ...ptRect(36, 14, 14, 16, 1.1),
      ...ptLine(36, 22, 50, 22, 1.1),
      ...ptLine(36, 14, 50, 22, 1.1),
      ...ptLine(50, 14, 36, 22, 1.1),
      ...ptLine(36, 22, 50, 30, 1.1),
      ...ptLine(50, 22, 36, 30, 1.1),
      ...ptLine(43, 14, 43, 4, 1),
      ...ptLine(43, 4, 62, 4, 1),
      ...ptLine(43, 4, 48, 9, 1),
      ...ptLine(60, 4, 60, 8, 1),
      ...ptRect(58, 8, 4, 3, 1),
      ...ptRect(56, 12, 22, 18, 1.1),
      ...ptLine(56, 18, 78, 18, 1.1),
      ...ptLine(56, 24, 78, 24, 1.1),
      ...ptLine(63, 12, 63, 30, 1.1),
      ...ptLine(71, 12, 71, 30, 1.1),
      ...ptArc(85, 26, 3, Math.PI, 2 * Math.PI, 10),
      ...ptLine(82, 26, 88, 26, 1),
      ...ptLine(85, 6, 85, 22, 1.3),
    ],
    accent: [[85, 6], [85, 29], [60, 9.5]],
    strokes: [
      { d: 'M3 6 L21 20', w: 1 },
      { d: 'M21 6 L3 20', w: 1 },
      { d: 'M24 14 L32 14 M29.5 12.5 L32 14 L29.5 15.5', w: 0.7 },
    ],
  },
  // 6 — Uncredentialed → IACET-stamped credential
  {
    base: [
      ...ptRect(4, 6, 28, 24, 1.2),
      ...ptLine(8, 12, 28, 12, 1.1),
      ...ptLine(8, 16, 22, 16, 1.1),
      ...ptLine(8, 20, 28, 20, 1.1),
      ...ptLine(8, 24, 20, 24, 1.1),
      ...ptLine(36, 18, 44, 18, 1.1),
      ...ptRect(46, 6, 50, 24, 1.2),
      ...ptLine(50, 10, 92, 10, 1.1),
      ...ptLine(50, 12.5, 80, 12.5, 1.1),
      ...ptLine(50, 18, 68, 18, 1.1),
      ...ptLine(50, 21, 64, 21, 1.1),
      ...ptLine(50, 24, 68, 24, 1.1),
      ...ptCircle(83, 22, 6, 32),
      ...ptCircle(83, 22, 4, 22),
      ...ptCircle(83, 22, 1.5, 10),
      ...ptPath([[80, 27], [79, 32], [83, 29.5], [87, 32], [86, 27]], 1, false),
    ],
    accent: [[83, 22], [83, 18], [83, 26], [79, 22], [87, 22]],
    strokes: [
      { d: 'M3 4 L33 32', w: 1.1 },
      { d: 'M33 4 L3 32', w: 1.1 },
      { d: 'M41.5 16.5 L44 18 L41.5 19.5', w: 0.7 },
      {
        d: 'M83 18.5 L84 20.5 L86.3 20.7 L84.6 22.2 L85.1 24.4 L83 23.3 L80.9 24.4 L81.4 22.2 L79.7 20.7 L82 20.5 Z',
        w: 0.6,
      },
    ],
    labels: [{ x: 50, y: 30.5, text: 'IACET', size: 2.3 }],
  },
  // 7 — Broker chain broken → direct carrier conversation
  {
    base: [
      ...ptCircle(8, 11, 2.5, 14),
      ...ptArc(8, 19, 4.5, Math.PI, 2 * Math.PI, 12),
      ...ptCircle(26, 11, 2.5, 14),
      ...ptArc(26, 19, 4.5, Math.PI, 2 * Math.PI, 12),
      ...ptBezier([12, 13], [40, 26], [70, 13], 40),
      ...ptCircle(74, 11, 2.5, 14),
      ...ptArc(74, 19, 4.5, Math.PI, 2 * Math.PI, 12),
      ...ptPath([[40, 16], [44, 14], [48, 16], [52, 14]], 0.6, false),
      ...ptPath([[40, 18], [44, 16], [48, 18], [52, 16]], 0.6, false),
      ...ptPath([[55, 5], [60, 7], [65, 4], [70, 6]], 0.9, false),
      ...ptRect(84, 22, 13, 10, 1.1),
      ...ptLine(86, 25, 95, 25, 1.1),
      ...ptLine(86, 28, 93, 28, 1.1),
      ...ptPath([[86, 30.5], [88, 29], [90, 31], [92, 29]], 0.9, false),
    ],
    accent: [[8, 11], [74, 11], [40, 22], [50, 22], [60, 7], [65, 4]],
    strokes: [
      { d: 'M20 6 L32 16', w: 1.1 },
      { d: 'M32 6 L20 16', w: 1.1 },
      { d: 'M68 11.5 L70 13 L68 14.5', w: 0.7 },
    ],
    labels: [
      { x: 3, y: 27, text: 'YOU', size: 2.4 },
      { x: 67, y: 27, text: 'CARRIER', size: 2.4 },
    ],
  },
];

// Round to 4 decimals so SVG coords match between Node V8 (SSR) and browser V8.
// Math.cos/Math.sin are not bit-stable across V8 builds, and ULP-level drift in
// the last digits of cx/cy was triggering React hydration mismatches.
const q = (n: number) => Math.round(n * 10000) / 10000;

function PillarGraph({ index, className }: { readonly index: number; readonly className?: string }) {
  const shape = PILLAR_SHAPES[index % PILLAR_SHAPES.length];
  if (!shape) return null;
  return (
    <svg
      viewBox="0 0 100 36"
      className={`block ${className ?? ''}`}
      aria-hidden="true"
    >
      <g>
        {shape.base.map((p, i) => {
          const x = q(p[0]);
          const y = q(p[1]);
          return <circle key={`b-${i}-${x}-${y}`} cx={x} cy={y} r="0.42" fill="currentColor" />;
        })}
      </g>
      <g>
        {shape.accent.map((p, i) => {
          const x = q(p[0]);
          const y = q(p[1]);
          return <circle key={`a-${i}-${x}-${y}`} cx={x} cy={y} r="0.95" fill="currentColor" />;
        })}
      </g>
      {shape.strokes?.map((s, i) => (
        <path
          key={`s-${i}-${s.d.slice(0, 12)}`}
          d={s.d}
          stroke="currentColor"
          strokeWidth={s.w ?? 0.5}
          strokeDasharray={s.dash}
          fill={s.d.trim().endsWith('Z') ? 'currentColor' : 'none'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {shape.labels?.map((l, i) => (
        <text
          key={`t-${i}-${l.text}`}
          x={l.x}
          y={l.y}
          fontSize={l.size ?? 2.5}
          fill="currentColor"
          stroke="none"
          style={{ letterSpacing: '0.3px' }}
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
}

// ── Dialog ────────────────────────────────────────────────────────────────
interface PillarDialogProps {
  readonly pillar: Pillar;
  readonly index: number;
  readonly onClose: () => void;
}

function PillarDialog({ pillar, index, onClose }: PillarDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (!dlg.open) dlg.showModal();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Intentionally do NOT call dlg.close() in cleanup. Real unmount
    // disconnects the dialog node from the DOM, which releases its
    // top-layer entry on its own. Calling close() here would queue an
    // async `close` event that survives StrictMode's dev double-invoke
    // (effect → cleanup → effect) — the queued event fires after the
    // second mount has reopened the dialog and would silently tear it
    // back down.
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [index]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={handleBackdropClick}
      className="fixed left-1/2 top-1/2 m-0 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-sm border border-black/15 bg-nx-paper p-0 text-nx-ink shadow-[0_20px_60px_-12px_rgba(0,0,0,0.35)] backdrop:bg-black/45 backdrop:backdrop-blur-sm dark:border-white/15 dark:bg-nx-black dark:text-white"
    >
      <div className="relative p-8 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-500 tabular-nums dark:text-neutral-400">
            {String(index + 1).padStart(2, '0')} · capability
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 flex h-9 w-9 items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        </div>

        <PillarPlate
          index={index}
          className="mt-7 h-56 w-full text-black/85 dark:text-white/85 md:h-64"
        />

        <h3 className="mt-7 font-serif text-3xl font-light leading-[1.08] text-black dark:text-white md:text-4xl">
          {pillar.title}
        </h3>

        {pillar.description && (
          <p className="mt-5 max-w-xl font-sans text-base leading-relaxed text-neutral-700 dark:text-neutral-300 md:text-lg">
            {pillar.description}
          </p>
        )}

        {pillar.detail && (
          <div className="mt-6 border-t border-black/10 pt-6 dark:border-white/10">
            <p className="max-w-xl font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {pillar.detail}
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center gap-3">
          <span className="h-px w-10 bg-black/40 dark:bg-white/40" />
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
            press esc to close
          </span>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
