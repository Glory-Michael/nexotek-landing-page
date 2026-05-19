import type { Block } from 'payload';
import { noEmoji, noEmojiAndNoHype } from './_validators';
import { NX_ICON_OPTIONS } from './_icon-options';

export const CredentialBlock: Block = {
  slug: 'credentialBlock',
  dbName: 'credential',
  labels: { singular: 'Credential Block', plural: 'Credential Blocks' },
  fields: [
    { name: 'anchorId', type: 'text', defaultValue: '#train' },
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
      name: 'badges',
      type: 'array',
      admin: {
        description:
          'E.g. IACET ACCREDITED PROVIDER · Licensed SSM/SSC/CFSM · NYC SST/DOB/OSHA.',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'sub', type: 'text' },
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
    {
      name: 'stats',
      type: 'array',
      admin: {
        description:
          'E.g. 100,000 workers · 500 sites · $50M in mitigated claims. Attribute to NextWave Safety in the section copy.',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          validate: noEmojiAndNoHype,
        },
        { name: 'label', type: 'text', required: true },
      ],
    },
    {
      name: 'disclaimer',
      type: 'text',
      admin: {
        description:
          'Required attribution where formal credentialing is mentioned, e.g. "co-developed with NextWave Safety".',
      },
    },
  ],
};
