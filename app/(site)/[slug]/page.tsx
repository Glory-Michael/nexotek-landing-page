import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@/payload.config';
import type { Metadata } from 'next';
import { Barlow_Condensed } from 'next/font/google';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PlatformLoopDiagram } from '@/components/platform-loop-diagram';
import { WorkerSkylineScene } from '@/components/worker-skyline-scene-client';
import { EventRegistrationForm } from '@/components/event-registration-form';

export const dynamic = 'force-dynamic';

const titleFont = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

interface EventPageProps {
  params: Promise<{ readonly slug: string }>;
}

async function getEvent(slug: string) {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'events',
    where: { slug: { equals: slug } },
    limit: 1,
  });
  return result.docs[0] ?? null;
}

export async function generateMetadata({ params }: Readonly<EventPageProps>): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: 'Not Found — Nexotek' };
  const pageTitle = (event as Record<string, unknown>).pageTitle as string | undefined;
  const title = pageTitle?.trim() || 'Connect with Nexotek';
  return {
    title,
    description: 'Meet the Nexotek team and see our Spatial Intelligence Risk Platform in action.',
    openGraph: {
      title,
      description: 'Meet the Nexotek team and see our Spatial Intelligence Risk Platform in action.',
    },
  };
}

export default async function EventPage({ params }: Readonly<EventPageProps>) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) notFound();

  const showDiagram = event.showDiagram ?? true;
  const showSkylineScene = event.showSkylineScene ?? false;

  const fc = event.fieldConfig as Record<string, boolean> | undefined;
  const requiredFields = {
    name:         fc?.requireName         ?? true,
    organization: fc?.requireOrganization ?? true,
    phone:        fc?.requirePhone        ?? true,
    email:        fc?.requireEmail        ?? true,
  };

  return (
    <div className="flex flex-col bg-nx-paper dark:bg-nx-black min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden">
      <Navbar />

      {showDiagram ? (
        /*
          ── With diagram: two-column layout ──────────────────────────────
          Left card: headline + separator + diagram (fills full height)
          Right card: form (matches left height via grid items-stretch)
        */
        <main className="
          flex-1 lg:min-h-0
          px-4 sm:px-5 lg:px-6
          pt-4 pb-6 lg:py-4
        ">
          <div className="
            w-full max-w-6xl mx-auto
            flex flex-col gap-4
            lg:grid lg:grid-cols-2 lg:items-stretch lg:h-full
          ">
            {/* LEFT */}
            <div className="bg-white dark:bg-nx-ink-3 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
              <div className="blueprint-grid px-6 sm:px-8 pt-7 pb-5 flex-shrink-0">
                <h1
                  className={`${titleFont.className} font-700 leading-[1.02] tracking-tight text-[clamp(2rem,4vw,3.2rem)] text-[#0A0A0A] dark:text-white`}
                >
                  Spatial Intelligence for the People Who Build the World.
                </h1>
                <p className="mt-3 text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed max-w-md">
                  From real-time hazard detection to immersive training — one connected platform.
                </p>
              </div>
              <div className="mx-6 sm:mx-8 border-t border-neutral-100 dark:border-neutral-800" />
              {showSkylineScene ? (
                <div className="flex-1 min-h-0 overflow-hidden">
                  <WorkerSkylineScene />
                </div>
              ) : (
                <div className="flex-1 flex items-center px-6 py-6">
                  <PlatformLoopDiagram />
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div className="bg-white dark:bg-nx-ink-3 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
              <EventRegistrationForm
                bare
                eventSlug={slug}
                isOpen={event.isOpen ?? true}
                ctaLabel={event.ctaLabel ?? 'Request a Demo'}
                boothInfo={event.boothInfo ?? undefined}
                requiredFields={requiredFields}
              />
            </div>
          </div>
        </main>
      ) : (
        /*
          ── Without diagram: single centered card ────────────────────────
          Title sits above the form inside one unified card.
          On landscape/desktop: card is centered horizontally and vertically.
          On mobile: card has natural height and the page scrolls.
        */
        <main className="
          flex-1 lg:min-h-0
          flex items-center justify-center
          px-4 sm:px-5 lg:px-6
          pt-4 pb-6 lg:py-4
        ">
          {/*
            On desktop: card is capped at the main area height (lg:max-h-full).
            Title is pinned (flex-shrink-0). The form scrolls inside the card
            if content exceeds the available space.
          */}
          <div className="w-full max-w-md bg-white dark:bg-nx-ink-3 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col lg:max-h-full">

            {/* Title — pinned, never scrolls away */}
            <div className="blueprint-grid flex-shrink-0 px-7 pt-7 pb-5">
              <h1
                className={`${titleFont.className} font-700 leading-[1.02] tracking-tight text-[clamp(1.8rem,3vw,2.6rem)] text-[#0A0A0A] dark:text-white`}
              >
                Spatial Intelligence for the People Who Build the World.
              </h1>
            </div>

            <div className="flex-shrink-0 mx-7 border-t border-neutral-100 dark:border-neutral-800" />

            {/* Form — scrollable if card hits max-height on desktop */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <EventRegistrationForm
                bare
                hideHeading
                eventSlug={slug}
                isOpen={event.isOpen ?? true}
                ctaLabel={event.ctaLabel ?? 'Request a Demo'}
                boothInfo={event.boothInfo ?? undefined}
                requiredFields={requiredFields}
              />
            </div>

          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}
