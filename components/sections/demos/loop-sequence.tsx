'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import { LoopPhasePeek } from './loop-phase-peek';
import type { LoopDiagramNode } from '@/types/landing-page';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useNarrowViewport } from '@/hooks/use-narrow-viewport';
import { NxIcon, type NxIconName } from '@/components/brand/nx-icon';
import { LoopGridMobile } from './loop-grid-mobile';

interface LoopSequenceProps {
  nodes: LoopDiagramNode[];
  pinDistancePerNodeVh?: number;
  loopRing?: {
    enabled?: boolean;
    revolutionMs?: number;
    startingCycle?: number;
  };
  showPhaseReadout?: boolean;
  sash?: {
    enabled?: boolean;
    text?: string;
  };
}

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
  // Explicit admin selection wins; then label match; then positional fallback.
  if (override && VALID_ICONS.has(override)) return override as NxIconName;
  return ICON_BY_LABEL[label.toUpperCase()] ?? fallback;
}

// Each card's "home corner" — its resting position in the loop diagram.
// Top/bottom rows are pulled toward the edges (22 / 78) so there's a clear
// vertical channel between the rows for the connector arrows and the loop's
// closed-loop reading; previous 28 / 72 left only a sliver of gap.
const CORNERS = [
  { x: 25, y: 22 }, // 0: top-left
  { x: 75, y: 22 }, // 1: top-right
  { x: 75, y: 78 }, // 2: bottom-right
  { x: 25, y: 78 }, // 3: bottom-left
];

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

type ChevronDir = 'right' | 'down' | 'left' | 'up';
const ARROWS: ReadonlyArray<{
  x1: number; y1: number; x2: number; y2: number; length: number;
  endX: number; endY: number; dir: ChevronDir;
  delay: number; roadmap: boolean;
}> = [
  // Horizontals run inside the inter-card gap (cards span ~x:9-41 and 59-91).
  { x1: 43, y1: 22, x2: 57, y2: 22, length: 14, endX: 57, endY: 22, dir: 'right', delay: 200, roadmap: false },
  // Verticals span the exact channel between top/bottom rows. With cards at
  // 36% stage-relative height centered on y=22/78, the inner edges sit at
  // y=40 (top row bottom) and y=60 (bottom row top), so the connectors
  // touch both rows instead of floating in the middle of the gap.
  { x1: 75, y1: 40, x2: 75, y2: 60, length: 20, endX: 75, endY: 60, dir: 'down',  delay: 500, roadmap: false },
  { x1: 57, y1: 78, x2: 43, y2: 78, length: 14, endX: 43, endY: 78, dir: 'left',  delay: 800, roadmap: true  },
  { x1: 25, y1: 60, x2: 25, y2: 40, length: 20, endX: 25, endY: 40, dir: 'up',    delay: 1100, roadmap: true },
];

// Tip placed exactly at the viewBox edge so `translate(-100%/-50%/0%)` on
// the chevron container lands the tip on the shaft endpoint. Filled triangle
// (no stroke join) keeps the point geometrically clean.
const CHEVRON_PATH: Record<ChevronDir, string> = {
  right: 'M 0 0 L 10 5 L 0 10 Z',
  down:  'M 0 0 L 5 10 L 10 0 Z',
  left:  'M 10 0 L 0 5 L 10 10 Z',
  up:    'M 0 10 L 5 0 L 10 10 Z',
};

const CHEVRON_TRANSFORM: Record<ChevronDir, string> = {
  right: 'translate(-100%, -50%)',
  down:  'translate(-50%, -100%)',
  left:  'translate(0%, -50%)',
  up:    'translate(-50%, 0%)',
};

// Time after closure entry for the loop to finish drawing itself.
const DRAW_COMPLETE_MS = 1700;

