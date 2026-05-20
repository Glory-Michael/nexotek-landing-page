'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProofGridSection } from '@/types/landing-page';
import { SmartNumericHeadline } from './demos/count-up';
import { SkeuomorphicBadge } from '@/components/brand/skeuomorphic-badge';
import { useNarrowViewport } from '@/hooks/use-narrow-viewport';
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// ── Micro-viz: each tile gets its own visual "personality" tied to the claim ──

function ServerRackViz() {
  return (
    <div className="grid h-16 w-32 grid-cols-6 grid-rows-3 gap-[3px] border border-black/45 bg-neutral-100 dark:border-white/30 dark:bg-neutral-900 p-1">
      {Array.from({ length: 18 }).map((_, i) => {
        const live = i === 8;
        return (
          <span
            key={i}
            className={`block h-full w-full ${live ? 'bg-emerald-500 nx-pulse-dot' : 'bg-neutral-400/60 dark:bg-neutral-600/60'}`}
          />
        );
      })}
    </div>
  );
}

function CameraRowViz() {
  return (
    <div className="flex items-center gap-4">
      {[0, 1, 2, 3].map((i) => {
        const live = i === 1;
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className={`h-10 w-10 ${live ? 'nx-rotate-slow' : ''}`}
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" />
            <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );
      })}
    </div>
  );
}

function RadarSweepViz() {
  return (
    <svg viewBox="0 0 64 64" className="h-24 w-24" aria-hidden>
      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      <circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle cx="32" cy="32" r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="32" y1="4" x2="32" y2="60" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      <line x1="4" y1="32" x2="60" y2="32" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      <g className="nx-rotate-slow" style={{ transformOrigin: '32px 32px' }}>
        <path d="M32,32 L32,4 A28,28 0 0,1 60,32 Z" fill="currentColor" opacity="0.18" />
        <line x1="32" y1="32" x2="60" y2="32" stroke="currentColor" strokeWidth="1.5" />
      </g>
      <circle cx="32" cy="32" r="2.5" fill="currentColor" />
    </svg>
  );
}

function FeaturedStatsViz({ sub }: { sub?: string }) {
  const parts = (sub || '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
  const stats: Array<{ value: string; label: string }> = [];
  for (const part of parts) {
    const m = part.match(/^(\$?\d[\d.,]*\s*[KM]?\+?)\s+(.+)$/);
    if (m) stats.push({ value: m[1], label: m[2].toUpperCase() });
  }
  if (stats.length < 2) return null;

  const heights = [22, 32, 26, 44, 36, 52, 42, 64];
  return (
    <div className="mt-1 border-l-2 border-black bg-neutral-50 dark:border-white dark:bg-neutral-900 p-4 md:p-6">
      <div className="flex flex-wrap gap-x-8 gap-y-2 md:gap-x-12 md:gap-y-4">
        {stats.map((s) => (
          <div key={s.label} className="min-w-[5rem] md:min-w-[6rem]">
            <p className="font-display text-3xl font-bold tracking-tight md:text-6xl">
              <SmartNumericHeadline text={s.value} />
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-600 dark:text-neutral-400 md:text-[11px]">
              {s.label}
            </p>
          </div>
        ))}
      </div>
      {/* Bar heights scale via `--nx-bar-scale` so we can mobile-shrink them
          without touching the inline numeric heights. Default = 0.55 on
          mobile (matches the tighter sticky-tile budget), 1 from md upward. */}
      <div
        className="nx-proof-bars mt-3 flex items-end gap-[3px] md:mt-6 md:gap-[4px]"
        aria-hidden
      >
        {heights.map((h, i) => (
          <span
            key={i}
            className="block w-[6px] bg-black dark:bg-white md:w-[8px]"
            style={{
              height: `calc(${h}px * var(--nx-bar-scale, 0.55))`,
              opacity: 0.35 + (i / heights.length) * 0.65,
            }}
          />
        ))}
        <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-600 dark:text-neutral-400 md:ml-4">
          TREND · 8 QTRS
        </span>
      </div>
    </div>
  );
}

function LivePulseViz({ count = 3 }: { count?: number }) {
  return (
    <div className="flex items-center gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="relative inline-flex h-4 w-4">
          <span
            className="absolute inset-0 rounded-full bg-emerald-500 nx-pulse-dot"
            style={{ animationDelay: `${i * 0.25}s` }}
          />
          <span className="relative inline-block h-4 w-4 rounded-full bg-emerald-600" />
        </span>
      ))}
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-600 dark:text-neutral-400">
        LIVE · {count} SITE{count === 1 ? '' : 'S'}
      </span>
    </div>
  );
}

