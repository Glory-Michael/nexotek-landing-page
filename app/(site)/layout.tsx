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

// ─── Pre-declare all selectable fonts (required by next/font at build time) ──
//
// next/font requires every font to be instantiated at module top level — we
// can't conditionally pick at runtime. To keep the public site fast while
// preserving the Payload font selector, we declare all 14 here but ONLY
// attach the className for the editor-selected body+display fonts to <body>
// below. The other 12 @font-face rules end up in the CSS but, because no
// rendered element references them, the browser never fetches their woff2.
//
// Always-loaded: Inter (fallback body) + Space Grotesk (fallback display) +
// the NX design-system trio (Geist / JetBrains Mono / Instrument Serif which
// are also wired into --nx-font-* in globals.css).

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap', preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap', preload: false });

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap', preload: false });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta-sans', display: 'swap', preload: false });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap', preload: false });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato', display: 'swap', preload: false });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-roboto', display: 'swap', preload: false });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap', preload: false });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap', preload: false });
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend', display: 'swap', preload: false });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap', preload: false });

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap', preload: false });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap', preload: false });
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-instrument-serif', display: 'swap', preload: false });

const BODY_FONT_OBJECT: Record<string, { variable: string } | undefined> = {
  inter,
  'dm-sans': dmSans,
  'plus-jakarta-sans': plusJakarta,
  nunito,
  lato,
  roboto,
  geist,
};

const DISPLAY_FONT_OBJECT: Record<string, { variable: string } | undefined> = {
  'space-grotesk': spaceGrotesk,
  outfit,
  sora,
  lexend,
  raleway,
  geist,
};

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

  // Resolve which CSS var to alias onto --font-sans and --font-display
  const bodyVar = BODY_FONT_VAR[identity.bodyFont] ?? BODY_FONT_VAR['inter'];
  const displayVar = DISPLAY_FONT_VAR[identity.displayFont] ?? DISPLAY_FONT_VAR['space-grotesk'];

  // Only attach the editor-selected fonts' className to <body>. Unreferenced
  // font @font-face rules stay in the global CSS but their woff2 files never
  // download because nothing in the DOM uses them. The NX design-system trio
  // (Geist / JetBrains Mono / Instrument Serif) is always attached — they're
  // wired into --nx-font-* in globals.css.
  const selectedBodyFont = BODY_FONT_OBJECT[identity.bodyFont] ?? inter;
  const selectedDisplayFont = DISPLAY_FONT_OBJECT[identity.displayFont] ?? spaceGrotesk;
  const fontClasses = [
    selectedBodyFont.variable,
    selectedDisplayFont.variable,
    geist.variable,
    jetbrainsMono.variable,
    instrumentSerif.variable,
  ]
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
    .join(' ');

  // Build an inline style that re-aliases the selected font onto the shared vars
  // that the design system (globals.css / Tailwind font-sans/font-display) reads.
  const fontStyle: React.CSSProperties = {
    ...(bodyVar ? { '--font-sans': `var(${bodyVar})` } as React.CSSProperties : {}),
    ...(displayVar ? { '--font-display': `var(${displayVar})` } as React.CSSProperties : {}),
  };

  return (
    <html
      lang="en"
      className={fontClasses}
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
