import { NextResponse } from 'next/server';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

export function GET() {
  const card = {
    schemaVersion: '0.1',
    serverInfo: {
      name: 'NexoTek',
      version: '1.0.0',
      description:
        'Read-only MCP server exposing NexoTek CMS content: pages, articles, categories, and site configuration.',
    },
    transports: [
      {
        type: 'streamable-http',
        endpoint: `${BASE_URL}/api/mcp`,
      },
    ],
    capabilities: {
      tools: true,
      resources: false,
      prompts: false,
    },
  };

  return new NextResponse(JSON.stringify(card, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
