import { unstable_cache } from 'next/cache';
import { getPayload } from 'payload';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AlphaGate } from '@/components/alpha-gate';
import config from '@/payload.config';
import { landingPageDefaults } from '@/types/landing-page';
import {
  getAlphaConfig,
  findProtectedFeature,
  validateAlphaToken,
  ALPHA_COOKIE_NAME,
} from '@/lib/alpha-features';
import { getNewsroomSettings } from '@/lib/newsroom-settings';
import { SampleContentBanner } from '@/components/newsroom/sample-content-banner';

const getNewsroomChrome = unstable_cache(
  async () => {
    try {
      const payload = await getPayload({ config });
      const data = await payload.findGlobal({ slug: 'landing-page', draft: false });

      const navLogo = data.navbar?.logo;
      const logoUrl =
        navLogo && typeof navLogo === 'object' && 'url' in navLogo
          ? (navLogo.url as string)
          : undefined;

      return {
        navbar: {
          ctaText: data.navbar?.ctaText || landingPageDefaults.navbar.ctaText,
          logoUrl,
        },
        footer: {
          copyrightName: data.footer?.copyrightName || landingPageDefaults.footer.copyrightName,
          links: (() => {
            const base =
              data.footer?.links && Array.isArray(data.footer.links) && data.footer.links.length > 0
                ? data.footer.links.map((link: { label?: string; url?: string }) => ({
                    label: link.label || '',
                    url: link.url || '#',
                  }))
                : landingPageDefaults.footer.links;
            return base.some((l: { url: string }) => l.url === '/newsroom')
              ? base
              : [{ label: 'Newsroom', url: '/newsroom' }, ...base];
          })(),
        },
      };
    } catch (err) {
      console.error('Failed to fetch newsroom chrome data:', err);
      return {
        navbar: { ctaText: landingPageDefaults.navbar.ctaText, logoUrl: undefined },
        footer: {
          copyrightName: landingPageDefaults.footer.copyrightName,
          links: landingPageDefaults.footer.links,
        },
      };
    }
  },
  ['newsroom-chrome'],
  { revalidate: 60, tags: ['landing-page'] },
);

export const metadata: Metadata = {
  alternates: {
    types: {
      'application/rss+xml': '/api/rss',
    },
  },
};

export default async function NewsroomLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Alpha gate check — runs before rendering any content
  const alphaConfig = await getAlphaConfig();
  const feature = findProtectedFeature('/newsroom', alphaConfig.features);
  if (feature) {
    const cookieStore = await cookies();
    const token = cookieStore.get(ALPHA_COOKIE_NAME)?.value ?? '';
    if (!validateAlphaToken(token, alphaConfig.password)) {
      return <AlphaGate featureLabel={feature.label} />;
    }
  }

  const [chrome, { showDemoArticles }] = await Promise.all([
    getNewsroomChrome(),
    getNewsroomSettings(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <Navbar ctaText={chrome.navbar.ctaText} logoSrc={chrome.navbar.logoUrl} />
      {showDemoArticles && <SampleContentBanner />}
      <main className="flex-1">{children}</main>
      <Footer copyrightName={chrome.footer.copyrightName} links={chrome.footer.links} />
    </div>
  );
}
