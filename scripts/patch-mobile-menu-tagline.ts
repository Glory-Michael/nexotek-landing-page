/**
 * Sets the mobile-menu tagline on the existing Navigation global.
 *
 * Payload's `defaultValue` only applies on document *creation*, so the
 * Navigation singleton (which already exists) doesn't pick up the new
 * field's default automatically. This script seeds the field so the
 * mobile menu's "Founders respond · we pick up · 24h" strap continues to
 * render after the schema change rolls out, until an editor edits it in
 * admin.
 *
 *   npx payload run scripts/patch-mobile-menu-tagline.ts
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const TAGLINE = 'Founders respond · we pick up · 24h';

const payload = await getPayload({ config });

const current = await payload.findGlobal({
  slug: 'navigation',
  depth: 0,
});

const navbar =
  (current as unknown as { navbar?: Record<string, unknown> }).navbar ?? {};
const mobileMenu = (navbar.mobileMenu as Record<string, unknown> | undefined) ?? {};

const nextNavbar = {
  ...navbar,
  mobileMenu: {
    ...mobileMenu,
    taglineEnabled:
      mobileMenu.taglineEnabled === false ? false : true,
    tagline:
      typeof mobileMenu.tagline === 'string' && mobileMenu.tagline.trim().length > 0
        ? mobileMenu.tagline
        : TAGLINE,
  },
};

await payload.updateGlobal({
  slug: 'navigation',
  data: { navbar: nextNavbar } as never,
});

payload.logger.info(`Patched navigation.navbar.mobileMenu.tagline = "${nextNavbar.mobileMenu.tagline}"`);
process.exit(0);
