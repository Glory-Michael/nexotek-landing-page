export interface LandingPageData {
  hero: {
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    heroImage?: { url: string; alt: string } | null;
  };
  emailForm: {
    emailPlaceholder: string;
    buttonText: string;
    successMessage: string;
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
    successMessage: "You're on the list. We'll be in touch.",
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
};
