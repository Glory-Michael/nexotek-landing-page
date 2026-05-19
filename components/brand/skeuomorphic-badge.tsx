'use client';

import type { CSSProperties } from 'react';

type BadgeVariant = 'sticker' | 'stamp';
type BadgeColor = 'yellow' | 'red' | 'blue' | 'green' | 'amber';
type BadgeIcon = 'check' | 'star' | 'bolt' | 'shield' | 'dot';

interface SkeuomorphicBadgeProps {
  variant?: BadgeVariant;
  color?: BadgeColor;
  primary: string;
  secondary?: string;
  icon?: BadgeIcon;
  rotate?: number;
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Subtle hover-lift; disabled for purely decorative use. */
  interactive?: boolean;
}

interface Palette {
  bg: string;
  fg: string;
  accent: string;
  deep: string;
  /** Top-edge highlight tint (lighter than bg). */
  highlight: string;
}

const PALETTE: Record<BadgeColor, Palette> = {
  yellow: { bg: '#F4D544', fg: '#3A2A00', accent: '#D9B62D', deep: '#7A5C0F', highlight: '#FFE780' },
  red:    { bg: '#D9342B', fg: '#FFFFFF', accent: '#A8231C', deep: '#6F1611', highlight: '#F36057' },
  blue:   { bg: '#2D6BFF', fg: '#FFFFFF', accent: '#1F50CC', deep: '#0F2D85', highlight: '#6A93FF' },
  green:  { bg: '#3DB46D', fg: '#FFFFFF', accent: '#2A8E54', deep: '#0E5E36', highlight: '#6BD192' },
  amber:  { bg: '#E89B2C', fg: '#FFFFFF', accent: '#C77A19', deep: '#5A3608', highlight: '#FFBA5C' },
};

const ICON_PATHS: Record<BadgeIcon, string> = {
  check:  'M5 12 L10 17 L19 7',
  star:   'M12 2 L14.5 9 L22 9 L16 14 L18 21 L12 17 L6 21 L8 14 L2 9 L9.5 9 Z',
  bolt:   'M13 2 L4 14 L11 14 L9 22 L18 10 L13 10 Z',
  shield: 'M12 2 L20 6 V12 C20 17 16 21 12 22 C8 21 4 17 4 12 V6 Z',
  dot:    'M12 8 A 4 4 0 1 1 12 16 A 4 4 0 1 1 12 8 Z',
};