function ProgressBarViz({ label = 'IN DISCUSSION' }: { label?: string }) {
  return (
    <div className="w-72 space-y-1">
      <div className="relative h-3 w-full overflow-hidden border border-black/45 bg-neutral-100 dark:border-white/30 dark:bg-neutral-900">
        <span className="absolute inset-y-0 w-1/3 bg-black/80 dark:bg-white/80 nx-progress-indeterminate" />
      </div>
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-600 dark:text-neutral-400">
        {label}
      </p>
    </div>
  );
}

function StampsViz({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {tags.map((t, i) => (
        <span
          key={t}
          className="inline-flex items-center gap-2 border-2 border-black dark:border-white px-3 py-1.5 font-mono text-xs uppercase tracking-[0.22em] nx-stamp-tick"
          style={{ animationDelay: `${i * 0.4}s` }}
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
            <path d="M2,6 L5,9 L10,3" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          {t}
        </span>
      ))}
    </div>
  );
}

function SparklineLatencyViz() {
  const heights = [18, 10, 16, 8, 22, 12, 14, 9, 17, 6];
  return (
    <div className="flex items-end gap-4">
      <div className="flex items-end gap-[4px]" aria-hidden>
        {heights.map((h, i) => (
          <span
            key={i}
            className="block w-[7px] bg-black dark:bg-white"
            style={{ height: `${h}px`, opacity: 0.5 + (i % 3) * 0.15 }}
          />
        ))}
      </div>
      <div>
        <p className="font-display text-4xl font-bold tracking-tight">
          <SmartNumericHeadline text="23ms" />
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-600 dark:text-neutral-400">
          AVG · ON-CAMERA
        </p>
      </div>
    </div>
  );
}

function vizForTile(headline: string, sub?: string): React.ReactNode {
  const h = headline.toLowerCase();
  const s = (sub || '').toLowerCase();
  if (h.includes('edge-ai') || h.includes('inference')) return <SparklineLatencyViz />;
  if (h.includes('on-premise') || h.includes('on prem')) return <ServerRackViz />;
  if (h.includes('camera') || h.includes('rtsp') || h.includes('onvif')) return <CameraRowViz />;
  if (h.includes('law enforcement') || h.includes('police') || h.includes('forensic')) {
    return <RadarSweepViz />;
  }
  if (h.includes('iacet') || h.includes('training') || h.includes('credential')) {
    return <FeaturedStatsViz sub={sub} />;
  }
  if (h.includes('pilot') || h.includes('deploy')) return <LivePulseViz count={3} />;
  if (h.includes('insurance') || h.includes('underwriting')) return <ProgressBarViz />;
  if (h.includes('nyc') || h.includes('regulat') || s.includes('sst')) {
    return <StampsViz tags={['SST', 'DOB', 'OSHA']} />;
  }
  return null;
}

type Citation = { source: string; detail?: string };

