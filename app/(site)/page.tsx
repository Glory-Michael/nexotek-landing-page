import { HeroSection } from '@/components/hero-section';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { landingPageDefaults } from '@/types/landing-page';
import type { LandingPageData } from '@/types/landing-page';

async function getLandingPageData(): Promise<LandingPageData> {
  try {
    const payload = await getPayload({ config });
    const data = await payload.findGlobal({ slug: 'landing-page' });

    return {
      hero: {
        titleLine1: data.hero?.titleLine1 || landingPageDefaults.hero.titleLine1,
        titleLine2: data.hero?.titleLine2 || landingPageDefaults.hero.titleLine2,
        subtitle: data.hero?.subtitle || landingPageDefaults.hero.subtitle,
        emailPlaceholder: data.hero?.emailPlaceholder || landingPageDefaults.hero.emailPlaceholder,
        buttonText: data.hero?.buttonText || landingPageDefaults.hero.buttonText,
        successMessage: data.hero?.successMessage || landingPageDefaults.hero.successMessage,
      },
      navbar: {
        ctaText: data.navbar?.ctaText || landingPageDefaults.navbar.ctaText,
      },
      footer: {
        copyrightName: data.footer?.copyrightName || landingPageDefaults.footer.copyrightName,
      },
    };
  } catch (err) {
    console.error('Failed to fetch landing page data:', err);
    return landingPageDefaults;
  }
}

export default async function Home() {
  const content = await getLandingPageData();

  return (
    <main className="min-h-[100dvh] md:min-h-[600px] lg:min-h-[100dvh] w-full flex flex-col relative bg-white dark:bg-black transition-colors duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-white to-white dark:from-neutral-900 dark:via-black dark:to-black -z-30 transition-colors duration-500" />
      <Navbar ctaText={content.navbar.ctaText} />
      <div className="flex-1 flex flex-col">
        <HeroSection hero={content.hero} />
      </div>
      <Footer copyrightName={content.footer.copyrightName} />
    </main>
  );
}
