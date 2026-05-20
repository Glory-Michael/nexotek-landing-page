import { HeroSection } from '@/components/hero-section';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { LivePreviewPage } from '@/components/live-preview-page';
import { ClientEffects } from '@/components/client-effects';
import { HeroHeightLock } from '@/components/hero-height-lock';
import { ScrollCenter } from '@/components/scroll-center';
import { SectionsRenderer } from '@/components/sections/sections-renderer';
import {
  StructuredData,
  lexicalToPlainText,
} from '@/components/seo/structured-data';
import { getSiteContext } from '@/lib/site-context';
import { unstable_cache } from 'next/cache';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { landingPageDefaults } from '@/types/landing-page';
import type {
  CtaConfig,
  HeroV2Data,
  LandingPageData,
  SectionBlock,
} from '@/types/landing-page';
import type { Metadata } from 'next';
import { getAlphaConfig } from '@/lib/alpha-features';

function extractCta(raw: unknown): CtaConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (!r.label) return undefined;
  return {
    label: r.label as string,
    mode: ((r.mode as CtaConfig['mode']) || 'href'),
    href: (r.href as string) || undefined,
  };
}

function extractHeroV2(data: unknown): HeroV2Data | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const hv2 = (data as unknown as Record<string, unknown>).heroV2 as
    | Record<string, unknown>
    | undefined;
  if (!hv2) return undefined;
  const linesRaw = hv2.headlineLines;
  const headlineLines = Array.isArray(linesRaw)
    ? (linesRaw as Array<Record<string, unknown>>)
        .map((l) => (l.value as string) || '')
        .filter((s) => s.length > 0)
    : [];
  const eyebrow = (hv2.eyebrow as string) || undefined;
  const leadSentence = (hv2.leadSentence as string) || undefined;
  const primaryCta = extractCta(hv2.primaryCta);
  const secondaryCta = extractCta(hv2.secondaryCta);
  if (
    headlineLines.length === 0 &&
    !eyebrow &&
    !leadSentence &&
    !primaryCta &&
    !secondaryCta
  ) {
    return undefined;
  }
  return { eyebrow, headlineLines, leadSentence, primaryCta, secondaryCta };
}

function extractSections(data: unknown): SectionBlock[] | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const raw = (data as unknown as Record<string, unknown>).sections;
  if (!Array.isArray(raw)) return undefined;
  return raw as SectionBlock[];
}

const getLandingPageData = unstable_cache(
  async (): Promise<LandingPageData> => {
    try {
      const payload = await getPayload({ config });
      const data = await payload.findGlobal({ slug: 'landing-page', draft: false });

      const heroImage = data.hero?.heroImage;
      // SEO plugin stores fields under `meta`
      const meta = (data as unknown as Record<string, unknown>).meta as
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
        seo: {
          metaTitle: meta?.title || landingPageDefaults.seo.metaTitle,
          metaDescription: meta?.description || landingPageDefaults.seo.metaDescription,
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
        effects: {
          handwritingAnimation: (data as Record<string, any>).effects?.handwritingAnimation ?? landingPageDefaults.effects.handwritingAnimation,
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
        heroV2: extractHeroV2(data),
        sections: extractSections(data),
      };
    } catch (err) {
      console.error('Failed to fetch landing page data:', err);
      return landingPageDefaults;
    }
  },
  ['landing-page-data'],
  { revalidate: 60, tags: ['landing-page'] }
);

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
}: Readonly<{
  searchParams: Promise<{ preview?: string; v2?: string }>;
}>) {
  const [content, alphaConfig, site] = await Promise.all([
    getLandingPageData(),
    getAlphaConfig(),
    getSiteContext(),
  ]);
  const { preview, v2 } = await searchParams;
  const isPreview = preview === 'true';
  const isV2Preview = isPreview && v2 === '1';

  const faqItems: Array<{ question: string; answerText: string }> = [];
  for (const section of content.sections ?? []) {
    if (section.blockType !== 'faqBlock') continue;
    for (const item of section.items ?? []) {
      faqItems.push({
        question: item.question,
        answerText: lexicalToPlainText(item.answer),
      });
    }
  }

  const alphaExtraLinks = alphaConfig.features
    .filter((f) => f.showInNav)
    .map((f) => ({ label: f.label, url: f.path }));

  const hasSections = (content.sections?.length ?? 0) > 0;

  const mainClass = hasSections
    ? 'site-main w-full flex flex-col relative bg-white dark:bg-black'
    : 'site-main h-[100dvh] overflow-y-auto w-full flex flex-col relative bg-white dark:bg-black';

  return (
    <main className={mainClass}>
      <StructuredData
        data={{ kind: 'home', faq: faqItems.length > 0 ? faqItems : undefined }}
        site={site}
      />
      {isPreview ? (
        <LivePreviewPage
          initialData={content}
          serverURL={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
          navContent={<Navbar />}
          footerContent={<Footer extraLinks={alphaExtraLinks} />}
          variant={isV2Preview ? 'v2' : 'legacy'}
        />
      ) : (
        <>
          <ScrollCenter />
          <ClientEffects customCursorEnabled={content.cursors.customCursor} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-white to-white dark:from-neutral-900 dark:via-black dark:to-black -z-30" />
          <Navbar />
          {hasSections ? (
            <>
              <HeroHeightLock offsetPx={100} />
              <div className="site-hero-wrapper flex h-[var(--nx-hero-h,calc(100svh_-_100px))] flex-col">
                <HeroSection
                  hero={content.hero}
                  emailForm={content.emailForm}
                  scene={content.scene}
                  typography={content.typography}
                  dotMatrixCursor={content.cursors.dotMatrixCursor}
                  handwritingAnimation={content.effects.handwritingAnimation}
                  heroV2={content.heroV2}
                />
              </div>
              <SectionsRenderer sections={content.sections} />
            </>
          ) : (
            <div className="site-hero-wrapper flex-1 flex flex-col">
              <HeroSection
                hero={content.hero}
                emailForm={content.emailForm}
                scene={content.scene}
                typography={content.typography}
                dotMatrixCursor={content.cursors.dotMatrixCursor}
                handwritingAnimation={content.effects.handwritingAnimation}
                heroV2={content.heroV2}
              />
            </div>
          )}
          <Footer extraLinks={alphaExtraLinks} />
        </>
      )}
    </main>
  );
}
