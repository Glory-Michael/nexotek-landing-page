import type { GlobalConfig } from 'payload';

export const LandingPage: GlobalConfig = {
  slug: 'landing-page',
  label: 'Landing Page',
  access: {
    read: () => true,
  },
  fields: [
    // --- Hero Section ---
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'titleLine1',
          label: 'Title (Line 1)',
          type: 'text',
          required: true,
          defaultValue: 'Spatial Risk Intelligence,',
        },
        {
          name: 'titleLine2',
          label: 'Title (Line 2, italic)',
          type: 'text',
          required: true,
          defaultValue: 'Redefined.',
        },
        {
          name: 'subtitle',
          type: 'textarea',
          required: true,
          defaultValue:
            'Nexotek is building the next generation of enterprise spatial risk management systems. Join the waitlist to secure your spot for our upcoming launch.',
        },
        {
          name: 'emailPlaceholder',
          label: 'Email Input Placeholder',
          type: 'text',
          defaultValue: 'Enter your email address...',
        },
        {
          name: 'buttonText',
          label: 'Submit Button Text',
          type: 'text',
          defaultValue: 'Join',
        },
        {
          name: 'successMessage',
          label: 'Success Message',
          type: 'text',
          defaultValue: "You're on the list. We'll be in touch.",
        },
      ],
    },

    // --- Navbar ---
    {
      name: 'navbar',
      type: 'group',
      fields: [
        {
          name: 'ctaText',
          label: 'CTA Button Text',
          type: 'text',
          defaultValue: 'Get Updates',
        },
      ],
    },

    // --- Footer ---
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
      ],
    },
  ],
};
