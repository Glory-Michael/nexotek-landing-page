import type { Block } from 'payload';
import { noEmojiAndNoHype } from './_validators';
import { NX_ICON_OPTIONS } from './_icon-options';

export const TrustStripBlock: Block = {
  slug: 'trustStripBlock',
  dbName: 'trust',
  labels: { singular: 'Trust Strip', plural: 'Trust Strips' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      defaultValue: '#trust',
      admin: { description: 'Anchor id used for in-page links (include the leading "#").' },
    },
    {
      name: 'leadSentence',
      type: 'text',
      admin: {
        description:
          'AEO first sentence — one concise definition of the section. Used for SEO/AI engines.',
      },
      validate: noEmojiAndNoHype,
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 8,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'sublabel', type: 'text' },
        {
          name: 'icon',
          type: 'select',
          options: NX_ICON_OPTIONS,
          admin: {
            description:
              'Optional. Leave blank to auto-pick from the label.',
          },
        },
      ],
    },
  ],
};
