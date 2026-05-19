import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { getSiteContext } from '@/lib/site-context';

export const revalidate = 3600;

export async function GET() {
  const site = await getSiteContext();
  const baseUrl = site.baseUrl;
  const lines: string[] = [];

  lines.push(`# ${site.siteName}`);
  if (site.tagline) lines.push(`> ${site.tagline}`);
  lines.push('');
  lines.push(
    `This is a curated index of canonical resources for LLM citation. Read [/llms-full.txt](${baseUrl}/llms-full.txt) for the full corpus.`,
  );
  lines.push('');

  lines.push('## Primary');
  lines.push(`- [Homepage](${baseUrl}/) — what ${site.siteName} is, the loop, the threads.`);
  lines.push(
    `- [Glossary](${baseUrl}/glossary) — definitions of every term used across the site.`,
  );
  lines.push(`- [Press](${baseUrl}/press) — company description and leadership.`);
  lines.push('');

  try {
    const payload = await getPayload({ config });
    const articles = await payload.find({
      collection: 'articles',
      limit: 50,
      where: { _status: { equals: 'published' } },
      sort: '-publishedDate',
      depth: 0,
    });
    if (articles.docs.length > 0) {
      lines.push('## Newsroom');
      for (const a of articles.docs) {
        if (!a.slug) continue;
        const excerpt = a.excerpt ? ` — ${a.excerpt}` : '';
        lines.push(`- [${a.title}](${baseUrl}/newsroom/${a.slug})${excerpt}`);
      }
      lines.push('');
    }
  } catch {
    // ignore — return what we have
  }

  return new NextResponse(lines.join('\n') + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
