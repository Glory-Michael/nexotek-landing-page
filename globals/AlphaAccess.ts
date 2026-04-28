import type { GlobalConfig } from 'payload';
import { canWrite } from '@/lib/access';
import { revalidateTag } from 'next/cache';

export const AlphaAccess: GlobalConfig = {
  slug: 'alpha-access',
  label: 'Alpha Feature Access',
  admin: {
    group: 'Settings',
    description:
      'Password-gate pages that are still in development. Visitors must enter the password to access protected routes.',
  },
  access: {
    update: canWrite,
    read: () => true,
  },
  hooks: {
    afterChange: [
      async () => {
        // Bust the landing page cache so showInNav changes appear immediately.
        revalidateTag('landing-page', 'default');
      },
    ],
  },
  fields: [
    {
      name: 'accessPassword',
      type: 'text',
      defaultValue: '',
      admin: {
        description:
          'Shared password required to access alpha features. Changing this immediately invalidates all existing sessions.',
        placeholder: 'e.g. nexotek-preview-2024',
      },
    },
    {
      name: 'features',
      type: 'array',
      label: 'Protected Routes',
      admin: {
        description:
          'URL paths that require the password above. Use a leading slash (e.g. /newsroom). All sub-paths are also protected.',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            description: 'Human-readable name shown on the password prompt (e.g. "Newsroom").',
            placeholder: 'Newsroom',
          },
        },
        {
          name: 'path',
          type: 'text',
          required: true,
          admin: {
            description: 'URL path prefix to protect (e.g. /newsroom).',
            placeholder: '/newsroom',
          },
        },
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Gate enabled',
          defaultValue: true,
          admin: {
            description: 'Uncheck to disable the gate without removing this entry.',
          },
        },
        {
          name: 'showInNav',
          type: 'checkbox',
          label: 'Show in footer nav',
          defaultValue: false,
          admin: {
            description:
              'When on, a link to this page appears in the site footer even though it is password-gated. Visitors who click it will hit the password prompt.',
          },
        },
      ],
    },
  ],
};
