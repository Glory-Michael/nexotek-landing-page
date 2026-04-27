import { NextResponse } from 'next/server';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

export function GET() {
  const catalog = {
    linkset: [
      {
        anchor: `${BASE_URL}/api/rss`,
        'service-desc': [
          {
            href: `${BASE_URL}/openapi.json`,
            type: 'application/openapi+json',
            title: 'NexoTek OpenAPI Description',
          },
        ],
        'service-doc': [
          {
            href: `${BASE_URL}/api/rss`,
            type: 'application/rss+xml',
            title: 'NexoTek Newsroom RSS Feed',
          },
        ],
        status: [
          {
            href: `${BASE_URL}/api/health`,
            type: 'application/json',
            title: 'Health Check',
          },
        ],
      },
    ],
  };

  return new NextResponse(JSON.stringify(catalog, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/linkset+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
