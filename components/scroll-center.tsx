'use client';

import { useEffect } from 'react';

const getSiteMain = () =>
  document.querySelector('.site-main') as HTMLElement | null;

const getViewportHeight = () =>
  Math.round(window.visualViewport?.height ?? window.innerHeight);

// Drive height from window.innerHeight instead of CSS dvh.
// iOS Safari's dvh unit can get stuck at the previous orientation's value
// after rotation, making site-main taller than the physical viewport and
// causing the body to become browser-scrollable. visualViewport.height tracks
// the actual visible viewport more reliably on iPad Safari during rotation.
// Only applies on the legacy single-viewport layout where site-main is its own
// scroll container. The v2 layout (with sections) uses natural body scroll —
// clamping site-main there would chop off everything below the viewport.
function isViewportLockedLayout(el: HTMLElement): boolean {
  return el.classList.contains('overflow-y-auto') || getComputedStyle(el).overflowY === 'auto';
}

function applyHeight() {
  const el = getSiteMain();
  if (!el) return;
  if (!isViewportLockedLayout(el)) {
    el.style.removeProperty('height');
    el.style.removeProperty('min-height');
    return;
  }
  const height = getViewportHeight();
  if (height > 640) {
    el.style.height = `${height}px`;
    el.style.minHeight = `${height}px`;
  } else {
    el.style.removeProperty('height');
    el.style.removeProperty('min-height');
  }
}

function centerScroll() {
  const el = getSiteMain();
  if (el && !isViewportLockedLayout(el)) return;
  if (!el) return;
  const overflow = el.scrollHeight - el.clientHeight;
  el.scrollTop = overflow > 0 ? overflow / 2 : 0;
}

function applyHeightAndCenter() {
  applyHeight();
  centerScroll();
}

export function ScrollCenter() {
  useEffect(() => {
    applyHeightAndCenter();

    const vvp = window.visualViewport;
    const onResize = () => applyHeight();
    if (vvp) vvp.addEventListener('resize', onResize);
    else window.addEventListener('resize', onResize);

    // iPad Safari can continue resizing the visual viewport for several
    // frames after orientationchange fires. Keep sampling until the height
    // stabilizes, then recenter once using the final dimensions.
    let rafId: number | null = null;
    const onOrientationChange = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);

      let lastHeight = -1;
      let stableFrames = 0;
      let frameCount = 0;

      const settle = () => {
        applyHeight();

        const nextHeight = getViewportHeight();
        if (nextHeight === lastHeight) {
          stableFrames += 1;
        } else {
          lastHeight = nextHeight;
          stableFrames = 0;
        }

        frameCount += 1;
        if (stableFrames >= 4 || frameCount >= 45) {
          applyHeightAndCenter();
          rafId = null;
          return;
        }

        rafId = requestAnimationFrame(settle);
      };

      rafId = requestAnimationFrame(settle);
    };
    globalThis.addEventListener('orientationchange', onOrientationChange);

    return () => {
      if (vvp) vvp.removeEventListener('resize', onResize);
      else window.removeEventListener('resize', onResize);
      globalThis.removeEventListener('orientationchange', onOrientationChange);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);
  return null;
}
