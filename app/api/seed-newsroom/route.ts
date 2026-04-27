/**
 * Seeds the Newsroom collections (Categories and Articles) with sample data.
 *
 * Usage: GET /api/seed-newsroom?secret=<PAYLOAD_SECRET>
 * Idempotent: skips any category or article that already exists (matched by slug).
 *
 * This route is intended for local/staging setup only.
 */

import { getPayload } from 'payload';
import config from '@payload-config';

export const dynamic = 'force-dynamic';

// ─── Lexical rich-text helpers ────────────────────────────────────────────────

type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'quote'; text: string };

function textNode(text: string) {
  return {
    type: 'text',
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text,
    version: 1,
  };
}

function paragraph(text: string) {
  return {
    type: 'paragraph',
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    textFormat: 0,
    textStyle: '',
    children: [textNode(text)],
  };
}

function heading(tag: 'h2' | 'h3', text: string) {
  return {
    type: 'heading',
    tag,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    children: [textNode(text)],
  };
}

function quote(text: string) {
  return {
    type: 'quote',
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    children: [textNode(text)],
  };
}

function buildLexical(blocks: Block[]) {
  const children = blocks.map((b) => {
    if (b.type === 'h2') return heading('h2', b.text);
    if (b.type === 'h3') return heading('h3', b.text);
    if (b.type === 'quote') return quote(b.text);
    return paragraph(b.text);
  });
  return {
    root: {
      type: 'root',
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
      children,
    },
  };
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Press Release', slug: 'press-release', description: 'Official announcements and press releases from NexoTek.', color: '#3B82F6' },
  { name: 'Product Update', slug: 'product-update', description: 'Release notes, new features, and product-related news.', color: '#10B981' },
  { name: 'Company News', slug: 'company-news', description: 'Hiring announcements, milestones, and team updates.', color: '#F59E0B' },
  { name: 'Blog', slug: 'blog', description: 'Long-form posts about spatial intelligence and engineering.', color: '#8B5CF6' },
];

interface ArticleSeed {
  title: string;
  slug: string;
  excerpt: string;
  categorySlug: string;
  author: string;
  publishedDate: string;
  featured: boolean;
  tags: string[];
  content: Block[];
}

