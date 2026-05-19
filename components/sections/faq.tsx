import Link from 'next/link';
import { SectionShell } from './section-shell';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import type { FaqSection } from '@/types/landing-page';
import { NxIcon } from '@/components/brand/nx-icon';

export function Faq({ block }: { block: FaqSection }) {
  const items = block.items ?? [];
  if (items.length === 0) return null;
  return (
    <SectionShell
      anchorId={block.anchorId ?? '#faq'}
      surface="paper"
      eyebrow={block.eyebrow}
      title={block.title ?? 'Frequently asked questions'}
      leadSentence={block.leadSentence}
    >
      <ul className="divide-y divide-black/45 border-y-2 border-black/45 dark:divide-white/30 dark:border-white/30">
        {items.map((item, i) => (
          <li key={`${item.question}-${i}`} className="py-4">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-display text-lg font-medium tracking-tight md:text-xl">
                  {item.question}
                </span>
                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-black/55 text-neutral-700 transition-transform duration-300 group-open:rotate-45 group-open:border-black/40 group-open:text-black dark:border-white/40 dark:text-neutral-300 dark:group-open:border-white/30 dark:group-open:text-white"
                  aria-hidden
                >
                  <NxIcon name="plus" size={14} />
                </span>
              </summary>
              <div className="mt-4 max-w-3xl text-neutral-700 dark:text-neutral-300">
                <RichTextRenderer content={item.answer} variant="default" />
                {item.linkAnchor && (
                  <Link
                    href={item.linkAnchor}
                    className="mt-3 inline-block font-mono text-xs uppercase tracking-[0.24em] underline-offset-4 hover:underline"
                  >
                    LEARN MORE →
                  </Link>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
