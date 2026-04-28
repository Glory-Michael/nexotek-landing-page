import type { CollectionConfig } from 'payload';
import { canWrite } from '@/lib/access';

export const Events: CollectionConfig = {
  slug: 'events',
  dbName: 'payload_events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'isOpen', 'createdAt'],
    description: 'Industry events where Nexotek has a presence (booth, demo, speaking slot).',
    group: 'Events',
  },
  access: {
    read: () => true,
    create: canWrite,
    update: canWrite,
    delete: canWrite,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal label only (e.g. "CES 2026"). Not shown on the public page.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL segment (e.g. "ces-2026" → /events/ces-2026).',
      },
    },
    {
      name: 'boothInfo',
      type: 'text',
      admin: {
        description: 'Shown below the CTA button (e.g. "Booth #C-214, Hall C").',
      },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      defaultValue: 'Request a Demo',
      admin: {
        description: 'Text for the registration form submit button.',
      },
    },
    {
      name: 'isOpen',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Uncheck to close registration and show a "no longer connecting" message.',
        position: 'sidebar',
      },
    },
    {
      name: 'fieldConfig',
      type: 'group',
      label: 'Required Form Fields',
      admin: {
        description: 'Toggle which fields are mandatory on the registration form.',
      },
      fields: [
        {
          name: 'requireName',
          type: 'checkbox',
          defaultValue: true,
          label: 'Name required',
        },
        {
          name: 'requireOrganization',
          type: 'checkbox',
          defaultValue: true,
          label: 'Organization required',
        },
        {
          name: 'requirePhone',
          type: 'checkbox',
          defaultValue: true,
          label: 'Phone required',
        },
        {
          name: 'requireEmail',
          type: 'checkbox',
          defaultValue: true,
          label: 'Email required',
        },
      ],
    },
    {
      name: 'notificationRecipients',
      type: 'group',
      label: 'Lead Notification Recipients',
      admin: {
        description: 'Who receives an email when someone registers for this event.',
      },
      fields: [
        {
          name: 'globalSubscribers',
          type: 'relationship',
          relationTo: 'users',
          hasMany: true,
          label: 'Enabled globally',
          admin: {
            readOnly: true,
            description: 'Auto-populated. These users receive notifications for every event because of their profile setting or admin role. Manage via Users → profile sidebar.',
          },
          access: {
            read: ({ req }) => Boolean(req.user),
            create: () => false,
            update: () => false,
          },
          hooks: {
            afterRead: [
              async ({ req }) => {
                if (!req.user || !req.payload) return [];
                try {
                  const result = await req.payload.find({
                    collection: 'users',
                    where: { notifyOnEventLead: { equals: true } },
                    limit: 100,
                    depth: 0,
                  });
                  return result.docs.map((u) => u.id);
                } catch {
                  return [];
                }
              },
            ],
          },
        },
        {
          name: 'users',
          type: 'relationship',
          relationTo: 'users',
          hasMany: true,
          label: 'Event-specific team members',
          admin: {
            description: 'Select additional users to notify for this event only. Globally-subscribed users above are excluded from this picker.',
          },
          filterOptions: {
            and: [
              { role: { not_equals: 'admin' } },
              { notifyOnEventLead: { not_equals: true } },
            ],
          },
        },
        {
          name: 'additionalEmails',
          type: 'array',
          label: 'Additional emails',
          admin: {
            description: 'Extra addresses outside the system (e.g. agency partners, clients).',
          },
          fields: [
            {
              name: 'email',
              type: 'email',
              required: true,
              label: 'Email address',
            },
          ],
        },
      ],
    },
    {
      name: 'showDiagram',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show the platform overview section on the left panel of the event page.',
        position: 'sidebar',
      },
    },
    {
      name: 'showSkylineScene',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Replace the four-pillar diagram with the 3D dot-matrix skyline & worker scene (requires Show Diagram to be enabled).',
        position: 'sidebar',
      },
    },
  ],
};
