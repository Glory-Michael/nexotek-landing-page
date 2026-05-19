import Image from 'next/image';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { navigationDefaults } from '@/types/landing-page';
import type { FooterData } from '@/types/landing-page';
import { MotionToggle } from './motion-toggle';
import { LeadFormButton } from './lead-form-button';

interface FooterProps {
  readonly extraLinks?: ReadonlyArray<{ label: string; url: string }>;
}

interface LegacyFooterData {
  copyrightName: string;
  links: Array<{ label: string; url: string }>;
}

const getFooterData = unstable_cache(
  async (): Promise<{ legacy: LegacyFooterData; v2: FooterData | null }> => {
    try {
      const payload = await getPayload({ config });

      const [navData, footerData] = await Promise.all([
        payload.findGlobal({ slug: 'navigation' }).catch(() => null),
        payload.findGlobal({ slug: 'footer' }).catch(() => null),
      ]);

      // Legacy: read from Navigation.footer (pre-Phase-1)
      const navAsRecord = navData ? (navData as unknown as Record<string, unknown>) : undefined;
      const navFooter = navAsRecord?.footer
        ? (navAsRecord.footer as Record<string, unknown>)
        : undefined;
      const legacyLinks = navFooter?.links;
      const legacy: LegacyFooterData = {
        copyrightName: (navFooter?.copyrightName as string) || navigationDefaults.copyrightName,
        links:
          Array.isArray(legacyLinks) && legacyLinks.length > 0
            ? (legacyLinks as Array<{ label?: string; url?: string }>).map((l) => ({
                label: l.label || '',
                url: l.url || '#',
              }))
            : navigationDefaults.links,
      };

      // V2: read from new Footer global
      const footerAsRecord = footerData
        ? (footerData as unknown as Record<string, unknown>)
        : undefined;
      const content = footerAsRecord?.content
        ? (footerAsRecord.content as Record<string, unknown>)
        : undefined;

      const v2: FooterData | null = content
        ? {
            closingLine: (content.closingLine as string) || undefined,
            closingCta: (() => {
              const c = content.closingCta as Record<string, unknown> | undefined;
              if (!c?.label) return undefined;
              return {
                label: c.label as string,
                mode: (c.mode as FooterData['closingCta'] extends infer T
                  ? T extends { mode: infer M }
                    ? M
                    : never
                  : never) || 'href',
                href: c.href as string | undefined,
              };
            })(),
            columns: Array.isArray(content.columns)
              ? (content.columns as Array<Record<string, unknown>>).map((col) => ({
                  heading: (col.heading as string) || '',
                  links: Array.isArray(col.links)
                    ? (col.links as Array<Record<string, unknown>>).map((l) => ({
                        label: (l.label as string) || '',
                        href: (l.href as string) || '#',
                        openInNewTab: !!l.openInNewTab,
                      }))
                    : [],
                }))
              : [],
            social: Array.isArray(content.social)
              ? (content.social as Array<Record<string, unknown>>).map((s) => ({
                  label: (s.label as string) || '',
                  href: (s.href as string) || '#',
                }))
              : [],
            complianceBadges: Array.isArray(content.complianceBadges)
              ? (content.complianceBadges as Array<Record<string, unknown>>).map((b) => ({
                  label: (b.label as string) || '',
                  sub: (b.sub as string) || undefined,
                }))
              : [],
            legalLine: (content.legalLine as string) || undefined,
            wordmark: (() => {
              const w = content.wordmark;
              return w && typeof w === 'object' && 'url' in (w as Record<string, unknown>)
                ? {
                    url: (w as { url: string }).url,
                    alt: (w as { alt?: string }).alt,
                  }
                : null;
            })(),
          }
        : null;

      const hasV2Content =
        v2 &&
        ((v2.closingLine && v2.closingLine.length > 0) ||
          (v2.columns && v2.columns.length > 0) ||
          (v2.social && v2.social.length > 0) ||
          (v2.complianceBadges && v2.complianceBadges.length > 0));

      return { legacy, v2: hasV2Content ? v2 : null };
    } catch {
      return {
        legacy: {
          copyrightName: navigationDefaults.copyrightName,
          links: navigationDefaults.links,
        },
        v2: null,
      };
    }
  },
  ['footer-data'],
  { revalidate: 60, tags: ['navigation', 'footer'] },
);

