export interface LandingPageData {
  hero: {
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    emailPlaceholder: string;
    buttonText: string;
    successMessage: string;
  };
  navbar: {
    ctaText: string;
  };
  footer: {
    copyrightName: string;
  };
}

export const landingPageDefaults: LandingPageData = {
  hero: {
    titleLine1: 'Spatial Risk Intelligence,',
    titleLine2: 'Redefined.',
    subtitle:
      'Nexotek is building the next generation of enterprise spatial risk management systems. Join the waitlist to secure your spot for our upcoming launch.',
    emailPlaceholder: 'Enter your email address...',
    buttonText: 'Join',
    successMessage: "You're on the list. We'll be in touch.",
  },
  navbar: {
    ctaText: 'Get Updates',
  },
  footer: {
    copyrightName: 'Nexotek.ai',
  },
};