// ── Rail with click-to-jump nodes + playhead + pulse rings ────────────────
function ScrubRail({
  tiles,
  activeIndex,
  pinged,
  onSelect,
}: {
  tiles: Array<{ headline: string }>;
  activeIndex: number;
  pinged: Set<number>;
  onSelect: (i: number) => void;
}) {
  // Snap rail fill to the active node's position rather than tracking
  // continuous scroll. With N evenly-spaced nodes (first at 0%, last at 100%),
  // node i sits at i/(N-1). Fill leading edge lands exactly on the active dot.
  const railFillPct =
    tiles.length > 1 ? (activeIndex / (tiles.length - 1)) * 100 : 0;
  return (
    <div className="relative h-full max-h-[calc(var(--nx-svh,100vh)*0.64)] w-full">
      {/* Rail bg */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[8px] top-0 bottom-0 w-[2px] bg-black/15 dark:bg-white/15"
      />
      {/* Rail fill — snaps between nodes with a short ease-out transition. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[8px] top-0 w-[2px] bg-black dark:bg-white transition-[height] duration-500"
        style={{ height: `${railFillPct.toFixed(2)}%`, transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
      />
      <ol className="relative flex h-full flex-col justify-between gap-1">
        {tiles.map((tile, i) => {
          const isActive = i === activeIndex;
          const isPassed = i < activeIndex;
          const isPinged = pinged.has(i);
          return (
            <li key={i} className="relative">
              <button
                type="button"
                onClick={() => onSelect(i)}
                className="group flex w-full items-center gap-3 text-left"
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  aria-hidden
                  className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center"
                >
                  <span
                    className={`block h-[14px] w-[14px] border-2 transition-colors duration-300 ${
                      isActive || isPassed ? 'border-black bg-black dark:border-white dark:bg-white' : 'border-black/70 bg-white dark:border-white/70 dark:bg-nx-black'
                    }`}
                  />
                  {isActive && isPinged && (
                    <span
                      key={`pulse-${i}-${pinged.size}`}
                      aria-hidden
                      className="pointer-events-none absolute h-[14px] w-[14px] border-2 border-black dark:border-white animate-nx-ring"
                    />
                  )}
                </span>
                <span
                  className={`min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 ${
                    isActive
                      ? 'text-black dark:text-white'
                      : isPassed
                        ? 'text-neutral-600 dark:text-neutral-400'
                        : 'text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-600 dark:group-hover:text-neutral-300'
                  }`}
                >
                  <span className="mr-2 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  {tile.headline}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Stage: large render of the currently-active proof point ───────────────
function Stage({
  tile,
  viz,
  citation,
  activeIndex,
  total,
  openCitation,
  onToggleCitation,
}: {
  tile: { headline: string; sub?: string; footnote?: string };
  viz: React.ReactNode;
  citation: Citation | null;
  activeIndex: number;
  total: number;
  openCitation: boolean;
  onToggleCitation: () => void;
}) {
  const isFeatured = /iacet|training/i.test(tile.headline);
  return (
    <article key={activeIndex} className="animate-nx-stage-enter flex flex-col">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
        <span className="tabular-nums">STEP {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        {isFeatured && (
          <span className="ml-3 inline-block border-2 border-black px-1.5 py-[1px] text-black dark:border-white dark:text-white">
            FEATURED
          </span>
        )}
      </p>
      <h3 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
        <SmartNumericHeadline text={tile.headline} />
      </h3>
      {viz && <div className="mt-8 text-neutral-800 dark:text-neutral-200">{viz}</div>}
      {tile.sub && (
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-700 dark:text-neutral-300 md:text-xl">
          {tile.sub}
        </p>
      )}
      {tile.footnote && (
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
          {tile.footnote}
        </p>
      )}
      {citation && (
        <div className="mt-8">
          <button
            type="button"
            onClick={onToggleCitation}
            aria-expanded={openCitation}
            className="inline-flex w-fit items-center gap-2 border-2 border-black bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors hover:bg-black hover:text-white dark:border-white dark:bg-nx-black dark:hover:bg-white dark:hover:text-black"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            {openCitation ? '× HIDE SOURCE' : 'SHOW SOURCE'}
          </button>
          {openCitation && (
            <div className="mt-3 max-w-2xl border-l-2 border-black bg-neutral-50 dark:border-white dark:bg-neutral-900 p-4 animate-nx-stage-enter">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-600 dark:text-neutral-400">
                SOURCE
              </p>
              <p className="mt-1 font-display text-lg font-semibold leading-snug">
                {citation.source}
              </p>
              {citation.detail && (
                <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{citation.detail}</p>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// ── Main scrub demo section ───────────────────────────────────────────────
function ProofScrubSection({
  tiles,
  leadSentence,
}: {
  tiles: Array<{
    headline: string;
    sub?: string;
    footnote?: string;
    citationSource?: string;
    citationDetail?: string;
  }>;
  leadSentence?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pinged, setPinged] = useState<Set<number>>(() => new Set([0]));
  const [openCitation, setOpenCitation] = useState(false);
  const isNarrow = useNarrowViewport();

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof window === 'undefined') return;
    // Don't bail for reduced-motion — content swap is not an animation, and
    // disabling scroll mapping would leave a multi-screen empty section.
    // Visual animations (pulse, stage-enter) are gated in CSS.

    let rafId = 0;
    let scheduled = false;
    const total = tiles.length;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const scrollableHeight = el.offsetHeight - viewportH;
      if (scrollableHeight <= 0) return;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / scrollableHeight));
      const idx = Math.min(total - 1, Math.max(0, Math.floor(p * total)));
      setActiveIndex(idx);
    };

    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      rafId = requestAnimationFrame(() => {
        scheduled = false;
        update();
      });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [tiles.length]);

  // Mark each node as "pinged" the first time it becomes active so the
  // pulse-ring animation fires exactly once per node per visit.
  useEffect(() => {
    setOpenCitation(false);
    setPinged((prev) => {
      if (prev.has(activeIndex)) return prev;
      const next = new Set(prev);
      next.add(activeIndex);
      return next;
    });
  }, [activeIndex]);

  const scrollToIndex = (idx: number) => {
    const el = wrapperRef.current;
    if (!el || typeof window === 'undefined') return;
    const viewportH = window.innerHeight;
    const scrollableHeight = el.offsetHeight - viewportH;
    if (scrollableHeight <= 0) return;
    const wrapperTop = el.getBoundingClientRect().top + window.scrollY;
    // Center each step in its scroll segment so the active index lands cleanly.
    const targetProgress = (idx + 0.5) / tiles.length;
    const target = wrapperTop + targetProgress * scrollableHeight;
    window.scrollTo({ top: target, behavior: 'smooth' });
  };

  // ~85vh of scrub per step, plus a viewport of pin-buffer at the end.
  // Below `md` the visual real estate is much tighter (no rail column), so we
  // shrink the per-step scrub to 50vh — each step still gets its own scroll
  // segment to feel paced, but the section as a whole is ~40% shorter.
  // Built against `--nx-svh` (JS-pinned viewport height from HeroHeightLock)
  // so the runway doesn't flex when iOS Safari's bottom bar collapses; raw
  // `vh` would resize the runway mid-scroll and push the section below it
  // up/down. Fallback to plain `vh` for SSR + pre-hydration first paint.
  const perStepVh = isNarrow ? 50 : 85;
  const sectionVhMultiple = (tiles.length * perStepVh + 100) / 100;
  const sectionHeight = `calc(var(--nx-svh, 100vh) * ${sectionVhMultiple})`;

  const activeTile = tiles[activeIndex];
  const activeViz = vizForTile(activeTile.headline, activeTile.sub);
  const activeCitation: Citation | null = activeTile.citationSource
    ? { source: activeTile.citationSource, detail: activeTile.citationDetail }
    : null;

  return (
    <div
      ref={wrapperRef}
      className="relative w-full bg-nx-paper text-nx-ink dark:bg-nx-black dark:text-white"
      style={{ height: sectionHeight }}
    >
      <div className="sticky top-[var(--nx-navbar-h)] flex h-[calc(var(--nx-svh,100svh)-var(--nx-navbar-h))] w-full items-start overflow-hidden md:items-center">
        <div className="mx-auto grid h-full w-full max-w-7xl grid-cols-1 gap-8 px-6 py-8 md:grid-cols-[280px_1fr] md:gap-16 md:px-12 md:py-20">
          {/* Rail column (desktop) */}
          <aside className="relative hidden md:flex md:flex-col">
            <header className="mb-10">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
                PROOF
              </p>
              <p className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                <span className="tabular-nums">{String(activeIndex + 1).padStart(2, '0')}</span>
                <span className="text-neutral-300 dark:text-neutral-600"> / {String(tiles.length).padStart(2, '0')}</span>
              </p>
            </header>
            <div className="min-h-0 flex-1">
              <ScrubRail
                tiles={tiles}
                activeIndex={activeIndex}
                pinged={pinged}
                onSelect={scrollToIndex}
              />
            </div>
            {leadSentence && activeIndex === 0 && (
              <p className="mt-8 max-w-xs text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                {leadSentence}
              </p>
            )}
          </aside>

          {/* Mobile header + chapter chips. Each chip is a real tap target
              that jumps to its tile; the active chip carries a live-pulse
              dot so the affordance reads as "in progress, tap the next one"
              instead of static text. */}
          <header className="md:hidden">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
              PROOF · <span className="tabular-nums">{String(activeIndex + 1).padStart(2, '0')} / {String(tiles.length).padStart(2, '0')}</span>
            </p>
            <nav
              aria-label="Proof step navigation"
              className="-mx-1 mt-3 flex items-center gap-1 overflow-x-auto pb-1"
            >
              {tiles.map((_, i) => {
                const isActive = i === activeIndex;
                const isPassed = i < activeIndex;
                const roman = ROMAN_NUMERALS[i] ?? String(i + 1);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToIndex(i)}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={`Step ${i + 1} of ${tiles.length}`}
                    className={`relative inline-flex h-7 min-w-[28px] shrink-0 items-center justify-center rounded-full border px-2 font-mono text-[10px] tracking-[0.18em] transition-colors ${
                      isActive
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                        : isPassed
                          ? 'border-black/60 bg-transparent text-black/70 dark:border-white/60 dark:text-white/70'
                          : 'border-black/20 bg-transparent text-black/40 dark:border-white/20 dark:text-white/40'
                    }`}
                  >
                    <span aria-hidden="true">{roman}</span>
                  </button>
                );
              })}
            </nav>
          </header>

          {/* Stage column — content pinned to top on mobile (the desktop
              center alignment leaves ~50% of the viewport empty above the
              headline). */}
          <div className="flex min-h-0 flex-col justify-start md:justify-center">
            <Stage
              tile={activeTile}
              viz={activeViz}
              citation={activeCitation}
              activeIndex={activeIndex}
              total={tiles.length}
              openCitation={openCitation}
              onToggleCitation={() => setOpenCitation((o) => !o)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProofGrid({ block }: { block: ProofGridSection }) {
  const tiles = block.tiles ?? [];
  if (tiles.length === 0) return null;
  return (
    <section
      id={(block.anchorId ?? '#proof').replace(/^#/, '')}
      className="nx-section-chapter relative w-full scroll-mt-24 md:scroll-mt-0 bg-nx-paper text-nx-ink dark:bg-nx-black dark:text-white"
    >
      {/* Skeuomorphic stamp: "field-verified" credibility marker on the proof
          section. Block-stamp design (rectangular, horizontal text) so the
          ink reads cleanly. Click to cycle through partner/status stamps. */}
      <div className="absolute right-6 top-12 z-20 hidden md:block md:right-12 lg:right-16 lg:top-16">
        <SkeuomorphicBadge
          variant="stamp"
          color="red"
          primary="In exploration"
          secondary="CAMECT · 2026"
          icon="check"
          rotate={-6}
          size={120}
          states={[
            { primary: 'Pilot live', secondary: 'NYC SST · Q3', icon: 'bolt', color: 'amber' },
            { primary: 'Insured', secondary: 'Underwriting · Q4', icon: 'shield', color: 'blue' },
            { primary: 'Field-tested', secondary: 'On-prem · LE units', icon: 'star', color: 'green' },
          ]}
        />
      </div>
      <ProofScrubSection tiles={tiles} leadSentence={block.leadSentence} />
    </section>
  );
}
