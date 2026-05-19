import type { ReactElement, SVGProps } from 'react';

export type NxIconName =
  | 'arrow-right'
  | 'arrow-down'
  | 'asset'
  | 'close'
  | 'globe'
  | 'grid'
  | 'hex'
  | 'menu'
  | 'pause'
  | 'play'
  | 'play-circle'
  | 'plus'
  | 'radar'
  | 'search'
  | 'shield'
  | 'target'
  | 'trend'
  | 'user';

interface NxIconProps extends SVGProps<SVGSVGElement> {
  name: NxIconName;
  size?: number;
  'aria-label'?: string;
}

const ICON_PATHS: Record<NxIconName, ReactElement> = {
  'arrow-down': (
    <>
      <line x1="12" y1="5" x2="12" y2="20" />
      <polyline points="6,13 12,20 18,13" />
    </>
  ),
  'arrow-right': (
    <>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13,6 19,12 13,18" />
    </>
  ),
  asset: (
    <>
      <polygon points="12,3 4,8 4,16 12,21 20,16 20,8" />
      <polyline points="4,8 12,13 20,8" />
      <line x1="12" y1="13" x2="12" y2="21" />
    </>
  ),
  close: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M12 3 a14 14 0 010 18" />
      <path d="M12 3 a14 14 0 000 18" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="16" height="16" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="10" y1="10" x2="10" y2="20" />
    </>
  ),
  hex: <polygon points="12,3 21,8 21,16 12,21 3,16 3,8" />,
  menu: (
    <>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </>
  ),
  pause: (
    <>
      <line x1="6" y1="4" x2="6" y2="20" />
      <line x1="14" y1="4" x2="14" y2="20" />
    </>
  ),
  play: <polygon points="6,4 20,12 6,20" />,
  'play-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <polygon points="9,7 18,12 9,17" fill="currentColor" stroke="none" />
    </>
  ),
  plus: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="12" y1="5" x2="12" y2="19" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <line x1="16" y1="16" x2="20" y2="20" />
    </>
  ),
  shield: (
    <>
      <path d="M5 9 L12 4 L19 9 V19 H5 Z" />
      <line x1="5" y1="14" x2="19" y2="14" />
    </>
  ),
  target: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  trend: (
    <>
      <path d="M3 19 L9 13 L13 17 L21 9" />
      <polyline points="15,9 21,9 21,15" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 21 a7 7 0 0114 0" />
    </>
  ),
};

export function NxIcon({
  name,
  size = 24,
  'aria-label': ariaLabel,
  ...rest
}: NxIconProps) {
  const decorative = !ariaLabel;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative}
      aria-label={ariaLabel}
      {...rest}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
