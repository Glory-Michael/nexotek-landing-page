import { EmailForm } from './email-form';
import { BackgroundBeams } from './background-beams';
import { RichTextRenderer } from './rich-text-renderer';
import { HeroScene } from './hero-scene';
import { TegakiHeroTitle } from './tegaki-hero-title'; // dormant — see README
import { StrokeRevealTitle } from './stroke-reveal-title';
import type { LandingPageData } from '@/types/landing-page';

interface HeroSectionProps {
  hero: LandingPageData['hero'];
  emailForm: LandingPageData['emailForm'];
  scene?: LandingPageData['scene'];
  typography?: LandingPageData['typography'];
  dotMatrixCursor?: boolean;
  handwritingAnimation?: boolean;
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
}: HeroSectionProps) {
  const hasRichTitle = hero.title?.root?.children?.length > 0;
  const hasRichBody = hero.body?.root?.children?.length > 0;

  const titleSize = TITLE_SIZES[typography?.heroTitleSize || 'default'];
  const subtitleSize = SUBTITLE_SIZES[typography?.subtitleSize || 'default'];
  const headingFont = HEADING_FONTS[typography?.headingFont || 'space-grotesk'] || 'font-display';
  const bodyFont = BODY_FONTS[typography?.bodyFont || 'inter'] || 'font-sans';
  const titleMb = TITLE_SPACING[typography?.titleSpacing || 'default'];
  const contentPx = CONTENT_PADDING[typography?.contentPadding || 'default'];

  return (
    <section className="relative flex-1 min-h-0 flex flex-col lg:flex-row items-stretch justify-center w-full px-0 pt-0 overflow-hidden">
      <BackgroundBeams />

      <div
        className="absolute lg:relative inset-0 lg:inset-auto w-full h-full min-h-0 lg:w-[55%] xl:w-[50%] order-2 lg:order-2 opacity-40 lg:opacity-100 overflow-hidden"
        data-hide-cursor="true"
      >
        <HeroScene scene={scene} dotMatrixCursor={dotMatrixCursor} />
      </div>

      <div className={`relative z-20 w-full lg:w-[45%] xl:w-[50%] min-h-0 flex flex-col items-center justify-center lg:items-start lg:justify-center text-left ${contentPx} py-8 lg:py-0 order-1 lg:order-1`}>
        {handwritingAnimation ? (
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
              <h1>
                <span>{hero.titleLine1}</span> <br className="hidden sm:block" />
                <span className="italic font-serif text-neutral-600 dark:text-neutral-300 font-light">
                  {hero.titleLine2}
                </span>
              </h1>
            )}
          </div>
        )}

        <div className="animate-hero-fade-up w-full max-w-md lg:max-w-none">
          <div className={`text-neutral-800 dark:text-neutral-200 mb-6 sm:mb-8 font-medium ${subtitleSize} ${bodyFont}`}>
            {hasRichBody ? (
              <RichTextRenderer content={hero.body} variant="hero-body" />
            ) : (
              <p>{hero.subtitle}</p>
            )}
          </div>
          <EmailForm
            placeholder={emailForm.emailPlaceholder}
            buttonText={emailForm.buttonText}
            successMessage={emailForm.successMessage}
            successMessageText={emailForm.successMessageText}
          />
        </div>
      </div>
    </section>
  );
}
