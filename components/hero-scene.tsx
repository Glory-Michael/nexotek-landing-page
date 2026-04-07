'use client';

import dynamic from 'next/dynamic';
import type { LandingPageData } from '@/types/landing-page';

const InteractiveSkyline = dynamic(
  () => import('./interactive-skyline').then(m => ({ default: m.InteractiveSkyline })),
  { ssr: false }
);

const CustomModelViewer = dynamic(
  () => import('./custom-model-viewer').then(m => ({ default: m.CustomModelViewer })),
  { ssr: false }
);

interface HeroSceneProps {
  scene?: LandingPageData['scene'];
  dotMatrixCursor: boolean;
}

export function HeroScene({ scene, dotMatrixCursor }: HeroSceneProps) {
  if (scene?.customModelUrl) {
    return (
      <CustomModelViewer
        modelUrl={scene.customModelUrl}
        scale={scene.modelScale}
        autoRotate={scene.autoRotate}
        rotationSpeed={scene.rotationSpeed}
        backgroundColor={scene.backgroundColor}
      />
    );
  }

  return <InteractiveSkyline showDotCursor={dotMatrixCursor} />;
}
