'use client';

import dynamic from 'next/dynamic';

const CustomCursor = dynamic(
  () => import('@/components/custom-cursor').then(m => ({ default: m.CustomCursor })),
  { ssr: false }
);

const ThemeScheduler = dynamic(
  () => import('@/components/theme-scheduler').then(m => ({ default: m.ThemeScheduler })),
  { ssr: false }
);

interface ClientEffectsProps {
  customCursorEnabled: boolean;
  themeMode: 'light' | 'dark' | 'system' | 'scheduled';
  lightStartTime: string;
  darkStartTime: string;
}

export function ClientEffects({
  customCursorEnabled,
  themeMode,
  lightStartTime,
  darkStartTime,
}: ClientEffectsProps) {
  return (
    <>
      <CustomCursor enabled={customCursorEnabled} />
      <ThemeScheduler
        mode={themeMode}
        lightStartTime={lightStartTime}
        darkStartTime={darkStartTime}
      />
    </>
  );
}
