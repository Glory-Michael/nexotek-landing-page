// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RichTextContent = any; // Lexical JSON

export type CtaMode = 'leadForm' | 'href' | 'emailForm';

export interface CtaConfig {
  label: string;
  mode: CtaMode;
  href?: string;
}

export interface HeroV2Data {
  eyebrow?: string;
  headlineLines: string[];
  leadSentence?: string;
  primaryCta?: CtaConfig;
  secondaryCta?: CtaConfig;
  backgroundImage?: MediaRef | null;
}

export interface MediaRef {
  url: string;
  alt?: string;
  mimeType?: string;
}

// Section block payloads — each entry is a Payload `blocks` field item, discriminated by `blockType`.
export interface SectionBlockBase {
  id?: string;
  blockType: string;
  anchorId?: string;
  leadSentence?: string;
}

export interface TrustStripSection extends SectionBlockBase {
  blockType: 'trustStripBlock';
  items?: Array<{ label: string; sublabel?: string; icon?: string }>;
}

export interface LoopDiagramNode {
  index: string;
  label: string;
  icon?: string;
  tagline?: string;
  body?: RichTextContent;
  anchorLink?: string;
  status?: 'current' | 'roadmap';
  statusLabel?: string;
}

export interface LoopDiagramSection extends SectionBlockBase {
  blockType: 'loopDiagramBlock';
  eyebrow?: string;
  title?: string;
  body?: RichTextContent;
  nodes?: LoopDiagramNode[];
  revealMode?: 'pinnedSequence' | 'viewportTracked' | 'foldedList';
  pinDistancePerNodeVh?: number;
  packetMotion?: 'none' | 'between-rows' | 'inside-row';
  showPhaseReadout?: boolean;
  loopRing?: {
    enabled?: boolean;
    position?: 'right' | 'left' | 'inline';
    size?: number;
    revolutionMs?: number;
    showCycleCounter?: boolean;
    startingCycle?: number;
    autonomousTickWhileVisible?: boolean;
  };
  closureBeat?: {
    enabled?: boolean;
    durationMs?: number;
    easing?: string;
    incrementCycleCounter?: boolean;
  };
  sash?: {
    enabled?: boolean;
    scope?: 'next-section' | 'rest-of-page';
    text?: string;
  };
  testimonial?: {
    enabled?: boolean;
    eyebrow?: string;
    quote?: string;
    attributionName?: string;
    attributionRole?: string;
    attributionInitials?: string;
  };
}

export interface PlatformShowcaseCopy {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  leadSentence?: string;
  visionCaption?: string;
  spatialCaption?: string;
  flowSteps?: Array<{ value: string }>;
  screenDeck?: DemoToggle;
  spatialStudio?: DemoToggle;
}

export interface DemoToggle {
  enabled?: boolean;
  altText?: string;
}

export interface CompanionCopy {
  eyebrow?: string;
  headlineLine1?: string;
  headlineLine2?: string;
  leadSentence?: string;
  // Optional. Used only by whoWeServeBlock.companion to label the mobile
  // tab control on ShowcaseFlip ("Operator surface"). Other consumers of
  // CompanionCopy ignore these.
  queueTabLabel?: string;
  dashboardTabLabel?: string;
}

export interface ThreadSection extends SectionBlockBase {
  blockType: 'threadBlock';
  variant: 'vision' | 'spatial' | 'train';
  productName?: string;
  tagline?: string;
  body?: RichTextContent;
  bullets?: Array<{ value: string }>;
  mediaType?: 'image' | 'video' | 'lottie';
  mediaRef?: MediaRef | null;
  chips?: Array<{ value: string }>;
  ctaLabel?: string;
  ctaHref?: string;
  subItems?: Array<{ title: string; body?: RichTextContent; icon?: string }>;
  demoMode?: 'none' | 'detection-grid' | 'before-after' | 'splat-viewer' | 'training-quiz';
  comparisonAssets?: { beforeImage?: MediaRef | null; afterImage?: MediaRef | null };
  splatUrl?: string;
  companion?: CompanionCopy;
  // Spatial variant only — drives the auto-rendered Platform diptych
  // (operator console + reconstruction studio) that follows the section.
  platformShowcase?: PlatformShowcaseCopy;
  // Per-variant demo toggles + alt text. Admin-only conditional visibility.
  visionDemos?: {
    cameraGrid?: DemoToggle;
    operatorCli?: DemoToggle;
    floorplan?: DemoToggle;
  };
  spatialDemos?: {
    spatialPeek?: DemoToggle;
    liveView?: DemoToggle;
  };
}

export interface CredentialSection extends SectionBlockBase {
  blockType: 'credentialBlock';
  eyebrow?: string;
  title?: string;
  body?: RichTextContent;
  badges?: Array<{ label: string; sub?: string; icon?: string }>;
  stats?: Array<{ value: string; label: string }>;
  disclaimer?: string;
}

