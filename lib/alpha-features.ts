import { getPayload } from 'payload';
import config from '@/payload.config';
import { createHmac } from 'crypto';

export const ALPHA_COOKIE_NAME = 'nxt-alpha';

export type AlphaFeature = {
  label: string;
  path: string;
  enabled: boolean;
  showInNav: boolean;
};

export type AlphaConfig = {
  password: string;
  features: AlphaFeature[];
};

// Not cached — this is a security gate and must always be fresh.
export async function getAlphaConfig(): Promise<AlphaConfig> {
  try {
    const payload = await getPayload({ config });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await payload.findGlobal({ slug: 'alpha-access' as any, draft: false });
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      password: (data as any).accessPassword || '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      features: ((data as any).features || []).map((f: any) => ({
        label: f.label || '',
        path: f.path || '',
        enabled: f.enabled !== false,
        showInNav: Boolean(f.showInNav),
      })),
    };
  } catch {
    return { password: '', features: [] };
  }
}

export function makeAlphaToken(password: string): string {
  return createHmac('sha256', process.env.PAYLOAD_SECRET || 'default-secret')
    .update(password)
    .digest('hex');
}

export function validateAlphaToken(token: string, password: string): boolean {
  if (!password || !token) return false;
  return token === makeAlphaToken(password);
}

/** Returns the matching feature if the path is currently gated, otherwise null. */
export function findProtectedFeature(pathname: string, features: AlphaFeature[]): AlphaFeature | null {
  return (
    features.find((f) => {
      if (!f.enabled || !f.path) return false;
      const base = f.path.endsWith('/') ? f.path : `${f.path}/`;
      return pathname === f.path || pathname.startsWith(base);
    }) ?? null
  );
}
