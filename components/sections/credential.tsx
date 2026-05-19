import { ChapterHeader } from './chapter-header';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import type { CredentialSection } from '@/types/landing-page';
import { SmartNumericHeadline } from './demos/count-up';
import { CredentialCard } from './credential-card';

export function Credential({ block }: { block: CredentialSection }) {
  const badges = block.badges ?? [];
  const stats = block.stats ?? [];

  return (
    <section
      id={(block.anchorId ?? '#train').replace(/^#/, '')}
      className="nx-section-chapter bg-black text-white scroll-mt-24 md:scroll-mt-0"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-12 md:py-28">
        <ChapterHeader
          eyebrow={block.eyebrow}
          title={block.title}
          leadSentence={block.leadSentence}
          onInk
        />
        {block.body && (
          <div className="-mt-8 mb-12 max-w-3xl">
            <RichTextRenderer content={block.body} variant="default" onInk />
          </div>
        )}

        {badges.length > 0 && (
          <ul className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((b, i) => (
              <CredentialCard key={`${b.label}-${i}`} badge={b} />
            ))}
          </ul>
        )}

        {stats.length > 0 && (
          <ul className="grid gap-8 border-y-2 border-white/70 py-8 sm:grid-cols-3">
            {stats.map((s, i) => (
              <li key={`${s.label}-${i}`} className="text-center sm:text-left">
                <p className="font-display text-4xl font-semibold tracking-tight md:text-6xl">
                  <SmartNumericHeadline text={s.value} />
                </p>
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.22em] text-neutral-400">
                  {s.label}
                </p>
              </li>
            ))}
          </ul>
        )}

        {block.disclaimer && (
          <div className="mt-10 max-w-3xl">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-400">
              Training delivery
            </p>
            <p className="text-base leading-relaxed text-neutral-100 md:text-lg">
              {block.disclaimer}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
