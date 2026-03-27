import type { CollectionConfig } from 'payload';

export const EmailLog: CollectionConfig = {
  slug: 'email-log',
  dbName: 'payload_email_log',
  admin: {
    useAsTitle: 'to',
    defaultColumns: ['to', 'subject', 'status', 'createdAt'],
    description: 'Log of all emails sent via Resend.',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'to',
          type: 'email',
          required: true,
          admin: { width: '50%', readOnly: true },
        },
        {
          name: 'subject',
          type: 'text',
          required: true,
          admin: { width: '50%', readOnly: true },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'resendId',
      label: 'Resend ID',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The Resend message ID for tracking.',
      },
    },
    {
      name: 'error',
      type: 'textarea',
      admin: {
        readOnly: true,
        condition: (data) => data?.status === 'failed',
      },
    },
  ],
};
