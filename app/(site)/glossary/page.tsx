import { unstable_cache } from 'next/cache';
import { getPayload } from 'payload';
import type { Metadata } from 'next';
import Link from 'next/link';
import config from '@/payload.config';
import { getSiteContext } from '@/lib/site-context';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import {
  StructuredData,
  lexicalToPlainText,
} from '@/components/seo/structured-data';
import type { Glossary } from '@/payload-types';

const getGlossaryTerms = unstable_cache(
  async (): Promise<Glossary[]> => {
    try {
      const payload = await getPayload({ config });
      const result = await payload.find({
        collection: 'glossary',
        limit: 500,
        sort: 'term',
      });
      return result.docs;
    } catch {
      return [];
    }
  },
  ['glossary-terms'],
  { revalidate: 300, tags: ['glossary'] },
);

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContext();
  const title = `Glossary — ${site.siteName}`;
  const description = `Definitions of the terms used across ${site.siteName}: Spatial Risk OS, edge-AI detection, Gaussian splat reconstruction, IACET credentialing, and more.`;
  return {
    title,
    description,
    alternates: { canonical: `${site.baseUrl}/glossary` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${site.baseUrl}/glossary`,
    },
  };
}

export default async function GlossaryPage() {
  const [site, terms] = await Promise.all([getSiteContext(), getGlossaryTerms()]);

  const structuredTerms = terms.map((t) => ({
    term: t.term,
    slug: t.slug,
    definitionText: lexicalToPlainText(t.definition),
    pillarLink: t.pillarLink ?? undefined,
  }));

  return (
    <main className="bg-white text-black dark:bg-neutral-50 dark:text-neutral-900 min-h-screen">
      <StructuredData
        data={{ kind: 'glossary', terms: structuredTerms }}
        site={site}
      />
      <div className="mx-auto max-w-4xl px-6 py-20 md:px-12 md:py-28">
        <header className="mb-12">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
            Reference
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">
            Glossary
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-700 md:text-xl">
            Definitions of the terms used across {site.siteName} — written so anyone
            (engineer, underwriter, safety lead, AI engine) can lift them as canonical
            answers.
          </p>
        </header>

        {terms.length === 0 ? (
          <p className="text-neutral-500">No glossary terms yet.</p>
        ) : (
          <dl className="divide-y divide-black/10 border-y border-black/10">
            {terms.map((t) => (
              <div key={t.id} id={t.slug} className="py-8 scroll-mt-24">
                <dt className="mb-2 flex items-baseline justify-between gap-4">
                  <span className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                    {t.term}
                  </span>
                  {t.pillarLink && (
                    <Link
                      href={t.pillarLink}
                      className="font-mono text-xs uppercase tracking-[0.18em] underline-offset-4 hover:underline"
                    >
                      ON HOMEPAGE →
                    </Link>
                  )}
                </dt>
                <dd className="max-w-2xl text-neutral-700">
                  <RichTextRenderer content={t.definition} variant="default" />
                </dd>
                {Array.isArray(t.seeAlso) && t.seeAlso.length > 0 && (
                  <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
                    See also:{' '}
                    {t.seeAlso.map((ref, i) => {
                      if (typeof ref === 'object' && ref?.slug && ref?.term) {
                        return (
                          <Link
                            key={ref.id}
                            href={`#${ref.slug}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {ref.term}
                            {i < t.seeAlso!.length - 1 ? ', ' : ''}
                          </Link>
                        );
                      }
                      return null;
                    })}
                  </p>
                )}
              </div>
            ))}
          </dl>
        )}
      </div>
    </main>
  );
}
