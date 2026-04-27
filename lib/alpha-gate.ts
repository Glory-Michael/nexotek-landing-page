import { getPayload } from 'payload';
import config from '@/payload.config';

/** Returns path prefixes (e.g. "/newsroom") whose gates are currently enabled. */
export async function getGatedPaths(): Promise<string[]> {
  try {
    const payload = await getPayload({ config });
    const data = await payload.findGlobal({ slug: 'alpha-access' as never });
    const features = (data as Record<string, unknown>).features;
    if (!Array.isArray(features)) return [];
    return features
      .filter((f: Record<string, unknown>) => f.enabled && typeof f.path === 'string')
      .map((f: Record<string, unknown>) => f.path as string);
  } catch {
    return [];
  }
}

/** Returns true if pathname is under any of the given gated path prefixes. */
export function isGated(pathname: string, gatedPaths: string[]): boolean {
  return gatedPaths.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  );
}
