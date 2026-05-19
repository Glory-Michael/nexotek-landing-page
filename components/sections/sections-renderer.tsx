import { Fragment } from 'react';
import type { SectionBlock } from '@/types/landing-page';
import { TrustStrip } from './trust-strip';
import { LoopDiagram } from './loop-diagram';
import { ThreadVision } from './thread-vision';
import { ThreadSpatial } from './thread-spatial';
import { ThreadTrain } from './thread-train';
import { Credential } from './credential';
import { ComparisonTable } from './comparison-table';
import { WhoWeServe } from './who-we-serve';
import { ProofGrid } from './proof-grid';
import { Faq } from './faq';
import { ContactCta } from './contact-cta';
import { PlatformShowcase } from './demos/platform-showcase';
import { ShowcaseFlip } from './demos/showcase-flip';
import { TestimonialSection } from './testimonial-section';
import { PartnerCarousel } from './partner-carousel';

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
