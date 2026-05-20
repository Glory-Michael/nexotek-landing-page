import Link from 'next/link';
import { ChapterHeader } from './chapter-header';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import type { ContactCtaSection } from '@/types/landing-page';
import { LeadFormButton } from '@/components/lead-form-button';
import { SkeuomorphicBadge } from '@/components/brand/skeuomorphic-badge';
import { DotMatrixMorph } from './demos/dot-matrix-morph';

export function ContactCta({ block }: { block: ContactCtaSection }) {
  const trustRow = (block.trustRow ?? []).map((t) => t.value);
  const primary = block.primaryCta;
  const secondary = block.secondaryCta;

  return (
    <section
      id={(block.anchorId ?? '#contact').replace(/^#/, '')}
      className="nx-section-chapter relative overflow-hidden bg-black text-white scroll-mt-24 md:scroll-mt-0"
    >
      {/* Ambient dot-matrix that morphs between circle → heart → thumbs-up →
          NX cross every ~3.4s. Sits behind the content with low opacity so it
          adds depth without competing with the copy. Positioned with breathing
          room on both sides so the wordmark pattern reads symmetrically. */}
      <DotMatrixMorph
        className="pointer-events-none absolute z-0 hidden md:block md:bottom-0 md:right-0 md:h-[480px] md:w-[480px] lg:bottom-auto lg:right-0 lg:top-1/2 lg:h-[680px] lg:w-[680px] lg:-translate-y-1/2"
        tone="text-white/25 md:text-white/30"
      />

      {/* Skeuomorphic seal — green "founders respond" sticker pinned to the
          top-left corner of the section so it labels the panel rather than
          competing with the title or dot matrix. Counter-rotated so it tilts
          toward the page rather than away from it. Click to cycle through
          alternate ways we frame the same promise. */}
      <div className="absolute left-6 top-8 z-20 hidden md:left-12 md:top-10 md:block lg:left-16 lg:top-12">
        <SkeuomorphicBadge
          variant="sticker"
          color="green"
          primary="Founders respond"
          secondary="we pick up · 24h"
          icon="check"
          rotate={-6}
          size={100}
          states={[
            { primary: 'No SDRs', secondary: 'direct line · 24h', icon: 'bolt', color: 'amber' },
            { primary: 'Real call', secondary: 'no demo wall · 24h', icon: 'star', color: 'blue' },
            { primary: 'Reply same-day', secondary: 'team of 3 · 24h', icon: 'dot', color: 'yellow' },
          ]}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32">
        <div className="relative max-w-3xl md:max-w-[58%] lg:max-w-[50%]">
          <ChapterHeader
            eyebrow={block.eyebrow}
            title={block.title}
            leadSentence={block.leadSentence}
            onInk
          />
          {block.body && (
            <div className="-mt-6 mb-6 max-w-2xl">
              <RichTextRenderer content={block.body} variant="default" onInk />
            </div>
          )}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            {primary?.label &&
              (primary.mode === 'leadForm' ? (
                <LeadFormButton label={primary.label} variant="primary-ink" />
              ) : (
                <Link
                  href={primary.href || '#contact'}
                  className="inline-flex items-center justify-center rounded-nx-button bg-white px-7 py-3 font-mono text-xs uppercase tracking-[0.24em] text-black hover:bg-neutral-200"
                  data-cta-mode={primary.mode}
                >
                  {primary.label} →
                </Link>
              ))}
            {secondary?.label &&
              (secondary.mode === 'leadForm' ? (
                <LeadFormButton label={secondary.label} variant="ghost-ink" />
              ) : (
                <Link
                  href={secondary.href || '#contact'}
                  className="inline-flex items-center justify-center border-2 border-white px-6 py-3 font-mono text-xs uppercase tracking-[0.24em] hover:bg-white hover:text-black"
                  data-cta-mode={secondary.mode}
                >
                  {secondary.label}
                </Link>
              ))}
          </div>
          {trustRow.length > 0 && (
            // Stack one-per-line on mobile so each marker reads cleanly against
            // the halftone dot background; flow into a row on tablet+.
            <ul className="mt-12 flex flex-col gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-400 md:flex-row md:flex-wrap md:gap-x-6 md:gap-y-2 md:text-neutral-500">
              {trustRow.map((t, i) => (
                <li key={`${t}-${i}`}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
