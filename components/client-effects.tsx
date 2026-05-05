'use client';

import dynamic from 'next/dynamic';

const CustomCursor = dynamic(
  () => import('@/components/custom-cursor').then(m => ({ default: m.CustomCursor })),
  { ssr: false }
);

interface ClientEffectsProps {
  customCursorEnabled: boolean;
}

export function ClientEffects({ customCursorEnabled }: Readonly<ClientEffectsProps>) {
  return <CustomCursor enabled={customCursorEnabled} />;
}
