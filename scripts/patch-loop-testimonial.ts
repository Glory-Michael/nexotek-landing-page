/**
 * Seeds the loopDiagramBlock's `testimonial` group on the LandingPage
 * global with the founder quote that used to live as a `QUOTE` constant
 * in components/sections/testimonial-section.tsx.
 *
 * Surgical: walks the existing `sections` array, finds the single
 * loopDiagramBlock, and patches only its `testimonial` field. Everything
 * else is preserved verbatim — sidesteps the full-seed validation error
 * on the Loop Diagram's Node 4 body that blocks `seed:homepage-sections`.
 *
 *   npx payload run scripts/patch-loop-testimonial.ts
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const TESTIMONIAL = {
  enabled: true,
  eyebrow: 'From the team',
  quote:
    "Real safety happens between the alert and the action. That's the loop we close — where every signal becomes a decision, and the operator's judgment finally compounds.",
  attributionName: 'Michael Xu',
  attributionRole: 'Product Manager, Nexotek',
  attributionInitials: 'MX',
};

const payload = await getPayload({ config });

const current = await payload.findGlobal({
  slug: 'landing-page',
  depth: 0,
});

const sections = (current.sections ?? []) as Array<Record<string, unknown>>;

let touched = 0;
const patched = sections.map((block) => {
  if (block.blockType !== 'loopDiagramBlock') return block;
  touched += 1;
  return { ...block, testimonial: TESTIMONIAL };
});

if (touched === 0) {
  payload.logger.warn(
    'No loopDiagramBlock found in sections — testimonial not seeded.',
  );
  process.exit(0);
}

await payload.updateGlobal({
  slug: 'landing-page',
  data: { sections: patched } as never,
});

payload.logger.info(
  `Patched ${touched} loopDiagramBlock(s) with founder testimonial fields.`,
);
process.exit(0);
