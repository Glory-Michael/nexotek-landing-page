interface ChapterHeaderProps {
  eyebrow?: string;
  title?: string;
  leadSentence?: string;
  /** Render the header for an ink surface (dark bg). Default is paper. */
  onInk?: boolean;
  className?: string;
}

export function ChapterHeader({
  eyebrow,
  title,
  leadSentence,
  onInk = false,
  className = '',
}: ChapterHeaderProps) {
  const inlineColor = onInk
    ? 'text-white/65'
    : 'text-neutral-500 dark:text-neutral-400';
  const ghostColor = onInk ? 'text-white' : 'text-black dark:text-white';
  const ghostOpacity = onInk
    ? 'opacity-[0.07]'
    : 'opacity-[0.06] dark:opacity-[0.09]';
  const titleColor = onInk ? 'text-white' : '';
  const leadColor = onInk
    ? 'text-neutral-300'
    : 'text-neutral-700 dark:text-neutral-300';

  return (
    <header className={`relative mb-12 ${className}`}>
      {/* Inline tiny chapter label — small italic Roman + eyebrow on one line. */}
      <div className="relative z-10 mb-5 flex items-baseline gap-2 font-serif italic">
        <span
          aria-hidden="true"
          className={`nx-chapter-num text-base font-light md:text-lg ${inlineColor}`}
        />
        {eyebrow && (
          <span className={`text-base font-light md:text-lg ${inlineColor}`}>
            {eyebrow}
          </span>
        )}
      </div>

      {/* Title sits atop a giant ghosted Roman numeral watermark. */}
      <div className="relative">
        <span
          aria-hidden="true"
          className={`nx-chapter-num-ghost pointer-events-none absolute -left-2 -top-10 select-none font-serif italic font-light leading-none text-[9rem] md:-top-16 md:text-[18rem] ${ghostColor} ${ghostOpacity}`}
        />
        {title && (
          <h2
            className={`relative font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl ${titleColor}`}
          >
            {title}
          </h2>
        )}
      </div>

      {leadSentence && (
        <p
          className={`relative mt-5 max-w-3xl text-lg leading-relaxed md:text-xl ${leadColor}`}
        >
          {leadSentence}
        </p>
      )}
    </header>
  );
}
