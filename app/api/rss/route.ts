import { getPayload } from 'payload';
import config from '@/payload.config';

export const dynamic = 'force-dynamic';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function cdata(value: string): string {
  return `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
}

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'articles',
      where: { _status: { equals: 'published' } },
      sort: '-publishedDate',
      limit: 50,
      depth: 1,
    });

    const items = result.docs
      .map((article) => {
        const slug = String(article.slug || '');
        const title = String(article.title || 'Untitled');
        const excerpt = String(article.excerpt || '');
        const pubDate = new Date(
          (article.publishedDate as string) || new Date().toISOString(),
        ).toUTCString();
        const link = `${appUrl}/newsroom/${slug}`;
        const author = typeof article.author === 'string' ? article.author : null;

        return `    <item>
      <title>${cdata(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${cdata(excerpt)}</description>
      <pubDate>${pubDate}</pubDate>${author ? `\n      <author>${escapeXml(author)}</author>` : ''}
    </item>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NexoTek Newsroom</title>
    <link>${escapeXml(`${appUrl}/newsroom`)}</link>
    <description>Latest news, press releases, and updates from NexoTek.</description>
    <language>en-us</language>
    <atom:link href="${escapeXml(`${appUrl}/api/rss`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('Failed to generate RSS feed:', err);
    return new Response('Failed to generate RSS feed', { status: 500 });
  }
}
