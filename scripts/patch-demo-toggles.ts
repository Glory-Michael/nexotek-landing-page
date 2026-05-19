/**
 * Seeds the per-demo visibility toggles and alt-text fields added in this
 * pass. After running, the relevant fields are surfaced in admin with
 * editor-friendly default values (enabled: true, alt text from the defaults
 * we ship in the schema).
 *
 * Patched fields:
 *   • threadBlock (vision) → visionDemos.{cameraGrid,operatorCli,floorplan}
 *   • threadBlock (spatial) → spatialDemos.{spatialPeek,liveView}
 *   • threadBlock (spatial) → platformShowcase.{screenDeck,spatialStudio}
 *   • whoWeServeBlock → demos.showcaseFlip
 *
 * Merge logic preserves any pre-existing admin edit on every field touched.
 *
 *   npx payload run scripts/patch-demo-toggles.ts
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const VISION_DEFAULTS = {
  cameraGrid: {
    enabled: true,
    altText:
      'Four-camera CCTV grid mockup with simulated AI detections overlaid on construction-site footage.',
  },
  operatorCli: {
    enabled: true,
    altText: 'Terminal-style preview of the nx-cli operator surface.',
  },
  floorplan: {
    enabled: true,
    altText:
      '3D floorplan with placed cameras and field-of-view cones, viewed from a perspective angle.',
  },
};

const SPATIAL_DEFAULTS = {
  spatialPeek: {
    enabled: true,
    altText:
      '3D reconstruction of a construction yard with forklift, pallets, traffic cones, and a scaffold tower.',
  },
  liveView: {
    enabled: true,
    altText: 'Camera live-view preview with pan/tilt/zoom controls.',
  },
};

const PLATFORM_DEMO_DEFAULTS = {
  screenDeck: {
    enabled: true,
    altText:
      'Operator console preview cycling through Vision review queue, decision panel, and dashboard cards.',
  },
  spatialStudio: {
    enabled: true,
    altText:
      'Reconstruction studio preview with an orbiting Gaussian-splat point cloud of a tower-crane excavator.',
  },
};

const WHOSERVE_DEMOS_DEFAULTS = {
  showcaseFlip: {
    enabled: true,
    altText:
      'Operator-surface mockup that flips between an alert review queue and a dashboard.',
  },
};

// Per-field merge: keep existing edits, fill blanks from defaults.
function mergeDemoGroup<T extends Record<string, { enabled?: boolean; altText?: string }>>(
  existing: Record<string, unknown> | undefined,
  defaults: T,
): T {
  const out: Record<string, unknown> = { ...(existing ?? {}) };
  for (const [k, v] of Object.entries(defaults)) {
    const prev =
      (out[k] as { enabled?: boolean; altText?: string } | undefined) ?? {};
    out[k] = {
      enabled: typeof prev.enabled === 'boolean' ? prev.enabled : v.enabled,
      altText:
        typeof prev.altText === 'string' && prev.altText.trim().length > 0
          ? prev.altText
          : v.altText,
    };
  }
  return out as T;
}

const payload = await getPayload({ config });

const current = await payload.findGlobal({
  slug: 'landing-page',
  depth: 0,
});

const sections = (current.sections ?? []) as Array<Record<string, unknown>>;

let stats = { vision: 0, spatial: 0, platform: 0, whoServe: 0 };

const patched = sections.map((block) => {
  if (block.blockType === 'threadBlock') {
    const variant = (block as { variant?: string }).variant;
    const next = { ...block };
    if (variant === 'vision') {
      next.visionDemos = mergeDemoGroup(
        block.visionDemos as Record<string, unknown> | undefined,
        VISION_DEFAULTS,
      );
      stats.vision += 1;
    }
    if (variant === 'spatial') {
      next.spatialDemos = mergeDemoGroup(
        block.spatialDemos as Record<string, unknown> | undefined,
        SPATIAL_DEFAULTS,
      );
      stats.spatial += 1;

      const ps =
        (block.platformShowcase as Record<string, unknown> | undefined) ?? {};
      next.platformShowcase = {
        ...ps,
        ...mergeDemoGroup(ps, PLATFORM_DEMO_DEFAULTS),
      };
      stats.platform += 1;
    }
    return next;
  }

  if (block.blockType === 'whoWeServeBlock') {
    stats.whoServe += 1;
    return {
      ...block,
      demos: mergeDemoGroup(
        block.demos as Record<string, unknown> | undefined,
        WHOSERVE_DEMOS_DEFAULTS,
      ),
    };
  }

  return block;
});

await payload.updateGlobal({
  slug: 'landing-page',
  data: { sections: patched } as never,
});

payload.logger.info(
  `Patched: vision×${stats.vision} spatial×${stats.spatial} platform-demos×${stats.platform} whoServe×${stats.whoServe}`,
);
process.exit(0);
