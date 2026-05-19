import type { MetadataRoute } from 'next';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

// AI bots we want to be discoverable to so the site is citation-eligible.
const ALLOWED_AI_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
  'Bytespider',
];

const DISALLOW_PATHS = ['/admin/', '/api/', '/_payload/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW_PATHS },
      ...ALLOWED_AI_BOTS.map((bot) => ({
        userAgent: bot,
        allow: '/',
        disallow: DISALLOW_PATHS,
      })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
