'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ThemeToggle } from './theme-toggle';

interface FooterProps {
  copyrightName?: string;
}

export function Footer({ copyrightName = 'Nexotek.ai' }: FooterProps) {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="relative w-full bg-transparent py-4 px-6 md:px-12 z-50 mt-auto overflow-hidden"
    >
      {/* Isometric Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none"
        style={{ 
          maskImage: 'linear-gradient(to bottom, transparent, black 40%)', 
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 40%)' 
        }}
      >
        <svg width="100%" height="100%">
          <defs>
            <pattern id="footer-isometric-grid" width="40" height="69.282" patternUnits="userSpaceOnUse">
              <g stroke="currentColor" strokeWidth="1" fill="none">
                <path d="M 40 0 L 0 23.094 L 0 69.282 L 40 46.188 Z" />
                <path d="M 0 23.094 L 40 46.188 M 0 69.282 L 40 23.094" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-isometric-grid)" className="text-black dark:text-white" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <span className="text-[10px] sm:text-xs font-medium text-neutral-500 whitespace-nowrap">
            © {new Date().getFullYear()} {copyrightName}
          </span>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-neutral-500">
          <Link href="/privacy" className="hover:text-black dark:hover:text-white transition-colors whitespace-nowrap">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors whitespace-nowrap">
            Terms of Service
          </Link>
          <div className="hidden">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
