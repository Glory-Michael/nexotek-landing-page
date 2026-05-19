import type { CSSProperties } from 'react';

const RING_COUNT = 10;
const RING_PERIOD_SEC = 6.4;
const SCANNER_RADII = [220, 380, 560];

export function SpatialPulse({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 hidden overflow-hidden dark:block ${className}`}
    >
      {/* Layer 1 — slow rotating conic wash anchored at the top-right corner.
          Lifts the dark surface and gives the rings something to read against. */}
      <div className="nx-spatial-pulse__wash absolute inset-0" />

      {/* Layer 2 — primary expanding ring family + partial "scanner" arcs.
          Screen-blended so the arcs additively glow over the wash. */}
      <svg
        className="nx-spatial-pulse__svg absolute right-0 top-0 h-[200%] w-[200%] translate-x-[55%] -translate-y-[55%]"
        viewBox="0 0 800 800"
      >
        <defs>
          <linearGradient id="nx-spatial-pulse-stroke" x1="1" y1="0.05" x2="0.05" y2="1">
            <stop offset="0%"   stopColor="#5BE8FF" stopOpacity="0" />
            <stop offset="18%"  stopColor="#5BE8FF" stopOpacity="1" />
            <stop offset="42%"  stopColor="#3DB46D" stopOpacity="0.95" />
            <stop offset="72%"  stopColor="#7FE0A1" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#7FE0A1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="nx-spatial-pulse-scanner" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#E6FBFF" stopOpacity="0" />
            <stop offset="45%"  stopColor="#E6FBFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#5BE8FF" stopOpacity="0" />
          </linearGradient>
          <filter id="nx-spatial-pulse-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
          <filter id="nx-spatial-pulse-glow-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Soft halo pass — wider blur of the same rings to fake volumetric bloom */}
        <g filter="url(#nx-spatial-pulse-glow-soft)" opacity="0.55">
          {Array.from({ length: RING_COUNT }).map((_, i) => (
            <circle
              key={`halo-${i}`}
              cx="400"
              cy="400"
              r="40"
              fill="none"
              stroke="url(#nx-spatial-pulse-stroke)"
              strokeWidth={i % 2 === 0 ? 3.2 : 1.6}
              strokeLinecap="round"
              className="nx-spatial-pulse__ring"
              style={{ animationDelay: `${-(i / RING_COUNT) * RING_PERIOD_SEC}s` } as CSSProperties}
            />
          ))}
        </g>

        {/* Sharp pass — crisp arc lines on top of the halo */}
        <g filter="url(#nx-spatial-pulse-glow)">
          {Array.from({ length: RING_COUNT }).map((_, i) => (
            <circle
              key={`ring-${i}`}
              cx="400"
              cy="400"
              r="40"
              fill="none"
              stroke="url(#nx-spatial-pulse-stroke)"
              strokeWidth={i % 2 === 0 ? 2.4 : 1.2}
              strokeLinecap="round"
              className="nx-spatial-pulse__ring"
              style={{ animationDelay: `${-(i / RING_COUNT) * RING_PERIOD_SEC}s` } as CSSProperties}
            />
          ))}
        </g>

        {/* Scanner arcs — partial dashed circles rotating at different speeds,
            alternating direction, suggesting active sensors scanning the field */}
        <g filter="url(#nx-spatial-pulse-glow)">
          {SCANNER_RADII.map((r, i) => {
            const circumference = 2 * Math.PI * r;
            return (
              <circle
                key={`scanner-${i}`}
                cx="400"
                cy="400"
                r={r}
                fill="none"
                stroke="url(#nx-spatial-pulse-scanner)"
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeDasharray={`${circumference * 0.16} ${circumference}`}
                className="nx-spatial-pulse__scanner"
                style={{
                  animationDuration: `${16 + i * 5}s`,
                  animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
                  animationDelay: `${-i * 3}s`,
                } as CSSProperties}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
