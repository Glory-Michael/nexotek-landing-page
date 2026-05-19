import type { ReactNode } from 'react';

interface RedactedProps {
  children: ReactNode;
  variant?: 'block' | 'strike';
  className?: string;
}

/**
 * Redacted — renders the underlying text covered with a solid block (default)
 * or a single strike-through. Used for editorial moments where we hint at
 * non-public content (e.g. NDA-bound customer name, classified pilot site).
 * The text is preserved in the DOM via `aria-label` for screen readers.
 */
export function Redacted({ children, variant = 'block', className = '' }: RedactedProps) {
  const label = typeof children === 'string' ? children : 'Redacted';
  if (variant === 'strike') {
    return (
      <span aria-label={label} className={`relative inline-block ${className}`}>
        <span aria-hidden>{children}</span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-current"
        />
      </span>
    );
  }
  return (
    <span
      aria-label={label}
      className={`relative inline-block align-baseline ${className}`}
      style={{
        backgroundColor: 'currentColor',
        color: 'transparent',
        userSelect: 'none',
      }}
    >
      <span aria-hidden>{children}</span>
    </span>
  );
}
