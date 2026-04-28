import type { CollectionConfig } from 'payload';
import { canWrite } from '@/lib/access';

export const Media: CollectionConfig = {
  slug: 'media',
  trash: true,
  access: {
    create: canWrite,
    update: canWrite,
    delete: canWrite,
    read: () => true,
  },
  admin: {
    defaultColumns: ['filename', 'alt', 'mimeType', 'updatedAt'],
  },
  upload: {
    mimeTypes: ['image/*', 'video/*', 'application/pdf', 'model/gltf-binary', 'model/gltf+json', 'application/octet-stream'],
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
};
