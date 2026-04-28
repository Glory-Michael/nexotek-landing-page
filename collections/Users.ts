import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  trash: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'createdAt'],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Read Only', value: 'read-only' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'notifyOnEventLead',
      type: 'checkbox',
      defaultValue: false,
      label: 'Receive event lead notifications',
      admin: {
        position: 'sidebar',
        description: 'Send this user an email whenever a new event registration comes in. Admins are always notified.',
      },
    },
  ],
};
