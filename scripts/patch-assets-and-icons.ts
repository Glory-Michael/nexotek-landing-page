/**
 * Single consolidated seed for the asset / icon wire-up:
 *
 *   1. Uploads the seven bundled brand photos to the `media` collection
 *      (idempotent — skipped if a doc with the same filename already exists).
 *   2. Patches the LandingPage global:
 *        • heroV2.backgroundImage  → hero-crane-silhouette.jpg
 *        • trustStripBlock.items[].icon  → curated NxIcon key per label
 *        • threadBlock variant=vision.mediaRef  → vision-cctv.jpg
 *        • threadBlock variant=spatial.mediaRef → spatial-brutalist.jpg
 *        • credentialBlock.badges[].icon → curated NxIcon key per label
 *        • loopDiagramBlock.nodes[].icon → DETECT/RECONSTRUCT/TRAIN/CONVERGE
 *        • whoWeServeBlock.tabs[].photo → per-tab construction/habitation
 *
 *   npx payload run scripts/patch-assets-and-icons.ts
 *
 * Re-running is safe: existing media docs are reused; field merges
 * preserve any non-empty admin edit (icon selections and uploaded
 * mediaRef/photo overrides are honored).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPayload } from 'payload';
import config from '../payload.config';

// Mixed module mode (top-level await + tsx loader) — derive __dirname
// equivalent from import.meta.url.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(HERE, '../public');

// Tiny mime sniff covering exactly what we ship in /public/brand/photos.
function mimeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

interface AssetSpec {
  publicPath: string; // relative to /public
  alt: string;
}

const ASSETS: Record<string, AssetSpec> = {
  hero: {
    publicPath: 'brand/photos/hero-crane-silhouette.jpg',
    alt: 'Hero silhouette of a tower crane against an overcast sky',
  },
  vision: {
    publicPath: 'brand/photos/vision-cctv.jpg',
    alt: 'CCTV camera mounted on an industrial post, oblique angle',
  },
  spatial: {
    publicPath: 'brand/photos/spatial-brutalist.jpg',
    alt: 'Brutalist concrete interior — geometric volumes and shadow',
  },
  construction: {
    publicPath: 'brand/photos/construction-crane.jpg',
    alt: 'Tower crane against deep blue sky on an active construction site',
  },
  habitation: {
    publicPath: 'brand/photos/habitation-interior.jpg',
    alt: 'Modern multi-family residential atrium with stacked balconies',
  },
};

// ── Icon mappings (mirrors the auto-derived fallbacks already in code) ──
const TRUST_ICON_BY_LABEL: Record<string, string> = {
  'IACET ACCREDITED': 'shield',
  'METHODOLOGY USED BY LAW ENFORCEMENT': 'radar',
  'EDGE-AI': 'grid',
  'ACTIVE PILOTS': 'target',
};

const CREDENTIAL_ICON_BY_LABEL: Record<string, string> = {
  'IACET ACCREDITED PROVIDER': 'shield',
  'LICENSED SSM / SSC / CFSM': 'asset',
  'NYC SST · DOB · OSHA': 'shield',
};

const LOOP_ICON_BY_LABEL: Record<string, string> = {
  DETECT: 'radar',
  RECONSTRUCT: 'globe',
  TRAIN: 'shield',
  CONVERGE: 'grid',
};

const payload = await getPayload({ config });

async function uploadAsset(spec: AssetSpec): Promise<number> {
  const abs = path.join(PUBLIC, spec.publicPath);
  const filename = path.basename(abs);

  // Reuse existing media doc if filename already uploaded.
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  });
  if (existing.docs[0]) {
    payload.logger.info(`  ↺ ${filename} (already in media, id=${existing.docs[0].id})`);
    return existing.docs[0].id as number;
  }

  const data = fs.readFileSync(abs);
  const doc = await payload.create({
    collection: 'media',
    data: { alt: spec.alt },
    file: {
      data,
      mimetype: mimeFor(filename),
      name: filename,
      size: data.length,
    },
  });
  payload.logger.info(`  ✓ uploaded ${filename} → id=${doc.id}`);
  return doc.id as number;
}

payload.logger.info('— Uploading brand photos to media collection …');
const media: Record<string, number> = {};
for (const [key, spec] of Object.entries(ASSETS)) {
  media[key] = await uploadAsset(spec);
}

payload.logger.info('— Patching landing-page global …');
const current = await payload.findGlobal({
  slug: 'landing-page',
  depth: 0,
});

// 1) heroV2.backgroundImage
const heroV2 = (current as unknown as { heroV2?: Record<string, unknown> }).heroV2 ?? {};
const nextHeroV2 = {
  ...heroV2,
  backgroundImage: heroV2.backgroundImage ?? media.hero,
};

// 2) Walk sections.
const sections = (current.sections ?? []) as Array<Record<string, unknown>>;
let counters = { trust: 0, vision: 0, spatial: 0, credential: 0, loop: 0, whoServe: 0 };

const patched = sections.map((block) => {
  // Trust strip — set icon per item by label, preserve any existing icon.
  if (block.blockType === 'trustStripBlock') {
    const items = (block.items as Array<Record<string, unknown>> | undefined) ?? [];
    counters.trust += 1;
    return {
      ...block,
      items: items.map((it) => {
        if (typeof it.icon === 'string' && it.icon.length > 0) return it;
        const label = String(it.label ?? '');
        const icon = TRUST_ICON_BY_LABEL[label];
        return icon ? { ...it, icon } : it;
      }),
    };
  }

  // Vision / Spatial thread mediaRef.
  if (block.blockType === 'threadBlock') {
    const variant = (block as { variant?: string }).variant;
    if (variant === 'vision' && !block.mediaRef) {
      counters.vision += 1;
      return { ...block, mediaRef: media.vision };
    }
    if (variant === 'spatial' && !block.mediaRef) {
      counters.spatial += 1;
      return { ...block, mediaRef: media.spatial };
    }
  }

  // Credential badges icon per label, preserve any existing icon.
  if (block.blockType === 'credentialBlock') {
    const badges = (block.badges as Array<Record<string, unknown>> | undefined) ?? [];
    counters.credential += 1;
    return {
      ...block,
      badges: badges.map((b) => {
        if (typeof b.icon === 'string' && b.icon.length > 0) return b;
        const icon = CREDENTIAL_ICON_BY_LABEL[String(b.label ?? '')];
        return icon ? { ...b, icon } : b;
      }),
    };
  }

  // Loop diagram node icons, keyed by uppercase label.
  if (block.blockType === 'loopDiagramBlock') {
    const nodes = (block.nodes as Array<Record<string, unknown>> | undefined) ?? [];
    counters.loop += 1;
    return {
      ...block,
      nodes: nodes.map((n) => {
        if (typeof n.icon === 'string' && n.icon.length > 0) return n;
        const icon = LOOP_ICON_BY_LABEL[String(n.label ?? '').toUpperCase()];
        return icon ? { ...n, icon } : n;
      }),
    };
  }

  // Who we serve tab photos, keyed by tab key.
  if (block.blockType === 'whoWeServeBlock') {
    const tabs = (block.tabs as Array<Record<string, unknown>> | undefined) ?? [];
    counters.whoServe += 1;
    return {
      ...block,
      tabs: tabs.map((t) => {
        if (t.photo) return t;
        const key = String(t.key ?? '');
        const mediaId = media[key];
        return mediaId ? { ...t, photo: mediaId } : t;
      }),
    };
  }

  return block;
});

await payload.updateGlobal({
  slug: 'landing-page',
  data: { heroV2: nextHeroV2, sections: patched } as never,
});

payload.logger.info(
  `Done. trust×${counters.trust} vision×${counters.vision} spatial×${counters.spatial} credential×${counters.credential} loop×${counters.loop} whoServe×${counters.whoServe} (heroV2.backgroundImage seeded if empty)`,
);
process.exit(0);
