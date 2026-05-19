'use client';

import { Fragment } from 'react';
import { ScreenDeck } from './screen-deck';
import { SpatialStudioPeek } from './spatial-studio-peek';
import { SectionShell } from '../section-shell';

interface PlatformShowcaseProps {
  eyebrow: string;
  title: string;
  leadSentence?: string;
  visionCaption: string;
  spatialCaption: string;
  flowSteps: string[];
  screenDeckEnabled?: boolean;
  screenDeckAltText?: string;
  spatialStudioEnabled?: boolean;
  spatialStudioAltText?: string;
  className?: string;
}

export function PlatformShowcase({
  eyebrow,
  title,
  leadSentence,
  visionCaption,
  spatialCaption,
  flowSteps,
  screenDeckEnabled = true,
  screenDeckAltText,
  spatialStudioEnabled = true,
  spatialStudioAltText,
  className = '',
}: PlatformShowcaseProps) {
  return (
    <SectionShell
      surface="ink"
      eyebrow={eyebrow}
      title={title}
      leadSentence={leadSentence}
      className={className}
    >
      {/* ── Diptych: Vision (operator console) ↔ Spatial (studio) ───────
          Both panes are 360px tall. The studio is 480w — slightly wider
          than the 340w operator deck — so it reads as the heavier authoring
          surface without dominating the layout. Detection Activity is no
          longer a standalone card; it cycles inside the operator deck.
       */}
      <div className="hidden md:flex md:items-start md:justify-center md:gap-x-10 lg:gap-x-14">
        {screenDeckEnabled && (
          <figure
            className="flex flex-col items-center gap-3"
            aria-label={screenDeckAltText}
          >
            <ScreenDeck />
            <figcaption className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/55">
              {visionCaption}
            </figcaption>
          </figure>
        )}

        {spatialStudioEnabled && (
          <figure
            className="flex flex-col items-center gap-3"
            aria-label={spatialStudioAltText}
          >
            <SpatialStudioPeek />
            <figcaption className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/55">
              {spatialCaption}
            </figcaption>
          </figure>
        )}
      </div>

      {/* ── Mobile — vertical stack. Studio scales down so its 480w
          footprint fits narrow viewports without overflowing. ──────── */}
      <div className="flex flex-col items-center gap-10 md:hidden">
        {screenDeckEnabled && (
          <figure
            className="flex flex-col items-center gap-3"
            aria-label={screenDeckAltText}
          >
            <ScreenDeck />
            <figcaption className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/55">
              {visionCaption}
            </figcaption>
          </figure>
        )}
        {spatialStudioEnabled && (
          <figure
            className="flex flex-col items-center gap-3"
            aria-label={spatialStudioAltText}
          >
            <div className="h-[216px] w-[336px] overflow-hidden">
              <div className="origin-top-left scale-[0.6]">
                <SpatialStudioPeek />
              </div>
            </div>
            <figcaption className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/55">
              {spatialCaption}
            </figcaption>
          </figure>
        )}
      </div>

      {/* ── Flow caption ────────────────────────────────────────────────── */}
      {flowSteps.length > 0 && (
        <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.24em] text-white/60">
          {flowSteps.map((step, i) => (
            <Fragment key={`${step}-${i}`}>
              {i > 0 && <span className="text-white/30">→</span>}
              <span>{step}</span>
            </Fragment>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
