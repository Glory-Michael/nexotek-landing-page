'use client';

import { useEffect, useRef, useState } from 'react';

interface StrokeRevealTitleProps {
  titleLine1: string;
  titleLine2: string;
  titleSizeClass: string;
  titleMbClass: string;
  headingFontClass: string;
}

function AnimatedText({
  text,
  charDelay,
  startDelay,
  strokeColor,
  fillColor,
  className,
}: {
  text: string;
  charDelay: number;
  startDelay: number;
  strokeColor: string;
  fillColor: string;
  className?: string;
}) {
  let charIndex = 0;

  return (
    <span className={className}>
      {text.split(/(\s+)/).map((segment, si) => {
        if (/^\s+$/.test(segment)) {
          charIndex += segment.length;
          return <span key={`s${si}`}>{segment}</span>;
        }
        return (
          <span key={`w${si}`} className="inline-block">
            {segment.split('').map((char) => {
              const delay = startDelay + charIndex * charDelay;
              charIndex++;
              return (
                <span
                  key={`${si}-${charIndex}`}
                  className="sr-char"
                  style={{
                    '--sr-delay': `${delay}s`,
                    '--sr-stroke': strokeColor,
                    '--sr-fill': fillColor,
                  } as React.CSSProperties}
                >
                  {char}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}

export function StrokeRevealTitle({
  titleLine1,
  titleLine2,
  titleSizeClass,
  titleMbClass,
  headingFontClass,
}: StrokeRevealTitleProps) {
  const hasInit = useRef(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    requestAnimationFrame(() => setStarted(true));
  }, []);

  return (
    <div
      className={`animate-hero-slide-in w-full max-w-md lg:max-w-none ${titleSizeClass} ${headingFontClass} font-bold tracking-tighter ${titleMbClass} leading-[1.1] sm:leading-[1.1]`}
    >
      <style>{`
        .sr-char {
          color: transparent;
          -webkit-text-stroke-width: 1.5px;
          -webkit-text-stroke-color: var(--sr-stroke);
        }
        .sr-started .sr-char {
          animation: sr-fill 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) var(--sr-delay) forwards;
        }
        @keyframes sr-fill {
          0% {
            color: transparent;
            -webkit-text-stroke-width: 1.5px;
          }
          100% {
            color: var(--sr-fill);
            -webkit-text-stroke-width: 0px;
          }
        }
        :root { --sr-c1: #171717; --sr-c2: #525252; }
        .dark { --sr-c1: #f5f5f5; --sr-c2: #d4d4d4; }
      `}</style>

      <h1 className={started ? 'sr-started' : ''}>
        <span className="text-transparent bg-clip-text bg-gradient-to-b from-black to-neutral-700 dark:from-white dark:to-neutral-300">
          {titleLine1}
        </span>
        <br className="hidden sm:block" />
        <AnimatedText
          text={titleLine2}
          charDelay={0}
          startDelay={1.2}
          strokeColor="var(--sr-c2)"
          fillColor="var(--sr-c2)"
          className="italic font-serif font-light"
        />
      </h1>
    </div>
  );
}
