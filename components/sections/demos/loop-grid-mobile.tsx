'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import { NxIcon, type NxIconName } from '@/components/brand/nx-icon';
import type { LoopDiagramNode } from '@/types/landing-page';
import { LoopPhasePeek } from './loop-phase-peek';
import { useGhostDemo } from '@/hooks/use-ghost-demo';

const ICON_BY_LABEL: Record<string, NxIconName> = {
  DETECT: 'radar',
  RECONSTRUCT: 'globe',
  TRAIN: 'shield',
  CONVERGE: 'grid',
};
const FALLBACKS: NxIconName[] = ['radar', 'globe', 'shield', 'grid'];

const VALID_ICONS = new Set<string>([
  'arrow-right', 'arrow-down', 'asset', 'close', 'globe', 'grid', 'hex',
  'menu', 'pause', 'play', 'play-circle', 'plus', 'radar', 'search',
  'shield', 'target', 'trend', 'user',
]);

function iconFor(
  override: string | undefined,
  label: string,
  fallback: NxIconName,
): NxIconName {
  if (override && VALID_ICONS.has(override)) return override as NxIconName;
  return ICON_BY_LABEL[label.toUpperCase()] ?? fallback;
}

// Explicit grid placement so the array order [DETECT, RECONSTRUCT, TRAIN,
// CONVERGE] lays out as TL, TR, BR, BL — matching the desktop cycle
// (DETECT → RECONSTRUCT → TRAIN → CONVERGE → DETECT).
const PLACEMENT = [
  'col-start-1 row-start-1', // TL  (i=0)
  'col-start-2 row-start-1', // TR  (i=1)
  'col-start-2 row-start-2', // BR  (i=2)
  'col-start-1 row-start-2', // BL  (i=3)
];

type Dir = 'right' | 'down' | 'left' | 'up';
const CHEVRON_PATH: Record<Dir, string> = {
  right: 'M 0 0 L 10 5 L 0 10 Z',
  down: 'M 0 0 L 5 10 L 10 0 Z',
  left: 'M 10 0 L 0 5 L 10 10 Z',
  up: 'M 0 10 L 5 0 L 10 10 Z',
};
const CHEVRON_TRANSFORM: Record<Dir, string> = {
  right: 'translate(-100%, -50%)',
  down: 'translate(-50%, -100%)',
  left: 'translate(0%, -50%)',
  up: 'translate(-50%, 0%)',
};

