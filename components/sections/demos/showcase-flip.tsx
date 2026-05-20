'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertQueuePeek } from './alert-queue-peek';
import { DashboardPeek } from './dashboard-peek';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useNarrowViewport } from '@/hooks/use-narrow-viewport';
import { useGhostDemo } from '@/hooks/use-ghost-demo';
import { SectionShell } from '../section-shell';
import type { CompanionCopy } from '@/types/landing-page';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── NX Console wrapper ──────────────────────────────────────────────────────
// Industrial-monitor frame, not a macOS window. Top bar carries the NX glyph
// + screen name + live status pulse; corner brackets ring the viewport like a
// camera viewfinder; bottom bar carries the channel + frame id.

function NxGlyph({ size = 10 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 1 1 L 5 5 L 1 9 M 9 1 L 5 5 L 9 9" />
    </svg>
  );
}

function CornerBracket({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const cls: Record<typeof position, string> = {
    tl: 'top-2 left-2',
    tr: 'top-2 right-2 rotate-90',
    bl: 'bottom-2 left-2 -rotate-90',
    br: 'bottom-2 right-2 rotate-180',
  };
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute h-3.5 w-3.5 ${cls[position]}`}
      viewBox="0 0 14 14"
      fill="none"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="1"
    >
      <path d="M 1 7 L 1 1 L 7 1" />
    </svg>
  );
}

function NxFrame({
  name,
  channel,
  status,
  statusColor,
  frameId,
  active,
  children,
}: {
  name: string;
  channel: string;
  status: string;
  statusColor: string;
  frameId: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden border bg-nx-black shadow-[0_30px_80px_-15px_rgba(0,0,0,0.75)]"
      style={{ borderColor: active ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.12)' }}
    >
      {/* ── Top status rail ─────────────────────────────────────────────── */}
      <div className="relative flex h-8 items-center justify-between border-b border-white/12 bg-gradient-to-b from-[#0E0E0E] to-black px-3.5">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white">
          <span className="text-white/55">
            <NxGlyph />
          </span>
          <span className="text-white/55">NX-OPS</span>
          <span className="text-white/20">·</span>
          <span className="text-white">{name}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.26em] text-white/65">
          <span className="relative inline-block h-1.5 w-1.5">
            <span
              className="absolute inset-0 rounded-full"
              style={{ background: statusColor }}
            />
            {active && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: statusColor, opacity: 0.55 }}
              />
            )}
          </span>
          {status}
        </div>
      </div>

      {/* ── Viewport with corner brackets ───────────────────────────────── */}
      <div className="relative bg-nx-black">
        <CornerBracket position="tl" />
        <CornerBracket position="tr" />
        <CornerBracket position="bl" />
        <CornerBracket position="br" />
        {children}
      </div>

      {/* ── Bottom info rail ────────────────────────────────────────────── */}
      <div className="flex h-6 items-center justify-between border-t border-white/10 bg-nx-black px-3.5 font-mono text-[9px] uppercase tracking-[0.26em] text-white/40">
        <span>NX OPS · {channel}</span>
        <span>FRAME · {frameId}</span>
      </div>
    </div>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

// Hardcoded fallbacks render when the CMS field is left blank. Editors
// override via the whoWeServeBlock.companion group.
const DEFAULTS = {
  eyebrow: 'Operator surfaces',
  headlineLine1: 'Detect with the queue.',
  headlineLine2: 'Decide from the dashboard.',
  leadSentence: undefined as string | undefined,
  queueTabLabel: '01 · QUEUE',
  dashboardTabLabel: '02 · DASHBOARD',
};

interface ShowcaseFlipProps {
  companion?: CompanionCopy;
}

export function ShowcaseFlip({ companion }: ShowcaseFlipProps = {}) {
  const eyebrow = companion?.eyebrow ?? DEFAULTS.eyebrow;
  const headlineLine1 = companion?.headlineLine1 ?? DEFAULTS.headlineLine1;
  const headlineLine2 = companion?.headlineLine2 ?? DEFAULTS.headlineLine2;
  const leadSentence = companion?.leadSentence ?? DEFAULTS.leadSentence;
  const queueTabLabel =
    companion?.queueTabLabel?.trim() || DEFAULTS.queueTabLabel;
  const dashboardTabLabel =
    companion?.dashboardTabLabel?.trim() || DEFAULTS.dashboardTabLabel;
  const title = [headlineLine1, headlineLine2].filter(Boolean).join(' ');

  const runwayRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const isNarrow = useNarrowViewport();
  const [progress, setProgress] = useState(0);
  const [mobileTab, setMobileTab] = useState<'queue' | 'dashboard'>('queue');
  // Ghost demo: when the section enters the viewport on mobile for the
  // first time, the dot auto-toggles to the dashboard tab and back so the
  // user sees the affordance perform itself once. Subsequent visits skip
  // it (storageKey persisted in localStorage).
  const mobileRef = useRef<HTMLDivElement | null>(null);
  const ghostPlay = useGhostDemo(mobileRef, 'showcase-flip');
  const userInteractedRef = useRef(false);
  useEffect(() => {
    if (!ghostPlay) return;
    const t1 = window.setTimeout(() => {
      if (!userInteractedRef.current) setMobileTab('dashboard');
    }, 450);
    const t2 = window.setTimeout(() => {
      if (!userInteractedRef.current) setMobileTab('queue');
    }, 1450);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [ghostPlay]);
  const handleTab = (next: 'queue' | 'dashboard') => {
    userInteractedRef.current = true;
    setMobileTab(next);
  };

  useEffect(() => {
    if (reduced || isNarrow) {
      setProgress(0);
      return;
    }
    const el = runwayRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height - vh;
        const scrolled = Math.max(0, -rect.top);
        setProgress(total > 0 ? Math.min(1, scrolled / total) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reduced, isNarrow]);

  // Card poses — only the front card's body is fully visible. The back card
  // sits at Y=0, peeking above the front card by ACTIVE_Y pixels.
  const ACTIVE_Y = 110;
  const PEEK_Y = 0;
  const p = easeInOutCubic(progress);

  const aY = lerp(ACTIVE_Y, PEEK_Y, p);
  const aScale = lerp(1, 0.88, p);
  const aZ = lerp(60, -100, p);
  const aActive = p < 0.5;

  const bY = lerp(PEEK_Y, ACTIVE_Y, p);
  const bScale = lerp(0.88, 1, p);
  const bZ = lerp(-100, 60, p);
  const bActive = p >= 0.5;

  if (isNarrow) {
    const isQueue = mobileTab === 'queue';
    return (
      <SectionShell
        surface="ink"
        eyebrow={eyebrow}
        title={title}
        leadSentence={leadSentence}
      >
        {/* Real tab control replaces the desktop scroll-driven flip. Ref
            sits here so `useGhostDemo` can detect when the operator surface
            enters the mobile viewport. */}
        <div
          ref={mobileRef}
          role="tablist"
          aria-label="Operator surface"
          className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isQueue}
            onClick={() => handleTab('queue')}
            className={`transition-colors duration-200 ${isQueue ? 'text-white' : 'text-white/40'}`}
          >
            {queueTabLabel}
          </button>
          <span className="relative block h-px w-12 bg-white/15">
            <span
              aria-hidden="true"
              className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white transition-[left] duration-200 ease-out motion-reduce:transition-none"
              style={{ left: isQueue ? '-4px' : 'calc(100% - 4px)' }}
            />
          </span>
          <button
            type="button"
            role="tab"
            aria-selected={!isQueue}
            onClick={() => handleTab('dashboard')}
            className={`transition-colors duration-200 ${!isQueue ? 'text-white' : 'text-white/40'}`}
          >
            {dashboardTabLabel}
          </button>
        </div>
        <div className="relative">
          {isQueue ? (
            <NxFrame
              name="REVIEW QUEUE"
              channel="/alerts"
              status="LIVE"
              statusColor="#3DB46D"
              frameId="01·CTRL"
              active
            >
              <AlertQueuePeek />
            </NxFrame>
          ) : (
            <NxFrame
              name="OPERATIONS"
              channel="/dashboard"
              status="ARMED"
              statusColor="#E89B2C"
              frameId="02·OPS"
              active
            >
              <DashboardPeek industryKey="construction" />
            </NxFrame>
          )}
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      surface="ink"
      eyebrow={eyebrow}
      title={title}
      leadSentence={leadSentence}
    >
      {/* Scroll runway — the sticky card stack pins to the viewport top as the
          user scrolls through this 220vh-tall column, with `progress` driving
          the flip from QUEUE to DASHBOARD. */}
      <div ref={runwayRef} style={{ height: '220vh' }} className="relative">
        <div className="sticky top-[var(--nx-navbar-h)] flex h-[calc(var(--nx-svh,100svh)-var(--nx-navbar-h))] flex-col items-center justify-center gap-10">
          <div
            className="relative w-full max-w-[680px]"
            style={{ perspective: '1600px' }}
          >
            <div
              className="relative h-[560px] w-full"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Card A — Review Queue */}
              <div
                className="absolute inset-x-0 top-0"
                style={{
                  transform: `translate3d(0, ${aY}px, ${aZ}px) scale(${aScale})`,
                  zIndex: aActive ? 3 : 1,
                  transition: reduced
                    ? 'none'
                    : 'transform 90ms linear, z-index 0ms 80ms',
                  willChange: 'transform',
                  transformStyle: 'preserve-3d',
                }}
              >
                <NxFrame
                  name="REVIEW QUEUE"
                  channel="/alerts"
                  status={aActive ? 'LIVE' : 'STANDBY'}
                  statusColor={aActive ? '#3DB46D' : '#666'}
                  frameId="01·CTRL"
                  active={aActive}
                >
                  <AlertQueuePeek />
                </NxFrame>
              </div>

              {/* Card B — Dashboard */}
              <div
                className="absolute inset-x-0 top-0"
                style={{
                  transform: `translate3d(0, ${bY}px, ${bZ}px) scale(${bScale})`,
                  zIndex: bActive ? 3 : 1,
                  transition: reduced
                    ? 'none'
                    : 'transform 90ms linear, z-index 0ms 80ms',
                  willChange: 'transform',
                  transformStyle: 'preserve-3d',
                }}
              >
                <NxFrame
                  name="OPERATIONS"
                  channel="/dashboard"
                  status={bActive ? 'ARMED' : 'STANDBY'}
                  statusColor={bActive ? '#E89B2C' : '#666'}
                  frameId="02·OPS"
                  active={bActive}
                >
                  <DashboardPeek industryKey="construction" />
                </NxFrame>
              </div>
            </div>
          </div>

          {/* Stack pagination — shows which card is in front */}
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.28em]">
            <span
              className={`transition-colors duration-300 ${aActive ? 'text-white' : 'text-white/40'}`}
            >
              {queueTabLabel}
            </span>
            <span className="relative block h-px w-16 bg-white/15">
              <span
                aria-hidden="true"
                className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white transition-[left] duration-200 ease-out motion-reduce:transition-none"
                style={{ left: `calc(${p * 100}% - 4px)` }}
              />
            </span>
            <span
              className={`transition-colors duration-300 ${bActive ? 'text-white' : 'text-white/40'}`}
            >
              {dashboardTabLabel}
            </span>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
