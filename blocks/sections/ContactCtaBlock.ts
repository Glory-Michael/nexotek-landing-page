import type { Block } from 'payload';
import { noEmoji } from './_validators';

export const ContactCtaBlock: Block = {
  slug: 'contactCtaBlock',
  dbName: 'contact_cta',
  labels: { singular: 'Contact CTA', plural: 'Contact CTAs' },
  fields: [
    { name: 'anchorId', type: 'text', defaultValue: '#contact' },
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text', validate: noEmoji },
    {
      name: 'leadSentence',
      type: 'text',
      admin: { description: 'AEO first sentence.' },
      validate: noEmoji,
    },
    { name: 'body', type: 'richText', validate: noEmoji },
    {
      name: 'primaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true, defaultValue: 'TALK TO OUR TEAM' },
        {
          name: 'mode',
          type: 'select',
          required: true,
          defaultValue: 'leadForm',
          options: [
            { label: 'Open lead form', value: 'leadForm' },
            { label: 'Link to URL', value: 'href' },
          ],
        },
        {
          name: 'href',
          type: 'text',
          admin: { condition: (_, sibling) => sibling?.mode === 'href' },
        },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        {
          name: 'mode',
          type: 'select',
          defaultValue: 'href',
          options: [
            { label: 'Open email signup', value: 'emailForm' },
            { label: 'Link to URL', value: 'href' },
          ],
        },
        {
          name: 'href',
          type: 'text',
          admin: { condition: (_, sibling) => sibling?.mode === 'href' },
        },
      ],
    },
    {
      name: 'trustRow',
      type: 'array',
      admin: {
        description:
          'Only include items that are presently true. Examples: "SOC 2 COMPLIANCE PLANNED", "GDPR-READY", "DATA STAYS ON-PREM".',
      },
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    {
      name: 'partners',
      type: 'array',
      labels: { singular: 'Partner', plural: 'Partners' },
      admin: {
        description:
          'Logos/names shown in the marquee above the CTA. Leave empty to hide the carousel. Use "Placeholder" kind for category slots you have not signed yet — they render dimmed and italicized.',
      },
      fields: [
        { name: 'name', type: 'text', required: true, validate: noEmoji },
        {
          name: 'category',
          type: 'text',
          required: true,
          admin: { description: 'Short uppercase tag, e.g. "CREDENTIALED TRAINING".' },
          validate: noEmoji,
        },
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'real',
          options: [
            { label: 'Real partner', value: 'real' },
            { label: 'Placeholder', value: 'placeholder' },
          ],
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description:
              'Optional. PNG, SVG, or WebP. Renders in place of the partner name. For dark backgrounds use a light/white logo. Recommended height: ~80px.',
          },
        },
      ],
    },
  ],
};
