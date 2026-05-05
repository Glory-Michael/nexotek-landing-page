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
          label: 'CTA Button Text',
          type: 'text',
          defaultValue: 'Get Updates',
          admin: {
            description: 'Text on the top-right call-to-action button.',
          },
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
