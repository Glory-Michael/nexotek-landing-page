/**
 * Curated icon set for Payload select fields.
 *
 * Strategy: icons live as inline React JSX inside the design-system
 * component (components/brand/nx-icon.tsx). Editors don't upload arbitrary
 * SVGs — they pick from this curated keyset, which is type-aligned with
 * `NxIconName` in nx-icon.tsx. Adding a new icon = adding it both to
 * NX_ICON_NAMES (here) and to ICON_PATHS (in nx-icon.tsx).
 *
 * This trade keeps brand consistency tight (no rogue uploads), keeps the
 * payload tiny (no media roundtrip per icon), and lets the icon set
 * evolve via code review rather than admin chaos.
 */
import type { Option } from 'payload';

// Keep in sync with `NxIconName` in components/brand/nx-icon.tsx.
export const NX_ICON_NAMES = [
  'arrow-right',
  'arrow-down',
  'asset',
  'close',
  'globe',
  'grid',
  'hex',
  'menu',
  'pause',
  'play',
  'play-circle',
  'plus',
  'radar',
  'search',
  'shield',
  'target',
  'trend',
  'user',
] as const;

// Title-case for the admin label so the dropdown reads cleanly.
function titleize(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const NX_ICON_OPTIONS: Option[] = NX_ICON_NAMES.map((value) => ({
  label: titleize(value),
  value,
}));
