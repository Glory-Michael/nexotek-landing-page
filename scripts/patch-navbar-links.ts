/**
 * Re-seeds the Navigation global's navbar.links with the canonical chapter
 * list, in the order they appear on the homepage. Earlier seeds were
 * missing the `#train` and `#why` chapters; this overwrites any prior
 * contents so the mobile menu's chapter list matches the page.
 *
 * Source of truth is scripts/seed-homepage-sections.ts — each chapter's
 * anchorId is mirrored here.
 *
 *   npx payload run scripts/patch-navbar-links.ts
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const LINKS = [
  { label: 'Loop',       href: '#loop',         openInNewTab: false, mobileOnly: false },
  { label: 'Vision',     href: '#vision',       openInNewTab: false, mobileOnly: false },
  { label: 'Spatial',    href: '#spatial',      openInNewTab: false, mobileOnly: false },
  { label: 'Train',      href: '#train',        openInNewTab: false, mobileOnly: false },
  { label: 'Why',        href: '#why',          openInNewTab: false, mobileOnly: false },
  { label: 'Industries', href: '#who-we-serve', openInNewTab: false, mobileOnly: false },
  { label: 'Proof',      href: '#proof',        openInNewTab: false, mobileOnly: false },
  { label: 'FAQ',        href: '#faq',          openInNewTab: false, mobileOnly: false },
  { label: 'Contact',    href: '#contact',      openInNewTab: false, mobileOnly: false },
];

const payload = await getPayload({ config });

const current = await payload.findGlobal({
  slug: 'navigation',
  depth: 0,
});

const navbar =
  (current as unknown as { navbar?: Record<string, unknown> }).navbar ?? {};

await payload.updateGlobal({
  slug: 'navigation',
  data: { navbar: { ...navbar, links: LINKS } } as never,
});

payload.logger.info(`Patched navbar.links → ${LINKS.length} chapter entries.`);
process.exit(0);
