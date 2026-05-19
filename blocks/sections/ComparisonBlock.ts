import type { Block } from 'payload';
import { noEmoji, warnOnNamedCompetitors } from './_validators';

export const ComparisonBlock: Block = {
  slug: 'comparisonBlock',
  dbName: 'compare',
  labels: { singular: 'Comparison Table', plural: 'Comparison Tables' },
  fields: [
    { name: 'anchorId', type: 'text', defaultValue: '#why' },
    { name: 'title', type: 'text' },
    {
      name: 'leadSentence',
      type: 'text',
      admin: { description: 'AEO first sentence.' },
      validate: noEmoji,
    },
    {
      name: 'columns',
      type: 'array',
      minRows: 2,
      maxRows: 4,
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'isUs',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Tick the column that represents Nexotek.' },
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'cells',
          type: 'array',
          admin: { description: 'One cell per column in order.' },
          fields: [{ name: 'value', type: 'text' }],
        },
        {
          name: 'detail',
          type: 'textarea',
          admin: {
            description:
              'Long-form copy (~80–120 words) shown when a visitor opens this pillar in the click-through dialog. Plain prose, no markdown.',
          },
          validate: noEmoji,
        },
      ],
    },
    {
      name: 'showNamedCompetitorsPublicly',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Default off. When off, the table reads as "Nexotek vs. detection-only tools".',
      },
      validate: warnOnNamedCompetitors,
    },
  ],
};
