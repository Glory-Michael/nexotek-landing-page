import type { Block } from 'payload';
import { noEmoji, noEmojiAndNoHype } from './_validators';

export const ProofGridBlock: Block = {
  slug: 'proofGridBlock',
  dbName: 'proof',
  labels: { singular: 'Proof Grid', plural: 'Proof Grids' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      defaultValue: '#proof',
    },
    {
      name: 'leadSentence',
      type: 'text',
      admin: { description: 'AEO first sentence — one concise definition of this section.' },
      validate: noEmoji,
    },
    {
      name: 'tiles',
      type: 'array',
      minRows: 1,
      maxRows: 12,
      fields: [
        {
          name: 'headline',
          type: 'text',
          required: true,
          validate: noEmojiAndNoHype,
        },
        { name: 'sub', type: 'text' },
        { name: 'footnote', type: 'text' },
        {
          name: 'citationSource',
          type: 'text',
          admin: {
            description:
              'Source title shown when the visitor clicks "SHOW SOURCE". Leave blank to hide the button.',
          },
          validate: noEmoji,
        },
        {
          name: 'citationDetail',
          type: 'textarea',
          admin: {
            description:
              'Longer source explanation shown below the title. Optional.',
            condition: (_, sibling) => Boolean(sibling?.citationSource),
          },
          validate: noEmoji,
        },
      ],
    },
  ],
};
