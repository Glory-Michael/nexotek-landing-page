/**
 * Idempotently create the `homepage-cta` Event used by the TALK TO OUR TEAM
 * lead form. Reuses the existing /api/events/[slug]/register pipeline so
 * homepage leads land in `event-leads`, Supabase, Notion, and Resend the same
 * way booth/demo leads do.
 *
 * Run with: `npm run seed:homepage-cta`
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const payload = await getPayload({ config });

const existing = await payload.find({
  collection: 'events',
  where: { slug: { equals: 'homepage-cta' } },
  limit: 1,
});

if (existing.docs.length > 0) {
  payload.logger.info(`✓ homepage-cta event already exists (id ${existing.docs[0].id})`);
} else {
  const created = await payload.create({
    collection: 'events',
    data: {
      title: 'Homepage — Talk to Our Team',
      slug: 'homepage-cta',
      ctaLabel: 'Submit',
      isOpen: true,
      pageTitle: 'Talk to Our Team — Nexotek',
      fieldConfig: {
        requireName: true,
        requireEmail: true,
        requireOrganization: true,
        requirePhone: false,
      },
    },
  });
  payload.logger.info(`✓ created homepage-cta event id=${created.id}`);
}

process.exit(0);
