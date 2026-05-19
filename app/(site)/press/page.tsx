import { unstable_cache } from 'next/cache';
import { getPayload } from 'payload';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import config from '@/payload.config';
import { getSiteContext } from '@/lib/site-context';
import { RichTextRenderer } from '@/components/rich-text-renderer';
import { StructuredData } from '@/components/seo/structured-data';
import type { PressKit } from '@/payload-types';

const getPressKit = unstable_cache(
  async (): Promise<PressKit | null> => {
    try {
      const payload = await getPayload({ config });
      const result = await payload.findGlobal({ slug: 'press-kit' });
      return result as PressKit;
    } catch {
      return null;
    }
  },
  ['press-kit'],
  { revalidate: 300, tags: ['press-kit'] },
);

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContext();
  const title = `Press — ${site.siteName}`;
  const description = `${site.siteName} press kit: company description, leadership, downloads, and brand assets.`;
  return {
    title,
    description,
    alternates: { canonical: `${site.baseUrl}/press` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${site.baseUrl}/press`,
    },
  };
}

export default async function PressPage() {
  const [site, pressKit] = await Promise.all([getSiteContext(), getPressKit()]);
  const content = pressKit?.content;
  const leadership = (content?.leadership ?? []).map((m) => ({
    name: m.name,
    title: m.title,
    photoUrl:
      typeof m.photo === 'object' && m.photo?.url ? m.photo.url : undefined,
  }));
  const downloads = content?.downloadLinks ?? [];
  const contactEmail = content?.contactEmail ?? undefined;
  const foundingDate = content?.foundingDate ?? undefined;

  return (
    <main className="bg-white text-black dark:bg-neutral-50 dark:text-neutral-900 min-h-screen">
      <StructuredData
        data={{
          kind: 'press',
          leadership: leadership.map((m) => ({ name: m.name, title: m.title })),
          contactEmail,
          foundingDate: foundingDate ?? undefined,
        }}
        site={site}
      />
      <div className="mx-auto max-w-5xl px-6 py-20 md:px-12 md:py-28">
        <header className="mb-12">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
            Press Kit
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">
            {site.siteName}
          </h1>
          {site.tagline && (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-700 md:text-xl">
              {site.tagline}
            </p>
          )}
        </header>

        {content?.companyDescription && (
          <section className="mb-16 max-w-3xl">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              About
            </h2>
            <RichTextRenderer content={content.companyDescription} variant="default" />
            {foundingDate && (
              <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
                Founded {new Date(foundingDate).getFullYear()}
              </p>
            )}
          </section>
        )}

        {leadership.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              Leadership
            </h2>
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {leadership.map((m) => (
                <li key={m.name} className="border border-black/10 p-6">
                  {m.photoUrl && (
                    <div className="relative mb-4 aspect-square w-full overflow-hidden bg-neutral-100">
                      <Image
                        src={m.photoUrl}
                        alt={m.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <p className="font-display text-lg font-semibold tracking-tight">
                    {m.name}
                  </p>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
                    {m.title}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {downloads.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              Downloads
            </h2>
            <ul className="space-y-3">
              {downloads.map((d, i) => (
                <li key={`${d.label}-${i}`}>
                  <Link
                    href={d.url}
                    className="font-mono text-sm uppercase tracking-[0.18em] underline-offset-4 hover:underline"
                  >
                    {d.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {content?.brandRulesSummary && (
          <section className="mb-16 max-w-3xl">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              Brand Rules
            </h2>
            <RichTextRenderer content={content.brandRulesSummary} variant="default" />
          </section>
        )}

        {contactEmail && (
          <section className="border-t border-black/10 pt-12">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              Press inquiries
            </p>
            <Link
              href={`mailto:${contactEmail}`}
              className="mt-2 inline-block font-display text-2xl font-semibold tracking-tight underline-offset-4 hover:underline"
            >
              {contactEmail}
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
