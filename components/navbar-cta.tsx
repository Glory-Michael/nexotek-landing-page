'use client';

import { ArrowRight } from 'lucide-react';
import { MagneticButton } from './magnetic-button';

interface NavbarCTAProps {
  ctaText: string;
}

export function NavbarCTA({ ctaText }: NavbarCTAProps) {
  return (
    <MagneticButton
      onClick={() => document.getElementById('email-input')?.focus()}
      className="hidden group items-center gap-2 px-4 py-2 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 transition-all duration-300 text-sm font-medium text-black dark:text-white backdrop-blur-md"
    >
      {ctaText}
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </MagneticButton>
  );
}
