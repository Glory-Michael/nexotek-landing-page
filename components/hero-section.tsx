'use client';

import { motion } from 'motion/react';
import { EmailForm } from './email-form';
import { BackgroundBeams } from './background-beams';
import { InteractiveSkyline } from './interactive-skyline';
import { ChevronDown } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative flex-1 flex flex-col lg:flex-row items-stretch justify-center w-full px-0 pt-0 overflow-hidden">
      <BackgroundBeams />
      
      {/* Interactive Skyline - Background on mobile, Split on desktop */}
      <div 
        className="absolute lg:relative inset-0 lg:inset-auto w-full lg:w-[55%] xl:w-[50%] order-2 lg:order-2 opacity-40 lg:opacity-100"
        data-hide-cursor="true"
      >
        <InteractiveSkyline />
        
        {/* Gradients to blend with content */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent dark:from-black dark:via-black/20 lg:hidden z-10 pointer-events-none cursor-none" data-hide-cursor="true" />
      </div>

      {/* Content Side */}
      <div className="relative z-20 w-full lg:w-[45%] xl:w-[50%] flex flex-col items-center justify-center lg:items-start lg:justify-center text-left px-6 sm:px-12 lg:pl-20 xl:pl-32 lg:pr-12 py-8 lg:py-0 order-1 lg:order-1">
        <motion.h1
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md lg:max-w-none text-4xl sm:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-display font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-black to-neutral-700 dark:from-white dark:to-neutral-300 mb-4 sm:mb-8 leading-[1.1] sm:leading-[1.1]"
        >
          <span>Spatial Risk Intelligence,</span> <br className="hidden sm:block" />
          <span className="italic font-serif text-neutral-600 dark:text-neutral-300 font-light">Redefined.</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md lg:max-w-none"
        >
          <p className="text-neutral-800 dark:text-neutral-200 mb-6 sm:mb-8 font-medium text-base sm:text-lg lg:text-xl">
            Nexotek is building the next generation of enterprise spatial risk management systems. 
            Join the waitlist to secure your spot for our upcoming launch.
          </p>
          <EmailForm />
        </motion.div>
      </div>

      {/* Decorative Elements */}
    </section>
  );
}
