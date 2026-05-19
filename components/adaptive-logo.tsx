'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface AdaptiveLogoProps {
  src: string;
}

interface SlotRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Renders an invisible logo-sized placeholder inside the navbar (so flex
// layout still allocates the slot) and portals the visible logo to
// document.body. Living at body level means the portaled element is in the
// page's root stacking context, which lets `mix-blend-mode: difference`
// actually compose against the page content behind it — the same trick the
// CustomCursor uses. Position is kept in sync via ResizeObserver +
// scroll/resize listeners so the floating logo tracks the layout slot.
export function AdaptiveLogo({ src }: AdaptiveLogoProps) {
  const slotRef = useRef<HTMLSpanElement | null>(null);
  const [rect, setRect] = useState<SlotRect | null>(null);
  const [canPortal, setCanPortal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setCanPortal(true), []);

  // The MobileMenu broadcasts open/close so the portaled logo can step out
  // of the way (otherwise it draws over the menu panel since both live at
  // document.body level).
  useEffect(() => {
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail;
      setMenuOpen(Boolean(detail?.open));
    };
    window.addEventListener('nx-menu-toggle', onToggle as EventListener);
    return () => window.removeEventListener('nx-menu-toggle', onToggle as EventListener);
  }, []);

  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;

    const recompute = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    recompute();

    const ro = new ResizeObserver(recompute);
    ro.observe(el);

    window.addEventListener('scroll', recompute, { passive: true });
    window.addEventListener('resize', recompute, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', recompute);
      window.removeEventListener('resize', recompute);
    };
  }, []);

  return (
    <>
      {/* Layout placeholder — claims the same dimensions as the visible logo
          so the navbar flex row reserves the correct space. */}
      <span
        ref={slotRef}
        aria-hidden="true"
        className="block h-10 md:h-16 lg:h-20 w-32 md:w-40 lg:w-48"
      />
      {canPortal && rect && !menuOpen && createPortal(
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[9990] mix-blend-difference"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        >
          {/* `invert` flips the source (black wordmark) to white so the
              difference blend produces black over light backgrounds and
              white over dark ones, mirroring the CustomCursor behavior. */}
          <div className="relative h-full w-full invert">
            <Image
              src={src}
              alt=""
              fill
              priority
              unoptimized
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
