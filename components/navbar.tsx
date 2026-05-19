import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { navigationDefaults } from '@/types/landing-page';
import type { CtaConfig } from '@/types/landing-page';
import { NavbarCTA } from './navbar-cta';
import { MobileMenu } from './mobile-menu';
import { AdaptiveLogo } from './adaptive-logo';

interface NavbarData {
  ctaText: string;
  logoSrc: string;
  navLinks: Array<{
    label: string;
    href: string;
    openInNewTab: boolean;
    mobileOnly: boolean;
  }>;
  secondaryLinks: Array<{ label: string; href: string }>;
  primaryCta?: CtaConfig;
  mobileTagline?: string;
}

const getNavbarData = unstable_cache(
  async (): Promise<NavbarData> => {
    try {
      const payload = await getPayload({ config });
      const data = await payload.findGlobal({ slug: 'navigation' });
      const navbar = (data as unknown as Record<string, unknown>).navbar as Record<string, unknown> | undefined;
      const footer = (data as unknown as Record<string, unknown>).footer as Record<string, unknown> | undefined;
      const logo = navbar?.logo;
      const linksRaw = navbar?.links;
      const footerLinksRaw = footer?.links;
      const primaryCtaRaw = navbar?.primaryCta as
        | { label?: string; mode?: 'leadForm' | 'href'; href?: string }
        | undefined;

      const navLinks = Array.isArray(linksRaw)
        ? (linksRaw as Array<Record<string, unknown>>).map((l) => ({
            label: (l.label as string) || '',
            href: (l.href as string) || '#',
            openInNewTab: !!l.openInNewTab,
            mobileOnly: !!l.mobileOnly,
          }))
        : [];

      const secondaryLinks = Array.isArray(footerLinksRaw)
        ? (footerLinksRaw as Array<Record<string, unknown>>)
            .map((l) => ({
              label: (l.label as string) || '',
              href: (l.url as string) || '',
            }))
            .filter((l) => l.label && l.href)
        : [];

      const mobileMenuRaw = navbar?.mobileMenu as
        | { tagline?: string; taglineEnabled?: boolean }
        | undefined;
      const mobileTagline =
        mobileMenuRaw?.taglineEnabled !== false &&
        typeof mobileMenuRaw?.tagline === 'string' &&
        mobileMenuRaw.tagline.trim().length > 0
          ? mobileMenuRaw.tagline
          : undefined;

      const primaryCta: CtaConfig | undefined = primaryCtaRaw?.label
        ? {
            label: primaryCtaRaw.label,
            mode: (primaryCtaRaw.mode as CtaConfig['mode']) || 'href',
            href: primaryCtaRaw.href,
          }
        : undefined;

      return {
        ctaText: (navbar?.ctaText as string) || navigationDefaults.ctaText,
        logoSrc:
          logo && typeof logo === 'object' && 'url' in (logo as Record<string, unknown>)
            ? (logo as { url: string }).url
            : navigationDefaults.logoSrc,
        navLinks,
        secondaryLinks,
        primaryCta,
        mobileTagline,
      };
    } catch {
      return {
        ctaText: navigationDefaults.ctaText,
        logoSrc: navigationDefaults.logoSrc,
        navLinks: [],
        secondaryLinks: [],
        primaryCta: undefined,
        mobileTagline: undefined,
      };
    }
  },
  ['navbar-data'],
  { revalidate: 60, tags: ['navigation'] },
);

export async function Navbar() {
  const { ctaText, logoSrc, navLinks, secondaryLinks, primaryCta, mobileTagline } =
    await getNavbarData();
  const hasLinks = navLinks.length > 0;

  return (
    <header className="site-navbar animate-navbar-slide-down sticky top-0 md:relative md:top-auto z-50 flex items-center justify-between gap-6 px-6 py-4 md:px-12 w-full bg-transparent backdrop-blur-none min-h-[100px]">
      <Link href="/" className="flex items-center gap-3 group shrink-0">
        <AdaptiveLogo src={logoSrc} />
      </Link>

      {hasLinks && (
        <nav aria-label="Primary" className="hidden flex-1 md:flex md:justify-center">
          <ul className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.24em]">
            {navLinks
              .filter((l) => !l.mobileOnly)
              .map((l) => (
                <li key={l.href + l.label}>
                  <Link
                    href={l.href}
                    target={l.openInNewTab ? '_blank' : undefined}
                    rel={l.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white underline-offset-[6px] hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      )}

      <div className="flex shrink-0 items-center gap-3">
        {primaryCta?.label ? (
          <Link
            href={primaryCta.mode === 'href' && primaryCta.href ? primaryCta.href : '#contact'}
            data-cta-mode={primaryCta.mode}
            className="hidden md:inline-flex items-center justify-center rounded-nx-button bg-black px-5 py-2 font-mono text-xs uppercase tracking-[0.24em] text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {primaryCta.label} →
          </Link>
        ) : (
          <NavbarCTA ctaText={ctaText} />
        )}
        <div className="md:hidden">
          <MobileMenu
            links={navLinks.map((l) => ({
              label: l.label,
              href: l.href,
              openInNewTab: l.openInNewTab,
            }))}
            secondaryLinks={secondaryLinks}
            primaryCta={primaryCta}
            tagline={mobileTagline}
          />
        </div>
      </div>
    </header>
  );
}
