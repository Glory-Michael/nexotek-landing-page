import type { CollectionConfig } from 'payload';
import { canWrite } from '@/lib/access';

export const Articles: CollectionConfig = {
  slug: 'articles',
  trash: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'category', '_status', 'publishedDate', 'updatedAt'],
    group: 'Content',
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/newsroom/${data?.slug || ''}?preview=true`,
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
                description: 'URL-safe identifier used in /newsroom/[slug]',
              },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              admin: {
                description: 'Short summary shown on article cards and used as SEO description fallback.',
              },
            },
            {
              name: 'coverImage',
              label: 'Cover Image',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'content',
              type: 'richText',
            },
            {
              name: 'publishedDate',
              type: 'date',
              required: true,
              defaultValue: () => new Date().toISOString(),
              admin: {
                position: 'sidebar',
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
            {
              name: 'author',
              type: 'text',
              admin: {
                description: 'Author display name (optional).',
              },
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              admin: {
                position: 'sidebar',
              },
            },
            {
              name: 'tags',
              type: 'array',
              admin: {
                position: 'sidebar',
                description: 'Cross-cutting topic tags.',
              },
              fields: [
                {
                  name: 'tag',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                position: 'sidebar',
                description: 'Pin to the top of the newsroom listing.',
              },
            },
            {
              name: 'contentState',
              type: 'select',
              defaultValue: 'live',
              options: [
                { label: 'Live', value: 'live' },
                { label: 'Sample / Demo', value: 'sample' },
              ],
              admin: {
                position: 'sidebar',
                description:
                  'Mark as "Sample / Demo" for placeholder content shown during alpha access. Live articles are real published content.',
              },
            },
          ],
        },
        // SEO tab auto-injected by @payloadcms/plugin-seo
      ],
    },
  ],
};
