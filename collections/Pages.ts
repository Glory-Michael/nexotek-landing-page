import type { CollectionConfig } from 'payload';
import { canWrite } from '@/lib/access';
import { FormBlock } from '../blocks/FormBlock';

export const Pages: CollectionConfig = {
  slug: 'pages',
  trash: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${data?.slug || ''}?preview=true`,
    },
  },
  access: {
    create: canWrite,
    update: canWrite,
    delete: canWrite,
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                position: 'sidebar',
              },
            },
            {
              name: 'heroImage',
              label: 'Banner Image',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'content',
              type: 'richText',
            },
            {
              name: 'layout',
              type: 'blocks',
              blocks: [FormBlock],
            },
          ],
        },
        // SEO tab is auto-injected by @payloadcms/plugin-seo
      ],
    },
  ],
};