export function LoopGridMobile({ nodes }: { nodes: LoopDiagramNode[] }) {
  const tiles = nodes.slice(0, 4);
  // Default open on first phase so the section never reads as empty.
  const [expanded, setExpanded] = useState<number>(0);
  const baseId = useId();

  // Ghost demo: cycle 0 → 1 → 2 → 3 → 0 the first time this enters the
  // mobile viewport, so the user *sees* the tap-to-expand affordance.
  // localStorage-persisted; subsequent visits skip it.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ghostPlay = useGhostDemo(rootRef, 'loop-grid-mobile');
  const userTouchedRef = useRef(false);
  useEffect(() => {
    if (!ghostPlay || tiles.length === 0) return;
    const beats = [1, 2, 3, 0];
    const timers = beats.map((target, i) =>
      window.setTimeout(() => {
        if (!userTouchedRef.current) setExpanded(target);
      }, 600 * (i + 1)),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [ghostPlay, tiles.length]);
  const handleActivate = (i: number) => {
    userTouchedRef.current = true;
    setExpanded(i);
  };

  return (
    <div ref={rootRef} className="md:hidden">
      {/* 2×2 grid with overlaid SVG-like arrow cycle */}
      <div className="relative aspect-square w-full">
        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-8">
          {tiles.map((node, i) => (
            <div key={`${node.index}-${i}`} className={PLACEMENT[i]}>
              <LoopGridTile
                node={node}
                icon={iconFor(node.icon, node.label, FALLBACKS[i % 4])}
                isExpanded={expanded === i}
                onActivate={() => handleActivate(i)}
                panelId={`${baseId}-panel-${i}`}
              />
            </div>
          ))}
        </div>
        <ArrowOverlay tiles={tiles} />
      </div>

      <div className="mt-6">
        <ExpandedPanel
          node={tiles[expanded] ?? null}
          panelId={`${baseId}-panel-${expanded}`}
        />
      </div>
    </div>
  );
}

function LoopGridTile({
  node,
  icon,
  isExpanded,
  onActivate,
  panelId,
}: {
  node: LoopDiagramNode;
  icon: NxIconName;
  isExpanded: boolean;
  onActivate: () => void;
  panelId: string;
}) {
  const isRoadmap = node.status === 'roadmap';
  return (
    <button
      type="button"
      onClick={onActivate}
      aria-expanded={isExpanded}
      aria-controls={panelId}
      className={`relative flex h-full w-full flex-col justify-between bg-white/40 p-3 text-left backdrop-blur-[2px] transition-colors duration-300 dark:bg-black/30 ${
        isRoadmap ? 'border-dashed' : 'border-solid'
      } ${isExpanded ? 'border-2 border-current' : 'border border-current/30'}`}
    >
      <header className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center justify-center border transition-colors duration-300 ${
            isExpanded
              ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
              : 'border-current/45 text-current/70'
          }`}
          style={{ width: 26, height: 26 }}
        >
          <NxIcon name={icon} size={14} />
        </span>
        {isRoadmap ? (
          <span className="border border-current/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.22em] text-current/70">
            {node.statusLabel || 'BUILDING'}
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-current/60">
            {node.index}
          </span>
        )}
      </header>
      <div className="mt-2">
        <h3 className="font-display text-xl font-semibold uppercase leading-tight tracking-tight">
          {node.label}
        </h3>
        {node.tagline && (
          <p className="mt-1 line-clamp-2 font-sans text-[11px] leading-snug text-current/70">
            {node.tagline}
          </p>
        )}
      </div>
    </button>
  );
}

/**
 * Four cycle arrows positioned in the gaps of a 2×2 grid. Cycle order matches
 * the desktop closure: 0→1 (TL→TR, solid), 1→2 (TR→BR, solid), 2→3 (BR→BL,
 * dashed if the CONVERGE phase is roadmap), 3→0 (BL→TL, dashed for the same
 * reason). With Tailwind `gap-8` on an `aspect-square` container, each tile is
 * ~46.5% wide so the gap centers sit at 50% and the arrows have ~7% of width
 * (≈24px on a 342px container) to render in.
 */
function ArrowOverlay({ tiles }: { tiles: LoopDiagramNode[] }) {
  // Edges marked roadmap when EITHER endpoint is a roadmap phase — keeps the
  // visual cue from the desktop arrows.
  const isRoadmap = (i: number) =>
    tiles[i]?.status === 'roadmap' ||
    tiles[(i + 1) % 4]?.status === 'roadmap';

  // Each entry: where the arrow sits and which direction it points.
  // Coordinates are percentages of the grid area (aspect-square container).
  const arrows: Array<{
    dir: Dir;
    // Center of the arrow shaft in % of grid.
    cx: number;
    cy: number;
    // Length of the shaft in %, perpendicular to the chevron direction.
    shaftPct: number;
    roadmap: boolean;
  }> = [
    { dir: 'right', cx: 50, cy: 23.25, shaftPct: 7, roadmap: isRoadmap(0) },
    { dir: 'down', cx: 76.75, cy: 50, shaftPct: 7, roadmap: isRoadmap(1) },
    { dir: 'left', cx: 50, cy: 76.75, shaftPct: 7, roadmap: isRoadmap(2) },
    { dir: 'up', cx: 23.25, cy: 50, shaftPct: 7, roadmap: isRoadmap(3) },
  ];

  const HEAD_PX = 7;
  const SHAFT_PX = 1.5;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ opacity: 0.85 }}
    >
      {arrows.map((a, i) => {
        const horizontal = a.dir === 'right' || a.dir === 'left';
        // Shaft endpoint (where the chevron tip lands).
        const endX = a.dir === 'right' ? a.cx + a.shaftPct / 2 : a.dir === 'left' ? a.cx - a.shaftPct / 2 : a.cx;
        const endY = a.dir === 'down' ? a.cy + a.shaftPct / 2 : a.dir === 'up' ? a.cy - a.shaftPct / 2 : a.cy;
        // Shaft container — centered on (cx, cy), oriented along the axis.
        const shaftStyle: React.CSSProperties = horizontal
          ? {
              left: `${a.cx - a.shaftPct / 2}%`,
              top: `${a.cy}%`,
              width: `calc(${a.shaftPct}% - ${HEAD_PX}px)`,
              height: `${SHAFT_PX}px`,
              transform: 'translateY(-50%)',
              // Trim from the head-side end so we leave room for the chevron.
              marginLeft: a.dir === 'left' ? `${HEAD_PX}px` : undefined,
            }
          : {
              left: `${a.cx}%`,
              top: `${a.cy - a.shaftPct / 2}%`,
              width: `${SHAFT_PX}px`,
              height: `calc(${a.shaftPct}% - ${HEAD_PX}px)`,
              transform: 'translateX(-50%)',
              marginTop: a.dir === 'up' ? `${HEAD_PX}px` : undefined,
            };
        return (
          <div key={`arrow-${i}`}>
            <div
              className="absolute bg-current"
              style={{
                ...shaftStyle,
                opacity: a.roadmap ? 0.55 : 0.85,
                ...(a.roadmap
                  ? {
                      backgroundImage:
                        horizontal
                          ? 'repeating-linear-gradient(to right, currentColor 0 3px, transparent 3px 6px)'
                          : 'repeating-linear-gradient(to bottom, currentColor 0 3px, transparent 3px 6px)',
                      backgroundColor: 'transparent',
                    }
                  : null),
              }}
            />
            <div
              className="absolute text-current"
              style={{
                left: `${endX}%`,
                top: `${endY}%`,
                transform: CHEVRON_TRANSFORM[a.dir],
                opacity: a.roadmap ? 0.6 : 0.9,
              }}
            >
              <svg width={HEAD_PX} height={HEAD_PX} viewBox="0 0 10 10" display="block">
                <path d={CHEVRON_PATH[a.dir]} fill="currentColor" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExpandedPanel({
  node,
  panelId,
}: {
  node: LoopDiagramNode | null;
  panelId: string;
}) {
  if (!node) return null;
  return (
    <article
      id={panelId}
      aria-live="polite"
      className="border border-current/30 bg-white/40 p-5 backdrop-blur-[2px] dark:bg-black/30"
      // Re-key the wrapper to retrigger the inner mockup's enter animation on
      // tile change.
      key={node.label}
    >
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-current/60">
          PHASE {node.index} · {node.label}
        </p>
        {node.status === 'roadmap' && (
          <span className="border border-current/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-current/70">
            {node.statusLabel || 'BUILDING'}
          </span>
        )}
      </header>
      <LoopPhasePeek currentLabel={node.label} compact />
      {node.body && (
        <div className="mt-4 text-current/80">
          <RichTextRenderer content={node.body} variant="default" />
        </div>
      )}
      {node.anchorLink && (
        <Link
          href={node.anchorLink}
          className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.24em] underline-offset-4 hover:underline"
        >
          DETAIL <NxIcon name="arrow-right" size={12} />
        </Link>
      )}
    </article>
  );
}
