import Link from 'next/link';
import Image from 'next/image';
import { EmailForm } from './email-form';
import { BackgroundBeams } from './background-beams';
import { RichTextRenderer } from './rich-text-renderer';
import { HeroScene } from './hero-scene';
import { TegakiHeroTitle } from './tegaki-hero-title'; // dormant — see README
import { StrokeRevealTitle } from './stroke-reveal-title';
import { LeadFormButton } from './lead-form-button';
import { LiveEventTicker } from './live-event-ticker';
import { PointerVars } from './parallax';
import { CommandPalettePeek } from './sections/demos/command-palette-peek';
import { SidebarPeek } from './sections/demos/sidebar-peek';
import type { HeroV2Data, LandingPageData } from '@/types/landing-page';

interface HeroSectionProps {
  hero: LandingPageData['hero'];
  emailForm: LandingPageData['emailForm'];
  scene?: LandingPageData['scene'];
  typography?: LandingPageData['typography'];
  dotMatrixCursor?: boolean;
  handwritingAnimation?: boolean;
  heroV2?: HeroV2Data;
}

const TITLE_SIZES: Record<string, string> = {
  small: 'text-3xl sm:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl',
  default: 'text-4xl sm:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl',
  large: 'text-5xl sm:text-6xl lg:text-6xl xl:text-7xl 2xl:text-8xl',
  xl: 'text-6xl sm:text-7xl lg:text-7xl xl:text-8xl 2xl:text-9xl',
};

const SUBTITLE_SIZES: Record<string, string> = {
  small: 'text-sm sm:text-base lg:text-lg',
  default: 'text-base sm:text-lg lg:text-xl',
  large: 'text-lg sm:text-xl lg:text-2xl',
};

const HEADING_FONTS: Record<string, string> = {
  'space-grotesk': 'font-display',
  inter: 'font-sans',
  system: 'font-[system-ui]',
  serif: 'font-[Georgia,serif]',
  mono: 'font-[JetBrains_Mono,monospace]',
};

const BODY_FONTS: Record<string, string> = {
  inter: 'font-sans',
  system: 'font-[system-ui]',
  serif: 'font-[Georgia,serif]',
};

const TITLE_SPACING: Record<string, string> = {
  tight: 'mb-2 sm:mb-4',
  default: 'mb-4 sm:mb-8',
  relaxed: 'mb-6 sm:mb-12',
};

const CONTENT_PADDING: Record<string, string> = {
  compact: 'px-4 sm:px-8 lg:pl-12 xl:pl-20 lg:pr-8',
  default: 'px-6 sm:px-12 lg:pl-20 xl:pl-32 lg:pr-12',
  spacious: 'px-8 sm:px-16 lg:pl-28 xl:pl-40 lg:pr-16',
};

