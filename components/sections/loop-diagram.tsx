import Link from 'next/link';
import { SectionShell } from './section-shell';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import type { LoopDiagramSection } from '@/types/landing-page';
import { LoopSequence } from './demos/loop-sequence';
import { LoopSash } from './demos/loop-sash';

export function LoopDiagram({ block }: { block: LoopDiagramSection }) {
  const nodes = block.nodes ?? [];
  const revealMode = block.revealMode ?? 'pinnedSequence';
  const interactive = revealMode === 'pinnedSequence' || revealMode === 'viewportTracked';

  return (
    <SectionShell
      anchorId={block.anchorId ?? '#loop'}
      surface="paper"
      eyebrow={block.eyebrow}
      title={block.title}
      leadSentence={block.leadSentence}
    >
      {block.body && (
        <div className="mb-10 max-w-3xl text-neutral-700 dark:text-neutral-300">
          <RichTextRenderer content={block.body} variant="default" />
        </div>
      )}
      {interactive && nodes.length > 0 ? (
        <LoopSequence
          nodes={nodes}
          pinDistancePerNodeVh={block.pinDistancePerNodeVh ?? 90}
          loopRing={block.loopRing}
          showPhaseReadout={block.showPhaseReadout ?? true}
          sash={block.sash}
        />
      ) : null}
      {!interactive && nodes.length > 0 && (
      <ol className="flex flex-col divide-y divide-black/45 border-y-2 border-black/45 dark:divide-white/30 dark:border-white/30">
        {nodes.map((node, i) => (
          <li key={`${node.index}-${i}`} className="py-6 md:py-8">
            <details className="group">
              <summary className="flex cursor-pointer items-baseline justify-between gap-6 list-none">
                <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
                  <span className="font-mono text-xs uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
                    {node.index}
                  </span>
                  <span className="font-display text-2xl font-semibold uppercase tracking-tight md:text-4xl">
                    {node.label}
                  </span>
                  {node.tagline && (
                    <span className="font-sans text-base text-neutral-700 dark:text-neutral-300 md:text-lg">
                      {node.tagline}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-3">
                  {node.status === 'roadmap' && (
                    <span className="rounded-sm border border-black/30 dark:border-white/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-700 dark:text-neutral-300">
                      {node.statusLabel || 'BUILDING'}
                    </span>
                  )}
                  {node.anchorLink && (
                    <Link
                      href={node.anchorLink}
                      className="font-mono text-xs uppercase tracking-[0.22em] underline-offset-4 hover:underline"
                    >
                      DETAIL →
                    </Link>
                  )}
                </div>
              </summary>
              {node.body && (
                <div className="mt-4 max-w-3xl pl-0 text-neutral-700 dark:text-neutral-300 md:pl-24">
                  <RichTextRenderer content={node.body} variant="default" />
                </div>
              )}
            </details>
          </li>
        ))}
      </ol>
      )}
      {!interactive && block.sash?.enabled && block.sash?.text && (
        <LoopSash
          text={block.sash.text}
          revolutionMs={block.loopRing?.revolutionMs ?? 24000}
          startingCycle={block.loopRing?.startingCycle ?? 42}
          surface="paper"
          className="mt-12 -mx-6 md:-mx-12"
        />
      )}
    </SectionShell>
  );
}
