import type { GlobalConfig } from 'payload';

export const LandingPage: GlobalConfig = {
  slug: 'landing-page',
  label: 'Landing Page',
  access: {
    read: () => true,
  },
  admin: {
    livePreview: {
      url: ({ locale }) =>
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?preview=true${locale ? `&locale=${locale}` : ''}`,
    },
  },
  versions: {
    drafts: true,
  },
  fields: [
    // --- Hero Section ---
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            {
              name: 'hero',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'titleLine1',
                      label: 'Title (Line 1)',
                      type: 'text',
                      required: true,
                      defaultValue: 'Spatial Risk Intelligence,',
                      admin: { width: '60%' },
                    },
                    {
                      name: 'titleLine2',
                      label: 'Title (Line 2, italic)',
                      type: 'text',
                      required: true,
                      defaultValue: 'Redefined.',
                      admin: { width: '40%' },
                    },
                  ],
                },
                {
                  name: 'subtitle',
                  type: 'textarea',
                  required: true,
                  defaultValue:
                    'Nexotek is building the next generation of enterprise spatial risk management systems. Join the waitlist to secure your spot for our upcoming launch.',
                  admin: {
                    rows: 3,
                  },
                },
                {
                  name: 'heroImage',
                  label: 'Hero Background Image (optional)',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Optional background image for the hero section. If not set, the 3D skyline is used.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Email Form',
          fields: [
            {
              name: 'emailForm',
              type: 'group',
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
                  type: 'text',
                  defaultValue: "You're on the list. We'll be in touch.",
                },
                {
                  name: 'termsText',
                  label: 'Terms Disclaimer',
                  type: 'text',
                  defaultValue: 'By joining, you agree to our Terms & Privacy Policy.',
                  admin: {
                    description: 'Shown below the email form.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Navbar',
          fields: [
            {
              name: 'navbar',
              type: 'group',
              fields: [
                {
                  name: 'logo',
                  label: 'Logo',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Upload a custom logo. Falls back to /logo.svg if not set.',
                  },
                },
                {
                  name: 'ctaText',
                  label: 'CTA Button Text',
                  type: 'text',
                  defaultValue: 'Get Updates',
                },
              ],
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            {
              name: 'footer',
              type: 'group',
              fields: [
                {
                  name: 'copyrightName',
                  label: 'Copyright Name',
                  type: 'text',
                  defaultValue: 'Nexotek.ai',
                },
                {
                  name: 'links',
                  label: 'Footer Links',
                  type: 'array',
                  minRows: 0,
                  maxRows: 6,
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'label',
                          type: 'text',
                          required: true,
                          admin: { width: '50%' },
                        },
                        {
                          name: 'url',
                          type: 'text',
                          required: true,
                          admin: { width: '50%' },
                        },
                      ],
                    },
                  ],
                  defaultValue: [
                    { label: 'Privacy Policy', url: '/privacy' },
                    { label: 'Terms of Service', url: '/terms' },
                  ],
                },
              ],
            },
          ],
        },
        // SEO tab is auto-injected by @payloadcms/plugin-seo
      ],
    },
  ],
};
