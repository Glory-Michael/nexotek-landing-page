'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export function CustomCursor({ enabled = true }: { enabled?: boolean }) {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  }, []);

  useEffect(() => {
    if (isTouch) return;
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if we should hide the cursor
      if (target.closest('[data-hide-cursor]')) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }

      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        target.tagName.toLowerCase() === 'input'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => setIsHidden(true);
    const handleMouseEnter = () => setIsHidden(false);

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  if (!enabled || isTouch) return null;

  const visible = !isHidden;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 bg-white rounded-full mix-blend-difference pointer-events-none z-[9999] hidden md:block"
        animate={{
          x: mousePosition.x - 8,
          y: mousePosition.y - 8,
          scale: isHovering ? 2.5 : 1,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          x: { type: 'spring', stiffness: 150, damping: 15, mass: 0.5 },
          y: { type: 'spring', stiffness: 150, damping: 15, mass: 0.5 },
          scale: { type: 'spring', stiffness: 150, damping: 15, mass: 0.5 },
          opacity: { duration: 0.15 },
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 border border-white/30 rounded-full mix-blend-difference pointer-events-none z-[9998] hidden md:block"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isHovering ? 1.5 : 1,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          x: { type: 'spring', stiffness: 100, damping: 25, mass: 1 },
          y: { type: 'spring', stiffness: 100, damping: 25, mass: 1 },
          scale: { type: 'spring', stiffness: 100, damping: 25, mass: 1 },
          opacity: { duration: 0.15 },
        }}
      />
    </>
  );
}
