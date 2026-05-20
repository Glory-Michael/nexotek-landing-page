'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChapterHeader } from './chapter-header';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import { PointerVars, ScrollParallax } from '@/components/parallax';
import { DashboardStatsOverlay } from '@/components/sections/demos/dashboard-stats-overlay';
import { DashboardPeek } from '@/components/sections/demos/dashboard-peek';
import type { WhoWeServeSection } from '@/types/landing-page';

// Per-tab full-bleed environmental photo. Falls back to the bundled
// per-key photos when admin hasn't uploaded a custom `photo` for a tab.
const FALLBACK_TAB_IMAGES: Record<string, { src: string; alt: string }> = {
  construction: {
    src: '/brand/photos/construction-crane.jpg',
    alt: 'Tower crane against deep blue sky on an active construction site',
  },
  habitation: {
    src: '/brand/photos/habitation-interior.jpg',
    alt: 'Modern multi-family residential atrium with stacked balconies under warm interior light',
  },
};

export function WhoWeServe({ block }: { block: WhoWeServeSection }) {
  const tabs = block.tabs ?? [];
  const [active, setActive] = useState<string>(tabs[0]?.key ?? '');

  if (tabs.length === 0) return null;
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];
  // Editor-uploaded photo wins; else fall back to the bundled per-key image.
  const fallback = FALLBACK_TAB_IMAGES[activeTab.key];
  const media = activeTab.photo?.url
    ? {
        src: activeTab.photo.url,
        alt: activeTab.photo.alt || fallback?.alt || activeTab.title,
      }
    : fallback;
  const id = (block.anchorId ?? '#who-we-serve').replace(/^#/, '');

  return (
    <section
      id={id}
      className="nx-section-chapter relative w-full min-h-[calc(var(--nx-svh,100vh)*0.88)] bg-black text-white scroll-mt-24 md:scroll-mt-0 overflow-hidden"
    >
      <PointerVars />
      <ScrollParallax intensity={80} />
      <div aria-hidden className="absolute inset-0 h-full w-full overflow-hidden">
        {media && (
          <div
            className="absolute inset-0"
            style={{
              transform:
                'translate3d(calc(var(--nx-mx, 0) * -10px), calc(var(--nx-sy, 0px) + var(--nx-my, 0) * -8px), 0) scale(1.06)',
              willChange: 'transform',
            }}
          >
            <Image
              key={media.src}
              src={media.src}
              alt=""
              fill
              className="nx-photo object-cover transition-opacity duration-700"
              sizes="100vw"
              unoptimized
              priority
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/65 to-black/15" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 to-transparent" />
      </div>

      {/* Content over the photo */}
      <div className="relative z-10 mx-auto flex min-h-[calc(var(--nx-svh,100vh)*0.88)] max-w-7xl flex-col px-6 py-20 md:px-12 md:py-28">
        <ChapterHeader
          eyebrow="Who we serve"
          title="Where the loop runs."
          leadSentence={block.leadSentence}
          onInk
        />

        {/* Tabs */}
        <div
          role="tablist"
          className="mb-12 flex w-fit max-w-full flex-wrap gap-2 border-b-2 border-white/60"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={tab.key === activeTab.key}
              onClick={() => setActive(tab.key)}
              className={`px-4 py-3 font-mono text-xs uppercase tracking-[0.24em] transition-colors ${
                tab.key === activeTab.key
                  ? 'border-b-2 border-white text-white'
                  : 'text-white/45 hover:text-white/85'
              }`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          key={activeTab.key}
          className="flex max-w-xl flex-col"
        >
          {activeTab.eyebrow && (
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-white/55">
              {activeTab.eyebrow}
            </p>
          )}
          <h3 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
            {activeTab.title}
          </h3>
          {activeTab.body && (
            <div className="mt-6">
              <RichTextRenderer content={activeTab.body} variant="default" onInk />
            </div>
          )}
          {activeTab.ctaLabel && activeTab.ctaHref && (
            <a
              href={activeTab.ctaHref}
              className="mt-8 inline-flex w-fit items-center rounded-nx-button border-2 border-white px-5 py-3 font-mono text-xs uppercase tracking-[0.24em] hover:bg-white hover:text-black"
            >
              {activeTab.ctaLabel}
            </a>
          )}
        </div>

        {/* PREVIOUS (HIDDEN — kept for fallback): stylized stats overlay.
            To revert, comment out the DashboardPeek below and uncomment this. */}
        {false && (
          <DashboardStatsOverlay
            key={activeTab.key}
            industryKey={activeTab.key}
            className="absolute right-6 top-1/2 hidden w-[320px] -translate-y-1/2 lg:block xl:right-12"
          />
        )}

        {/* HIDDEN: 1:1 camect DashboardView corner peek. Moved into the new
            combined ShowcaseFlip section where it pairs with the AlertQueue
            mockup in a single scroll-driven flip showcase. To restore, swap
            `{false &&` for `{true &&`. */}
        {false && (
          <DashboardPeek
            key={`peek-${activeTab.key}`}
            industryKey={activeTab.key}
            className="absolute bottom-24 right-4 z-20 hidden w-[440px] lg:block xl:right-8"
          />
        )}

        <footer className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-12 font-mono text-[10px] uppercase tracking-[0.24em] font-medium text-white/85">
          <span>
            <span className="text-white/55">ENVIRONMENT · </span>
            {activeTab.label}
          </span>
          <span>NX · OBSERVED</span>
        </footer>
      </div>
    </section>
  );
}
