import type { Block } from 'payload';
import { noEmoji } from './_validators';

export const WhoWeServeBlock: Block = {
  slug: 'whoWeServeBlock',
  dbName: 'who_serve',
  labels: { singular: 'Who We Serve', plural: 'Who We Serve Blocks' },
  fields: [
    { name: 'anchorId', type: 'text', defaultValue: '#who-we-serve' },
    {
      name: 'leadSentence',
      type: 'text',
      admin: { description: 'AEO first sentence.' },
      validate: noEmoji,
    },
    {
      name: 'companion',
      type: 'group',
      admin: {
        description:
          'Copy for the paired ShowcaseFlip "Operator surfaces" demo that renders above this section. Leave any field blank to fall back to the hardcoded default.',
      },
      fields: [
        { name: 'eyebrow', type: 'text', validate: noEmoji },
        { name: 'headlineLine1', type: 'text', validate: noEmoji },
        { name: 'headlineLine2', type: 'text', validate: noEmoji },
        {
          name: 'leadSentence',
          type: 'text',
          admin: { description: 'Sub-headline beneath the companion headline.' },
          validate: noEmoji,
        },
        {
          name: 'queueTabLabel',
          type: 'text',
          defaultValue: '01 · QUEUE',
          admin: { description: 'Mobile tab label for the alert-queue mockup.' },
          validate: noEmoji,
        },
        {
          name: 'dashboardTabLabel',
          type: 'text',
          defaultValue: '02 · DASHBOARD',
          admin: { description: 'Mobile tab label for the dashboard mockup.' },
          validate: noEmoji,
        },
      ],
    },
    {
      name: 'demos',
      type: 'group',
      label: 'Inline demos',
      admin: {
        description:
          'Toggle visibility and set screen-reader alt text for the paired demo mockups in this section.',
      },
      fields: [
        {
          name: 'showcaseFlip',
          type: 'group',
          label: 'Operator surface (ShowcaseFlip)',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            {
              name: 'altText',
              type: 'text',
              defaultValue:
                'Operator-surface mockup that flips between an alert review queue and a dashboard.',
              validate: noEmoji,
            },
          ],
        },
      ],
    },
    {
      name: 'tabs',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        { name: 'key', type: 'text', required: true, admin: { description: 'URL-safe slug.' } },
        { name: 'label', type: 'text', required: true },
        { name: 'eyebrow', type: 'text' },
        { name: 'title', type: 'text', required: true, validate: noEmoji },
        { name: 'body', type: 'richText', validate: noEmoji },
        {
          name: 'photo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description:
              'Photo shown alongside this industry tab on desktop. Wide landscape, ~1200×800. Falls back to the per-key default if blank.',
          },
        },
        { name: 'ctaLabel', type: 'text' },
        { name: 'ctaHref', type: 'text' },
        {
          name: 'accentTokenPair',
          type: 'select',
          defaultValue: 'default',
          admin: {
            description: 'Brand-token accent pair. Defined in Phase 3; CMS-controlled now.',
          },
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Construction', value: 'construction' },
            { label: 'Habitation', value: 'habitation' },
            { label: 'Insurance', value: 'insurance' },
          ],
        },
      ],
    },
  ],
};
