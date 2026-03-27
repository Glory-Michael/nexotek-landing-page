import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { s3Storage } from '@payloadcms/storage-s3';
import { resendAdapter } from '@payloadcms/email-resend';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { seoPlugin } from '@payloadcms/plugin-seo';
import { redirectsPlugin } from '@payloadcms/plugin-redirects';
import { searchPlugin } from '@payloadcms/plugin-search';
import path from 'path';
import { fileURLToPath } from 'url';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Pages } from './collections/Pages';
import { Waitlist } from './collections/Waitlist';
import { EmailLog } from './collections/EmailLog';
import { LandingPage } from './globals/LandingPage';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default buildConfig({
  editor: lexicalEditor(),
  collections: [Users, Media, Pages, Waitlist, EmailLog],
  globals: [LandingPage],
  admin: {
    meta: {
      titleSuffix: ' — NexoTek Admin',
    },
    avatar: 'default',
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
    components: {
      graphics: {
        Logo: '/components/admin/Logo',
        Icon: '/components/admin/Icon',
      },
      afterDashboard: ['/components/admin/DashboardStats'],
    },
  },
  email: resendAdapter({
    defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    defaultFromName: process.env.RESEND_FROM_NAME || 'NexoTek',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  secret: process.env.PAYLOAD_SECRET || 'default-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    push: true,
  }),
  plugins: [
    // SEO — adds meta title, description, image, preview to Pages and Landing Page
    seoPlugin({
      collections: ['pages'],
      globals: ['landing-page'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) =>
        `${(doc as { title?: string }).title || 'Untitled'} — NexoTek`,
      generateDescription: ({ doc }) =>
        (doc as { metaDescription?: string }).metaDescription || '',
      generateURL: ({ doc, collectionConfig }) => {
        if (collectionConfig) {
          return `${appUrl}/${(doc as { slug?: string }).slug || ''}`;
        }
        return appUrl;
      },
    }),

    // Redirects — manage URL redirects from the admin panel
    redirectsPlugin({
      collections: ['pages'],
    }),

    // Search — auto-indexes Pages for admin search
    searchPlugin({
      collections: ['pages'],
      defaultPriorities: {
        pages: 10,
      },
    }),

    // S3 Media Storage
    s3Storage({
      collections: { media: true },
      bucket: process.env.R2_BUCKET_NAME || '',
      config: {
        endpoint: process.env.R2_ENDPOINT || '',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
        forcePathStyle: true,
      },
    }),
  ],
});
