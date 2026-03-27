import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { s3Storage } from '@payloadcms/storage-s3';
import { resendAdapter } from '@payloadcms/email-resend';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { seoPlugin } from '@payloadcms/plugin-seo';
import { redirectsPlugin } from '@payloadcms/plugin-redirects';
import { searchPlugin } from '@payloadcms/plugin-search';
import { mcpPlugin } from '@payloadcms/plugin-mcp';
import path from 'path';
import { fileURLToPath } from 'url';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Pages } from './collections/Pages';
import { Waitlist } from './collections/Waitlist';
import { EmailLog } from './collections/EmailLog';
import { LandingPage } from './globals/LandingPage';
import { SiteIdentity } from './globals/SiteIdentity';


const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default buildConfig({
  editor: lexicalEditor(),
  collections: [Users, Media, Pages, Waitlist, EmailLog],
  globals: [LandingPage, SiteIdentity],

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
      afterDashboard: [
        '/components/admin/DashboardStats',
        '/components/admin/AnalyticsDashboard',
      ],
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
    // MCP — Model Context Protocol server at /api/mcp
    mcpPlugin({
      collections: {
        // Waitlist signups — read-only for AI (no deletions from AI)
        waitlist: {
          description:
            'Email waitlist signups. Each document has an email address and a createdAt timestamp. Use this to query signup counts, recent signups, or export lists.',
          enabled: { find: true, create: false, update: false, delete: false },
        },

        // Media library — read-only; uploads happen via the admin UI
        media: {
          description:
            'Uploaded media assets (images, files, 3D models). Each document has a url, alt text, mimeType, and filesize. Use this to look up asset URLs for use in content.',
          enabled: { find: true, create: false, update: false, delete: false },
        },

        // Pages — read-only from MCP; editing happens via admin
        pages: {
          description:
            'Static CMS pages such as Privacy Policy and Terms of Service. Each page has a title, slug, and rich-text content field.',
          enabled: { find: true, create: false, update: false, delete: false },
        },

        // Email log — read-only audit trail
        'email-log': {
          description:
            'Audit log of outbound emails sent by the platform. Contains recipient email, subject, status, and timestamp. Read-only.',
          enabled: { find: true, create: false, update: false, delete: false },
        },

        // Users — read-only with sensitive fields stripped
        users: {
          description:
            'Admin user accounts. Returns name, email, role, and createdAt. Sensitive fields (hash, salt, tokens) are automatically redacted.',
          enabled: { find: true, create: false, update: false, delete: false },
          overrideResponse: (response) => {
            // Strip password hash/salt before model sees the document
            response.content = response.content.map((item) => ({
              ...item,
              text: (item as { text: string }).text
                .replace(/"hash":\s*"[^"]*"/g, '"hash": "[redacted]"')
                .replace(/"salt":\s*"[^"]*"/g, '"salt": "[redacted]"')
                .replace(/"resetPasswordToken":\s*"[^"]*"/g, '"resetPasswordToken": "[redacted]"'),
            }));
            return response;
          },
        },
      },

      globals: {
        // Landing page content — fully readable and updatable
        'landing-page': {
          description:
            'The main landing page content: hero title, hero body, email form text, navbar CTA, footer links, theme mode, typography settings, and 3D scene configuration. Update this to change what visitors see on the homepage.',
          enabled: { find: true, update: true },
        },

        // Site identity — fully readable and updatable
        'site-identity': {
          description:
            'Site-wide identity settings: site name, tagline, meta description, favicon, apple icon, OG image, and global font choices (body font and display/heading font). Update this to rebrand the site.',
          enabled: { find: true, update: true },
        },
      },

      mcp: {
        serverOptions: {
          serverInfo: {
            name: 'NexoTek CMS',
            version: '1.0.0',
          },
        },
        handlerOptions: {
          verboseLogs: process.env.NODE_ENV === 'development',
        },
      },
    }),

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
