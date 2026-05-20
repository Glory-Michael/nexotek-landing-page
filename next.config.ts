import type {NextConfig} from 'next';
import path from 'node:path';
import { withPayload } from '@payloadcms/next/withPayload';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      {
        source: '/.well-known/api-catalog',
        destination: '/api/well-known/api-catalog',
      },
      {
        source: '/.well-known/mcp/server-card.json',
        destination: '/api/well-known/mcp-server-card',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: [
              '</.well-known/api-catalog>; rel="api-catalog"',
              '</sitemap.xml>; rel="sitemap"',
              '</api/rss>; rel="alternate"; type="application/rss+xml"',
            ].join(', '),
          },
        ],
      },
    ];
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [],
  },
  transpilePackages: ['motion', 'tegaki'],
  allowedDevOrigins: ['michaels-macbook-pro-m2-pro.tailb6ac5f.ts.net'],
  webpack(config) {
    config.module.rules.push({
      test: /\.ttf$/,
      type: 'asset/resource',
    });
    return config;
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'motion',
      '@react-three/drei',
      '@react-three/fiber',
    ],
  },
};

export default withPayload(nextConfig);