function Icon({ name, size, color }: { name: BadgeIcon; size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === 'star' || name === 'shield' || name === 'bolt' || name === 'dot' ? color : 'none'}
      stroke={name === 'check' ? color : 'none'}
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export function SkeuomorphicBadge({
  variant = 'sticker',
  color = 'yellow',
  primary,
  secondary,
  icon,
  rotate = -8,
  size = 110,
  className = '',
  style,
  interactive = false,
}: SkeuomorphicBadgeProps) {
  const p = PALETTE[color];

  if (variant === 'stamp') {
    return (
      <RubberStamp
        p={p}
        primary={primary}
        secondary={secondary}
        icon={icon}
        rotate={rotate}
        size={size}
        className={className}
        style={style}
        interactive={interactive}
      />
    );
  }

  return (
    <Sticker
      p={p}
      primary={primary}
      secondary={secondary}
      icon={icon}
      rotate={rotate}
      size={size}
      className={className}
      style={style}
      interactive={interactive}
    />
  );
}

interface VariantProps {
  p: Palette;
  primary: string;
  secondary?: string;
  icon?: BadgeIcon;
  rotate: number;
  size: number;
  className: string;
  style?: CSSProperties;
  interactive: boolean;
}

// ── Sticker ─────────────────────────────────────────────────────────────────
// Vinyl sticker character: die-cut bright edge, soft directional drop shadow
// (lit from above-left), gentle top gloss, and a subtle inner color shift
// from the highlight tint at the top to the deeper accent near the bottom.
function Sticker({ p, primary, secondary, icon, rotate, size, className, style, interactive }: VariantProps) {
  return (
    <div
      className={`relative inline-flex select-none flex-col items-center justify-center rounded-2xl transition-transform duration-300 motion-reduce:transition-none nx-badge-pop ${interactive ? 'hover:-rotate-1 hover:scale-[1.04]' : ''} ${className}`}
      style={{
        width: size * 1.7,
        paddingInline: size * 0.16,
        paddingBlock: size * 0.11,
        background: `
          radial-gradient(120% 80% at 30% 0%, ${p.highlight} 0%, ${p.bg} 38%, ${p.bg} 60%, ${p.accent} 100%)
        `,
        color: p.fg,
        transform: `rotate(${rotate}deg)`,
        // Die-cut white edge + soft directional 3-layer shadow stack
        boxShadow: [
          // tight contact shadow (closest to surface)
          `0 1px 1px ${p.deep}55`,
          `0 2px 3px ${p.deep}3A`,
          // mid ambient
          `0 6px 12px -2px ${p.deep}66`,
          // diffuse cast (longer, softer, directional down-right)
          `4px 18px 32px -8px ${p.deep}A0`,
          // base sit (gives the sticker mass)
          `0 1px 0 ${p.deep}DD`,
          // inner top edge (lit) + bottom edge (shadowed)
          `inset 0 1px 0 rgba(255,255,255,0.55)`,
          `inset 0 -1px 0 ${p.deep}88`,
          // hairline die-cut highlight
          `inset 0 0 0 1px rgba(255,255,255,0.18)`,
        ].join(', '),
        ...style,
      }}
      aria-label={`${primary}${secondary ? ` ${secondary}` : ''}`}
    >
      {/* Top gloss — concentrated up-left to read as a single light source. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[6%] top-[6%] h-[34%] rounded-[14px]"
        style={{
          background:
            'linear-gradient(155deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 55%, rgba(255,255,255,0) 100%)',
          filter: 'blur(0.4px)',
        }}
      />
      {/* Hairline die-cut perimeter — subtle, replaces the old dashed seam. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[2px] rounded-[14px]"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.16), inset 0 0 0 2px ${p.deep}22`,
        }}
      />

      <div
        className="relative flex items-center"
        style={{ gap: size * 0.06 }}
      >
        {icon && <Icon name={icon} size={Math.max(12, size * 0.14)} color={p.fg} />}
        <span
          className="font-display font-bold uppercase leading-[1.02]"
          style={{
            fontSize: `${size * 0.135}px`,
            letterSpacing: '0.04em',
            textShadow: `0 1px 0 ${p.deep}55`,
          }}
        >
          {primary}
        </span>
      </div>
      {secondary && (
        <span
          className="relative font-mono font-semibold uppercase"
          style={{
            marginTop: size * 0.05,
            fontSize: `${size * 0.085}px`,
            letterSpacing: '0.22em',
            opacity: 0.82,
            textShadow: `0 1px 0 ${p.deep}33`,
          }}
        >
          {secondary}
        </span>
      )}

      <style jsx>{`
        @keyframes nx-badge-pop {
          0%   { transform: rotate(${rotate}deg) scale(0.6); opacity: 0; }
          60%  { transform: rotate(${rotate - 2}deg) scale(1.06); opacity: 1; }
          100% { transform: rotate(${rotate}deg) scale(1); opacity: 1; }
        }
        :global(.nx-badge-pop) {
          animation: nx-badge-pop 520ms cubic-bezier(0.22, 1.4, 0.36, 1) both;
        }
        :global(html[data-motion='reduced']) :global(.nx-badge-pop) {
          animation: none;
        }
      `}</style>
    </div>
  );
}

// ── Rubber stamp ────────────────────────────────────────────────────────────
// Letterpress "ink-on-paper" character. Sharper than the sticker; the depth
// comes from drop shadow (the paper "lifts" off the page) rather than from
// 3D edges (a stamp is flat). Distress speckle adds the ink-skip detail.
function RubberStamp({ p, primary, secondary, icon, rotate, size, className, style, interactive }: VariantProps) {
  const width = size * 1.7;
  const height = size * 1.0;
  const stampInk = p.deep;

  return (
    <div
      className={`relative inline-flex select-none items-center justify-center transition-transform duration-300 motion-reduce:transition-none nx-badge-pop ${interactive ? 'hover:-rotate-2 hover:scale-[1.04]' : ''} ${className}`}
      style={{
        width,
        height,
        color: stampInk,
        transform: `rotate(${rotate}deg)`,
        // Layered paper-on-surface drop. Softer than the sticker — a stamp
        // doesn't "lift" much, just rests on the page.
        filter: [
          `drop-shadow(0 1px 0.5px ${p.deep}44)`,
          `drop-shadow(0 4px 8px ${p.deep}55)`,
          `drop-shadow(3px 12px 24px ${p.deep}5A)`,
        ].join(' '),
        ...style,
      }}
      aria-label={`${primary}${secondary ? ` ${secondary}` : ''}`}
    >
      {/* Stamped paper background — pale tint of the ink colour so the text
          reads with high contrast (deep ink on light paper-tinted fill). */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-[3px]"
        style={{
          background: `linear-gradient(170deg, ${p.bg}F2 0%, ${p.bg}E8 55%, ${p.accent}E2 100%)`,
          border: `2px solid ${stampInk}`,
          boxShadow: [
            `inset 0 0 0 1.5px ${p.bg}`,
            `inset 0 0 0 3px ${stampInk}D0`,
            `inset 0 1.5px 0 rgba(255,255,255,0.32)`,
            `inset 0 -2px 4px ${stampInk}33`,
          ].join(', '),
        }}
      />

      {/* Content stack — primary line / divider with optional icon / secondary */}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center"
        style={{
          gap: size * 0.04,
          paddingInline: size * 0.16,
          paddingBlock: size * 0.10,
        }}
      >
        <span
          className="font-display font-extrabold uppercase leading-none"
          style={{
            fontSize: `${size * 0.18}px`,
            letterSpacing: '0.08em',
            color: stampInk,
          }}
        >
          {primary}
        </span>

        <span
          aria-hidden="true"
          className="flex items-center"
          style={{ color: stampInk, gap: size * 0.05, marginBlock: size * 0.015 }}
        >
          <span className="block h-[1.5px]" style={{ width: size * 0.18, background: 'currentColor', opacity: 0.7 }} />
          {icon && <Icon name={icon} size={Math.max(10, size * 0.115)} color={stampInk} />}
          <span className="block h-[1.5px]" style={{ width: size * 0.18, background: 'currentColor', opacity: 0.7 }} />
        </span>

        {secondary && (
          <span
            className="font-mono font-bold uppercase leading-none"
            style={{
              fontSize: `${size * 0.092}px`,
              letterSpacing: '0.24em',
              color: stampInk,
              opacity: 0.82,
            }}
          >
            {secondary}
          </span>
        )}
      </div>

      {/* Distress speckle — subtle ink-skip flecks for the rubber-stamp feel */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
      >
        {[
          [8, 12], [92, 14], [12, 48], [88, 50], [50, 6], [50, 54],
          [25, 18], [75, 42], [42, 30], [62, 30],
        ].map(([cx, cy], i) => (
          <circle
            key={`d-${i}`}
            cx={cx}
            cy={cy}
            r={0.5 + (i % 2) * 0.35}
            fill={stampInk}
            opacity="0.20"
          />
        ))}
      </svg>

      <style jsx>{`
        @keyframes nx-badge-pop {
          0%   { transform: rotate(${rotate}deg) scale(0.6); opacity: 0; }
          55%  { transform: rotate(${rotate - 4}deg) scale(1.08); opacity: 1; }
          100% { transform: rotate(${rotate}deg) scale(1); opacity: 1; }
        }
        :global(.nx-badge-pop) {
          animation: nx-badge-pop 580ms cubic-bezier(0.22, 1.4, 0.36, 1) both;
        }
        :global(html[data-motion='reduced']) :global(.nx-badge-pop) {
          animation: none;
        }
      `}</style>
    </div>
  );
}
