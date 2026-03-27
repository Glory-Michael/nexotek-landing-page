import { HeroSection } from '@/components/hero-section';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { CustomCursor } from '@/components/custom-cursor';
import { LivePreviewPage } from '@/components/live-preview-page';
import { ThemeScheduler } from '@/components/theme-scheduler';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { landingPageDefaults } from '@/types/landing-page';
import type { LandingPageData } from '@/types/landing-page';
import type { Metadata } from 'next';

async function getLandingPageData(): Promise<LandingPageData> {
  try {
    const payload = await getPayload({ config });
    const data = await payload.findGlobal({ slug: 'landing-page', draft: false });

    const heroImage = data.hero?.heroImage;
    const navLogo = data.navbar?.logo;
    // SEO plugin stores fields under `meta`
    const meta = (data as Record<string, unknown>).meta as
      | { title?: string; description?: string; image?: unknown }
      | undefined;

    return {
      hero: {
        title: data.hero?.title || undefined,
        body: data.hero?.body || undefined,
        // Backwards compat: old plain text fields
        titleLine1: (data.hero as Record<string, unknown>)?.titleLine1 as string || landingPageDefaults.hero.titleLine1,
        titleLine2: (data.hero as Record<string, unknown>)?.titleLine2 as string || landingPageDefaults.hero.titleLine2,
        subtitle: landingPageDefaults.hero.subtitle,
        heroImage:
          heroImage && typeof heroImage === 'object' && 'url' in heroImage
            ? { url: heroImage.url as string, alt: (heroImage as { alt?: string }).alt || '' }
            : null,
      },
      emailForm: {
        emailPlaceholder: data.emailForm?.emailPlaceholder || landingPageDefaults.emailForm.emailPlaceholder,
        buttonText: data.emailForm?.buttonText || landingPageDefaults.emailForm.buttonText,
        successMessage: data.emailForm?.successMessage || undefined,
        successMessageText: landingPageDefaults.emailForm.successMessageText,
      },
      navbar: {
        ctaText: data.navbar?.ctaText || landingPageDefaults.navbar.ctaText,
        logo:
          navLogo && typeof navLogo === 'object' && 'url' in navLogo
            ? { url: navLogo.url as string, alt: (navLogo as { alt?: string }).alt || 'Logo' }
            : null,
      },
      footer: {
        copyrightName: data.footer?.copyrightName || landingPageDefaults.footer.copyrightName,
        links:
          data.footer?.links && Array.isArray(data.footer.links) && data.footer.links.length > 0
            ? data.footer.links.map((link: { label?: string; url?: string }) => ({
                label: link.label || '',
                url: link.url || '#',
              }))
            : landingPageDefaults.footer.links,
      },
      seo: {
        metaTitle: (meta?.title as string) || landingPageDefaults.seo.metaTitle,
        metaDescription: (meta?.description as string) || landingPageDefaults.seo.metaDescription,
        ogImage:
          meta?.image && typeof meta.image === 'object' && 'url' in (meta.image as Record<string, unknown>)
            ? { url: (meta.image as { url: string }).url }
            : null,
      },
      theme: {
        mode: (data.theme?.mode as LandingPageData['theme']['mode']) || landingPageDefaults.theme.mode,
        lightStartTime: data.theme?.lightStartTime || landingPageDefaults.theme.lightStartTime,
        darkStartTime: data.theme?.darkStartTime || landingPageDefaults.theme.darkStartTime,
      },
      scene: {
        customModelUrl: (() => {
          const m = data.scene?.customModel;
          return m && typeof m === 'object' && 'url' in m ? (m.url as string) : null;
        })(),
        modelScale: data.scene?.modelScale ?? landingPageDefaults.scene.modelScale,
        autoRotate: data.scene?.autoRotate ?? landingPageDefaults.scene.autoRotate,
        rotationSpeed: data.scene?.rotationSpeed ?? landingPageDefaults.scene.rotationSpeed,
        backgroundColor: data.scene?.backgroundColor || null,
        pointSize: data.scene?.pointSize ?? landingPageDefaults.scene.pointSize,
        accentColor: data.scene?.accentColor || landingPageDefaults.scene.accentColor,
      },
      cursors: {
        customCursor: data.cursors?.customCursor ?? landingPageDefaults.cursors.customCursor,
        dotMatrixCursor: data.cursors?.dotMatrixCursor ?? landingPageDefaults.cursors.dotMatrixCursor,
      },
      typography: {
        headingFont: data.typography?.headingFont || landingPageDefaults.typography.headingFont,
        accentFont: data.typography?.accentFont || landingPageDefaults.typography.accentFont,
        bodyFont: data.typography?.bodyFont || landingPageDefaults.typography.bodyFont,
        heroTitleSize: data.typography?.heroTitleSize || landingPageDefaults.typography.heroTitleSize,
        subtitleSize: data.typography?.subtitleSize || landingPageDefaults.typography.subtitleSize,
        titleSpacing: data.typography?.titleSpacing || landingPageDefaults.typography.titleSpacing,
        contentPadding: data.typography?.contentPadding || landingPageDefaults.typography.contentPadding,
      },
    };
  } catch (err) {
    console.error('Failed to fetch landing page data:', err);
    return landingPageDefaults;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getLandingPageData();
  return {
    title: content.seo.metaTitle,
    description: content.seo.metaDescription,
    openGraph: {
      title: content.seo.metaTitle,
      description: content.seo.metaDescription,
      ...(content.seo.ogImage ? { images: [content.seo.ogImage.url] } : {}),
    },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const content = await getLandingPageData();
  const { preview } = await searchParams;
  const isPreview = preview === 'true';

  return (
    <main className="min-h-[100dvh] md:min-h-[600px] lg:min-h-[100dvh] w-full flex flex-col relative bg-white dark:bg-black transition-colors duration-500">
      {isPreview ? (
        <LivePreviewPage
          initialData={content}
          serverURL={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
        />
      ) : (
        <>
          <CustomCursor enabled={content.cursors.customCursor} />
          <ThemeScheduler
            mode={content.theme.mode}
            lightStartTime={content.theme.lightStartTime}
            darkStartTime={content.theme.darkStartTime}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-white to-white dark:from-neutral-900 dark:via-black dark:to-black -z-30 transition-colors duration-500" />
          <Navbar ctaText={content.navbar.ctaText} logoSrc={content.navbar.logo?.url} />
          <div className="flex-1 flex flex-col">
            <HeroSection hero={content.hero} emailForm={content.emailForm} scene={content.scene} typography={content.typography} dotMatrixCursor={content.cursors.dotMatrixCursor} />
          </div>
          <Footer copyrightName={content.footer.copyrightName} links={content.footer.links} />
        </>
      )}
    </main>
  );
}
