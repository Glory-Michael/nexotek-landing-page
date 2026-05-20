import { Fragment } from 'react';
import dynamic from 'next/dynamic';
import type { SectionBlock } from '@/types/landing-page';
// TrustStrip stays statically imported — it renders directly under the hero
// and is in the LCP window. Everything else is code-split via next/dynamic
// with default ssr:true so server rendering (and FAQ SEO/structured data)
// still works while client JS gets split into per-section chunks.
import { TrustStrip } from './trust-strip';

const LoopDiagram = dynamic(() =>
  import('./loop-diagram').then((m) => ({ default: m.LoopDiagram })),
);
const ThreadVision = dynamic(() =>
  import('./thread-vision').then((m) => ({ default: m.ThreadVision })),
);
const ThreadSpatial = dynamic(() =>
  import('./thread-spatial').then((m) => ({ default: m.ThreadSpatial })),
);
const ThreadTrain = dynamic(() =>
  import('./thread-train').then((m) => ({ default: m.ThreadTrain })),
);
const Credential = dynamic(() =>
  import('./credential').then((m) => ({ default: m.Credential })),
);
const ComparisonTable = dynamic(() =>
  import('./comparison-table').then((m) => ({ default: m.ComparisonTable })),
);
const WhoWeServe = dynamic(() =>
  import('./who-we-serve').then((m) => ({ default: m.WhoWeServe })),
);
const ProofGrid = dynamic(() =>
  import('./proof-grid').then((m) => ({ default: m.ProofGrid })),
);
const Faq = dynamic(() => import('./faq').then((m) => ({ default: m.Faq })));
const ContactCta = dynamic(() =>
  import('./contact-cta').then((m) => ({ default: m.ContactCta })),
);
const PlatformShowcase = dynamic(() =>
  import('./demos/platform-showcase').then((m) => ({
    default: m.PlatformShowcase,
  })),
);
const ShowcaseFlip = dynamic(() =>
  import('./demos/showcase-flip').then((m) => ({ default: m.ShowcaseFlip })),
);
const TestimonialSection = dynamic(() =>
  import('./testimonial-section').then((m) => ({
    default: m.TestimonialSection,
  })),
);
const PartnerCarousel = dynamic(() =>
  import('./partner-carousel').then((m) => ({ default: m.PartnerCarousel })),
);

export function SectionsRenderer({ sections }: { sections: SectionBlock[] | undefined }) {
  if (!sections || sections.length === 0) return null;
  return (
    <div className="nx-section-chapters">
      {sections.map((block, i) => {
        const key = block.id ?? `${block.blockType}-${i}`;
        switch (block.blockType) {
          case 'trustStripBlock':
            return <TrustStrip key={key} block={block} />;
          case 'loopDiagramBlock': {
            const t = block.testimonial;
            const showTestimonial =
              t?.enabled !== false &&
              typeof t?.quote === 'string' &&
              t.quote.trim().length > 0;
            return (
              <Fragment key={key}>
                <LoopDiagram block={block} />
                {showTestimonial && (
                  <TestimonialSection
                    eyebrow={t?.eyebrow?.trim() || 'From the team'}
                    quote={t!.quote!}
                    attribution={{
                      name: t?.attributionName?.trim() || 'Michael Xu',
                      role:
                        t?.attributionRole?.trim() ||
                        'Product Manager, Nexotek',
                      initials: t?.attributionInitials?.trim() || 'MX',
                    }}
                  />
                )}
              </Fragment>
            );
          }
          case 'threadBlock':
            if (block.variant === 'spatial') {
              const ps = block.platformShowcase;
              const showPlatform = ps?.enabled !== false;
              const flowSteps = (ps?.flowSteps ?? [
                { value: 'Detect' },
                { value: 'Reconstruct' },
                { value: 'Act' },
              ])
                .map((s) => s.value?.trim() ?? '')
                .filter((s) => s.length > 0);
              return (
                <Fragment key={key}>
                  <ThreadSpatial block={block} />
                  {showPlatform && (
                    <PlatformShowcase
                      eyebrow={ps?.eyebrow?.trim() || 'Platform'}
                      title={
                        ps?.title?.trim() ||
                        'One platform. Every signal connected.'
                      }
                      leadSentence={
                        ps?.leadSentence?.trim() ||
                        'Operator surfaces and reconstruction studios — every signal the platform sees flows through the same decision loop.'
                      }
                      visionCaption={
                        ps?.visionCaption?.trim() || 'Vision · Operator console'
                      }
                      spatialCaption={
                        ps?.spatialCaption?.trim() ||
                        'Spatial · Reconstruction studio'
                      }
                      flowSteps={flowSteps}
                      screenDeckEnabled={ps?.screenDeck?.enabled !== false}
                      screenDeckAltText={ps?.screenDeck?.altText}
                      spatialStudioEnabled={ps?.spatialStudio?.enabled !== false}
                      spatialStudioAltText={ps?.spatialStudio?.altText}
                    />
                  )}
                </Fragment>
              );
            }
            if (block.variant === 'train') return <ThreadTrain key={key} block={block} />;
            return <ThreadVision key={key} block={block} />;
          case 'credentialBlock':
            return <Credential key={key} block={block} />;
          case 'comparisonBlock':
            return <ComparisonTable key={key} block={block} />;
          case 'whoWeServeBlock': {
            const showShowcaseFlip =
              block.demos?.showcaseFlip?.enabled !== false;
            const showcaseFlipAlt = block.demos?.showcaseFlip?.altText;
            return (
              <Fragment key={key}>
                {showShowcaseFlip && (
                  <div role="region" aria-label={showcaseFlipAlt}>
                    <ShowcaseFlip companion={block.companion} />
                  </div>
                )}
                <WhoWeServe block={block} />
              </Fragment>
            );
          }
          case 'proofGridBlock':
            return <ProofGrid key={key} block={block} />;
          case 'faqBlock':
            return <Faq key={key} block={block} />;
          case 'contactCtaBlock':
            return (
              <Fragment key={key}>
                <PartnerCarousel partners={block.partners ?? []} />
                <ContactCta block={block} />
              </Fragment>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
