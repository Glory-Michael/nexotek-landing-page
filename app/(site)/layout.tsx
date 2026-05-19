import type { Metadata, Viewport } from 'next';
import {
  Inter,
  DM_Sans,
  Plus_Jakarta_Sans,
  Nunito,
  Lato,
  Roboto,
  Space_Grotesk,
  Outfit,
  Sora,
  Lexend,
  Raleway,
  Geist,
  JetBrains_Mono,
  Instrument_Serif,
} from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeScheduler } from '@/components/theme-scheduler';
import { SmoothScroll } from '@/components/smooth-scroll';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { siteIdentityDefaults, type SiteIdentityData } from '@/types/landing-page';
import React from 'react';

// ─── Pre-load all selectable fonts (required by next/font at build time) ──────

// Default fonts — preloaded for fast first paint
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' });

// Optional fonts — preload: false so they don't compete with critical resources
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap', preload: false });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta-sans', display: 'swap', preload: false });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap', preload: false });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato', display: 'swap', preload: false });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-roboto', display: 'swap', preload: false });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap', preload: false });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap', preload: false });
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend', display: 'swap', preload: false });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap', preload: false });

// NX design-system fonts — always loaded, wired into --nx-font-* CSS vars in globals.css
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap', preload: false });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap', preload: false });
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-instrument-serif', display: 'swap', preload: false });

// Maps Payload select value → the CSS variable name (without --)
const BODY_FONT_VAR: Record<string, string> = {
  inter: '--font-inter',
  'dm-sans': '--font-dm-sans',
  'plus-jakarta-sans': '--font-plus-jakarta-sans',
  nunito: '--font-nunito',
  lato: '--font-lato',
  roboto: '--font-roboto',
  geist: '--font-geist',
  system: '',
};

const DISPLAY_FONT_VAR: Record<string, string> = {
  'space-grotesk': '--font-space-grotesk',
  outfit: '--font-outfit',
  sora: '--font-sora',
  lexend: '--font-lexend',
  raleway: '--font-raleway',
  geist: '--font-geist',
  system: '',
};

// ─── Fetch site identity from Payload ────────────────────────────────────────

async function getSiteIdentity(): Promise<SiteIdentityData> {
  try {
    const payload = await getPayload({ config });
    const data = await payload.findGlobal({ slug: 'site-identity' });

    const resolveMedia = (field: unknown): { url: string } | null => {
      if (field && typeof field === 'object' && 'url' in field) {
        return { url: (field as { url: string }).url };
      }
      return null;
    };

    return {
      siteName: (data.siteName as string) || siteIdentityDefaults.siteName,
      tagline: (data.tagline as string) || siteIdentityDefaults.tagline,
      metaTitleTemplate: (data.metaTitleTemplate as string) || siteIdentityDefaults.metaTitleTemplate,
      metaDescription: (data.metaDescription as string) || siteIdentityDefaults.metaDescription,
      favicon: resolveMedia(data.favicon),
      appleIcon: resolveMedia(data.appleIcon),
      ogImage: resolveMedia(data.ogImage),
      bodyFont: (data.bodyFont as string) || siteIdentityDefaults.bodyFont,
      displayFont: (data.displayFont as string) || siteIdentityDefaults.displayFont,
      themeMode: ((data.themeMode as string) || siteIdentityDefaults.themeMode) as SiteIdentityData['themeMode'],
      lightStartTime: (data.lightStartTime as string) || siteIdentityDefaults.lightStartTime,
      darkStartTime: (data.darkStartTime as string) || siteIdentityDefaults.darkStartTime,
    };
  } catch {
    return siteIdentityDefaults;
  }
}

// ─── Resolve title from template ─────────────────────────────────────────────

function resolveTitle(template: string, siteName: string, tagline: string): string {
  return template
    .replace('{siteName}', siteName)
    .replace('{tagline}', tagline);
}

// ─── Viewport — prevents iOS Safari auto-zoom on orientation change ──────────
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
};

// ─── generateMetadata (site-wide default, sub-pages can override via SEO plugin) ─

export async function generateMetadata(): Promise<Metadata> {
  const identity = await getSiteIdentity();
  const defaultTitle = resolveTitle(
    identity.metaTitleTemplate,
    identity.siteName,
    identity.tagline,
  );

  return {
    title: {
      default: defaultTitle,
      template: `%s | ${identity.siteName}`,
    },
    description: identity.metaDescription,
    icons: {
      icon: identity.favicon?.url ?? '/logo.svg',
      ...(identity.appleIcon ? { apple: identity.appleIcon.url } : {}),
    },
    openGraph: {
      title: defaultTitle,
      description: identity.metaDescription,
      ...(identity.ogImage ? { images: [identity.ogImage.url] } : {}),
    },
  };
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await getSiteIdentity();

  // Collect all font variable class names (always loaded; only the ones the
  // admin selected will be wired to --font-sans / --font-display)
  const allFontClasses = [
    inter.variable,
    dmSans.variable,
    plusJakarta.variable,
    nunito.variable,
    lato.variable,
    roboto.variable,
    spaceGrotesk.variable,
    outfit.variable,
    sora.variable,
    lexend.variable,
    raleway.variable,
    geist.variable,
    jetbrainsMono.variable,
    instrumentSerif.variable,
  ].join(' ');

  // Resolve which CSS var to alias onto --font-sans and --font-display
  const bodyVar = BODY_FONT_VAR[identity.bodyFont] ?? BODY_FONT_VAR['inter'];
  const displayVar = DISPLAY_FONT_VAR[identity.displayFont] ?? DISPLAY_FONT_VAR['space-grotesk'];

  // Build an inline style that re-aliases the selected font onto the shared vars
  // that the design system (globals.css / Tailwind font-sans/font-display) reads.
  const fontStyle: React.CSSProperties = {
    ...(bodyVar ? { '--font-sans': `var(${bodyVar})` } as React.CSSProperties : {}),
    ...(displayVar ? { '--font-display': `var(${displayVar})` } as React.CSSProperties : {}),
  };

  return (
    <html
      lang="en"
      className={allFontClasses}
      suppressHydrationWarning
    >
      <body
        className="font-sans bg-nx-paper dark:bg-nx-black text-nx-ink dark:text-white antialiased selection:bg-nx-ink selection:text-white dark:selection:bg-white dark:selection:text-nx-ink"
        style={fontStyle}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ThemeScheduler
            mode={identity.themeMode}
            lightStartTime={identity.lightStartTime}
            darkStartTime={identity.darkStartTime}
          />
          <SmoothScroll />
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
