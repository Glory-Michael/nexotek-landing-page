import type { Block } from 'payload';
import { noEmoji, noEmojiAndNoHype, noEmojiAndRoadmapDisclaimer } from './_validators';
import { NX_ICON_OPTIONS } from './_icon-options';

export const LoopDiagramBlock: Block = {
  slug: 'loopDiagramBlock',
  dbName: 'loop',
  labels: { singular: 'Loop Diagram', plural: 'Loop Diagrams' },
  fields: [
    { name: 'anchorId', type: 'text', defaultValue: '#loop' },
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
      name: 'nodes',
      type: 'array',
      minRows: 4,
      maxRows: 4,
      admin: {
        description:
          'Four folds: 01 DETECT, 02 RECONSTRUCT, 03 TRAIN, 04 CONVERGE. Fold 04 is roadmap until further notice.',
      },
      fields: [
        { name: 'index', type: 'text', required: true, admin: { description: 'e.g. "01"' } },
        { name: 'label', type: 'text', required: true, admin: { description: 'e.g. "DETECT"' } },
        {
          name: 'icon',
          type: 'select',
          options: NX_ICON_OPTIONS,
          admin: {
            description:
              'Icon shown on the phase tile. Leave blank to auto-pick from the label (DETECT → radar, RECONSTRUCT → globe, TRAIN → shield, CONVERGE → grid).',
          },
        },
        { name: 'tagline', type: 'text' },
        {
          name: 'body',
          type: 'richText',
          validate: noEmojiAndRoadmapDisclaimer,
        },
        {
          name: 'anchorLink',
          type: 'text',
          admin: { description: 'Optional anchor to a downstream section, e.g. "#vision".' },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'current',
          options: [
            { label: 'Current capability', value: 'current' },
            { label: 'Roadmap', value: 'roadmap' },
          ],
        },
        {
          name: 'statusLabel',
          type: 'text',
          admin: {
            description:
              'Override badge text. Defaults to "ROADMAP" when status is roadmap; blank otherwise.',
          },
        },
      ],
    },
    {
      name: 'revealMode',
      type: 'select',
      defaultValue: 'pinnedSequence',
      options: [
        { label: 'Pinned sequence', value: 'pinnedSequence' },
        { label: 'Viewport-tracked', value: 'viewportTracked' },
        { label: 'Folded list', value: 'foldedList' },
      ],
    },
    {
      name: 'pinDistancePerNodeVh',
      type: 'number',
      defaultValue: 90,
    },
    {
      name: 'singleOpenAtATime',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showPhaseReadout',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'packetMotion',
      type: 'select',
      defaultValue: 'between-rows',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Between rows', value: 'between-rows' },
        { label: 'Inside row', value: 'inside-row' },
      ],
    },
    {
      name: 'loopRing',
      type: 'group',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        {
          name: 'position',
          type: 'select',
          defaultValue: 'right',
          options: [
            { label: 'Right', value: 'right' },
            { label: 'Left', value: 'left' },
            { label: 'Inline', value: 'inline' },
          ],
        },
        { name: 'size', type: 'number', defaultValue: 80 },
        { name: 'revolutionMs', type: 'number', defaultValue: 24000 },
        { name: 'showCycleCounter', type: 'checkbox', defaultValue: true },
        {
          name: 'startingCycle',
          type: 'number',
          defaultValue: 42,
          admin: { description: 'CMS-controlled launch baseline for the cycle counter.' },
        },
        { name: 'autonomousTickWhileVisible', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'closureBeat',
      type: 'group',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        { name: 'durationMs', type: 'number', defaultValue: 600 },
        {
          name: 'easing',
          type: 'text',
          defaultValue: 'var(--nx-ease-emphasis)',
        },
        { name: 'incrementCycleCounter', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'sash',
      type: 'group',
      admin: { description: 'Tier 1.5 cross-section sash. Off by default.' },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false },
        {
          name: 'scope',
          type: 'select',
          defaultValue: 'next-section',
          options: [
            { label: 'Next section', value: 'next-section' },
            { label: 'Rest of page', value: 'rest-of-page' },
          ],
        },
        {
          name: 'text',
          type: 'text',
          defaultValue: '← LOOP · CYCLE {n} · RUNNING',
          validate: noEmojiAndNoHype,
        },
      ],
    },
    {
      name: 'testimonial',
      type: 'group',
      label: 'Founder testimonial',
      admin: {
        description:
          'Sticky pull-quote rendered directly after the loop diagram. Toggle off to hide entirely.',
      },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: 'From the team',
          validate: noEmoji,
        },
        {
          name: 'quote',
          type: 'textarea',
          admin: {
            description:
              'Long-form founder quote (~30–60 words). The word-by-word highlight animation reads any prose.',
          },
          validate: noEmoji,
        },
        {
          name: 'attributionName',
          type: 'text',
          defaultValue: 'Michael Xu',
          validate: noEmoji,
        },
        {
          name: 'attributionRole',
          type: 'text',
          defaultValue: 'Product Manager, Nexotek',
          validate: noEmoji,
        },
        {
          name: 'attributionInitials',
          type: 'text',
          maxLength: 3,
          defaultValue: 'MX',
          admin: { description: '1–3 characters. Shown inside the round avatar plate.' },
          validate: noEmoji,
        },
      ],
    },
  ],
};
