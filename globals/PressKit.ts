import type { GlobalConfig } from 'payload';
import { canWrite } from '@/lib/access';

export const PressKit: GlobalConfig = {
  slug: 'press-kit',
  label: 'Press Kit',
  access: {
    update: canWrite,
    read: () => true,
  },
  admin: {
    description: 'Press kit content. Surfaces on /press in Phase 5.',
  },
  fields: [
    {
      name: 'content',
      type: 'group',
      label: 'Content',
      fields: [
        { name: 'companyDescription', type: 'richText' },
        { name: 'foundingDate', type: 'date' },
        {
          name: 'leadership',
          type: 'array',
          admin: { description: 'Public leadership entries only. Photos optional.' },
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'title', type: 'text', required: true },
            { name: 'photo', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          name: 'contactEmail',
          type: 'text',
          defaultValue: 'press@nexotek.ai',
        },
        {
          name: 'downloadLinks',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
        { name: 'brandRulesSummary', type: 'richText' },
      ],
    },
  ],
};
