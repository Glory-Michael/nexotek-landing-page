// `Image` kept in imports as a recoverable fallback — see comment at the
// render site for how to swap back to the photo placeholder.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Image from 'next/image';
import { ChapterHeader } from './chapter-header';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import { PointerVars } from '@/components/parallax';
import type { ThreadSection } from '@/types/landing-page';
import { ComparisonSlider } from './demos/comparison-slider';
import { ScrubbableTimeseries } from './demos/scrubbable-timeseries';
import { OperatorCli } from './demos/operator-cli';
import { SkeuomorphicBadge } from '@/components/brand/skeuomorphic-badge';
import { CameraGridPeek } from './demos/camera-grid-peek';
import { FloorplanPeek } from './demos/floorplan-peek';

const PLACEHOLDER_SVG = '/brand/photos/vision-cctv.jpg';

export function ThreadVision({ block }: { block: ThreadSection }) {
  const bullets = (block.bullets ?? []).map((b) => b.value);
  const chips = (block.chips ?? []).map((c) => c.value);
  const mediaUrl = block.mediaRef?.url || PLACEHOLDER_SVG;
  const mediaAlt = block.mediaRef?.alt || `${block.productName ?? 'Nexotek Vision'} preview`;

  return (
    <section
      id={(block.anchorId ?? '#vision').replace(/^#/, '')}
      className="nx-section-chapter relative bg-black text-white scroll-mt-24 md:scroll-mt-0"
    >
      <PointerVars />
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-12 md:py-28">
        <ChapterHeader
          eyebrow={block.productName}
          title={block.tagline}
          leadSentence={block.leadSentence}
          onInk
        />
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            {chips.length > 0 && (
              <ul className="mb-6 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.22em] text-neutral-400">
                {chips.map((c, i) => (
                  <li key={`${c}-${i}`} className="border border-white/70 px-2 py-1">
                    {c}
                  </li>
                ))}
              </ul>
            )}
            {block.body && (
              <div className="mt-6 max-w-xl">
                <RichTextRenderer content={block.body} variant="default" onInk />
              </div>
            )}
            {bullets.length > 0 && (
              <ul className="mt-8 space-y-3 text-neutral-300">
                {bullets.map((b, i) => (
                  <li key={`${b}-${i}`} className="flex items-start gap-3">
                    <span className="mt-2 inline-block h-[3px] w-4 bg-white/40" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {block.ctaLabel && block.ctaHref && (
              <a
                href={block.ctaHref}
                className="mt-10 inline-block border-2 border-white px-5 py-3 font-mono text-xs uppercase tracking-[0.24em] hover:bg-white hover:text-black"
              >
                {block.ctaLabel}
              </a>
            )}
          </div>
          {block.demoMode === 'before-after' &&
          block.comparisonAssets?.beforeImage?.url &&
          block.comparisonAssets?.afterImage?.url ? (
            <ComparisonSlider
              beforeImage={block.comparisonAssets.beforeImage}
              afterImage={block.comparisonAssets.afterImage}
              beforeLabel="RAW CCTV"
              afterLabel="DETECTED"
            />
          ) : (
            block.visionDemos?.cameraGrid?.enabled !== false && (
              <div
                className="relative aspect-[4/3] w-full"
                style={{
                  transform:
                    'translate3d(calc(var(--nx-mx, 0) * 6px), calc(var(--nx-my, 0) * 5px), 0)',
                  willChange: 'transform',
                }}
                role="img"
                aria-label={
                  block.visionDemos?.cameraGrid?.altText ||
                  'Four-camera CCTV grid mockup with simulated AI detections.'
                }
              >
                <CameraGridPeek className="absolute inset-0" />
              </div>
            )
          )}
        </div>

        {/* Row 2 — MEASURES · the quantitative read on what Vision saw.
            Events timeseries on top, then a 3-up of safety-focused charts
            for variety (bars · donut · column). */}
        <div className="mt-16 border border-white/15 bg-white/[0.02] p-6 md:p-8">
          <ScrubbableTimeseries className="text-white" />
          <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:gap-8">
            <HazardCategoryBars />
            <DetectionMixDonut />
            <ComplianceTrend />
          </div>
        </div>

        {/* Row 3 — ACTS · the operator workbench. CLI on the left, live
            alert queue on the right. Skeuomorphic "Live Ops" sticker stays
            pinned to the CLI as the live-ops surface. */}
        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative">
            <div className="pointer-events-none absolute -top-4 right-4 z-20 hidden md:block lg:-top-6 lg:right-6">
              <SkeuomorphicBadge
                variant="sticker"
                color="yellow"
                primary="Live Ops"
                secondary="nx-cli · v0.42"
                icon="bolt"
                rotate={-9}
                size={90}
              />
            </div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.24em] text-neutral-400">
              OPERATOR · NX CLI
            </p>
            {block.visionDemos?.operatorCli?.enabled !== false && (
              <div
                role="img"
                aria-label={
                  block.visionDemos?.operatorCli?.altText ||
                  'Terminal-style preview of the nx-cli operator surface.'
                }
              >
                <OperatorCli />
              </div>
            )}
          </div>
          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-neutral-400">
                SPATIAL INDEX · 3D
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                ↳ NX OPS · /space
              </span>
            </div>
            {block.visionDemos?.floorplan?.enabled !== false && (
              <div
                role="img"
                aria-label={
                  block.visionDemos?.floorplan?.altText ||
                  '3D floorplan with placed cameras and field-of-view cones.'
                }
              >
                <FloorplanPeek />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Safety mini-charts (scoped to ThreadVision) ────────────────────────────

const HAZARD_CATEGORIES = [
  { label: 'Restricted entry', count: 14, alert: true },
  { label: 'PPE missing', count: 11, alert: false },
  { label: 'Vehicle in zone', count: 7, alert: false },
  { label: 'After-hours access', count: 4, alert: false },
  { label: 'Lockout breach', count: 2, alert: false },
];

function HazardCategoryBars() {
  const max = Math.max(...HAZARD_CATEGORIES.map((c) => c.count));
  const total = HAZARD_CATEGORIES.reduce((a, c) => a + c.count, 0);
  return (
    <div className="border border-white/30 bg-black p-4">
      <div className="mb-3 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-400">
        <span>HAZARDS · 24 H</span>
        <span className="text-neutral-500">
          n=<span className="tabular-nums text-white">{total}</span>
        </span>
      </div>
      <ul className="space-y-2.5">
        {HAZARD_CATEGORIES.map((c) => {
          const pct = (c.count / max) * 100;
          return (
            <li key={c.label}>
              <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-300">
                <span className="truncate">{c.label}</span>
                <span className="tabular-nums text-white">{c.count}</span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-white/10">
                <div
                  className={`h-full ${c.alert ? 'bg-red-500/85' : 'bg-white/70'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-500">
        ▸ COUNT BY CATEGORY · CAM EDGE-AI
      </p>
    </div>
  );
}

const DETECTION_MIX = [
  { label: 'Person', pct: 48, color: '#FFFFFF' },
  { label: 'Vehicle', pct: 22, color: '#A8A8A8' },
  { label: 'PPE-OK', pct: 18, color: '#F4D544' },
  { label: 'Object', pct: 12, color: '#5C5C5C' },
];

function DetectionMixDonut() {
  const R = 38;
  const C = 2 * Math.PI * R;
  const segments = DETECTION_MIX.reduce<
    Array<{ label: string; pct: number; color: string; dash: number; offset: number }>
  >((acc, seg) => {
    const startPct = acc.reduce((s, p) => s + p.pct, 0);
    acc.push({
      ...seg,
      dash: (seg.pct / 100) * C,
      offset: -((startPct / 100) * C),
    });
    return acc;
  }, []);
  return (
    <div className="border border-white/30 bg-black p-4">
      <div className="mb-3 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-400">
        <span>DETECTION MIX</span>
        <span className="text-neutral-500">% · 24 H</span>
      </div>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90 shrink-0">
          {segments.map((seg) => (
            <circle
              key={seg.label}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${seg.dash} ${C - seg.dash}`}
              strokeDashoffset={seg.offset}
            />
          ))}
          <text
            x="50"
            y="52"
            fontSize="13"
            fontFamily="JetBrains Mono, monospace"
            textAnchor="middle"
            fill="#FFFFFF"
            transform="rotate(90 50 50)"
          >
            100%
          </text>
        </svg>
        <ul className="flex-1 space-y-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
          {DETECTION_MIX.map((seg) => (
            <li key={seg.label} className="flex items-center justify-between gap-2 text-neutral-300">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2"
                  style={{ background: seg.color }}
                  aria-hidden
                />
                {seg.label}
              </span>
              <span className="tabular-nums text-white">{seg.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-500">
        ▸ SHARE OF CLASSIFIED FRAMES
      </p>
    </div>
  );
}

const COMPLIANCE_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const COMPLIANCE_7D = [94.8, 96.1, 95.4, 97.2, 95.9, 96.5, 96.2];
const COMPLIANCE_TARGET = 95;
const COMPLIANCE_MIN = 92;
const COMPLIANCE_MAX = 100;

function ComplianceTrend() {
  const span = COMPLIANCE_MAX - COMPLIANCE_MIN;
  const targetTopPct = ((COMPLIANCE_MAX - COMPLIANCE_TARGET) / span) * 100;
  const weekAvg = (COMPLIANCE_7D.reduce((a, b) => a + b, 0) / COMPLIANCE_7D.length).toFixed(1);
  return (
    <div className="border border-white/30 bg-black p-4">
      <div className="mb-3 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-400">
        <span>PPE COMPLIANCE · 7 D</span>
        <span className="text-emerald-400">
          AVG <span className="tabular-nums">{weekAvg}%</span>
        </span>
      </div>
      <div className="relative h-[88px]">
        <div
          className="absolute inset-x-0 border-t border-dashed border-emerald-500/45"
          style={{ top: `${targetTopPct}%` }}
          aria-hidden
        />
        <span
          className="absolute -translate-y-1/2 bg-black px-1 font-mono text-[8.5px] uppercase tracking-[0.18em] text-emerald-400/80"
          style={{ top: `${targetTopPct}%`, right: 0 }}
        >
          TARGET {COMPLIANCE_TARGET}%
        </span>
        <div className="grid h-full grid-cols-7 items-end gap-1">
          {COMPLIANCE_7D.map((v, i) => {
            const h = ((v - COMPLIANCE_MIN) / span) * 100;
            const ok = v >= COMPLIANCE_TARGET;
            return (
              <div key={i} className="flex h-full flex-col items-center justify-end">
                <span className="mb-1 font-mono text-[8.5px] tabular-nums text-neutral-400">
                  {v.toFixed(1)}
                </span>
                <div
                  className={`w-full ${ok ? 'bg-emerald-500/80' : 'bg-red-500/80'}`}
                  style={{ height: `${h}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1 font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-500">
        {COMPLIANCE_DAYS.map((d) => (
          <span key={d} className="text-center">
            {d}
          </span>
        ))}
      </div>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-500">
        ▸ DAILY % · {COMPLIANCE_MIN}–{COMPLIANCE_MAX} SCALE
      </p>
    </div>
  );
}
