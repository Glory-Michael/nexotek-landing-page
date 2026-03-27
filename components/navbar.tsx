'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MagneticButton } from './magnetic-button';

export interface NavbarProps {
  logoSrc?: string;
  logoNode?: React.ReactNode;
  ctaText?: string;
}

export function Navbar({ logoSrc = "/logo.svg", logoNode, ctaText = "Get Updates" }: NavbarProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-50 flex items-center justify-between px-6 py-4 md:px-12 w-full bg-transparent min-h-[100px]"
    >
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative h-12 md:h-16 lg:h-20 w-32 md:w-40 lg:w-48">
          {logoNode ? (
            logoNode
          ) : (
            <Image 
              src={logoSrc} 
              alt="Nexotek Logo" 
              fill
              priority
              sizes="(max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
              className="object-contain dark:invert opacity-90 group-hover:opacity-100 transition-opacity" 
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </Link>

      <MagneticButton
        onClick={() => document.getElementById('email-input')?.focus()}
        className="hidden group items-center gap-2 px-4 py-2 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 transition-all duration-300 text-sm font-medium text-black dark:text-white backdrop-blur-md"
      >
        {ctaText}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </MagneticButton>
    </motion.header>
  );
}
