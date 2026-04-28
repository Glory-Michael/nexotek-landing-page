import { getPayload } from 'payload';
import config from '@/payload.config';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Events — Nexotek',
  description: 'Connect with the Nexotek team at upcoming industry events.',
};

async function getActiveEvents() {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'events',
    where: { isOpen: { equals: true } },
    limit: 50,
    sort: '-createdAt',
  });
  return result.docs;
}

export default async function EventsIndexPage() {
  const events = await getActiveEvents();

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-24 pb-20">
        <h1 className="text-3xl font-bold text-black mb-2">Find us at these events</h1>
        <p className="text-neutral-500 mb-10">
          Connect with the Nexotek team and see our platform in action.
        </p>

        {events.length === 0 ? (
          <p className="text-neutral-400 text-sm">No active events at the moment.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="flex items-center justify-between border border-neutral-200 rounded-xl px-5 py-4 hover:border-neutral-400 hover:shadow-sm transition-all duration-200 group"
              >
                <div>
                  <p className="font-medium text-black">{event.title}</p>
                  {event.boothInfo && (
                    <p className="text-xs text-neutral-400 mt-0.5">{event.boothInfo}</p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-black group-hover:translate-x-0.5 transition-all duration-200" />
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
