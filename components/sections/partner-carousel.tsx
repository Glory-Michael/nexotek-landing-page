'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface PartnerLogo {
  url?: string;
  alt?: string;
  mimeType?: string;
}

interface Partner {
  name: string;
  kind: 'real' | 'placeholder';
  category: string;
  logo?: PartnerLogo | null;
}

export function PartnerCarousel({ partners }: { partners: Partner[] }) {
  const reduced = useReducedMotion();
  if (partners.length === 0) return null;
  // Duplicate the list so the marquee can loop seamlessly — when the first
  // copy slides off, the second is positioned right behind it.
  const items = [...partners, ...partners];

  return (
    <section
      className="relative overflow-hidden border-y border-white/10 bg-black py-14 text-white"
      aria-label="Partners we're building with"
    >
      <p className="mb-10 text-center font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
        ─ Building with
      </p>

      <div className="relative">
        {/* Edge fades so the marquee dissolves instead of hard-cutting at the
            section edges. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-black to-transparent md:w-48"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-black to-transparent md:w-48"
        />

        <div
          className={`flex w-max items-center ${reduced ? '' : 'nx-partner-marquee'}`}
        >
          {items.map((p, i) => (
            <PartnerCell key={`${p.name}-${i}`} partner={p} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes nx-partner-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        :global(.nx-partner-marquee) {
          animation: nx-partner-marquee 38s linear infinite;
        }
        :global(.nx-partner-marquee:hover) {
          animation-play-state: paused;
        }
        :global(html[data-motion='reduced']) :global(.nx-partner-marquee) {
          animation: none;
        }
      `}</style>
    </section>
  );
}

function PartnerCell({ partner }: { partner: Partner }) {
  const isReal = partner.kind === 'real';
  const logoUrl = partner.logo?.url;
  return (
    <div className="mx-8 flex shrink-0 items-center gap-4 md:mx-12">
      <span
        className={`font-mono text-[10px] uppercase tracking-[0.28em] ${
          isReal ? 'text-white/55' : 'text-white/30'
        }`}
      >
        {partner.category}
      </span>
      <span
        aria-hidden="true"
        className={`block h-4 w-px ${isReal ? 'bg-white/25' : 'bg-white/12'}`}
      />
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={partner.logo?.alt || partner.name}
          loading="lazy"
          decoding="async"
          className="block h-8 w-auto max-w-[200px] object-contain md:h-10"
        />
      ) : (
        <span
          className={`whitespace-nowrap font-display text-2xl font-semibold tracking-tight md:text-3xl ${
            isReal ? 'text-white' : 'font-serif italic font-light text-white/35'
          }`}
        >
          {partner.name}
        </span>
      )}
    </div>
  );
}
