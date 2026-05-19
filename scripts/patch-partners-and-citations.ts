/**
 * Surgical patch for LandingPage global:
 *   - Adds `partners` to the contactCtaBlock entry.
 *   - Adds `citationSource` / `citationDetail` to each proofGridBlock tile.
 *
 * Reads the current `sections` array, mutates only those two blocks, and
 * writes the result back. Everything else is preserved verbatim, so this
 * sidesteps the pre-existing seed validation error on the Loop Diagram.
 *
 *   npx payload run scripts/patch-partners-and-citations.ts
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const PARTNERS = [
  { kind: 'real' as const,        category: 'CREDENTIALED TRAINING', name: 'NextWave Safety' },
  { kind: 'real' as const,        category: 'EDGE AI HUBS',          name: 'Camect' },
  { kind: 'placeholder' as const, category: 'INSURANCE',             name: 'Your firm here' },
  { kind: 'placeholder' as const, category: 'CCTV INTEGRATOR',       name: 'Your firm here' },
  { kind: 'placeholder' as const, category: 'ANALYTICS',             name: 'Your firm here' },
];

const CITATION_BY_PATTERN: Array<{
  match: RegExp;
  citationSource: string;
  citationDetail: string;
}> = [
  {
    match: /edge-ai|inference/i,
    citationSource: 'Edge inference benchmark log · last 30 days',
    citationDetail:
      '23ms median latency, 99th percentile under 80ms — measured per-frame on commodity edge hardware.',
  },
  {
    match: /on-premise|on prem/i,
    citationSource: 'Nexotek edge deployment specification',
    citationDetail:
      'Per-site inference runs on customer-controlled hardware; no event telemetry leaves the site perimeter unless explicitly configured.',
  },
  {
    match: /camera|rtsp|onvif/i,
    citationSource: 'Supported camera matrix · ONVIF Profile S + Profile T',
    citationDetail:
      'Any ONVIF-compliant or generic RTSP camera is supported. No replacement hardware required to begin a pilot.',
  },
  {
    match: /law enforcement|police|forensic/i,
    citationSource: 'French National Police forensic methodology',
    citationDetail:
      'Scene reconstruction approach adopted from the digital forensics labs of the Police Judiciaire.',
  },
  {
    match: /iacet|training|credential/i,
    citationSource: 'NextWave Safety historical training data · 5-year log',
    citationDetail:
      '100K+ workers trained across 500 sites; insurer-reported savings of $50M+ in mitigated claims. IACET CEUs awarded across 47 trade categories.',
  },
  {
    match: /pilot|deploy/i,
    citationSource: 'Active site map · internal',
    citationDetail:
      'Multi-site pilots underway across construction segments. Geographic distribution available under NDA.',
  },
  {
    match: /insurance|underwriting/i,
    citationSource: 'Underwriter conversations log',
    citationDetail:
      'Active integration discussions with multiple Tier-1 commercial insurance carriers. No commitments published until partner approval.',
  },
  {
    match: /nyc|regulat/i,
    citationSource: 'NYC DOB SST · Local Law 196 + OSHA 30',
    citationDetail:
      'Training curriculum aligned directly with NYC DOB Site Safety Training and federal OSHA 30 requirements.',
  },
];

const payload = await getPayload({ config });

const current = await payload.findGlobal({
  slug: 'landing-page',
  depth: 0,
});

const sections = (current.sections ?? []) as Array<Record<string, unknown>>;

let touchedContact = 0;
let touchedProof = 0;
let tilesUpdated = 0;

const patched = sections.map((block) => {
  if (block.blockType === 'contactCtaBlock') {
    touchedContact += 1;
    return { ...block, partners: PARTNERS };
  }
  if (block.blockType === 'proofGridBlock') {
    touchedProof += 1;
    const tiles = (block.tiles as Array<Record<string, unknown>> | undefined) ?? [];
    const nextTiles = tiles.map((tile) => {
      const headline = String(tile.headline ?? '');
      const match = CITATION_BY_PATTERN.find(({ match: re }) => re.test(headline));
      if (!match) return tile;
      tilesUpdated += 1;
      return {
        ...tile,
        citationSource: match.citationSource,
        citationDetail: match.citationDetail,
      };
    });
    return { ...block, tiles: nextTiles };
  }
  return block;
});

await payload.updateGlobal({
  slug: 'landing-page',
  data: { sections: patched } as never,
});

payload.logger.info(
  `Patched: contactCtaBlock×${touchedContact} (partners added), proofGridBlock×${touchedProof} (${tilesUpdated} tiles received citations).`,
);

process.exit(0);
