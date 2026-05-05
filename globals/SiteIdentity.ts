import type { GlobalConfig } from 'payload';
import { canWrite } from '@/lib/access';

export const SiteIdentity: GlobalConfig = {
  slug: 'site-identity',
  label: 'Site Identity',
  access: {
    update: canWrite,
    read: () => true,
  },
  admin: {
    description: 'Global site name, metadata defaults, icons, and typography.',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        // ─── Identity ────────────────────────────────────────────────────────
        {
          label: 'Identity',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'siteName',
                  label: 'Site Name',
                  type: 'text',
                  required: true,
                  defaultValue: 'Nexotek',
                  admin: {
                    width: '50%',
                    description: 'Used in the browser tab title and OG tags.',
                  },
                },
                {
                  name: 'tagline',
                  label: 'Tagline',
                  type: 'text',
                  defaultValue: 'The Future of Spatial Intelligence',
                  admin: {
                    width: '50%',
                    description: 'Short phrase appended to the default page title.',
                  },
                },
              ],
            },
            {
              name: 'metaTitleTemplate',
              label: 'Title Template',
              type: 'text',
              defaultValue: '{siteName} | {tagline}',
              admin: {
                description:
                  'Template for the default browser tab title. Use {siteName} and {tagline} as placeholders. Sub-pages override this via the SEO plugin.',
              },
            },
            {
              name: 'metaDescription',
              label: 'Default Meta Description',
              type: 'textarea',
              defaultValue:
                'Nexotek is building the next generation of Spatial Intelligence. Sign up for updates.',
              admin: {
                description:
                  'Used as the site-wide fallback description for search engines and social sharing.',
              },
            },
          ],
        },

        // ─── Icons ───────────────────────────────────────────────────────────
        {
          label: 'Icons',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'favicon',
                  label: 'Favicon',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    width: '33%',
                    description: 'Browser tab icon (.ico, .png, or .svg recommended).',
                  },
                },
                {
                  name: 'appleIcon',
                  label: 'Apple Touch Icon',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    width: '33%',
                    description: '180×180 px PNG for iOS home screen.',
                  },
                },
                {
                  name: 'ogImage',
                  label: 'Default OG Image',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    width: '33%',
                    description:
                      'Fallback Open Graph image for social sharing (1200×630 px recommended). Per-page images set via the SEO plugin take priority.',
                  },
                },
              ],
            },
          ],
        },

        // ─── Theme ──────────────────────────────────────────────────────────
        {
          label: 'Theme',
          fields: [
            {
              name: 'themeMode',
              label: 'Theme Mode',
              type: 'select',
              defaultValue: 'light',
              options: [
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
                { label: 'System', value: 'system' },
                { label: 'Scheduled', value: 'scheduled' },
              ],
              admin: {
                description: 'Controls the color scheme for all pages site-wide.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'lightStartTime',
                  label: 'Light Starts At',
                  type: 'text',
                  defaultValue: '06:00',
                  admin: {
                    width: '50%',
                    placeholder: 'HH:MM',
                    condition: (data) => data?.themeMode === 'scheduled',
                    description: 'Time when light mode begins (24h format).',
                  },
                },
                {
                  name: 'darkStartTime',
                  label: 'Dark Starts At',
                  type: 'text',
                  defaultValue: '18:00',
                  admin: {
                    width: '50%',
                    placeholder: 'HH:MM',
                    condition: (data) => data?.themeMode === 'scheduled',
                    description: 'Time when dark mode begins (24h format).',
                  },
                },
              ],
            },
          ],
        },

        // ─── Global Fonts ────────────────────────────────────────────────────
        {
          label: 'Global Fonts',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'bodyFont',
                  label: 'Body Font',
                  type: 'select',
                  defaultValue: 'inter',
                  options: [
                    { label: 'Geist (NX brand)', value: 'geist' },
                    { label: 'Inter', value: 'inter' },
                    { label: 'DM Sans', value: 'dm-sans' },
                    { label: 'Plus Jakarta Sans', value: 'plus-jakarta-sans' },
                    { label: 'Nunito', value: 'nunito' },
                    { label: 'Lato', value: 'lato' },
                    { label: 'Roboto', value: 'roboto' },
                    { label: 'System Default', value: 'system' },
                  ],
                  admin: {
                    width: '50%',
                    description: 'Primary font for body text, UI labels, and general copy.',
                  },
                },
                {
                  name: 'displayFont',
                  label: 'Display / Heading Font',
                  type: 'select',
                  defaultValue: 'space-grotesk',
                  options: [
                    { label: 'Geist (NX brand)', value: 'geist' },
                    { label: 'Space Grotesk', value: 'space-grotesk' },
                    { label: 'Outfit', value: 'outfit' },
                    { label: 'Sora', value: 'sora' },
                    { label: 'Lexend', value: 'lexend' },
                    { label: 'Raleway', value: 'raleway' },
                    { label: 'System Default', value: 'system' },
                  ],
                  admin: {
                    width: '50%',
                    description: 'Font used for hero titles, headings, and display text.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
