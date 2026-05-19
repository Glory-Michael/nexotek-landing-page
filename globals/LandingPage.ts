import type { GlobalConfig } from 'payload';
import { canWrite } from '@/lib/access';
import {
  lexicalEditor,
  LinkFeature,
  HeadingFeature,
  AlignFeature,
  OrderedListFeature,
  UnorderedListFeature,
  BlockquoteFeature,
  EXPERIMENTAL_TableFeature,
  UploadFeature,
  HorizontalRuleFeature,
  FixedToolbarFeature,
  TextStateFeature,
  defaultColors,
} from '@payloadcms/richtext-lexical';
import { TrustStripBlock } from '@/blocks/sections/TrustStripBlock';
import { LoopDiagramBlock } from '@/blocks/sections/LoopDiagramBlock';
import { ThreadBlock } from '@/blocks/sections/ThreadBlock';
import { ComparisonBlock } from '@/blocks/sections/ComparisonBlock';
import { WhoWeServeBlock } from '@/blocks/sections/WhoWeServeBlock';
import { CredentialBlock } from '@/blocks/sections/CredentialBlock';
import { ProofGridBlock } from '@/blocks/sections/ProofGridBlock';
import { FaqBlock } from '@/blocks/sections/FaqBlock';
import { ContactCtaBlock } from '@/blocks/sections/ContactCtaBlock';
import { noEmoji } from '@/blocks/sections/_validators';

const headlineEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    FixedToolbarFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
    LinkFeature(),
    AlignFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    EXPERIMENTAL_TableFeature(),
    UploadFeature(),
    HorizontalRuleFeature(),
    TextStateFeature({
      state: {
        color: defaultColors.text,
        background: defaultColors.background,
      },
    }),
  ],
});

const bodyEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    FixedToolbarFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5'] }),
    LinkFeature(),
    AlignFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    EXPERIMENTAL_TableFeature(),
    UploadFeature(),
    HorizontalRuleFeature(),
    TextStateFeature({
      state: {
        color: defaultColors.text,
        background: defaultColors.background,
      },
    }),
  ],
});

