/**
 * Seeds two newly-routed content surfaces on the LandingPage global:
 *
 *   1. The Spatial thread block's `platformShowcase` group — drives the
 *      Platform diptych (operator console + reconstruction studio) that
 *      renders directly after the Spatial thread.
 *   2. The whoWeServeBlock's `companion.queueTabLabel` /
 *      `companion.dashboardTabLabel` — drives the mobile tab labels on
 *      the ShowcaseFlip "Operator surface" demo.
 *
 * Surgical patch — walks the existing `sections` array, mutates only the
 * relevant blocks, preserves everything else. Mirrors the partner /
 * citation / mobile-menu / testimonial patch scripts.
 *
 *   npx payload run scripts/patch-platform-and-operator.ts
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const PLATFORM_SHOWCASE = {
  enabled: true,
  eyebrow: 'Platform',
  title: 'One platform. Every signal connected.',
  leadSentence:
    'Operator surfaces and reconstruction studios — every signal the platform sees flows through the same decision loop.',
  visionCaption: 'Vision · Operator console',
  spatialCaption: 'Spatial · Reconstruction studio',
  flowSteps: [
    { value: 'Detect' },
    { value: 'Reconstruct' },
    { value: 'Act' },
  ],
};

// All companion fields for the ShowcaseFlip "Operator surfaces" demo.
// Values mirror DEFAULTS in components/sections/demos/showcase-flip.tsx,
// so seeding makes the field visible/editable in admin without changing
// the rendered output.
const OPERATOR_COMPANION = {
  eyebrow: 'Operator surfaces',
  headlineLine1: 'Detect with the queue.',
  headlineLine2: 'Decide from the dashboard.',
  queueTabLabel: '01 · QUEUE',
  dashboardTabLabel: '02 · DASHBOARD',
};

const payload = await getPayload({ config });

const current = await payload.findGlobal({
  slug: 'landing-page',
  depth: 0,
});

const sections = (current.sections ?? []) as Array<Record<string, unknown>>;

let platformPatched = 0;
let operatorPatched = 0;

const patched = sections.map((block) => {
  // 1) Spatial thread → platformShowcase
  if (
    block.blockType === 'threadBlock' &&
    (block as { variant?: string }).variant === 'spatial'
  ) {
    platformPatched += 1;
    return { ...block, platformShowcase: PLATFORM_SHOWCASE };
  }
  // 2) Who-we-serve → companion (eyebrow, headlines, tab labels)
  if (block.blockType === 'whoWeServeBlock') {
    operatorPatched += 1;
    const companion =
      (block.companion as Record<string, unknown> | undefined) ?? {};
    // Merge: pre-existing admin edits win over the default text we're
    // seeding here, so re-running is safe and never clobbers editor work.
    const merged: Record<string, unknown> = { ...companion };
    for (const [k, v] of Object.entries(OPERATOR_COMPANION)) {
      const existing = merged[k];
      const hasExisting =
        typeof existing === 'string' && existing.trim().length > 0;
      if (!hasExisting) merged[k] = v;
    }
    return { ...block, companion: merged };
  }
  return block;
});

await payload.updateGlobal({
  slug: 'landing-page',
  data: { sections: patched } as never,
});

payload.logger.info(
  `Patched: spatial threadBlock × ${platformPatched} (platformShowcase), whoWeServeBlock × ${operatorPatched} (companion tab labels).`,
);
process.exit(0);
