/**
 * Bulk-marks all existing articles as contentState: 'sample'.
 *
 * Usage: GET /api/admin/mark-articles-sample?secret=<PAYLOAD_SECRET>
 * Idempotent — safe to run multiple times.
 * Intended for local/staging setup only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await getPayload({ config });

  // Fetch all articles (no pagination limit needed for a one-off admin op)
  const { docs: articles } = await payload.find({
    collection: 'articles',
    limit: 1000,
    pagination: false,
    draft: false,
  });

  let updated = 0;
  const errors: string[] = [];

  for (const article of articles) {
    try {
      await payload.update({
        collection: 'articles',
        id: article.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { contentState: 'sample' } as any,
      });
      updated++;
    } catch (err) {
      errors.push(`${article.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    ok: true,
    total: articles.length,
    updated,
    errors: errors.length ? errors : undefined,
  });
}
