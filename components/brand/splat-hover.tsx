'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

interface SplatHoverProps {
  children: ReactNode;
  className?: string;
}

/**
 * SplatHover — on hover, slightly desaturates and overlays a faint dot-matrix
 * texture to suggest the spatial-reconstruction primitive without animating
 * the underlying image. Subtle by design.
 */
export function SplatHover({ children, className = '' }: SplatHoverProps) {
  const [hover, setHover] = useState(false);
  return (
    <span
      className={`relative inline-block overflow-hidden ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        style={{
          transition: 'filter var(--nx-dur-base, 240ms) var(--nx-ease-standard, ease-out)',
          filter: hover ? 'saturate(0.7) contrast(1.05)' : 'none',
          display: 'block',
        }}
      >
        {children}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: hover ? 0.45 : 0,
          transition: 'opacity var(--nx-dur-base, 240ms) var(--nx-ease-standard, ease-out)',
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.7) 0.5px, transparent 1.5px)',
          backgroundSize: '6px 6px',
          mixBlendMode: 'overlay',
        }}
      />
    </span>
  );
}
