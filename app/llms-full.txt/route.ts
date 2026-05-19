import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { getSiteContext } from '@/lib/site-context';
import { lexicalToPlainText } from '@/components/seo/structured-data';

export const revalidate = 3600;

export async function GET() {
  const site = await getSiteContext();
  const baseUrl = site.baseUrl;
  const lines: string[] = [];

  lines.push(`# ${site.siteName}`);
  if (site.tagline) lines.push(`> ${site.tagline}`);
  lines.push('');

  try {
    const payload = await getPayload({ config });

    // Homepage content
    const landing = await payload.findGlobal({ slug: 'landing-page' });
    const landingRecord = landing as unknown as Record<string, unknown>;
    const hero = landingRecord.hero as Record<string, unknown> | undefined;
    if (hero) {
      lines.push('## Homepage');
      const title = lexicalToPlainText(hero.title);
      const body = lexicalToPlainText(hero.body);
      if (title) lines.push(title);
      if (body) {
        lines.push('');
        lines.push(body);
      }
      lines.push('');
    }
    const heroV2 = landingRecord.heroV2 as
      | { eyebrow?: string; headlineLines?: Array<{ value?: string }>; leadSentence?: string }
      | undefined;
    if (heroV2) {
      if (heroV2.eyebrow) {
        lines.push(`> ${heroV2.eyebrow}`);
        lines.push('');
      }
      if (heroV2.headlineLines && heroV2.headlineLines.length > 0) {
        lines.push(
          '# ' +
            heroV2.headlineLines
              .map((l) => l.value)
              .filter(Boolean)
              .join(' '),
        );
        lines.push('');
      }
      if (heroV2.leadSentence) {
        lines.push(heroV2.leadSentence);
        lines.push('');
      }
    }

    // Sections (lead sentences only — the part AI engines lift)
    const sections = landingRecord.sections as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(sections) && sections.length > 0) {
      lines.push('## Sections');
      for (const s of sections) {
        const lead = s.leadSentence as string | undefined;
        const blockType = s.blockType as string | undefined;
        if (lead) {
          lines.push(`- (${blockType ?? 'section'}) ${lead}`);
        }
      }
      lines.push('');
    }

    // Glossary
    const glossary = await payload.find({
      collection: 'glossary',
      limit: 500,
      sort: 'term',
    });
    if (glossary.docs.length > 0) {
      lines.push('## Glossary');
      for (const t of glossary.docs) {
        const def = lexicalToPlainText(t.definition);
        lines.push(`### ${t.term}`);
        lines.push(`URL: ${baseUrl}/glossary#${t.slug}`);
        if (def) {
          lines.push('');
          lines.push(def);
        }
        lines.push('');
      }
    }

    // Newsroom (recent articles)
    const articles = await payload.find({
      collection: 'articles',
      limit: 25,
      where: { _status: { equals: 'published' } },
      sort: '-publishedDate',
      depth: 0,
    });
    if (articles.docs.length > 0) {
      lines.push('## Newsroom');
      for (const a of articles.docs) {
        if (!a.slug) continue;
        lines.push(`### ${a.title}`);
        lines.push(`URL: ${baseUrl}/newsroom/${a.slug}`);
        if (a.publishedDate) {
          lines.push(`Date: ${new Date(a.publishedDate).toISOString().slice(0, 10)}`);
        }
        if (a.author) lines.push(`Author: ${a.author}`);
        if (a.excerpt) {
          lines.push('');
          lines.push(a.excerpt);
        }
        lines.push('');
        const body = lexicalToPlainText(a.content);
        if (body) {
          lines.push(body);
          lines.push('');
        }
      }
    }
  } catch (err) {
    lines.push(`<!-- error fetching content: ${String(err)} -->`);
  }

  return new NextResponse(lines.join('\n') + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
