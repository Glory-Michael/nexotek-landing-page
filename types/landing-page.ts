// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RichTextContent = any; // Lexical JSON

export interface LandingPageData {
  hero: {
    title?: RichTextContent;
    body?: RichTextContent;
    // Plain text fallbacks for backwards compatibility
    titleLine1?: string;
    titleLine2?: string;
    subtitle?: string;
    heroImage?: { url: string; alt: string } | null;
  };
  emailForm: {
    emailPlaceholder: string;
    buttonText: string;
    successMessage?: RichTextContent;
    termsText?: RichTextContent;
    // Plain text fallbacks
    successMessageText?: string;
  };
  navbar: {
    ctaText: string;
    logo?: { url: string; alt: string } | null;
  };
  footer: {
    copyrightName: string;
    links: Array<{ label: string; url: string }>;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage?: { url: string } | null;
  };
  theme: {
    mode: 'light' | 'dark' | 'system' | 'scheduled';
    lightStartTime: string;
    darkStartTime: string;
  };
  scene: {
    customModelUrl?: string | null;
    modelScale: number;
    autoRotate: boolean;
    rotationSpeed: number;
    backgroundColor?: string | null;
    pointSize: number;
    accentColor: string;
  };
  typography: {
    headingFont: string;
    accentFont: string;
    bodyFont: string;
    heroTitleSize: string;
    subtitleSize: string;
    titleSpacing: string;
    contentPadding: string;
  };
}

export const landingPageDefaults: LandingPageData = {
  hero: {
    titleLine1: 'Spatial Risk Intelligence,',
    titleLine2: 'Redefined.',
    subtitle:
      'Nexotek is building the next generation of enterprise spatial risk management systems. Join the waitlist to secure your spot for our upcoming launch.',
  },
  emailForm: {
    emailPlaceholder: 'Enter your email address...',
    buttonText: 'Join',
    successMessageText: "You're on the list. We'll be in touch.",
  },
  navbar: {
    ctaText: 'Get Updates',
  },
  footer: {
    copyrightName: 'Nexotek.ai',
    links: [
      { label: 'Privacy Policy', url: '/privacy' },
      { label: 'Terms of Service', url: '/terms' },
    ],
  },
  seo: {
    metaTitle: 'NexoTek — Spatial Risk Intelligence, Redefined',
    metaDescription:
      'NexoTek is building the next generation of enterprise spatial risk management systems.',
  },
  theme: {
    mode: 'light',
    lightStartTime: '06:00',
    darkStartTime: '18:00',
  },
  scene: {
    customModelUrl: null,
    modelScale: 1,
    autoRotate: true,
    rotationSpeed: 0.5,
    backgroundColor: null,
    pointSize: 3.5,
    accentColor: '#00c8ff',
  },
  typography: {
    headingFont: 'space-grotesk',
    accentFont: 'serif',
    bodyFont: 'inter',
    heroTitleSize: 'default',
    subtitleSize: 'default',
    titleSpacing: 'default',
    contentPadding: 'default',
  },
};
