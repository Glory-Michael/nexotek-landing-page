import type { Article, Category, Media } from '@/payload-types';

type WithMaybeUrl = { url?: string | null } | string | number | null | undefined;

interface SiteContext {
  siteName: string;
  tagline: string;
  baseUrl: string;
  logoUrl?: string;
  sameAs?: string[];
}

const mediaUrl = (v: WithMaybeUrl, base: string): string | undefined => {
  if (!v || typeof v !== 'object') return undefined;
  const u = (v as { url?: string }).url;
  if (!u) return undefined;
  return u.startsWith('http') ? u : new URL(u, base).toString();
};

function organizationGraph(ctx: SiteContext) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${ctx.baseUrl}#organization`,
    name: ctx.siteName,
    url: ctx.baseUrl,
    ...(ctx.logoUrl ? { logo: ctx.logoUrl } : {}),
    description: ctx.tagline,
    ...(ctx.sameAs && ctx.sameAs.length > 0 ? { sameAs: ctx.sameAs } : {}),
  };
}

function websiteGraph(ctx: SiteContext) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${ctx.baseUrl}#website`,
    url: ctx.baseUrl,
    name: ctx.siteName,
    publisher: { '@id': `${ctx.baseUrl}#organization` },
  };
}

function faqPageGraph(items: Array<{ question: string; answerText: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answerText,
      },
    })),
  };
}

function breadcrumbGraph(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: b.url,
    })),
  };
}

function newsArticleGraph(article: Article, ctx: SiteContext) {
  const slug = article.slug ?? '';
  const url = `${ctx.baseUrl}/newsroom/${slug}`;
  const cover = article.coverImage as Media | number | null | undefined;
  const coverUrl =
    typeof cover === 'object' && cover !== null
      ? mediaUrl(cover as { url?: string | null }, ctx.baseUrl)
      : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt ?? undefined,
    datePublished: article.publishedDate ?? article.createdAt,
    dateModified: article.updatedAt,
    author: article.author
      ? { '@type': 'Person', name: article.author }
      : undefined,
    image: coverUrl,
    mainEntityOfPage: url,
    publisher: { '@id': `${ctx.baseUrl}#organization` },
  };
}

function definedTermSetGraph(
  terms: Array<{ term: string; slug: string; definitionText: string; pillarLink?: string }>,
  ctx: SiteContext,
) {
  const setId = `${ctx.baseUrl}/glossary#set`;
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': setId,
    name: `${ctx.siteName} Glossary`,
    hasDefinedTerm: terms.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.definitionText,
      url: `${ctx.baseUrl}/glossary#${t.slug}`,
      inDefinedTermSet: setId,
    })),
  };
}

type Graph = Record<string, unknown>;

export type StructuredDataKind =
  | { kind: 'organization' }
  | { kind: 'home'; faq?: Array<{ question: string; answerText: string }> }
  | { kind: 'article'; article: Article; category?: Category | null }
  | {
      kind: 'glossary';
      terms: Array<{
        term: string;
        slug: string;
        definitionText: string;
        pillarLink?: string;
      }>;
    }
  | {
      kind: 'press';
      leadership: Array<{ name: string; title: string }>;
      contactEmail?: string;
      foundingDate?: string;
    };

interface StructuredDataProps {
  data: StructuredDataKind;
  site: SiteContext;
}

export function StructuredData({ data, site }: StructuredDataProps) {
  const graphs: Graph[] = [];

  switch (data.kind) {
    case 'organization':
      graphs.push(organizationGraph(site));
      break;
    case 'home':
      graphs.push(organizationGraph(site));
      graphs.push(websiteGraph(site));
      graphs.push(
        breadcrumbGraph([{ name: 'Home', url: site.baseUrl }]),
      );
      if (data.faq && data.faq.length > 0) {
        graphs.push(faqPageGraph(data.faq));
      }
      break;
    case 'article':
      graphs.push(newsArticleGraph(data.article, site));
      graphs.push(
        breadcrumbGraph([
          { name: 'Home', url: site.baseUrl },
          { name: 'Newsroom', url: `${site.baseUrl}/newsroom` },
          {
            name: data.article.title ?? 'Article',
            url: `${site.baseUrl}/newsroom/${data.article.slug ?? ''}`,
          },
        ]),
      );
      break;
    case 'glossary':
      graphs.push(definedTermSetGraph(data.terms, site));
      graphs.push(
        breadcrumbGraph([
          { name: 'Home', url: site.baseUrl },
          { name: 'Glossary', url: `${site.baseUrl}/glossary` },
        ]),
      );
      break;
    case 'press': {
      const orgExtended: Graph = {
        ...organizationGraph(site),
        ...(data.foundingDate ? { foundingDate: data.foundingDate } : {}),
        ...(data.contactEmail
          ? {
              contactPoint: {
                '@type': 'ContactPoint',
                email: data.contactEmail,
                contactType: 'press',
              },
            }
          : {}),
        ...(data.leadership && data.leadership.length > 0
          ? {
              member: data.leadership.map((m) => ({
                '@type': 'Person',
                name: m.name,
                jobTitle: m.title,
              })),
            }
          : {}),
      };
      graphs.push(orgExtended);
      graphs.push(
        breadcrumbGraph([
          { name: 'Home', url: site.baseUrl },
          { name: 'Press', url: `${site.baseUrl}/press` },
        ]),
      );
      break;
    }
  }

  return (
    <>
      {graphs.map((g, i) => (
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(g) }}
          // eslint-disable-next-line react/no-unknown-property
          type="application/ld+json"
          key={`ld-${(g as { '@type'?: string })['@type'] ?? i}-${i}`}
        />
      ))}
    </>
  );
}

/**
 * Flatten a Lexical rich-text document to plain text so it can be embedded in
 * JSON-LD `description` or `text` fields. Walks the standard `{root, children}`
 * shape produced by Payload's lexical editor.
 */
export function lexicalToPlainText(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const root = (value as { root?: { children?: unknown[] } }).root;
  if (!root) return '';
  const walk = (node: unknown): string => {
    if (!node || typeof node !== 'object') return '';
    const n = node as Record<string, unknown>;
    if (typeof n.text === 'string') return n.text;
    if (Array.isArray(n.children))
      return n.children.map(walk).join('');
    return '';
  };
  return walk(root).trim();
}
