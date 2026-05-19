import type { TrustStripSection } from '@/types/landing-page';
import { NxIcon, type NxIconName } from '@/components/brand/nx-icon';

const VALID_ICONS = new Set<string>([
  'arrow-right',
  'arrow-down',
  'asset',
  'close',
  'globe',
  'grid',
  'hex',
  'menu',
  'pause',
  'play',
  'play-circle',
  'plus',
  'radar',
  'search',
  'shield',
  'target',
  'trend',
  'user',
]);

function autoIconForLabel(label: string): NxIconName {
  const s = label.toUpperCase();
  if (s.includes('IACET') || s.includes('CREDENTIAL') || s.includes('ACCRED')) return 'shield';
  if (s.includes('METHOD') || s.includes('LAW ENFORCEMENT') || s.includes('FORENSIC')) return 'radar';
  if (s.includes('EDGE') || s.includes('AI') || s.includes('ON-PREM')) return 'grid';
  if (s.includes('PILOT') || s.includes('ACTIVE') || s.includes('DEPLOY')) return 'target';
  if (s.includes('CAMERA')) return 'hex';
  return 'hex';
}

// Editor pick wins over the auto-derived label match.
function resolveIcon(itemIcon: string | undefined, label: string): NxIconName {
  if (itemIcon && VALID_ICONS.has(itemIcon)) return itemIcon as NxIconName;
  return autoIconForLabel(label);
}

export function TrustStrip({ block }: { block: TrustStripSection }) {
  const items = block.items ?? [];
  const id = block.anchorId ? block.anchorId.replace(/^#/, '') : 'trust';
  if (items.length === 0) return null;
  return (
    <section
      id={id}
      className="bg-nx-paper text-nx-ink border-y-2 border-black/45 dark:bg-nx-black dark:text-white dark:border-white/30 scroll-mt-24 md:scroll-mt-0"
    >
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-12 md:py-10">
        {block.leadSentence && (
          <p className="sr-only">{block.leadSentence}</p>
        )}
        <ul className="grid grid-cols-1 divide-y divide-black/45 sm:grid-cols-2 sm:divide-y-0 sm:divide-x dark:divide-white/30 md:grid-cols-4">
          {items.map((item, i) => (
            <li
              key={`${item.label}-${i}`}
              className="flex items-start gap-3 px-0 py-3 sm:px-6 sm:py-2"
            >
              <NxIcon
                name={resolveIcon(item.icon, item.label)}
                size={22}
                className="mt-0.5 shrink-0 text-neutral-500 dark:text-neutral-400"
              />
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs font-medium uppercase tracking-[0.24em]">
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
                    {item.sublabel}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