export interface ComparisonSection extends SectionBlockBase {
  blockType: 'comparisonBlock';
  title?: string;
  columns?: Array<{ name: string; isUs?: boolean }>;
  rows?: Array<{
    label: string;
    cells?: Array<{ value: string }>;
    detail?: string;
  }>;
  showNamedCompetitorsPublicly?: boolean;
}

export interface WhoWeServeSection extends SectionBlockBase {
  blockType: 'whoWeServeBlock';
  demos?: {
    showcaseFlip?: DemoToggle;
  };
  tabs?: Array<{
    key: string;
    label: string;
    eyebrow?: string;
    title: string;
    body?: RichTextContent;
    photo?: MediaRef | null;
    ctaLabel?: string;
    ctaHref?: string;
    accentTokenPair?: string;
  }>;
  companion?: CompanionCopy;
}

export interface ProofGridSection extends SectionBlockBase {
  blockType: 'proofGridBlock';
  tiles?: Array<{
    headline: string;
    sub?: string;
    footnote?: string;
    citationSource?: string;
    citationDetail?: string;
  }>;
}

export interface FaqSection extends SectionBlockBase {
  blockType: 'faqBlock';
  eyebrow?: string;
  title?: string;
  items?: Array<{ question: string; answer: RichTextContent; linkAnchor?: string }>;
}

export interface ContactCtaSection extends SectionBlockBase {
  blockType: 'contactCtaBlock';
  eyebrow?: string;
  title?: string;
  body?: RichTextContent;
  primaryCta?: CtaConfig;
  secondaryCta?: CtaConfig;
  trustRow?: Array<{ value: string }>;
  partners?: Array<{
    name: string;
    category: string;
    kind: 'real' | 'placeholder';
    logo?: MediaRef | null;
  }>;
}

export type SectionBlock =
  | TrustStripSection
  | LoopDiagramSection
  | ThreadSection
  | CredentialSection
  | ComparisonSection
  | WhoWeServeSection
  | ProofGridSection
  | FaqSection
  | ContactCtaSection;

export interface FooterData {
  closingLine?: string;
  closingCta?: CtaConfig;
  columns?: Array<{
    heading: string;
    links?: Array<{ label: string; href: string; openInNewTab?: boolean }>;
  }>;
  social?: Array<{ label: string; href: string }>;
  complianceBadges?: Array<{ label: string; sub?: string }>;
  legalLine?: string;
  wordmark?: MediaRef | null;
}

export const footerDefaults: FooterData = {
  closingLine: undefined,
  legalLine: `© ${new Date().getFullYear()} Nexotek Inc. All rights reserved.`,
  columns: [],
  social: [],
  complianceBadges: [],
};

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
  effects: {
    handwritingAnimation: boolean;
  };
  cursors: {
    customCursor: boolean;
    dotMatrixCursor: boolean;
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
  heroV2?: HeroV2Data;
  sections?: SectionBlock[];
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
  effects: {
    handwritingAnimation: false,
  },
  cursors: {
    customCursor: true,
    dotMatrixCursor: true,
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

export interface SiteIdentityData {
  siteName: string;
  tagline: string;
  metaTitleTemplate: string;
  metaDescription: string;
  favicon?: { url: string } | null;
  appleIcon?: { url: string } | null;
  ogImage?: { url: string } | null;
  bodyFont: string;
  displayFont: string;
  themeMode: 'light' | 'dark' | 'system' | 'scheduled';
  lightStartTime: string;
  darkStartTime: string;
}

export const siteIdentityDefaults: SiteIdentityData = {
  siteName: 'Nexotek',
  tagline: 'The Future of Spatial Intelligence',
  metaTitleTemplate: '{siteName} | {tagline}',
  metaDescription:
    'Nexotek is building the next generation of Spatial Intelligence. Sign up for updates.',
  favicon: null,
  appleIcon: null,
  ogImage: null,
  bodyFont: 'inter',
  displayFont: 'space-grotesk',
  themeMode: 'light',
  lightStartTime: '06:00',
  darkStartTime: '18:00',
};

export interface NavigationData {
  ctaText: string;
  logoSrc: string;
  copyrightName: string;
  links: Array<{ label: string; url: string }>;
  navLinks?: Array<{
    label: string;
    href: string;
    anchorId?: string;
    openInNewTab?: boolean;
    mobileOnly?: boolean;
  }>;
  primaryCta?: CtaConfig;
  showStatusChip?: boolean;
}

export const navigationDefaults: NavigationData = {
  ctaText: 'Get Updates',
  logoSrc: '/logo.svg',
  copyrightName: 'Nexotek.ai',
  links: [
    { label: 'Newsroom',         url: '/newsroom' },
    { label: 'Privacy Policy',   url: '/privacy' },
    { label: 'Terms of Service', url: '/terms' },
  ],
  navLinks: [],
  showStatusChip: false,
};
