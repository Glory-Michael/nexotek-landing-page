'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

interface ThemeSchedulerProps {
  mode: 'light' | 'dark' | 'system' | 'scheduled';
  lightStartTime: string;
  darkStartTime: string;
}

function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
}

function getScheduledTheme(lightStart: string, darkStart: string): 'light' | 'dark' {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const light = parseTime(lightStart);
  const dark = parseTime(darkStart);
  const lightMin = light.hours * 60 + light.minutes;
  const darkMin = dark.hours * 60 + dark.minutes;

  if (lightMin < darkMin) {
    // Normal: light during the day (e.g., 06:00–18:00)
    return currentMinutes >= lightMin && currentMinutes < darkMin ? 'light' : 'dark';
  } else {
    // Inverted: dark during the day (e.g., 18:00–06:00)
    return currentMinutes >= darkMin && currentMinutes < lightMin ? 'dark' : 'light';
  }
}

export function ThemeScheduler({ mode, lightStartTime, darkStartTime }: ThemeSchedulerProps) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (mode === 'light' || mode === 'dark') {
      setTheme(mode);
      return;
    }

    if (mode === 'system') {
      setTheme('system');
      return;
    }

    if (mode === 'scheduled') {
      const apply = () => {
        const scheduled = getScheduledTheme(lightStartTime, darkStartTime);
        setTheme(scheduled);
      };

      apply();
      // Re-check every minute
      const interval = setInterval(apply, 60000);
      return () => clearInterval(interval);
    }
  }, [mode, lightStartTime, darkStartTime, setTheme]);

  return null;
}