const ARTICLES: ArticleSeed[] = [
  {
    title: 'NexoTek Secures $12M Series A to Scale Spatial Risk Intelligence Platform',
    slug: 'series-a-funding-announcement',
    excerpt: 'Led by Pacific Arc Ventures with participation from Horizon Capital, the round will accelerate product development and international expansion.',
    categorySlug: 'press-release',
    author: 'NexoTek Press Team',
    publishedDate: '2026-04-09T09:00:00.000Z',
    featured: true,
    tags: ['funding', 'series-a', 'growth'],
    content: [
      { type: 'p', text: 'NexoTek, the enterprise spatial risk intelligence platform, today announced the closing of a $12 million Series A funding round. The round was led by Pacific Arc Ventures with participation from Horizon Capital, Meridian Partners, and several strategic angel investors from the insurance and geospatial industries.' },
      { type: 'h2', text: 'Fueling the Next Chapter' },
      { type: 'p', text: 'The new capital will be directed toward three priorities: expanding the engineering team in New York and Singapore, scaling the production data pipeline to ingest a growing catalog of high-resolution Earth observation feeds, and accelerating go-to-market efforts across Europe and Asia-Pacific.' },
      { type: 'quote', text: '"NexoTek is building critical infrastructure for how the world measures and prices physical risk. The team has a rare combination of deep geospatial expertise and a pragmatic focus on enterprise outcomes." — Priya Menon, Managing Partner, Pacific Arc Ventures' },
      { type: 'h2', text: 'Momentum in the Market' },
      { type: 'p', text: 'The funding follows a year of strong customer growth, with the platform now supporting risk decisions across more than 40 enterprise deployments spanning reinsurance, commercial real estate, and critical infrastructure operators.' },
      { type: 'p', text: 'NexoTek remains committed to its core thesis: that better spatial data, delivered with rigor and speed, produces measurably better outcomes for organizations exposed to physical and environmental risk.' },
    ],
  },
  {
    title: 'Introducing the NexoTek Risk Graph: Real-Time Spatial Risk Analytics',
    slug: 'introducing-risk-graph',
    excerpt: 'A new query layer that lets teams ask spatial risk questions across assets, exposures, and scenarios — with answers in milliseconds.',
    categorySlug: 'product-update',
    author: 'Jordan Lee',
    publishedDate: '2026-03-28T14:30:00.000Z',
    featured: false,
    tags: ['product', 'risk-graph', 'analytics'],
    content: [
      { type: 'p', text: 'Today we are shipping the NexoTek Risk Graph — a new query layer that unifies assets, exposures, and scenario data into a single, queryable model. The Risk Graph is available to all customers on the Enterprise plan starting today.' },
      { type: 'h2', text: 'Why a Graph?' },
      { type: 'p', text: 'Real-world risk is relational. A warehouse in a flood zone inherits exposure from the parcel, the watershed, the climate model, and the logistics network it sits on. Modeling that as flat tables forces teams to write complex joins and accept stale results. The Risk Graph represents these entities as first-class nodes and edges, and exposes them through a simple query API.' },
      { type: 'h2', text: 'What You Can Do' },
      { type: 'p', text: 'Teams are already using the Risk Graph to answer questions like: "Show me every asset within 500 meters of a high-liquefaction zone whose primary access road crosses a flood-prone bridge." Queries that previously took hours of manual stitching now return in under 200 milliseconds.' },
      { type: 'p', text: 'The Risk Graph integrates natively with every scenario pack in the NexoTek catalog — including the new RCP 8.5 and RCP 4.5 climate projections through 2050.' },
    ],
  },
  {
    title: 'Welcoming Dr. Elena Park as Chief Scientist',
    slug: 'dr-elena-park-joins-nexotek',
    excerpt: 'A decade at the Jet Propulsion Laboratory, two National Science Foundation grants, and a passion for making spatial science accessible — Dr. Park is joining us to lead scientific strategy.',
    categorySlug: 'company-news',
    author: 'Maya Chen',
    publishedDate: '2026-03-14T10:00:00.000Z',
    featured: false,
    tags: ['hiring', 'leadership', 'science'],
    content: [
      { type: 'p', text: 'We are thrilled to announce that Dr. Elena Park has joined NexoTek as our Chief Scientist. Elena joins us from the Jet Propulsion Laboratory, where she spent the last decade leading research on multi-sensor fusion for environmental monitoring.' },
      { type: 'h2', text: 'A Rare Blend of Theory and Practice' },
      { type: 'p', text: 'Elena holds a PhD in Geophysics from Caltech and has authored more than 40 peer-reviewed papers on remote sensing, uncertainty quantification, and atmospheric modeling. She has been the principal investigator on two NSF grants and was recognized in 2024 with the AGU Early Career Award for Environmental Informatics.' },
      { type: 'quote', text: '"Spatial intelligence is no longer a research curiosity — it is a decision-grade capability that organizations depend on. I am joining NexoTek because the team is uniquely positioned to bring scientific rigor to production infrastructure." — Dr. Elena Park' },
      { type: 'h2', text: 'Looking Ahead' },
      { type: 'p', text: 'Elena will lead the scientific roadmap across model selection, validation methodology, and the peer-review program that underpins every NexoTek product release. Please join us in welcoming her to the team.' },
    ],
  },
  {
    title: 'From Satellite Imagery to Risk Scores: Our Data Pipeline Explained',
    slug: 'data-pipeline-explained',
    excerpt: 'A tour of the pipeline that turns raw multi-spectral imagery into the structured risk signals our customers rely on — with an honest look at the hard parts.',
    categorySlug: 'blog',
    author: 'Sam Okafor',
    publishedDate: '2026-02-21T16:00:00.000Z',
    featured: false,
    tags: ['engineering', 'data-pipeline', 'satellite'],
    content: [
      { type: 'p', text: 'When customers ask how NexoTek produces risk scores, the honest answer is: a lot of boring, careful pipeline engineering. This post walks through that pipeline end-to-end, focusing on the decisions that most shape quality and latency.' },
      { type: 'h2', text: 'Stage 1 — Ingest' },
      { type: 'p', text: 'We ingest imagery from a rotating set of commercial and public providers. Every tile is fingerprinted, deduplicated against our archive, and staged into per-provider cold storage before entering the processing queue. The provenance chain is preserved all the way to the final score.' },
      { type: 'h2', text: 'Stage 2 — Alignment and QC' },
      { type: 'p', text: 'Raw imagery is rarely usable as-is. We co-register tiles to a common grid, correct for sensor geometry, and run automated QC on cloud cover, haze, and sensor artifacts. Anything that fails QC is re-queued or flagged for human review. The honest truth is that this stage consumes far more compute than the ML we are better known for.' },
      { type: 'h2', text: 'Stage 3 — Feature Extraction' },
      { type: 'p', text: 'Cleaned imagery feeds our feature extraction models — a mix of classical indices and learned representations. Features are versioned, cached, and exposed as reusable building blocks for downstream risk models.' },
      { type: 'h3', text: 'A Note on Latency' },
      { type: 'p', text: 'We target 90-minute end-to-end latency from provider publish to updated score. The constraint is dominated by imagery availability, not compute. Most of our optimization work is about scheduling, not algorithms.' },
      { type: 'h2', text: 'Stage 4 — Scoring and Delivery' },
      { type: 'p', text: 'Finally, risk models combine features with customer portfolio data to produce scored outputs. These flow into the Risk Graph and are delivered to customers via API, webhook, and the dashboard.' },
      { type: 'p', text: 'We will continue publishing deep-dives on specific stages. If you have questions or want us to cover a particular topic, let us know.' },
    ],
  },
  {
    title: 'NexoTek Partners with Global Reinsurance Leader to Expand Coverage',
    slug: 'global-reinsurer-partnership',
    excerpt: 'A multi-year agreement will bring NexoTek spatial risk intelligence into core underwriting workflows across three continents.',
    categorySlug: 'press-release',
    author: 'NexoTek Press Team',
    publishedDate: '2026-01-30T11:00:00.000Z',
    featured: false,
    tags: ['partnership', 'reinsurance', 'enterprise'],
    content: [
      { type: 'p', text: 'NexoTek today announced a multi-year partnership with one of the world\u2019s largest reinsurance groups to integrate the NexoTek platform into core underwriting workflows across North America, Europe, and Asia.' },
      { type: 'h2', text: 'Details of the Agreement' },
      { type: 'p', text: 'Under the terms of the agreement, underwriting and portfolio management teams at the partner organization will have access to the full NexoTek platform — including the Risk Graph, scenario catalog, and exposure analytics — directly from within their existing systems.' },
      { type: 'p', text: 'The two organizations will also co-develop a research agenda focused on compound hazard modeling, with results published under the NexoTek peer-review program.' },
      { type: 'h2', text: 'Why This Matters' },
      { type: 'p', text: 'Reinsurance is one of the most demanding environments for risk intelligence — the signals must be defensible, reproducible, and fast. We are proud to support a partner with such high standards and look forward to sharing more as the work progresses.' },
    ],
  },
];

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const url = new URL(request.url);
  const providedSecret = url.searchParams.get('secret');
  const expectedSecret = process.env.PAYLOAD_SECRET;

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const log: string[] = [];
  const payload = await getPayload({ config });

  // 1. Categories
  const categoryIdBySlug = new Map<string, string | number>();
  for (const cat of CATEGORIES) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
    });
    if (existing.docs[0]) {
      log.push(`• Category "${cat.slug}" exists, skipped`);
      categoryIdBySlug.set(cat.slug, existing.docs[0].id);
      continue;
    }
    const created = await payload.create({ collection: 'categories', data: cat });
    categoryIdBySlug.set(cat.slug, created.id);
    log.push(`✓ Created category "${cat.slug}"`);
  }

  // 2. Articles
  for (const article of ARTICLES) {
    const existing = await payload.find({
      collection: 'articles',
      where: { slug: { equals: article.slug } },
      limit: 1,
    });
    if (existing.docs[0]) {
      log.push(`• Article "${article.slug}" exists, skipped`);
      continue;
    }
    const categoryId = categoryIdBySlug.get(article.categorySlug);
    if (!categoryId) {
      log.push(`! Missing category "${article.categorySlug}" for "${article.slug}", skipped`);
      continue;
    }
    await payload.create({
      collection: 'articles',
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: buildLexical(article.content),
        publishedDate: article.publishedDate,
        author: article.author,
        category: categoryId,
        tags: article.tags.map((tag) => ({ tag })),
        featured: article.featured,
        _status: 'published',
      },
    });
    log.push(`✓ Created article "${article.slug}"`);
  }

  return Response.json({ ok: true, log });
}
