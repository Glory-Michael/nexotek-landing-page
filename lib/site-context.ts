import { unstable_cache } from 'next/cache';
import { getPayload } from 'payload';
import config from '@/payload.config';

export interface SiteContext {
  siteName: string;
  tagline: string;
  baseUrl: string;
  logoUrl?: string;
  sameAs?: string[];
}

export const getSiteContext = unstable_cache(
  async (): Promise<SiteContext> => {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    try {
      const payload = await getPayload({ config });
      const identity = await payload.findGlobal({ slug: 'site-identity' });
      const id = identity as unknown as Record<string, unknown>;
      const favicon = id.favicon as { url?: string } | number | null | undefined;
      const logoUrl =
        favicon && typeof favicon === 'object' && favicon.url
          ? favicon.url.startsWith('http')
            ? favicon.url
            : `${baseUrl}${favicon.url}`
          : `${baseUrl}/brand/logo-mark.svg`;
      return {
        siteName: (id.siteName as string) || 'Nexotek',
        tagline: (id.tagline as string) || '',
        baseUrl,
        logoUrl,
      };
    } catch {
      return {
        siteName: 'Nexotek',
        tagline: '',
        baseUrl,
        logoUrl: `${baseUrl}/brand/logo-mark.svg`,
      };
    }
  },
  ['site-context'],
  { revalidate: 300, tags: ['site-identity'] },
);
