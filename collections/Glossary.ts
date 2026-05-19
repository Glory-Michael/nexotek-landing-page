import type { CollectionConfig } from 'payload';
import { canWrite } from '@/lib/access';

export const Glossary: CollectionConfig = {
  slug: 'glossary',
  labels: { singular: 'Glossary Term', plural: 'Glossary' },
  admin: {
    useAsTitle: 'term',
    description:
      'Glossary terms. Powers /glossary in Phase 5 and inline cross-links from FAQ + section copy.',
    defaultColumns: ['term', 'slug', 'pillarLink'],
  },
  access: {
    read: () => true,
    create: canWrite,
    update: canWrite,
    delete: canWrite,
  },
  fields: [
    { name: 'term', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL-safe identifier used as the anchor on /glossary.' },
    },
    { name: 'definition', type: 'richText', required: true },
    {
      name: 'seeAlso',
      type: 'relationship',
      relationTo: 'glossary',
      hasMany: true,
      admin: { description: 'Related glossary terms.' },
    },
    {
      name: 'pillarLink',
      type: 'text',
      admin: { description: 'Optional anchor to a homepage pillar (e.g. "#vision").' },
    },
  ],
};
