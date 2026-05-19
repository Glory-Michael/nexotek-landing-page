import type { ReactNode } from 'react';

interface NxGeometryIconProps {
  size?: number;
  surface?: 'paper' | 'ink';
  children?: ReactNode;
  className?: string;
}

export function NxGeometryIcon({
  size = 20,
  surface = 'paper',
  children,
  className = '',
}: NxGeometryIconProps) {
  const isInk = surface === 'ink';
  return (
    <span
      className={`inline-flex items-center justify-center ${
        isInk ? 'bg-white text-black' : 'bg-black text-white'
      } ${className}`}
      style={{ width: size, height: size, borderRadius: 'var(--nx-radius-geometry, 20px)' }}
      aria-hidden
    >
      {children ?? <span className="block h-1 w-1 rounded-full bg-current" />}
    </span>
  );
}
