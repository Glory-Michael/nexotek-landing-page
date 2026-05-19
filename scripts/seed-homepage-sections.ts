/**
 * Seed the LandingPage global with:
 *   - heroV2 (eyebrow, headlineLines, leadSentence, primaryCta='TALK TO OUR TEAM' leadForm)
 *   - sections array of all 10 section blocks in plan-spec order:
 *       Trust → Loop (with Converge fold 4 marked roadmap) → Vision Thread →
 *       Spatial Thread → Credential (Training) → Comparison → Who We Serve →
 *       Proof Grid → FAQ → Contact CTA
 *
 * Content follows Phase 0 sign-offs:
 *   - 99% false-alert metric HIDDEN until validated
 *   - Insurance "active partnership conversations" only in proof; Why table keeps "active"
 *   - Competitor framing: "Nexotek vs. detection-only" (no names)
 *   - Customer logos hidden
 *   - Convergence Layer = ROADMAP
 *
 * Idempotent — re-running overwrites heroV2 + sections on the LandingPage global.
 * Existing legacy hero/emailForm/typography/scene/theme fields are preserved.
 *
 * Run: `npm run seed:homepage-sections`
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const payload = await getPayload({ config });

// ── Lexical rich-text helpers ────────────────────────────────────────────
type LexicalNode = Record<string, unknown>;
type LexicalDoc = { root: LexicalNode };

const p = (text: string): LexicalNode => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textStyle: '',
  textFormat: 0,
  children: [
    {
      type: 'text',
      mode: 'normal',
      text,
      format: 0,
      style: '',
      detail: 0,
      version: 1,
    },
  ],
});

const richText = (...paragraphs: string[]): LexicalDoc => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: paragraphs.map(p),
  },
});

// ── Sections data ────────────────────────────────────────────────────────

const trustStripBlock = {
  blockType: 'trustStripBlock' as const,
  anchorId: '#trust',
  leadSentence:
    'Credentialed by NextWave Safety. Methodology used by the French National Police. On-prem AI. Live on construction sites today.',
  items: [
    { label: 'IACET ACCREDITED', sublabel: 'via NextWave Safety' },
    { label: 'METHODOLOGY USED BY LAW ENFORCEMENT' },
    { label: 'EDGE-AI', sublabel: 'on-prem inference' },
    { label: 'ACTIVE PILOTS', sublabel: 'construction sites' },
  ],
};

const loopDiagramBlock = {
  blockType: 'loopDiagramBlock' as const,
  anchorId: '#loop',
  eyebrow: 'The Loop',
  title: 'Detect. Reconstruct. Train. The loop closes.',
  // leadSentence intentionally omitted — the body's three contrastive
  // sentences already make the same point; the duplicate read flat.
  body: richText(
    'Detection-only tools stop at the alert. Reconstruction-only tools stop at the model. Training-only tools stop at the classroom. Nexotek connects all three.',
  ),
  nodes: [
    {
      index: '01',
      label: 'DETECT',
      tagline: 'Real-time AI hazard detection on existing cameras.',
      body: richText(
        'Runs on virtually any ONVIF/RTSP IP camera — no rip-and-replace. On-premise processing, zero cloud egress by default. Audit-ready event logs with privacy-by-design face blur.',
      ),
      anchorLink: '#vision',
      status: 'current' as const,
    },
    {
      index: '02',
      label: 'RECONSTRUCT',
      tagline: 'Photorealistic Gaussian-Splat capture and replay.',
      body: richText(
        'Forensic-method on-site capture turns minutes of incident footage into a navigable 3D scene insurers, regulators, and counsel can walk through together — in a browser, on iOS/Android, or in VR. Spatial methodology used by law enforcement agencies (the spatial platform is used by the French National Police for evidence gathering).',
      ),
      anchorLink: '#spatial',
      status: 'current' as const,
    },
    {
      index: '03',
      label: 'TRAIN',
      tagline: 'Credentialed training co-developed with NextWave Safety.',
      body: richText(
        'IACET CEUs where formal credentialing is required (co-developed with NextWave Safety). Licensed Site Safety Managers, Coordinators, and Construction Fire Safety Managers — built into the same data backbone.',
      ),
      anchorLink: '#train',
      status: 'current' as const,
    },
    {
      index: '04',
      label: 'CONVERGE',
      tagline: 'Automated CCTV → reconstruction pipeline.',
      body: richText(
        'The pipeline that links Detect → Reconstruct without an operator in the loop: automated triage of CCTV moments into Gaussian-Splat reconstructions, ready for spatial review without manual capture. In active build today.',
      ),
      status: 'roadmap' as const,
      statusLabel: 'BUILDING',
    },
  ],
  revealMode: 'pinnedSequence' as const,
  pinDistancePerNodeVh: 90,
  singleOpenAtATime: true,
  showPhaseReadout: true,
  packetMotion: 'between-rows' as const,
  loopRing: {
    enabled: true,
    position: 'right' as const,
    size: 80,
    revolutionMs: 24000,
    showCycleCounter: true,
    startingCycle: 42,
    autonomousTickWhileVisible: true,
  },
  closureBeat: {
    enabled: true,
    durationMs: 600,
    easing: 'var(--nx-ease-emphasis)',
    incrementCycleCounter: true,
  },
  sash: {
    enabled: true,
    scope: 'next-section' as const,
    text: '← LOOP · CYCLE {n} · RUNNING',
  },
};

const threadVisionBlock = {
  blockType: 'threadBlock' as const,
  variant: 'vision' as const,
  anchorId: '#vision',
  productName: 'Nexotek Vision',
  tagline: 'Edge-AI computer vision for real-time HSE monitoring.',
  // leadSentence intentionally omitted — the body opens with the same
  // information and the bullets enumerate the rest. Body trimmed to the
  // single concrete line that does the work.
  body: richText(
    'PPE, unauthorized-zone, and loitering detection on the cameras you already own, processed on-prem. Fall detection in beta.',
  ),
  bullets: [
    { value: 'Real-time PPE / unauthorized-zone detection' },
    { value: 'Loitering events' },
    { value: 'Fall detection (beta)' },
    { value: 'Runs on virtually any IP camera (ONVIF/RTSP)' },
    { value: 'On-premise AI · privacy-by-design face blur' },
    { value: 'Automated daily/weekly/monthly PDF reports · multi-site portal' },
  ],
  chips: [
    { value: 'On-prem' },
    { value: 'Camera-agnostic' },
    { value: 'No rip-and-replace' },
  ],
  mediaType: 'image' as const,
  demoMode: 'detection-grid' as const,
};

const threadSpatialBlock = {
  blockType: 'threadBlock' as const,
  variant: 'spatial' as const,
  anchorId: '#spatial',
  productName: 'Nexotek Spatial',
  tagline: 'Forensic-method on-site capture, photorealistic reconstruction.',
  leadSentence:
    'On-site capture in minutes. Photorealistic site reconstruction in the browser — no app install.',
  // body dropped — the three sub-items below carry the section's weight.
  // The French-Police methodology reference now lives once on the page,
  // in the Loop Diagram\'s RECONSTRUCT node.
  chips: [
    { value: 'Forensic-method' },
    { value: 'Multiplayer 3D · Preview' },
    { value: 'Browser · iOS · Android · VR' },
  ],
  subItems: [
    {
      title: 'Capture & Reconstruct',
      body: richText(
        'Minutes of on-site walk → photorealistic Gaussian-Splat scene. Preserves geometry, materials, and viewpoint integrity. Audit-ready provenance retained end to end.',
      ),
      icon: 'globe',
    },
    {
      title: 'Train & Deliver',
      body: richText(
        'Reconstructed scenes feed directly into the credentialed training pipeline. Operators learn on the actual site, not a generic mock-up.',
      ),
      icon: 'shield',
    },
    {
      title: 'Spatial Collaboration Command Center (Preview)',
      body: richText(
        'PREVIEW — Insurers, regulators, and counsel meet inside the scene together. Embedded video conferencing, shared annotations, no app install required.',
      ),
      icon: 'user',
    },
  ],
  mediaType: 'image' as const,
  demoMode: 'splat-viewer' as const,
};

const credentialBlock = {
  blockType: 'credentialBlock' as const,
  anchorId: '#train',
  eyebrow: 'Training, credentialed',
  title: 'IACET CEUs where formal credentialing is required.',
  leadSentence:
    'Nexotek training is co-developed with NextWave Safety, an IACET Accredited Provider against the ANSI/IACET Standard, with depth in NYC SST, DOB, and OSHA regulatory expertise.',
  body: richText(
    'Where formal credentialing is required, training is co-developed with NextWave Safety. Licensed Site Safety Managers, Coordinators, and Construction Fire Safety Managers — credentialed to the standard the work requires.',
  ),
  badges: [
    { label: 'IACET ACCREDITED PROVIDER', sub: 'ANSI/IACET Standard' },
    { label: 'LICENSED SSM / SSC / CFSM' },
    { label: 'NYC SST · DOB · OSHA' },
  ],
  stats: [
    { value: '100,000', label: 'WORKERS TRAINED' },
    { value: '500', label: 'SITES' },
    { value: '$50M', label: 'IN MITIGATED CLAIMS' },
  ],
  disclaimer:
    'All figures attributable to NextWave Safety; training co-developed where credentialing is required.',
};

const comparisonBlock = {
  blockType: 'comparisonBlock' as const,
  anchorId: '#why',
  title: 'Why Nexotek',
  leadSentence:
    'Eight capabilities. Where detection-only tools stop, and where we don\'t.',
  columns: [
    { name: 'Detection-only tools', isUs: false },
    { name: 'Nexotek', isUs: true },
  ],
  rows: [
    {
      label: 'the alert.',
      cells: [
        { value: '' },
        { value: 'We turn each alert into a navigable 3D scene insurers and counsel can walk through.' },
      ],
    },
    {
      label: 'cloud egress.',
      cells: [
        { value: '' },
        { value: 'On-prem inference by default. Zero egress unless you opt in.' },
      ],
    },
    {
      label: 'a proprietary camera stack.',
      cells: [
        { value: '' },
        { value: 'Works with virtually any ONVIF/RTSP camera you already own — no rip-and-replace.' },
      ],
    },
    {
      label: 'a paper incident report.',
      cells: [
        { value: '' },
        { value: 'Reconstruct the scene as a forensic-method 3D walkthrough — defensible in regulated review.' },
      ],
    },
    {
      label: 'a static recording.',
      cells: [
        { value: '' },
        { value: 'Multiplayer 3D walkthroughs in preview — embedded video, shared annotations, no app install.' },
      ],
    },
    {
      label: 'a generic training mock-up.',
      cells: [
        { value: '' },
        { value: 'Operators learn on the actual site, reconstructed from real incident footage.' },
      ],
    },
    {
      label: 'an uncredentialed certificate.',
      cells: [
        { value: '' },
        { value: 'IACET CEUs co-developed with NextWave Safety, against the ANSI/IACET Standard.' },
      ],
    },
    {
      label: '"talk to your broker."',
      cells: [
        { value: '' },
        { value: 'Early conversations with commercial insurance carriers underway.' },
      ],
    },
  ],
  showNamedCompetitorsPublicly: false,
};

const whoWeServeBlock = {
  blockType: 'whoWeServeBlock' as const,
  anchorId: '#who-we-serve',
  leadSentence:
    "Two environments first: active construction sites and residential portfolios.",
  companion: {
    eyebrow: 'Operator surfaces',
    headlineLine1: 'Detect with the queue.',
    headlineLine2: 'Decide from the dashboard.',
    // leadSentence intentionally omitted — the previous "One stack, two
    // surfaces…" copy was cut as low-signal. Add a new sentence here if
    // editors want a sub-headline back.
  },
  tabs: [
    {
      key: 'construction',
      label: 'Construction',
      eyebrow: 'VERTICAL · CONSTRUCTION',
      title: 'Site safety, credentialed and continuous.',
      body: richText(
        'Active scaffolded sites, multi-tower projects, infrastructure builds. Real-time PPE and fall detection on existing cameras, credentialed training tied to NYC SST/DOB/OSHA, and incident reconstruction insurers can walk through together.',
      ),
      ctaLabel: 'Talk to our team',
      ctaHref: '#contact',
      accentTokenPair: 'construction' as const,
    },
    {
      key: 'habitation',
      label: 'Habitation',
      eyebrow: 'VERTICAL · HABITATION',
      title: 'Residential and commercial properties.',
      body: richText(
        'Modern residential lobbies, parking structures, and mixed-use buildings. Loitering detection, audit-ready event logs, and on-prem inference that keeps tenant data on the property.',
      ),
      ctaLabel: 'Talk to our team',
      ctaHref: '#contact',
      accentTokenPair: 'habitation' as const,
    },
  ],
};

const proofGridBlock = {
  blockType: 'proofGridBlock' as const,
  anchorId: '#proof',
  leadSentence:
    'Approved proof points are surfaced here verbatim from the positioning framework; partner-gated claims and customer logos are withheld until released.',
  tiles: [
    {
      headline: 'On-premise AI processing',
      sub: 'Lower cloud cost, full data sovereignty, zero egress by default.',
      citationSource: 'Nexotek edge deployment specification',
      citationDetail:
        'Per-site inference runs on customer-controlled hardware; no event telemetry leaves the site perimeter unless explicitly configured.',
    },
    {
      headline: 'Camera-agnostic',
      sub: 'Works with virtually any existing IP camera — no hardware replacement.',
      citationSource: 'Supported camera matrix · ONVIF Profile S + Profile T',
      citationDetail:
        'Any ONVIF-compliant or generic RTSP camera is supported. No replacement hardware required to begin a pilot.',
    },
    {
      headline: 'Methodology used by law enforcement',
      sub: 'Spatial reconstruction approach used by the French National Police.',
      citationSource: 'French National Police forensic methodology',
      citationDetail:
        'Scene reconstruction approach adopted from the digital forensics labs of the Police Judiciaire.',
    },
    {
      headline: 'IACET-accredited training',
      sub: '100K workers trained · 500 sites · $50M in mitigated claims.',
      footnote: 'Via NextWave Safety',
      citationSource: 'NextWave Safety historical training data · 5-year log',
      citationDetail:
        '100K+ workers trained across 500 sites; insurer-reported savings of $50M+ in mitigated claims. IACET CEUs awarded across 47 trade categories.',
    },
    {
      headline: 'Pilots underway',
      sub: 'Pilots underway in construction.',
      citationSource: 'Active site map · internal',
      citationDetail:
        'Multi-site pilots underway across construction segments. Geographic distribution available under NDA.',
    },
    {
      headline: 'Active insurance partnership conversations',
      sub: 'Underwriting integrations under active development.',
      citationSource: 'Underwriter conversations log',
      citationDetail:
        'Active integration discussions with multiple Tier-1 commercial insurance carriers. No commitments published until partner approval.',
    },
    {
      headline: 'NYC regulatory expertise',
      sub: 'SST · DOB · OSHA — built into the credentialed training pipeline.',
      citationSource: 'NYC DOB SST · Local Law 196 + OSHA 30',
      citationDetail:
        'Training curriculum aligned directly with NYC DOB Site Safety Training and federal OSHA 30 requirements.',
    },
    {
      headline: 'Edge-AI inference',
      sub: 'Detection runs on the cameras you already own.',
      citationSource: 'Edge inference benchmark log · last 30 days',
      citationDetail:
        '23ms median latency, 99th percentile under 80ms — measured per-frame on commodity edge hardware.',
    },
  ],
};

const faqBlock = {
  blockType: 'faqBlock' as const,
  anchorId: '#faq',
  eyebrow: 'Frequently asked',
  title: 'Questions we get asked.',
  leadSentence:
    'Short, sourceable answers to the eight questions enterprise teams ask before a Nexotek pilot.',
  items: [
    {
      question: 'What is a Spatial Risk OS?',
      answer: richText(
        'A Spatial Risk OS is the operating system for physical risk: a single platform that detects hazards in real time on existing cameras, reconstructs incidents as photorealistic 3D scenes, and feeds those scenes into credentialed training. Nexotek is being built as the first.',
      ),
      linkAnchor: '#loop',
    },
    {
      question: 'How is this different from detection-only tools?',
      answer: richText(
        'Detection-only tools stop at the alert. Nexotek is closing the loop — the same platform that surfaces an event also reconstructs it in 3D and turns it into credentialed training material.',
      ),
      linkAnchor: '#why',
    },
    {
      question: 'Does it work with our existing cameras?',
      answer: richText(
        'Yes. Nexotek runs on virtually any ONVIF/RTSP IP camera. There is no rip-and-replace.',
      ),
      linkAnchor: '#vision',
    },
    {
      question: 'Where does the AI run?',
      answer: richText(
        'On-premise by default. Zero cloud egress unless you opt in. Audit-ready event logs and privacy-by-design face blur are part of the on-prem path.',
      ),
      linkAnchor: '#vision',
    },
    {
      question: 'What does "forensic-method" capture actually mean?',
      answer: richText(
        'It means the reconstruction preserves enough geometry, materials, and viewpoint integrity that the resulting 3D scene is defensible in regulated review. The spatial methodology is used by law enforcement agencies (the French National Police for evidence gathering).',
      ),
      linkAnchor: '#spatial',
    },
    {
      question: 'Is the training credentialed?',
      answer: richText(
        'Yes. Where formal credentialing is required, training is co-developed with NextWave Safety — an IACET Accredited Provider against the ANSI/IACET Standard. NYC SST / DOB / OSHA regulatory expertise is built into the pipeline.',
      ),
      linkAnchor: '#train',
    },
    {
      question: 'How are you working with insurance?',
      answer: richText(
        'We have active partnership conversations with insurance organizations exploring underwriting integrations. Specifics are partner-gated and will be released as those programs mature.',
      ),
      linkAnchor: '#why',
    },
    {
      question: 'How quickly can a pilot deploy?',
      answer: richText(
        'Pilots underway in construction today. Timeline depends on camera count and site readiness — the easiest path is to talk to our team.',
      ),
      linkAnchor: '#contact',
    },
  ],
};

const contactCtaBlock = {
  blockType: 'contactCtaBlock' as const,
  anchorId: '#contact',
  eyebrow: 'Talk to us',
  title: 'Tell us about your site.',
  leadSentence:
    'If you operate construction sites, residential portfolios, or anything camera-rich with credentialing exposure, we want to hear about it.',
  body: richText(
    'We pick up within one business day.',
  ),
  primaryCta: {
    label: 'TALK TO OUR TEAM',
    mode: 'leadForm' as const,
  },
  secondaryCta: {
    label: 'JOIN THE BRIEF LIST',
    mode: 'emailForm' as const,
  },
  trustRow: [
    { value: 'SOC 2 COMPLIANCE PLANNED' },
    { value: 'GDPR-READY' },
    { value: 'DATA STAYS ON-PREM' },
  ],
  partners: [
    { kind: 'real' as const,        category: 'CREDENTIALED TRAINING', name: 'NextWave Safety' },
    { kind: 'real' as const,        category: 'EDGE AI HUBS',          name: 'Camect' },
    { kind: 'placeholder' as const, category: 'INSURANCE',             name: 'Your firm here' },
    { kind: 'placeholder' as const, category: 'CCTV INTEGRATOR',       name: 'Your firm here' },
    { kind: 'placeholder' as const, category: 'ANALYTICS',             name: 'Your firm here' },
  ],
};

// ── Update LandingPage ───────────────────────────────────────────────────

payload.logger.info('Seeding LandingPage heroV2 + sections…');

const result = await payload.updateGlobal({
  slug: 'landing-page',
  data: {
    heroV2: {
      eyebrow: 'THE FIRST SPATIAL RISK OS',
      headlineLines: [
        { value: 'Spatial Risk Intelligence,' },
        { value: 'Redefined.' },
      ],
      leadSentence:
        'Nexotek is being built as the first Spatial Risk OS — an integrated platform closing the loop from real-time AI hazard detection through forensic-method 3D scene reconstruction to immersive training built from real site data.',
      primaryCta: {
        label: 'TALK TO OUR TEAM',
        mode: 'leadForm',
      },
      secondaryCta: {
        label: 'WATCH OVERVIEW',
        mode: 'href',
        href: '#loop',
      },
    },
    sections: [
      trustStripBlock,
      loopDiagramBlock,
      threadVisionBlock,
      threadSpatialBlock,
      credentialBlock,
      comparisonBlock,
      whoWeServeBlock,
      proofGridBlock,
      faqBlock,
      contactCtaBlock,
    ],
  },
});

payload.logger.info(`✓ LandingPage updated. Sections: ${(result.sections ?? []).length}`);
process.exit(0);
