import type {NextConfig} from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [],
  },
  transpilePackages: ['motion', 'tegaki'],
  webpack(config) {
    config.module.rules.push({
      test: /\.ttf$/,
      type: 'asset/resource',
    });
    return config;
  },
  experimental: {
  },
};

export default withPayload(nextConfig);