export function HeroSection({
  hero,
  emailForm,
  scene,
  typography,
  dotMatrixCursor = true,
  handwritingAnimation = false,
  heroV2,
}: HeroSectionProps) {
  const hasRichTitle = hero.title?.root?.children?.length > 0;
  const hasRichBody = hero.body?.root?.children?.length > 0;
  const useV2Headline = (heroV2?.headlineLines?.length ?? 0) > 0;
  const useV2Lead = !!heroV2?.leadSentence;
  const v2HasCtas = !!(heroV2?.primaryCta?.label || heroV2?.secondaryCta?.label);

  const titleSize = TITLE_SIZES[typography?.heroTitleSize || 'default'];
  const subtitleSize = SUBTITLE_SIZES[typography?.subtitleSize || 'default'];
  const headingFont = HEADING_FONTS[typography?.headingFont || 'space-grotesk'] || 'font-display';
  const bodyFont = BODY_FONTS[typography?.bodyFont || 'inter'] || 'font-sans';
  const titleMb = TITLE_SPACING[typography?.titleSpacing || 'default'];
  const contentPx = CONTENT_PADDING[typography?.contentPadding || 'default'];

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      {useV2Headline && (
        <div className="pointer-events-none absolute right-6 z-40 hidden w-[min(380px,calc(100%-3rem))] -top-12 lg:block xl:right-10 xl:-top-16">
          <LiveEventTicker className="rounded-sm border border-black/10 bg-white/65 px-3 py-1.5 text-black/80 backdrop-blur-md dark:border-white/15 dark:bg-black/50 dark:text-white/85" />
        </div>
      )}
      <section className="relative flex-1 min-h-0 flex flex-col lg:flex-row items-stretch justify-center w-full px-0 pt-0 overflow-hidden">
      <PointerVars />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          transform:
            'translate3d(calc(var(--nx-mx, 0) * -8px), calc(var(--nx-my, 0) * -6px), 0)',
          willChange: 'transform',
        }}
      >
        <div className="absolute inset-0 nx-ken-burns">
          <Image
            src={heroV2?.backgroundImage?.url || '/brand/photos/hero-crane-silhouette.jpg'}
            alt=""
            fill
            priority
            className="nx-photo object-cover opacity-[0.18] grayscale dark:opacity-25"
            sizes="100vw"
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white dark:from-black/30 dark:via-black/40 dark:to-black" />
      </div>
      <BackgroundBeams />

      <div
        className="absolute lg:relative inset-0 lg:inset-auto w-full h-full min-h-0 lg:w-[55%] xl:w-[50%] order-2 lg:order-2 opacity-40 lg:opacity-100 overflow-hidden"
        data-hide-cursor="true"
      >
        <HeroScene scene={scene} dotMatrixCursor={dotMatrixCursor} />
      </div>

      {/* HIDDEN: stylized ⌘K command-palette pill. Flip the `false &&` below
          to re-enable. */}
      {false && (
        <CommandPalettePeek className="absolute bottom-8 right-8 z-30 hidden w-[300px] lg:block" />
      )}


      {/* HIDDEN: 1:1 SidebarPeek — clashed visually with the NEXOTEK logo at
          the top-left of the hero. Kept for revert; flip to {true &&} to
          re-enable, then hide the CommandPalettePeek above. */}
      {false && (
        <SidebarPeek className="absolute bottom-10 left-0 z-30 hidden -translate-x-12 lg:block xl:-translate-x-8" />
      )}

      <div className={`relative z-20 w-full lg:w-[45%] xl:w-[50%] min-h-0 flex flex-col items-center justify-center lg:items-start lg:justify-center text-left ${contentPx} py-8 lg:py-0 order-1 lg:order-1 lg:bg-white dark:lg:bg-black`}>
        {heroV2?.eyebrow && (
          <p className="animate-hero-fade-up mb-4 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
            {heroV2.eyebrow}
          </p>
        )}

        {useV2Headline ? (
          heroV2!.headlineLines.length === 2 ? (
            <div
              style={{
                transform:
                  'translate3d(calc(var(--nx-mx, 0) * 4px), calc(var(--nx-my, 0) * 3px), 0)',
                willChange: 'transform',
              }}
            >
              <StrokeRevealTitle
                titleLine1={heroV2!.headlineLines[0]}
                titleLine2={heroV2!.headlineLines[1]}
                titleSizeClass={titleSize}
                titleMbClass={titleMb}
                headingFontClass={headingFont}
              />
            </div>
          ) : (
            <h1
              className={`animate-hero-slide-in w-full max-w-md lg:max-w-none ${titleSize} ${headingFont} font-bold tracking-tighter ${titleMb} leading-[1.05]`}
              style={{
                transform:
                  'translate3d(calc(var(--nx-mx, 0) * 4px), calc(var(--nx-my, 0) * 3px), 0)',
                willChange: 'transform',
              }}
            >
              {heroV2!.headlineLines.map((line, i) => {
                const total = heroV2!.headlineLines.length;
                const isAccent = total > 1 && i === total - 1;
                return isAccent ? (
                  <span
                    key={`hl-${i}`}
                    className="block italic font-serif font-light text-neutral-600 dark:text-neutral-300"
                  >
                    {line}
                  </span>
                ) : (
                  <span
                    key={`hl-${i}`}
                    className="block text-transparent bg-clip-text bg-gradient-to-b from-black to-neutral-700 dark:from-white dark:to-neutral-300"
                  >
                    {line}
                  </span>
                );
              })}
            </h1>
          )
        ) : handwritingAnimation ? (
          <StrokeRevealTitle
            titleLine1={hero.titleLine1 || 'Spatial Risk Intelligence,'}
            titleLine2={hero.titleLine2 || 'Redefined.'}
            titleSizeClass={titleSize}
            titleMbClass={titleMb}
            headingFontClass={headingFont}
          />
        ) : (
          <div
            className={`animate-hero-slide-in w-full max-w-md lg:max-w-none ${titleSize} ${headingFont} font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-black to-neutral-700 dark:from-white dark:to-neutral-300 ${titleMb} leading-[1.1] sm:leading-[1.1]`}
          >
            {hasRichTitle ? (
              <RichTextRenderer content={hero.title} variant="hero-title" accentFont={typography?.accentFont} headingFont={typography?.headingFont} />
            ) : (
              <h2 className="sr-only">
                <span>{hero.titleLine1}</span> <span>{hero.titleLine2}</span>
              </h2>
            )}
            {!hasRichTitle && (
              <p aria-hidden>
                <span>{hero.titleLine1}</span> <br className="hidden sm:block" />
                <span className="italic font-serif text-neutral-600 dark:text-neutral-300 font-light">
                  {hero.titleLine2}
                </span>
              </p>
            )}
          </div>
        )}

        <div className="animate-hero-fade-up w-full max-w-md lg:max-w-none">
          <div className={`text-neutral-800 dark:text-neutral-200 mb-6 sm:mb-8 font-medium ${subtitleSize} ${bodyFont}`}>
            {useV2Lead ? (
              <p>{heroV2!.leadSentence}</p>
            ) : hasRichBody ? (
              <RichTextRenderer content={hero.body} variant="hero-body" />
            ) : (
              <p>{hero.subtitle}</p>
            )}
          </div>
          {v2HasCtas ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {heroV2?.primaryCta?.label &&
                (heroV2.primaryCta.mode === 'leadForm' ? (
                  <LeadFormButton
                    label={heroV2.primaryCta.label}
                    variant="primary-paper"
                  />
                ) : (
                  <Link
                    href={heroV2.primaryCta.href || '#contact'}
                    data-cta-mode={heroV2.primaryCta.mode}
                    className="inline-flex items-center justify-center rounded-nx-button bg-black px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                  >
                    {heroV2.primaryCta.label} →
                  </Link>
                ))}
              {heroV2?.secondaryCta?.label &&
                (heroV2.secondaryCta.mode === 'leadForm' ? (
                  <LeadFormButton
                    label={heroV2.secondaryCta.label}
                    variant="ghost-paper"
                  />
                ) : (
                  <Link
                    href={heroV2.secondaryCta.href || '#contact'}
                    data-cta-mode={heroV2.secondaryCta.mode}
                    className="inline-flex items-center justify-center rounded-nx-button border border-black/30 px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] hover:bg-black hover:text-white dark:border-white/30 dark:hover:bg-white dark:hover:text-black"
                  >
                    {heroV2.secondaryCta.label}
                  </Link>
                ))}
            </div>
          ) : (
            <EmailForm
              placeholder={emailForm.emailPlaceholder}
              buttonText={emailForm.buttonText}
              successMessage={emailForm.successMessage}
              successMessageText={emailForm.successMessageText}
            />
          )}
        </div>
      </div>
      </section>
    </div>
  );
}
