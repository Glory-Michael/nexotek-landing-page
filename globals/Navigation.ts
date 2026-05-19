import type { GlobalConfig } from 'payload';
import { canWrite } from '@/lib/access';

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  access: {
    update: canWrite,
    read: () => true,
  },
  admin: {
    description: 'Site-wide header (navbar) and footer shown on every page.',
  },
  fields: [
    {
      name: 'navbar',
      type: 'group',
      label: 'Navbar',
      fields: [
        {
          name: 'logo',
          label: 'Logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Leave blank to use the default /logo.svg.',
          },
        },
        {
          name: 'ctaText',
          label: 'CTA Button Text (legacy)',
          type: 'text',
          defaultValue: 'Get Updates',
          admin: {
            description:
              'Legacy CTA text. Used when primaryCta below is empty. Will be removed in Phase 7.',
          },
        },
        {
          name: 'links',
          label: 'Nav Links',
          type: 'array',
          admin: {
            description:
              'Section nav links shown in the navbar. Empty = legacy single-CTA navbar.',
          },
          fields: [
            { name: 'label', type: 'text', required: true },
            {
              name: 'href',
              type: 'text',
              required: true,
              admin: { description: 'Full path or "#section-anchor".' },
            },
            { name: 'anchorId', type: 'text', admin: { description: 'Optional anchor id used for scroll-spy.' } },
            { name: 'openInNewTab', type: 'checkbox', defaultValue: false },
            { name: 'mobileOnly', type: 'checkbox', defaultValue: false },
          ],
        },
        {
          name: 'primaryCta',
          label: 'Primary CTA',
          type: 'group',
          fields: [
            { name: 'label', type: 'text', admin: { description: 'Empty = use legacy ctaText.' } },
            {
              name: 'mode',
              type: 'select',
              defaultValue: 'href',
              options: [
                { label: 'Open lead form', value: 'leadForm' },
                { label: 'Link to URL', value: 'href' },
              ],
            },
            {
              name: 'href',
              type: 'text',
              admin: { condition: (_, sibling) => sibling?.mode === 'href' },
            },
          ],
        },
        {
          name: 'showStatusChip',
          label: 'Show Live Status Chip',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Tier 2 navbar live-status chip. Off by default.' },
        },
        {
          name: 'mobileMenu',
          type: 'group',
          label: 'Mobile Menu',
          admin: {
            description:
              'Mobile-only overlay menu (the dot-matrix button). Controls supplemental copy that does not have a desktop equivalent.',
          },
          fields: [
            {
              name: 'taglineEnabled',
              label: 'Show Tagline',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Show the tagline strip above the CTA in the mobile menu.' },
            },
            {
              name: 'tagline',
              type: 'text',
              defaultValue: 'Founders respond · we pick up · 24h',
              admin: {
                description:
                  'Short uppercase strap rendered above the primary CTA. Mono caps, ~6–10 words.',
                condition: (_, sibling) => sibling?.taglineEnabled !== false,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      label: 'Footer',
      fields: [
        {
          name: 'copyrightName',
          label: 'Copyright Name',
          type: 'text',
          defaultValue: 'Nexotek.ai',
          admin: {
            description: 'Company name shown in the footer copyright line.',
          },
        },
        {
          name: 'links',
          label: 'Footer Links',
          type: 'array',
          minRows: 0,
          maxRows: 8,
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
                { name: 'url',   type: 'text', required: true, admin: { width: '50%' } },
              ],
            },
          ],
          defaultValue: [
            { label: 'Newsroom',         url: '/newsroom' },
            { label: 'Privacy Policy',   url: '/privacy' },
            { label: 'Terms of Service', url: '/terms' },
          ],
        },
      ],
    },
  ],
};
