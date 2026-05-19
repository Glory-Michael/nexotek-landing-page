import Link from 'next/link';
import type { ReactNode } from 'react';
import { NxIcon } from './nx-icon';
import type { NxIconName } from './nx-icon';

type NxIconButtonSize = 'sm' | 'md' | 'lg';
type NxIconButtonSurface = 'paper' | 'ink';

interface NxIconButtonProps {
  href: string;
  icon?: NxIconName;
  size?: NxIconButtonSize;
  surface?: NxIconButtonSurface;
  label?: string;
  external?: boolean;
  className?: string;
  children?: ReactNode;
  'data-cta-mode'?: string;
}

const SIZE_PX: Record<NxIconButtonSize, { btn: number; icon: number }> = {
  sm: { btn: 48, icon: 18 },
  md: { btn: 64, icon: 22 },
  lg: { btn: 88, icon: 28 },
};

export function NxIconButton({
  href,
  icon = 'arrow-right',
  size = 'md',
  surface = 'paper',
  label,
  external,
  className = '',
  children,
  ...rest
}: NxIconButtonProps) {
  const sizes = SIZE_PX[size];
  const isInk = surface === 'ink';
  const surfaceClass = isInk
    ? 'bg-black text-white hover:bg-neutral-900'
    : 'bg-white text-black hover:bg-neutral-100';
  const borderClass = isInk ? 'border-white/10' : 'border-black/10';

  const content = (
    <>
      <span
        className={`flex items-center justify-center rounded-full border ${surfaceClass} ${borderClass} transition-colors`}
        style={{ width: sizes.btn, height: sizes.btn }}
      >
        <NxIcon name={icon} size={sizes.icon} aria-label={label} />
      </span>
      {children && (
        <span className="font-mono text-xs uppercase tracking-[0.18em]">{children}</span>
      )}
    </>
  );

  const linkClassName = `inline-flex items-center gap-3 group ${className}`;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        aria-label={label}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={linkClassName} aria-label={label} {...rest}>
      {content}
    </Link>
  );
}