export const LandingPage: GlobalConfig = {
  slug: 'landing-page',
  label: 'Landing Page',
  access: {
    update: canWrite,
    read: () => true,
  },
  admin: {
    livePreview: {
      url: ({ data, locale }) => {
        const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const mode = (data as { livePreviewMode?: string } | undefined)?.livePreviewMode;
        const localeQs = locale ? `&locale=${locale}` : '';
        if (mode === 'v2-gated') {
          return `${base}/?preview=true&v2=1${localeQs}`;
        }
        return `${base}/?preview=true${localeQs}`;
      },
    },
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'livePreviewMode',
      label: 'Live Preview Target',
      type: 'select',
      defaultValue: 'current',
      options: [
        { label: 'Current homepage', value: 'current' },
        { label: 'v2 layout (Hero v2 + Sections)', value: 'v2-gated' },
      ],
      admin: {
        description:
          'Which homepage variant the admin live-preview iframe opens. The v2 layout renders Hero v2 + the Sections composer with live updates.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'hero',
              type: 'group',
              label: 'Hero',
              fields: [
                {
                  name: 'title',
                  label: 'Hero Title',
                  type: 'richText',
                  required: true,
                  editor: headlineEditor,
                  admin: {
                    description: 'Main headline. Use bold/italic for emphasis.',
                  },
                },
                {
                  name: 'body',
                  label: 'Hero Body',
                  type: 'richText',
                  required: true,
                  editor: bodyEditor,
                  admin: {
                    description: 'Supporting text below the title.',
                  },
                },
                {
                  name: 'heroImage',
                  label: 'Hero Background Image',
                  type: 'upload',
                  relationTo: 'media',
                },
              ],
            },
            {
              name: 'emailForm',
              type: 'group',
              label: 'Email Form',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'emailPlaceholder',
                      label: 'Input Placeholder',
                      type: 'text',
                      defaultValue: 'Enter your email address...',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'buttonText',
                      label: 'Button Text',
                      type: 'text',
                      defaultValue: 'Join',
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  name: 'successMessage',
                  label: 'Success Message',
                  type: 'richText',
                  editor: headlineEditor,
                },
                {
                  name: 'termsText',
                  label: 'Terms Disclaimer',
                  type: 'richText',
                  editor: bodyEditor,
                  admin: {
                    description: 'Use links for Terms/Privacy.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Style',
          fields: [
            {
              name: 'typography',
              type: 'group',
              label: 'Typography',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'headingFont',
                      label: 'Heading Font',
                      type: 'select',
                      defaultValue: 'space-grotesk',
                      options: [
                        { label: 'Geist (NX brand)', value: 'geist' },
                        { label: 'Space Grotesk', value: 'space-grotesk' },
                        { label: 'Inter', value: 'inter' },
                        { label: 'System Sans', value: 'system' },
                        { label: 'Georgia (Serif)', value: 'serif' },
                        { label: 'Monospace', value: 'mono' },
                      ],
                      admin: { width: '33%' },
                    },
                    {
                      name: 'accentFont',
                      label: 'Accent Font (italic text)',
                      type: 'select',
                      defaultValue: 'serif',
                      options: [
                        { label: 'Serif (default)', value: 'serif' },
                        { label: 'Same as Heading', value: 'heading' },
                        { label: 'Inter', value: 'inter' },
                        { label: 'System Sans', value: 'system' },
                        { label: 'Monospace', value: 'mono' },
                      ],
                      admin: {
                        width: '33%',
                        description: 'Font for italic/emphasized text in the hero title.',
                      },
                    },
                    {
                      name: 'bodyFont',
                      label: 'Body Font',
                      type: 'select',
                      defaultValue: 'inter',
                      options: [
                        { label: 'Geist (NX brand)', value: 'geist' },
                        { label: 'Inter', value: 'inter' },
                        { label: 'System Sans', value: 'system' },
                        { label: 'Georgia (Serif)', value: 'serif' },
                      ],
                      admin: { width: '33%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'heroTitleSize',
                      label: 'Title Size',
                      type: 'select',
                      defaultValue: 'default',
                      options: [
                        { label: 'Small', value: 'small' },
                        { label: 'Default', value: 'default' },
                        { label: 'Large', value: 'large' },
                        { label: 'XL', value: 'xl' },
                      ],
                      admin: { width: '50%' },
                    },
                    {
                      name: 'subtitleSize',
                      label: 'Subtitle Size',
                      type: 'select',
                      defaultValue: 'default',
                      options: [
                        { label: 'Small', value: 'small' },
                        { label: 'Default', value: 'default' },
                        { label: 'Large', value: 'large' },
                      ],
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'titleSpacing',
                      label: 'Title Bottom Spacing',
                      type: 'select',
                      defaultValue: 'default',
                      options: [
                        { label: 'Tight', value: 'tight' },
                        { label: 'Default', value: 'default' },
                        { label: 'Relaxed', value: 'relaxed' },
                      ],
                      admin: { width: '50%' },
                    },
                    {
                      name: 'contentPadding',
                      label: 'Content Padding',
                      type: 'select',
                      defaultValue: 'default',
                      options: [
                        { label: 'Compact', value: 'compact' },
                        { label: 'Default', value: 'default' },
                        { label: 'Spacious', value: 'spacious' },
                      ],
                      admin: { width: '50%' },
                    },
                  ],
                },
              ],
            },
            {
              name: 'effects',
              type: 'group',
              label: 'Effects',
              fields: [
                {
                  name: 'handwritingAnimation',
                  label: 'Handwriting Animation',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description: 'Animate the hero title with an SVG stroke-reveal drawing effect using the current heading font.',
                  },
                },
              ],
            },
            {
              name: 'cursors',
              type: 'group',
              label: 'Cursors',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'customCursor',
                      label: 'Custom Cursor',
                      type: 'checkbox',
                      defaultValue: true,
                      admin: {
                        width: '50%',
                        description: 'Rounded dot cursor that follows the mouse on desktop.',
                      },
                    },
                    {
                      name: 'dotMatrixCursor',
                      label: '3D Dot Matrix Cursor',
                      type: 'checkbox',
                      defaultValue: true,
                      admin: {
                        width: '50%',
                        description: 'Arrow-pattern dot cursor shown over the 3D scene.',
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: 'theme',
              type: 'group',
              label: 'Theme',
              fields: [
                {
                  name: 'mode',
                  label: 'Theme Mode',
                  type: 'select',
                  defaultValue: 'light',
                  options: [
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' },
                    { label: 'System', value: 'system' },
                    { label: 'Scheduled', value: 'scheduled' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'lightStartTime',
                      label: 'Light Starts At',
                      type: 'text',
                      defaultValue: '06:00',
                      admin: { width: '50%', placeholder: 'HH:MM', condition: (data) => data?.theme?.mode === 'scheduled' },
                    },
                    {
                      name: 'darkStartTime',
                      label: 'Dark Starts At',
                      type: 'text',
                      defaultValue: '18:00',
                      admin: { width: '50%', placeholder: 'HH:MM', condition: (data) => data?.theme?.mode === 'scheduled' },
                    },
                  ],
                },
              ],
            },
            {
              name: 'scene',
              type: 'group',
              label: '3D Scene',
              fields: [
                {
                  name: 'customModel',
                  label: 'Custom 3D Model (GLB/GLTF)',
                  type: 'upload',
                  relationTo: 'media',
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'modelScale',
                      label: 'Scale',
                      type: 'number',
                      defaultValue: 1,
                      admin: { width: '33%', step: 0.1, condition: (data) => !!data?.scene?.customModel },
                    },
                    {
                      name: 'autoRotate',
                      label: 'Auto-Rotate',
                      type: 'checkbox',
                      defaultValue: true,
                      admin: { width: '33%' },
                    },
                    {
                      name: 'rotationSpeed',
                      label: 'Speed',
                      type: 'number',
                      defaultValue: 0.5,
                      admin: { width: '33%', step: 0.1, condition: (data) => data?.scene?.autoRotate === true },
                    },
                  ],
                },
                {
                  name: 'backgroundColor',
                  label: 'Background Color',
                  type: 'text',
                  admin: { placeholder: 'transparent' },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'pointSize',
                      label: 'Point Size',
                      type: 'number',
                      defaultValue: 3.5,
                      admin: { width: '50%', step: 0.5, condition: (data) => !data?.scene?.customModel },
                    },
                    {
                      name: 'accentColor',
                      label: 'Accent Color',
                      type: 'text',
                      defaultValue: '#00c8ff',
                      admin: { width: '50%', condition: (data) => !data?.scene?.customModel },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Homepage',
          description:
            'New modular homepage. Hero v2 fields and the Sections composer. Legacy hero stays in the Content tab until Phase 7.',
          fields: [
            {
              name: 'heroV2',
              type: 'group',
              label: 'Hero v2',
              fields: [
                {
                  name: 'backgroundImage',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description:
                      'Faded background photograph behind the hero composition. Renders at ~18% opacity, grayscale. Wide landscape, ~1920×1080 or larger.',
                  },
                },
                { name: 'eyebrow', type: 'text', validate: noEmoji },
                {
                  name: 'headlineLines',
                  type: 'array',
                  admin: {
                    description:
                      'One line per row. Line breaks are honored verbatim — no <br/> needed.',
                  },
                  fields: [{ name: 'value', type: 'text', required: true, validate: noEmoji }],
                },
                {
                  name: 'leadSentence',
                  type: 'text',
                  admin: { description: 'AEO first sentence — concise category definition.' },
                  validate: noEmoji,
                },
                {
                  name: 'primaryCta',
                  type: 'group',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      defaultValue: 'TALK TO OUR TEAM',
                    },
                    {
                      name: 'mode',
                      type: 'select',
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
              ],
            },
            {
              name: 'sections',
              label: 'Sections',
              type: 'blocks',
              admin: {
                description:
                  'Drag to reorder. Default homepage order: Trust → Loop → Vision Thread → Spatial Thread → Training (Credential) → Comparison → Who We Serve → Proof → FAQ → Contact CTA.',
              },
              blocks: [
                TrustStripBlock,
                LoopDiagramBlock,
                ThreadBlock,
                CredentialBlock,
                ComparisonBlock,
                WhoWeServeBlock,
                ProofGridBlock,
                FaqBlock,
                ContactCtaBlock,
              ],
            },
          ],
        },
        // SEO tab is auto-injected by @payloadcms/plugin-seo
      ],
    },
  ],
};
