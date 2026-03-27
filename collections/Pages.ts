import type { CollectionConfig } from 'payload';

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${data?.slug || ''}?preview=true`,
    },
  },
  access: {
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
          ],
        },
        // SEO tab is auto-injected by @payloadcms/plugin-seo
      ],
    },
  ],
};
