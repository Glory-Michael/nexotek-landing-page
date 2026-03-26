import type { CollectionConfig } from 'payload';

export const Waitlist: CollectionConfig = {
  slug: 'waitlist',
  dbName: 'payload_waitlist',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'status', 'createdAt'],
    description: 'Waitlist signups from the landing page.',
  },
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'subscribed',
      options: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
        { label: 'Contacted', value: 'contacted' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'Internal notes about this signup.',
      },
    },
  ],
};
