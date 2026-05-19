import type { Block } from 'payload';
import { noEmoji } from './_validators';

export const FaqBlock: Block = {
  slug: 'faqBlock',
  dbName: 'faq',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  fields: [
    { name: 'anchorId', type: 'text', defaultValue: '#faq' },
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'leadSentence',
      type: 'text',
      admin: { description: 'AEO first sentence — one concise definition of this section.' },
      validate: noEmoji,
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 24,
      fields: [
        { name: 'question', type: 'text', required: true, validate: noEmoji },
        { name: 'answer', type: 'richText', required: true, validate: noEmoji },
        {
          name: 'linkAnchor',
          type: 'text',
          admin: { description: 'Optional cross-link to a section anchor (e.g. "#loop").' },
        },
      ],
    },
  ],
};