export async function Footer({ extraLinks = [] }: Readonly<FooterProps>) {
  const { legacy, v2 } = await getFooterData();

  if (v2) {
    return <FooterV2 data={v2} />;
  }

  return <FooterLegacy legacy={legacy} extraLinks={extraLinks} />;
}

function FooterLegacy({
  legacy,
  extraLinks,
}: {
  legacy: LegacyFooterData;
  extraLinks: ReadonlyArray<{ label: string; url: string }>;
}) {
  const allLinks = [
    ...extraLinks.filter((e) => !legacy.links.some((l) => l.url === e.url)),
    ...legacy.links,
  ];
  return (
    <footer className="site-footer animate-footer-fade-in relative w-full bg-transparent py-4 px-6 md:px-12 z-50 mt-auto overflow-hidden">
      <div
        className="footer-grid-mask absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none"
      >
        <svg width="100%" height="100%">
          <defs>
            <pattern id="footer-isometric-grid" width="40" height="69.282" patternUnits="userSpaceOnUse">
              <g stroke="currentColor" strokeWidth="1" fill="none">
                <path d="M 40 0 L 0 23.094 L 0 69.282 L 40 46.188 Z" />
                <path d="M 0 23.094 L 40 46.188 M 0 69.282 L 40 23.094" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-isometric-grid)" className="text-black dark:text-white" />
        </svg>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto flex flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <span className="text-[10px] sm:text-xs font-medium text-neutral-500 whitespace-nowrap">
            © {new Date().getFullYear()} {legacy.copyrightName}
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-neutral-500">
          {allLinks.map((link) => (
            <Link
              key={link.url}
              href={link.url}
              className="hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <div className="hidden md:block">
            <MotionToggle surface="paper" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterV2({ data }: { data: FooterData }) {
  const columns = data.columns ?? [];
  const social = data.social ?? [];
  const badges = data.complianceBadges ?? [];
  return (
    <footer className="site-footer relative w-full bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20">
        {data.closingLine && (
          <p className="mb-12 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            {data.closingLine}
          </p>
        )}
        {data.closingCta?.label &&
          (data.closingCta.mode === 'leadForm' ? (
            <div className="mb-16">
              <LeadFormButton
                label={data.closingCta.label}
                variant="primary-ink"
              />
            </div>
          ) : (
            <Link
              href={
                data.closingCta.mode === 'href' && data.closingCta.href
                  ? data.closingCta.href
                  : '#contact'
              }
              data-cta-mode={data.closingCta.mode}
              className="mb-16 inline-flex items-center justify-center rounded-nx-button bg-white px-6 py-3 font-mono text-xs uppercase tracking-[0.24em] text-black hover:bg-neutral-200"
            >
              {data.closingCta.label} →
            </Link>
          ))}

        {columns.length > 0 && (
          <div className="grid gap-10 border-t-2 border-white/60 pt-12 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((col, i) => (
              <div key={`${col.heading}-${i}`}>
                <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.24em] text-neutral-400">
                  {col.heading}
                </h3>
                <ul className="space-y-3 text-sm">
                  {(col.links ?? []).map((l, j) => (
                    <li key={`${l.href}-${j}`}>
                      <Link
                        href={l.href}
                        target={l.openInNewTab ? '_blank' : undefined}
                        rel={l.openInNewTab ? 'noopener noreferrer' : undefined}
                        className="text-neutral-300 hover:text-white"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 flex flex-col gap-8 border-t-2 border-white/60 pt-8 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-6">
            {data.wordmark?.url && (
              <div className="relative h-8 w-32">
                <Image
                  src={data.wordmark.url}
                  alt={data.wordmark.alt || 'Nexotek'}
                  fill
                  unoptimized
                  className="object-contain object-left brightness-0 invert"
                />
              </div>
            )}
            {data.legalLine && (
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                {data.legalLine}
              </p>
            )}
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            {badges.length > 0 && (
              <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                {badges.map((b, i) => (
                  <li key={`${b.label}-${i}`}>
                    {b.label}
                    {b.sub ? ` · ${b.sub}` : ''}
                  </li>
                ))}
              </ul>
            )}
            {social.length > 0 && (
              <ul className="flex gap-6 font-mono text-xs uppercase tracking-[0.24em]">
                {social.map((s, i) => (
                  <li key={`${s.label}-${i}`}>
                    <Link href={s.href} className="text-neutral-300 hover:text-white">
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="hidden md:block">
              <MotionToggle surface="ink" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
