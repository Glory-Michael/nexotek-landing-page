import { getPayload } from 'payload';
import config from '@/payload.config';

export type NewsroomSettings = {
  showDemoArticles: boolean;
};

// Not cached — always reads fresh so CMS toggle changes take effect immediately.
export async function getNewsroomSettings(): Promise<NewsroomSettings> {
  try {
    const payload = await getPayload({ config });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await payload.findGlobal({ slug: 'newsroom-config' as any, draft: false });
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      showDemoArticles: Boolean((data as any).showDemoArticles),
    };
  } catch {
    return { showDemoArticles: false };
  }
}
