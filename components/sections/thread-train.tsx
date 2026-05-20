import Image from 'next/image';
import { SectionShell } from './section-shell';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import type { ThreadSection } from '@/types/landing-page';

const PLACEHOLDER_SVG = '/brand/placeholder-training.svg';

export function ThreadTrain({ block }: { block: ThreadSection }) {
  const bullets = (block.bullets ?? []).map((b) => b.value);
  const chips = (block.chips ?? []).map((c) => c.value);
  const mediaUrl = block.mediaRef?.url || PLACEHOLDER_SVG;
  const mediaAlt = block.mediaRef?.alt || `${block.productName ?? 'Nexotek Training'} preview`;

  return (
    <section
      id={(block.anchorId ?? '#train').replace(/^#/, '')}
      className="bg-black text-white scroll-mt-24 md:scroll-mt-0"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-12 md:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-white/45 bg-neutral-950 lg:order-2">
            <Image
              src={mediaUrl}
              alt={mediaAlt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
          <div className="lg:order-1">
            {chips.length > 0 && (
              <ul className="mb-6 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.22em] text-neutral-400">
                {chips.map((c, i) => (
                  <li key={`${c}-${i}`} className="border border-white/70 px-2 py-1">
                    {c}
                  </li>
                ))}
              </ul>
            )}
            {block.productName && (
              <h2 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">
                {block.productName}
              </h2>
            )}
            {block.tagline && (
              <p className="mt-3 font-sans text-xl text-neutral-300 md:text-2xl">
                {block.tagline}
              </p>
            )}
            {block.leadSentence && (
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-300">
                {block.leadSentence}
              </p>
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
          </div>
        </div>
      </div>
    </section>
  );
}
