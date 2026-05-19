import type { GlobalConfig } from 'payload';
import { canWrite } from '@/lib/access';

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  access: {
    update: canWrite,
    read: () => true,
  },
  admin: {
    description:
      'Site-wide footer content. Replaces the legacy navigation.footer fields once Phase 7 cleanup completes.',
  },
  fields: [
    {
      name: 'content',
      type: 'group',
      label: 'Content',
      fields: [
        {
          name: 'closingLine',
          type: 'text',
          admin: { description: 'Big-type closing line shown above the columns.' },
        },
        {
          name: 'closingCta',
          type: 'group',
          fields: [
            { name: 'label', type: 'text' },
            {
              name: 'mode',
              type: 'select',
              defaultValue: 'leadForm',
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
          name: 'columns',
          type: 'array',
          maxRows: 4,
          admin: {
            description: '3–4 columns. Suggested headings: PLATFORM / COMPANY / RESOURCES / LEGAL.',
          },
          fields: [
            { name: 'heading', type: 'text', required: true },
            {
              name: 'links',
              type: 'array',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'href', type: 'text', required: true },
                { name: 'openInNewTab', type: 'checkbox', defaultValue: false },
              ],
            },
          ],
        },
        {
          name: 'social',
          type: 'array',
          admin: { description: 'Mono labels — "LinkedIn", "GitHub", "X". No icons.' },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
        {
          name: 'complianceBadges',
          type: 'array',
          admin: {
            description: 'Only include badges that are presently true. e.g. SOC 2 COMPLIANCE PLANNED.',
          },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'sub', type: 'text' },
          ],
        },
        {
          name: 'legalLine',
          type: 'text',
          defaultValue: '© 2026 Nexotek Inc. All rights reserved.',
        },
        { name: 'wordmark', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
};
