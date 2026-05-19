import type { Block } from 'payload';
import { noEmoji, noEmojiAndForensicGuard } from './_validators';
import { NX_ICON_OPTIONS } from './_icon-options';

export const ThreadBlock: Block = {
  slug: 'threadBlock',
  dbName: 'thread',
  labels: { singular: 'Thread (Vision / Spatial / Training)', plural: 'Threads' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'vision',
      options: [
        { label: 'Vision', value: 'vision' },
        { label: 'Spatial', value: 'spatial' },
        { label: 'Training', value: 'train' },
      ],
      admin: { description: 'Determines anchor default and which variant-only fields appear.' },
    },
    {
      name: 'anchorId',
      type: 'text',
      admin: {
        description:
          'Defaults to "#vision" / "#spatial" / "#train" when blank — set explicitly to override.',
      },
    },
    { name: 'productName', type: 'text', required: true, validate: noEmoji },
    { name: 'tagline', type: 'text', validate: noEmoji },
    {
      name: 'leadSentence',
      type: 'text',
      admin: { description: 'AEO first sentence.' },
      validate: noEmoji,
    },
    {
      name: 'body',
      type: 'richText',
      validate: noEmojiAndForensicGuard,
    },
    {
      name: 'bullets',
      type: 'array',
      fields: [{ name: 'value', type: 'text', required: true, validate: noEmoji }],
    },
    {
      name: 'mediaType',
      type: 'select',
      defaultValue: 'image',
      options: [
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
        { label: 'Lottie', value: 'lottie' },
      ],
    },
    { name: 'mediaRef', type: 'upload', relationTo: 'media' },
    {
      name: 'chips',
      type: 'array',
      admin: {
        description:
          'Short mono chips for the section header. e.g. "On-prem · Camera-agnostic · No rip-and-replace".',
      },
      fields: [{ name: 'value', type: 'text', required: true, validate: noEmoji }],
    },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaHref', type: 'text' },
    {
      name: 'subItems',
      type: 'array',
      admin: {
        description: 'Spatial sub-cards. Hidden for other variants.',
        condition: (_, sibling) => sibling?.variant === 'spatial',
      },
      fields: [
        { name: 'title', type: 'text', required: true, validate: noEmoji },
        { name: 'body', type: 'richText', validate: noEmoji },
        {
          name: 'icon',
          type: 'select',
          options: NX_ICON_OPTIONS,
          admin: { description: 'Icon shown on the sub-card.' },
        },
      ],
    },
    {
      name: 'demoMode',
      type: 'select',
      defaultValue: 'none',
      admin: {
        description: 'Tier 1 demo mode. Wires in Phase 4; schema-only here.',
      },
      options: [
        { label: 'None', value: 'none' },
        { label: 'Detection grid (Vision)', value: 'detection-grid' },
        { label: 'Before/after comparison', value: 'before-after' },
        { label: 'Splat viewer (Spatial)', value: 'splat-viewer' },
        { label: 'Training quiz card (Train)', value: 'training-quiz' },
      ],
    },
    {
      name: 'comparisonAssets',
      type: 'group',
      admin: {
        description: 'Stills for the before/after comparison demo.',
        condition: (_, sibling) => sibling?.demoMode === 'before-after',
      },
      fields: [
        { name: 'beforeImage', type: 'upload', relationTo: 'media' },
        { name: 'afterImage', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'splatUrl',
      type: 'text',
      admin: {
        description:
          'URL to a .splat / .ply Gaussian-Splat asset. Do NOT use third-party demo splats.',
        condition: (_, sibling) =>
          sibling?.demoMode === 'splat-viewer' || sibling?.variant === 'spatial',
      },
    },
    {
      name: 'companion',
      type: 'group',
      admin: {
        description:
          'Copy for the paired PlatformShowcase demo that renders above the Vision thread. Leave any field blank to fall back to the hardcoded default.',
        condition: (_, sibling) =>
          sibling?.variant === 'vision' || !sibling?.variant,
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
      ],
    },
    {
      name: 'platformShowcase',
      type: 'group',
      label: 'Platform showcase',
      admin: {
        description:
          'Copy for the paired Platform section (operator console + reconstruction studio diptych) that renders directly after the Spatial thread. Toggle off to hide entirely.',
        condition: (_, sibling) => sibling?.variant === 'spatial',
      },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: 'Platform',
          validate: noEmoji,
        },
        {
          name: 'title',
          type: 'text',
          defaultValue: 'One platform. Every signal connected.',
          validate: noEmoji,
        },
        {
          name: 'leadSentence',
          type: 'text',
          defaultValue:
            'Operator surfaces and reconstruction studios — every signal the platform sees flows through the same decision loop.',
          validate: noEmoji,
        },
        {
          name: 'visionCaption',
          type: 'text',
          defaultValue: 'Vision · Operator console',
          admin: { description: 'Caption shown below the left mockup (ScreenDeck).' },
          validate: noEmoji,
        },
        {
          name: 'spatialCaption',
          type: 'text',
          defaultValue: 'Spatial · Reconstruction studio',
          admin: { description: 'Caption shown below the right mockup (SpatialStudioPeek).' },
          validate: noEmoji,
        },
        {
          name: 'flowSteps',
          type: 'array',
          minRows: 0,
          maxRows: 6,
          admin: {
            description:
              'Bottom-of-section flow caption. Empty = hide. Default: Detect → Reconstruct → Act.',
          },
          fields: [{ name: 'value', type: 'text', required: true, validate: noEmoji }],
        },
        {
          name: 'screenDeck',
          type: 'group',
          label: 'Operator console (ScreenDeck)',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            {
              name: 'altText',
              type: 'text',
              defaultValue:
                'Operator console preview cycling through Vision review queue, decision panel, and dashboard cards.',
              admin: { description: 'Screen-reader description of the auto-cycling card stack.' },
              validate: noEmoji,
            },
          ],
        },
        {
          name: 'spatialStudio',
          type: 'group',
          label: 'Reconstruction studio (SpatialStudioPeek)',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            {
              name: 'altText',
              type: 'text',
              defaultValue:
                'Reconstruction studio preview with an orbiting Gaussian-splat point cloud of a tower-crane excavator.',
              admin: { description: 'Screen-reader description of the R3F point-cloud scene.' },
              validate: noEmoji,
            },
          ],
        },
      ],
    },
    {
      name: 'visionDemos',
      type: 'group',
      label: 'Vision · Inline demos',
      admin: {
        description:
          'Toggle visibility and set screen-reader alt text for the inline mockups in the Vision thread.',
        condition: (_, sibling) =>
          sibling?.variant === 'vision' || !sibling?.variant,
      },
      fields: [
        {
          name: 'cameraGrid',
          type: 'group',
          label: 'Camera grid mockup',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            {
              name: 'altText',
              type: 'text',
              defaultValue:
                'Four-camera CCTV grid mockup with simulated AI detections overlaid on construction-site footage.',
              validate: noEmoji,
            },
          ],
        },
        {
          name: 'operatorCli',
          type: 'group',
          label: 'Operator CLI mockup',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            {
              name: 'altText',
              type: 'text',
              defaultValue: 'Terminal-style preview of the nx-cli operator surface.',
              validate: noEmoji,
            },
          ],
        },
        {
          name: 'floorplan',
          type: 'group',
          label: 'Floorplan 3D scene',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            {
              name: 'altText',
              type: 'text',
              defaultValue:
                '3D floorplan with placed cameras and field-of-view cones, viewed from a perspective angle.',
              validate: noEmoji,
            },
          ],
        },
      ],
    },
    {
      name: 'spatialDemos',
      type: 'group',
      label: 'Spatial · Inline demos',
      admin: {
        description:
          'Toggle visibility and set screen-reader alt text for the R3F scenes in the Spatial thread.',
        condition: (_, sibling) => sibling?.variant === 'spatial',
      },
      fields: [
        {
          name: 'spatialPeek',
          type: 'group',
          label: 'Spatial 3D yard scene',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            {
              name: 'altText',
              type: 'text',
              defaultValue:
                '3D reconstruction of a construction yard with forklift, pallets, traffic cones, and a scaffold tower.',
              validate: noEmoji,
            },
          ],
        },
        {
          name: 'liveView',
          type: 'group',
          label: 'Live view corner peek',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            {
              name: 'altText',
              type: 'text',
              defaultValue: 'Camera live-view preview with pan/tilt/zoom controls.',
              validate: noEmoji,
            },
          ],
        },
      ],
    },
  ],
};
