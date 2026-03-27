'use client';

import { useLivePreview } from '@payloadcms/live-preview-react';
import { HeroSection } from './hero-section';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { ThemeScheduler } from './theme-scheduler';
import { landingPageDefaults } from '@/types/landing-page';
import type { LandingPageData } from '@/types/landing-page';

/**
 * Transforms raw Payload global data into the normalized LandingPageData shape.
 * The useLivePreview hook returns the raw Payload document, so we need to
 * map it the same way the server-side fetcher does.
 */
function normalize(raw: Record<string, unknown>): LandingPageData {
  const hero = raw.hero as Record<string, unknown> | undefined;
  const emailForm = raw.emailForm as Record<string, unknown> | undefined;
  const navbar = raw.navbar as Record<string, unknown> | undefined;
  const footer = raw.footer as Record<string, unknown> | undefined;
  const theme = raw.theme as Record<string, unknown> | undefined;
  const scene = raw.scene as Record<string, unknown> | undefined;

  const heroImage = hero?.heroImage;
  const navLogo = navbar?.logo;

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
    navbar: {
      ctaText: (navbar?.ctaText as string) || landingPageDefaults.navbar.ctaText,
      logo:
        navLogo && typeof navLogo === 'object' && 'url' in (navLogo as Record<string, unknown>)
          ? { url: (navLogo as { url: string }).url, alt: (navLogo as { alt?: string }).alt || 'Logo' }
          : null,
    },
    footer: {
      copyrightName: (footer?.copyrightName as string) || landingPageDefaults.footer.copyrightName,
      links:
        footer?.links && Array.isArray(footer.links) && footer.links.length > 0
          ? (footer.links as Array<{ label?: string; url?: string }>).map((l) => ({
              label: l.label || '',
              url: l.url || '#',
            }))
          : landingPageDefaults.footer.links,
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
  };
}

interface LivePreviewPageProps {
  initialData: LandingPageData;
  serverURL: string;
}

export function LivePreviewPage({ initialData, serverURL }: LivePreviewPageProps) {
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
      <Navbar ctaText={content.navbar.ctaText} logoSrc={content.navbar.logo?.url} />
      <div className="flex-1 flex flex-col">
        <HeroSection hero={content.hero} emailForm={content.emailForm} scene={content.scene} typography={content.typography} dotMatrixCursor={content.cursors.dotMatrixCursor} />
      </div>
      <Footer copyrightName={content.footer.copyrightName} links={content.footer.links} />
    </>
  );
}
