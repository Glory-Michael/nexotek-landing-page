import type { CollectionConfig } from 'payload';
import { canWrite } from '@/lib/access';

export const EventLeads: CollectionConfig = {
  slug: 'event-leads',
  dbName: 'payload_event_leads',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'organization', 'event', 'submittedAt'],
    description: 'Lead contact submissions from event landing pages.',
    group: 'Events',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true,
    update: canWrite,
    delete: canWrite,
  },
  defaultSort: '-submittedAt',
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'organization',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'submittedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: {
          displayFormat: 'MMM d, yyyy h:mm a',
        },
      },
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'UTM source or referrer (auto-populated).',
        position: 'sidebar',
      },
    },
  ],
};
