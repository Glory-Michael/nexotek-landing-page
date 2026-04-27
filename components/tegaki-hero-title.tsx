'use client';

// DORMANT: Tegaki handwriting animation component.
// tegaki (npm) requires pre-generated font bundles with stroke-path data.
// Only script/handwriting fonts (Caveat, Italianno, etc.) are bundled;
// tegaki-generator is not yet publicly available to create bundles for
// custom fonts like Space Grotesk. This component is kept as a shell so
// the import in hero-section.tsx remains valid. To reactivate, generate a
// Space Grotesk bundle at https://gkurt.com/tegaki/generator/ once the
// generator supports it, then restore the TegakiRenderer usage below.

interface TegakiHeroTitleProps {
  titleLine1: string;
  titleLine2: string;
  titleSizeClass: string;
  titleMbClass: string;
}

export function TegakiHeroTitle(_props: TegakiHeroTitleProps) {
  return null;
}
