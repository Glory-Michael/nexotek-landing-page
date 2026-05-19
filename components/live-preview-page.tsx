'use client';

import { useLivePreview } from '@payloadcms/live-preview-react';
import { HeroSection } from './hero-section';
import { ThemeScheduler } from './theme-scheduler';
import { SectionsRenderer } from './sections/sections-renderer';
import { landingPageDefaults } from '@/types/landing-page';
import type {
  CtaConfig,
  HeroV2Data,
  LandingPageData,
  SectionBlock,
} from '@/types/landing-page';

/**
 * Transforms raw Payload global data into the normalized LandingPageData shape.
 * The useLivePreview hook returns the raw Payload document, so we need to
 * map it the same way the server-side fetcher does.
 */
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

function extractHeroV2(raw: Record<string, unknown>): HeroV2Data | undefined {
  const hv2 = raw.heroV2 as Record<string, unknown> | undefined;
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

function extractSections(raw: Record<string, unknown>): SectionBlock[] | undefined {
  const sections = raw.sections;
  if (!Array.isArray(sections)) return undefined;
  return sections as SectionBlock[];
}

function normalize(raw: Record<string, unknown>): LandingPageData {
  const hero = raw.hero as Record<string, unknown> | undefined;
  const emailForm = raw.emailForm as Record<string, unknown> | undefined;
  const theme = raw.theme as Record<string, unknown> | undefined;
  const scene = raw.scene as Record<string, unknown> | undefined;

  const heroImage = hero?.heroImage;

  return {
    hero: {
      title: hero?.title || undefined,
      body: hero?.body || undefined,
      titleLine1: (hero?.titleLine1 as string) || landingPageDefaults.hero.titleLine1,
      titleLine2: (hero?.titleLine2 as string) || landingPageDefaults.hero.titleLine2,
      subtitle: landingPageDefaults.hero.subtitle,
      heroImage:
        heroImage && typeof heroImage === 'object' && 'url' in (heroImage as Record<string, unknown>)
          ? { url: (heroImage as { url: string }).url, alt: (heroImage as { alt?: string }).alt || '' }
          : null,
    },
    emailForm: {
      emailPlaceholder: (emailForm?.emailPlaceholder as string) || landingPageDefaults.emailForm.emailPlaceholder,
      buttonText: (emailForm?.buttonText as string) || landingPageDefaults.emailForm.buttonText,
      successMessage: emailForm?.successMessage || undefined,
      successMessageText: landingPageDefaults.emailForm.successMessageText,
    },
      seo: landingPageDefaults.seo,
    theme: {
      mode: (theme?.mode as LandingPageData['theme']['mode']) || landingPageDefaults.theme.mode,
      lightStartTime: (theme?.lightStartTime as string) || landingPageDefaults.theme.lightStartTime,
      darkStartTime: (theme?.darkStartTime as string) || landingPageDefaults.theme.darkStartTime,
    },
    scene: {
      customModelUrl: (() => {
        const m = scene?.customModel;
        return m && typeof m === 'object' && 'url' in (m as Record<string, unknown>) ? (m as { url: string }).url : null;
      })(),
      modelScale: (scene?.modelScale as number) ?? landingPageDefaults.scene.modelScale,
      autoRotate: (scene?.autoRotate as boolean) ?? landingPageDefaults.scene.autoRotate,
      rotationSpeed: (scene?.rotationSpeed as number) ?? landingPageDefaults.scene.rotationSpeed,
      backgroundColor: (scene?.backgroundColor as string) || null,
      pointSize: (scene?.pointSize as number) ?? landingPageDefaults.scene.pointSize,
      accentColor: (scene?.accentColor as string) || landingPageDefaults.scene.accentColor,
    },
    effects: {
      handwritingAnimation: (raw as Record<string, any>).effects?.handwritingAnimation as boolean ?? landingPageDefaults.effects.handwritingAnimation,
    },
    cursors: {
      customCursor: (raw.cursors as Record<string, unknown>)?.customCursor as boolean ?? landingPageDefaults.cursors.customCursor,
      dotMatrixCursor: (raw.cursors as Record<string, unknown>)?.dotMatrixCursor as boolean ?? landingPageDefaults.cursors.dotMatrixCursor,
    },
    typography: {
      headingFont: (raw.typography as Record<string, unknown>)?.headingFont as string || landingPageDefaults.typography.headingFont,
      accentFont: (raw.typography as Record<string, unknown>)?.accentFont as string || landingPageDefaults.typography.accentFont,
      bodyFont: (raw.typography as Record<string, unknown>)?.bodyFont as string || landingPageDefaults.typography.bodyFont,
      heroTitleSize: (raw.typography as Record<string, unknown>)?.heroTitleSize as string || landingPageDefaults.typography.heroTitleSize,
      subtitleSize: (raw.typography as Record<string, unknown>)?.subtitleSize as string || landingPageDefaults.typography.subtitleSize,
      titleSpacing: (raw.typography as Record<string, unknown>)?.titleSpacing as string || landingPageDefaults.typography.titleSpacing,
      contentPadding: (raw.typography as Record<string, unknown>)?.contentPadding as string || landingPageDefaults.typography.contentPadding,
    },
    heroV2: extractHeroV2(raw),
    sections: extractSections(raw),
  };
}

interface LivePreviewPageProps {
  initialData: LandingPageData;
  serverURL: string;
  navContent: React.ReactNode;
  footerContent: React.ReactNode;
  variant?: 'legacy' | 'v2';
}

export function LivePreviewPage({ initialData, serverURL, navContent, footerContent, variant = 'legacy' }: Readonly<LivePreviewPageProps>) {
  const { data: rawData, isLoading } = useLivePreview<Record<string, unknown>>({
    initialData: {} as Record<string, unknown>,
    serverURL,
    depth: 2,
  });

  // Use live data if available, otherwise fall back to server-rendered initial data
  const hasLiveData = rawData && Object.keys(rawData).length > 0;
  const content = hasLiveData && !isLoading ? normalize(rawData) : initialData;

  return (
    <>
      <ThemeScheduler
        mode={content.theme.mode}
        lightStartTime={content.theme.lightStartTime}
        darkStartTime={content.theme.darkStartTime}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-white to-white dark:from-neutral-900 dark:via-black dark:to-black -z-30 transition-colors duration-500" />
      {navContent}
      {variant === 'v2' ? (
        <>
          <div className="site-hero-wrapper flex h-[calc(100dvh_-_100px)] flex-col">
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
        <div className="flex-1 flex flex-col">
          <HeroSection hero={content.hero} emailForm={content.emailForm} scene={content.scene} typography={content.typography} dotMatrixCursor={content.cursors.dotMatrixCursor} />
        </div>
      )}
      {footerContent}
    </>
  );
}
