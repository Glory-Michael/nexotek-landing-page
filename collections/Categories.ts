import type { CollectionConfig } from 'payload';
import { canWrite } from '@/lib/access';

export const Categories: CollectionConfig = {
  slug: 'categories',
  trash: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    group: 'Content',
  },
  access: {
    create: canWrite,
    update: canWrite,
    delete: canWrite,
    read: () => true,
  },
  fields: [
    {
      name: 'name',
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
        description: 'URL-safe identifier, e.g. "press-release"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex color for UI badges, e.g. #3B82F6 (optional)',
      },
    },
  ],
};