export function LoopSequence({
  nodes,
  pinDistancePerNodeVh = 90,
  loopRing,
  showPhaseReadout = true,
  sash,
}: LoopSequenceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [packetIndex, setPacketIndex] = useState(0);
  const startingCycle = loopRing?.startingCycle ?? 42;
  const [cycleCount, setCycleCount] = useState(startingCycle);
  const prevPacketRef = useRef(0);
  const reduced = useReducedMotion();
  // The corner-positioned 2×2 layout used in closure (and the long pinned-scroll
  // ladder leading into it) doesn't fit below `md`: cards overlap vertically and
  // the inner mockups truncate at ~116px wide. Route mobile users to the same
  // stacked fallback we use for reduced-motion.
  const isNarrow = useNarrowViewport();
  const useStaticLayout = reduced || isNarrow;

  const N = Math.min(4, nodes.length);
  const totalSteps = N + 1;

  useEffect(() => {
    if (useStaticLayout) return;
    const el = containerRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height - vh;
        const scrolled = Math.max(0, -rect.top);
        const p = total > 0 ? Math.min(1, scrolled / total) : 0;
        setProgress(p);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [useStaticLayout]);

  const stepFloat = progress * totalSteps;
  const step = Math.min(totalSteps - 1, Math.floor(stepFloat));
  const inClosure = step >= N;
  const active = inClosure ? N - 1 : step;

  // Closure cycle: after the loop finishes drawing itself, start rotating the
  // active phase. Each card briefly pulses; the telemetry readout updates in
  // sync. Resets to phase 0 on closure entry so the loop visibly "starts over."
  useEffect(() => {
    if (!inClosure || useStaticLayout) {
      setPacketIndex(active);
      return;
    }
    setPacketIndex(0);
    prevPacketRef.current = 0;
    setCycleCount(startingCycle);
    const revolutionMs = loopRing?.revolutionMs ?? 12000;
    const stepMs = revolutionMs / Math.max(1, N);
    let interval: ReturnType<typeof setInterval> | undefined;
    const startTimer = setTimeout(() => {
      interval = setInterval(
        () => setPacketIndex((p) => (p + 1) % N),
        stepMs,
      );
    }, DRAW_COMPLETE_MS);
    return () => {
      clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, [inClosure, useStaticLayout, loopRing?.revolutionMs, N, active, startingCycle]);

  // Tick the sash cycle counter when the highlight wraps from N-1 back to 0,
  // so "CYCLE n" only advances when the loop visibly completes a full lap.
  useEffect(() => {
    if (!inClosure) return;
    if (prevPacketRef.current === N - 1 && packetIndex === 0) {
      setCycleCount((c) => c + 1);
    }
    prevPacketRef.current = packetIndex;
  }, [packetIndex, inClosure, N]);

  if (useStaticLayout || nodes.length === 0) {
    // Mobile gets a 2×2 connected cycle (preserves the loop metaphor) with
    // tap-to-expand. The reduced-motion-on-desktop case falls through to the
    // plain stacked list — a tap-to-expand interaction would be overkill there.
    if (isNarrow && nodes.length > 0) {
      return <LoopGridMobile nodes={nodes} />;
    }
    return (
      <ol className="flex flex-col divide-y divide-current/45 border-y-2 border-current/45">
        {nodes.map((node, i) => (
          <li key={`${node.index}-${i}`} className="py-8">
            <PhaseCard
              node={node}
              icon={iconFor(node.icon, node.label, FALLBACKS[i % 4])}
              isFocused
              isCompact={false}
              pulseKey="static"
            />
          </li>
        ))}
      </ol>
    );
  }

  const ordered = nodes.slice(0, N);
  const currentLabel = ordered[packetIndex]?.label ?? '';
  const nextLabel = ordered[(packetIndex + 1) % N]?.label ?? '';

  return (
    <div
      ref={containerRef}
      style={{ height: `${pinDistancePerNodeVh * totalSteps + 100}vh` }}
      className="relative"
    >
      <div className="sticky top-[var(--nx-navbar-h)] flex h-[calc(100svh-var(--nx-navbar-h))] flex-col justify-center overflow-hidden py-6 md:py-10">
        {/* Sequential backdrop numeral — fully inside the section with a small
            right gutter so the digit reads complete (was -right-6, which clipped
            through the middle of wider digits like "3"). */}
        <div
          aria-hidden
          key={`bg-${active}`}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none font-display text-[22vw] font-semibold leading-none tracking-tighter text-current md:right-8 md:text-[18vw]"
          style={{
            opacity: inClosure ? 0 : 0.045,
            transition: 'opacity 500ms ease-out',
          }}
        >
          {ordered[active]?.index ?? '00'}
        </div>

        {/* Phase readout */}
        {showPhaseReadout && (
          <div className="relative mb-3 flex items-center justify-between gap-4">
            <p
              className="font-mono text-xs uppercase tracking-[0.24em] text-current/70"
              aria-live="polite"
            >
              {inClosure ? (
                <span>↻ THE LOOP · CLOSED</span>
              ) : (
                <>
                  <span>
                    PHASE {ordered[active]?.index} · {ordered[active]?.label}
                  </span>
                  <span className="ml-3 opacity-60">
                    {String(active + 1).padStart(2, '0')} /{' '}
                    {String(N).padStart(2, '0')}
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Stage */}
        <div className="relative flex-1 min-h-0">
          {/* Arrows — shaft + head as paired divs that share a single opacity
              per arrow (no more head-darker-than-shaft mismatch). Shaft is
              centered on its axis via perpendicular translate. Shaft ends at
              the head's base (calc(% - HEAD_PX)) so they meet cleanly with no
              overlap or gap; the head's tip sits at the geometric endpoint. */}
          {ARROWS.map((a, i) => {
            const isHorizontal = a.y1 === a.y2;
            const minX = Math.min(a.x1, a.x2);
            const minY = Math.min(a.y1, a.y2);
            const lenX = Math.abs(a.x2 - a.x1);
            const lenY = Math.abs(a.y2 - a.y1);
            const HEAD_PX = 8;
            const SHAFT_PX = 1.5;
            const transformOrigin =
              a.dir === 'right'
                ? '0% 50%'
                : a.dir === 'left'
                  ? '100% 50%'
                  : a.dir === 'down'
                    ? '50% 0%'
                    : '50% 100%';
            const drawnScale = isHorizontal ? 'scaleX(1)' : 'scaleY(1)';
            const undrawnScale = isHorizontal ? 'scaleX(0)' : 'scaleY(0)';
            const scale = inClosure ? drawnScale : undrawnScale;
            const arrowOpacity = inClosure ? (a.roadmap ? 0.6 : 0.85) : 0;

            // Shaft positioning: centered perpendicular to its axis, and ends
            // HEAD_PX short of the geometric endpoint so it doesn't pierce the
            // head triangle.
            let shaftLeft: string;
            let shaftTop: string;
            let shaftWidth: string;
            let shaftHeight: string;
            let shaftPerpCenter: string;
            switch (a.dir) {
              case 'right':
                shaftLeft = `${minX}%`;
                shaftTop = `${a.y1}%`;
                shaftWidth = `calc(${lenX}% - ${HEAD_PX}px)`;
                shaftHeight = `${SHAFT_PX}px`;
                shaftPerpCenter = 'translateY(-50%)';
                break;
              case 'down':
                shaftLeft = `${a.endX}%`;
                shaftTop = `${minY}%`;
                shaftWidth = `${SHAFT_PX}px`;
                shaftHeight = `calc(${lenY}% - ${HEAD_PX}px)`;
                shaftPerpCenter = 'translateX(-50%)';
                break;
              case 'left':
                shaftLeft = `calc(${minX}% + ${HEAD_PX}px)`;
                shaftTop = `${a.y1}%`;
                shaftWidth = `calc(${lenX}% - ${HEAD_PX}px)`;
                shaftHeight = `${SHAFT_PX}px`;
                shaftPerpCenter = 'translateY(-50%)';
                break;
              case 'up':
              default:
                shaftLeft = `${a.endX}%`;
                shaftTop = `calc(${minY}% + ${HEAD_PX}px)`;
                shaftWidth = `${SHAFT_PX}px`;
                shaftHeight = `calc(${lenY}% - ${HEAD_PX}px)`;
                shaftPerpCenter = 'translateX(-50%)';
                break;
            }

            return (
              <div key={`arrow-group-${i}`} aria-hidden>
                {/* Shaft */}
                <div
                  className="pointer-events-none absolute bg-current"
                  style={{
                    left: shaftLeft,
                    top: shaftTop,
                    width: shaftWidth,
                    height: shaftHeight,
                    opacity: arrowOpacity,
                    transform: `${shaftPerpCenter} ${scale}`,
                    transformOrigin,
                    transition: `transform 620ms ${EASE} ${a.delay}ms, opacity 240ms ease-out ${a.delay}ms`,
                  }}
                />
                {/* Head */}
                <div
                  className="pointer-events-none absolute text-current"
                  style={{
                    left: `${a.endX}%`,
                    top: `${a.endY}%`,
                    transform: CHEVRON_TRANSFORM[a.dir],
                    opacity: arrowOpacity,
                    transition: `opacity 220ms ease-out ${a.delay + 480}ms`,
                  }}
                >
                  <svg width={HEAD_PX} height={HEAD_PX} viewBox="0 0 10 10" display="block">
                    <path d={CHEVRON_PATH[a.dir]} fill="currentColor" />
                  </svg>
                </div>
              </div>
            );
          })}

          {/* Cards — each travels between its corner and center */}
          {ordered.map((n, i) => {
            const isActiveSequential = !inClosure && i === active;
            const home = CORNERS[i];
            const pos = isActiveSequential ? { x: 50, y: 50 } : home;
            const visible = inClosure || isActiveSequential;
            const compact = !isActiveSequential;
            const isHighlighted =
              isActiveSequential || (inClosure && i === packetIndex);
            const pulseKey = `${inClosure ? 'c' : 's'}-${
              inClosure ? packetIndex : active
            }`;
            return (
              <div
                key={`card-${i}`}
                className="absolute"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: compact ? 'min(34%, 380px)' : 'min(82%, 720px)',
                  opacity: visible ? 1 : 0,
                  zIndex: isActiveSequential ? 5 : 2,
                  transition: `left 720ms ${EASE}, top 720ms ${EASE}, width 720ms ${EASE}, opacity 480ms ease-out`,
                  pointerEvents: visible ? 'auto' : 'none',
                }}
              >
                <PhaseCard
                  node={n}
                  icon={iconFor(n.icon, n.label, FALLBACKS[i % 4])}
                  isFocused={isHighlighted}
                  isCompact={compact}
                  pulseKey={pulseKey}
                />
              </div>
            );
          })}

          {/* HIDDEN: center "↻ LOOP / CLOSED + telemetry" box. Removed per
              user request — felt redundant once the loop visualization itself
              communicates closure. To restore, flip {false &&} to {true &&}. */}
          {false && (
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2"
              style={{
                transform: `translate(-50%, -50%) scale(${inClosure ? 1 : 0.6})`,
                opacity: inClosure ? 1 : 0,
                transition: `opacity 500ms ease-out 180ms, transform 600ms ${EASE} 180ms`,
                zIndex: 3,
              }}
            >
              <div className="flex flex-col items-center gap-1 border border-current/65 bg-white/55 px-5 py-3 text-current/70 backdrop-blur-sm dark:bg-black/40">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em]">↻ LOOP</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-current/55">CLOSED</span>
                <span
                  className="mt-1.5 min-w-[180px] border-t-2 border-current/55 pt-1.5 text-center font-mono text-[9px] uppercase tracking-[0.22em] text-current/65"
                  aria-live="polite"
                >
                  <span className="text-current/40">▸ ACTIVE&nbsp;</span>
                  <TelemetryLine current={currentLabel} next={nextLabel} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* HIDDEN: below-loop LoopPhasePeek. Replaced by inline mockups
            duplicated INTO each PhaseCard. To restore, flip {false &&} to
            {true && inClosure && (...)}. */}
        {false && inClosure && (
          <div className="mx-auto mt-8 w-full max-w-md">
            <LoopPhasePeek currentLabel={currentLabel} />
          </div>
        )}

        <ProgressBar
          total={totalSteps}
          progress={progress}
          N={N}
          className="mt-4"
        />

        <div className="sr-only">
          <ol>
            {ordered.map((n, i) => (
              <li key={`sr-${i}`}>
                PHASE {n.index} · {n.label}: {n.tagline}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/**
 * Crossfades the "current → next" labels on each cycle tick — gives the
 * readout a soft refresh feel rather than a hard text swap.
 */
function TelemetryLine({
  current,
  next,
}: {
  current: string;
  next: string;
}) {
  return (
    <span
      key={`${current}-${next}`}
      style={{
        display: 'inline-block',
        animation: 'nx-loop-pulse 480ms ease-out reverse',
      }}
    >
      {current} → {next}
    </span>
  );
}

function PhaseCard({
  node,
  icon,
  isFocused,
  isCompact = false,
  pulseKey,
}: {
  node: LoopDiagramNode;
  icon: NxIconName;
  isFocused: boolean;
  isCompact?: boolean;
  pulseKey: string;
}) {
  const isRoadmap = node.status === 'roadmap';
  return (
    <article
      className={`relative bg-white/40 backdrop-blur-[2px] dark:bg-black/30 ${
        isCompact ? 'flex flex-col' : ''
      }`}
      style={{
        padding: isCompact ? '18px' : '32px',
        // Stage-relative height in compact (closure) mode: each card is
        // exactly 36% of the stage so all four read as identical tiles AND
        // the inter-row channel stays a fixed 20% (cards 4–40% / 60–96%
        // around corners at y=22 / 78). The vertical arrow endpoints below
        // (y=40 and y=60) lock to that channel so the connectors visibly
        // bridge the top and bottom rows regardless of viewport height.
        height: isCompact ? '36%' : undefined,
        borderWidth: isFocused ? 2 : 1,
        borderStyle: isRoadmap ? 'dashed' : 'solid',
        borderColor: isFocused
          ? 'currentColor'
          : isRoadmap
            ? 'rgba(127,127,127,0.4)'
            : 'rgba(127,127,127,0.25)',
        transition: `padding 720ms ${EASE}, border-color 480ms, border-width 480ms, height 720ms ${EASE}`,
      }}
    >
      <header
        className="flex items-center justify-between gap-3"
        style={{
          marginBottom: isCompact ? '10px' : '20px',
          transition: `margin-bottom 720ms ${EASE}`,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center justify-center border ${
              isFocused
                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                : 'border-current/45 text-current/70'
            }`}
            style={{
              width: isCompact ? 26 : 36,
              height: isCompact ? 26 : 36,
              transition: `width 720ms ${EASE}, height 720ms ${EASE}, background-color 480ms, border-color 480ms, color 480ms`,
            }}
          >
            <NxIcon name={icon} size={isCompact ? 14 : 18} />
          </span>
          <span
            className="font-mono uppercase tracking-[0.22em] text-current/60"
            style={{
              fontSize: isCompact ? '10px' : '11px',
              transition: `font-size 720ms ${EASE}`,
            }}
          >
            PHASE {node.index}
          </span>
        </div>
        {isRoadmap && (
          <span className="border border-current/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.24em] text-current/70">
            {node.statusLabel || 'BUILDING'}
          </span>
        )}
      </header>
      <h3
        className="font-display font-semibold uppercase tracking-tight"
        style={{
          fontSize: isCompact
            ? 'clamp(0.95rem, 1.3vw, 1.15rem)'
            : 'clamp(1.875rem, 4.2vw, 3rem)',
          lineHeight: 1.05,
          transition: `font-size 720ms ${EASE}`,
        }}
      >
        {node.label}
      </h3>
      {node.tagline && (
        <p
          className="mt-2 font-sans text-current/80"
          style={{
            fontSize: isCompact ? '0.8rem' : '1.1rem',
            transition: `font-size 720ms ${EASE}`,
          }}
        >
          {node.tagline}
        </p>
      )}
      {/* Per-phase product mockup duplicated INTO every phase card so each
          phase shows its own visual demonstration, not just the centered one.
          In compact (closure) mode the wrapper flex-grows and clips overflow
          so every card's mockup occupies an identical slot. */}
      <div
        className={`mt-3 ${isCompact ? 'flex-1 overflow-hidden' : ''}`}
        style={{
          transform: isCompact ? 'scale(0.78)' : 'scale(1)',
          transformOrigin: 'left top',
          transition: `transform 720ms ${EASE}`,
        }}
      >
        <LoopPhasePeek currentLabel={node.label} compact />
      </div>
      <div
        style={{
          maxHeight: isCompact ? '0px' : '600px',
          opacity: isCompact ? 0 : 1,
          overflow: 'hidden',
          transition: `max-height 720ms ${EASE}, opacity 400ms ease-out`,
        }}
      >
        {node.body && (
          <div className="mt-4 max-w-2xl text-current/80">
            <RichTextRenderer content={node.body} variant="default" />
          </div>
        )}
        {node.anchorLink && (
          <Link
            href={node.anchorLink}
            className="mt-6 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.24em] underline-offset-4 hover:underline"
          >
            DETAIL <NxIcon name="arrow-right" size={12} />
          </Link>
        )}
      </div>
    </article>
  );
}

function ProgressBar({
  total,
  progress,
  N,
  className = '',
}: {
  total: number;
  progress: number;
  N: number;
  className?: string;
}) {
  return (
    <div className={`relative flex items-center gap-2 ${className}`} aria-hidden>
      {Array.from({ length: total }).map((_, i) => {
        const segStart = i / total;
        const segEnd = (i + 1) / total;
        const segProgress = Math.max(
          0,
          Math.min(1, (progress - segStart) / (segEnd - segStart)),
        );
        const isClosureSegment = i === N;
        const reached = progress >= segStart;
        return (
          <div key={i} className="flex flex-1 items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: reached ? 'currentColor' : 'transparent',
                outline: '1px solid currentColor',
                outlineOffset: '-1px',
                opacity: reached ? 1 : 0.35,
                transition: 'background-color 280ms, opacity 280ms',
              }}
            />
            <span className="relative h-[3px] flex-1 bg-current/15">
              <span
                className="absolute inset-y-0 left-0 origin-left bg-current"
                style={{
                  width: '100%',
                  transform: `scaleX(${segProgress})`,
                  opacity: isClosureSegment ? 0.55 : 0.85,
                  transition: 'transform 120ms linear',
                }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}
