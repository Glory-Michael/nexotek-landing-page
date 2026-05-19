/**
 * Seeds the per-row `detail` field on the Why Nexotek comparison block.
 * Replaces the previously hardcoded PILLAR_DETAILS array in
 * components/sections/comparison-table.tsx — same eight paragraphs, now
 * routed through Payload so an editor can tweak the dialog copy in admin.
 *
 * The details are written by row INDEX (0-7) — order matches the rendered
 * card grid. If rows have been reordered in admin, re-run the script with
 * an updated mapping, or seed by row label instead.
 *
 *   npx payload run scripts/patch-why-nexotek-details.ts
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const DETAILS: string[] = [
  "Detection-only stacks raise an alarm and stop. Nexotek converts the same camera feed into a navigable 3D scene — the alert, the angle, the position of every person and vehicle in the moment — for the insurer, counsel, or operations lead to walk through. The evidence used to verify an incident is reusable for training, claims, and pattern-of-life analysis.",
  "Inference runs on-premise on commodity GPU hardware. Footage never leaves the site by default. You opt in, per camera, per event, before any frame egresses — every transfer is logged, scoped, and revocable. Your compliance posture stays as tight as your most regulated site.",
  "ONVIF and RTSP are the industry's lowest common denominators, and most installed cameras already speak them. Nexotek runs against your existing cameras as-is — no rip-and-replace, no proprietary firmware, no vendor lock-in on the imaging layer. The intelligence sits above the cameras you already own.",
  "Traditional incident reports ask reviewers to imagine the scene from text and a few stills. We render the actual scene from the recorded footage into a forensic-method 3D walkthrough. Reviewers, counsel, and regulators inspect the same geometry from the angles that matter — defensible under the standards used in expert testimony.",
  "A clip forwarded over email gives one person, one perspective. Our spatial walkthroughs are multiplayer in preview — you, your broker, your counsel, and your insurer in the same 3D scene at the same time, with shared annotations, embedded clip context, and no app installs.",
  "Generic \"industrial safety\" courseware teaches abstract rules. Operators train on their own site, reconstructed from real incident footage from that site — same geometry, same equipment placement, same blind spots. Training becomes site-specific muscle memory instead of slides to forget.",
  "Continuing education counts only when the issuing body counts. Training tracks are co-developed with NextWave Safety, an IACET Accredited Provider against the ANSI/IACET Standard — CEUs that satisfy NYC SST, DOB, and OSHA review under credentials the regulator recognizes.",
  "Most platforms hand off the carrier conversation to your broker and hope. Nexotek is in early commercial conversations with carriers directly — about loss-history evidence, premium signals, and the structured payload they need to underwrite your specific risk profile.",
];

const payload = await getPayload({ config });

const current = await payload.findGlobal({
  slug: 'landing-page',
  depth: 0,
});

const sections = (current.sections ?? []) as Array<Record<string, unknown>>;

let blocks = 0;
let rowsPatched = 0;

const patched = sections.map((block) => {
  if (block.blockType !== 'comparisonBlock') return block;
  blocks += 1;
  const rows = (block.rows as Array<Record<string, unknown>> | undefined) ?? [];
  const nextRows = rows.map((row, i) => {
    const detail = DETAILS[i];
    if (!detail) return row;
    rowsPatched += 1;
    return { ...row, detail };
  });
  return { ...block, rows: nextRows };
});

if (blocks === 0) {
  payload.logger.warn(
    'No comparisonBlock found in sections — Why Nexotek details not seeded.',
  );
  process.exit(0);
}

await payload.updateGlobal({
  slug: 'landing-page',
  data: { sections: patched } as never,
});

payload.logger.info(
  `Patched ${blocks} comparisonBlock(s); ${rowsPatched} row detail field(s) populated.`,
);
process.exit(0);
