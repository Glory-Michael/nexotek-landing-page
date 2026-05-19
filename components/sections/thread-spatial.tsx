// `Image` + PLACEHOLDER_SVG kept as recoverable photo fallback — see render site.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Image from 'next/image';
import { SectionShell } from './section-shell';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import { PointerVars } from '@/components/parallax';
import type { ThreadSection } from '@/types/landing-page';
import { SplatViewerLoader } from './demos/splat-viewer-loader';
import { SpatialPeek } from './demos/spatial-peek';
import { LiveViewPeek } from './demos/live-view-peek';
import { NxIcon, type NxIconName } from '@/components/brand/nx-icon';

// Recoverable: photo fallback path used by the old image placeholder.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PLACEHOLDER_SVG = '/brand/photos/spatial-brutalist.jpg';

const VALID_ICONS: ReadonlyArray<NxIconName> = [
  'arrow-right', 'arrow-down', 'asset', 'close', 'globe', 'grid', 'hex', 'menu',
  'pause', 'play', 'play-circle', 'plus', 'radar', 'search', 'shield', 'target',
  'trend', 'user',
];

function normalizeIcon(raw: unknown, fallback: NxIconName): NxIconName {
  if (typeof raw !== 'string') return fallback;
  return (VALID_ICONS as readonly string[]).includes(raw) ? (raw as NxIconName) : fallback;
}


export function ThreadSpatial({ block }: { block: ThreadSection }) {
  const subItems = block.subItems ?? [];
  const chips = (block.chips ?? []).map((c) => c.value);

  return (
    <SectionShell
      anchorId={block.anchorId ?? '#spatial'}
      surface="paper"
      eyebrow={block.tagline}
      title={block.productName}
      leadSentence={block.leadSentence}
    >
      <PointerVars />
      {chips.length > 0 && (
        <ul className="mb-8 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.22em] text-neutral-600 dark:text-neutral-400">
          {chips.map((c, i) => (
            <li key={`${c}-${i}`} className="border border-black/65 dark:border-white/50 px-2 py-1">
              {c}
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6 text-neutral-700 dark:text-neutral-300">
          {block.body && <RichTextRenderer content={block.body} variant="default" />}
          {subItems.length > 0 && (
            <ul className="grid gap-6 sm:grid-cols-1">
              {subItems.map((item, i) => {
                const iconName = normalizeIcon(
                  (item as { icon?: unknown }).icon,
                  (['globe', 'shield', 'user'] as const)[i % 3],
                );
                return (
                  <li
                    key={`${item.title}-${i}`}
                    className="flex gap-4 border-l-2 border-black/65 dark:border-white/50 pl-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-black/55 text-neutral-700 dark:border-white/40 dark:text-neutral-300">
                      <NxIcon name={iconName} size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold uppercase tracking-tight">
                        {item.title}
                      </h3>
                      {item.body && (
                        <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                          <RichTextRenderer content={item.body} variant="default" />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {block.ctaLabel && block.ctaHref && (
            <a
              href={block.ctaHref}
              className="inline-block border-2 border-black px-5 py-3 font-mono text-xs uppercase tracking-[0.24em] hover:bg-black hover:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
            >
              {block.ctaLabel}
            </a>
          )}
        </div>
        {block.demoMode === 'splat-viewer' ? (
          <SplatViewerLoader splatUrl={block.splatUrl} />
        ) : (
          block.spatialDemos?.spatialPeek?.enabled !== false && (
            <div
              className="relative aspect-[4/3] w-full overflow-hidden border-2 border-black bg-neutral-50 dark:border-white dark:bg-neutral-900"
              role="img"
              aria-label={
                block.spatialDemos?.spatialPeek?.altText ||
                '3D reconstruction of a construction yard with assets and cameras.'
              }
            >
              <SpatialPeek className="absolute inset-0" />
              {block.spatialDemos?.liveView?.enabled !== false && (
                /* Corner peek: 1:1 camect LiveView + PTZ controls overlaid
                   in the lower-right. Reads as "the operator zoomed into a
                   single camera within this floorplan." */
                <div
                  role="img"
                  aria-label={
                    block.spatialDemos?.liveView?.altText ||
                    'Camera live-view preview with PTZ controls.'
                  }
                >
                  <LiveViewPeek className="pointer-events-none absolute bottom-3 right-3 hidden w-[380px] origin-bottom-right rotate-[-1deg] md:block" />
                </div>
              )}
            </div>
          )
        )}
      </div>
    </SectionShell>
  );
}
