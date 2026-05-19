'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface OperatorCliProps {
  className?: string;
}

type Kind = 'prompt' | 'out' | 'ok' | 'warn' | 'info';
interface Line {
  kind: Kind;
  text: string;
}

interface Block {
  prompt: string;
  /** ms the spinner lingers after the prompt resolves */
  spinMs: number;
  outputs: Line[];
}

const BLOCKS: Block[] = [
  {
    prompt: 'nx vision status --site lobby-02',
    spinMs: 720,
    outputs: [
      { kind: 'out',  text: 'streams           9 active / 9 connected' },
      { kind: 'out',  text: 'inference         on-prem · nominal' },
      { kind: 'ok',   text: 'face-blur         enabled · all streams' },
      { kind: 'out',  text: 'last 60s          412 events processed' },
      { kind: 'warn', text: 'last alert        loitering · dock · conf 0.84' },
    ],
  },
  {
    prompt: 'nx vision reports --weekly --out pdf',
    spinMs: 980,
    outputs: [
      { kind: 'info', text: 'queued            report-2026-w19 · 1.2 MB · 14 sites' },
      { kind: 'ok',   text: 'delivered         operations@example.com · 14:32 EDT' },
    ],
  },
];

const KIND_CLASS: Record<Kind, string> = {
  prompt: 'text-white',
  out:    'text-neutral-400',
  ok:     'text-[color:var(--nx-signal-green,#3DB46D)]',
  warn:   'text-[color:var(--nx-signal-yellow,#F4D544)]',
  info:   'text-[color:var(--nx-signal-blue,#2D6BFF)]',
};

const KIND_PREFIX: Record<Kind, string> = {
  prompt: '$ ',
  out:    '  ',
  ok:     '✓ ',
  warn:   '! ',
  info:   '· ',
};

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const TYPE_MS_PER_CHAR = 24;
const TYPE_HOLD_AFTER_PROMPT = 220;
const REVEAL_MS = 130;
const NEXT_BLOCK_DELAY = 480;
const LOOP_PAUSE_MS = 2600;
const SPINNER_TICK = 80;

type Phase = 'typing' | 'spinning' | 'revealing' | 'pause';

interface CompletedBlock {
  prompt: string;
  outputs: Line[];
}

export function OperatorCli({ className = '' }: OperatorCliProps) {
  const reduced = useReducedMotion();
  const [iteration, setIteration] = useState(0);
  const [blockIdx, setBlockIdx] = useState(0);
  const [typed, setTyped] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');
  const [spinFrame, setSpinFrame] = useState(0);
  const [history, setHistory] = useState<CompletedBlock[]>([]);

  // Step machine
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (reduced) return;
    const current = BLOCKS[blockIdx];
    if (!current) return;

    const clear = () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
    clear();

    if (phase === 'typing') {
      if (typed < current.prompt.length) {
        timerRef.current = window.setTimeout(
          () => setTyped((t) => t + 1),
          TYPE_MS_PER_CHAR,
        );
      } else {
        timerRef.current = window.setTimeout(
          () => setPhase('spinning'),
          TYPE_HOLD_AFTER_PROMPT,
        );
      }
    } else if (phase === 'spinning') {
      timerRef.current = window.setTimeout(
        () => setPhase('revealing'),
        current.spinMs,
      );
    } else if (phase === 'revealing') {
      if (revealed < current.outputs.length) {
        timerRef.current = window.setTimeout(
          () => setRevealed((r) => r + 1),
          REVEAL_MS,
        );
      } else if (blockIdx < BLOCKS.length - 1) {
        timerRef.current = window.setTimeout(() => {
          setHistory((h) => [...h, { prompt: current.prompt, outputs: current.outputs }]);
          setBlockIdx((b) => b + 1);
          setTyped(0);
          setRevealed(0);
          setPhase('typing');
        }, NEXT_BLOCK_DELAY);
      } else {
        timerRef.current = window.setTimeout(
          () => setPhase('pause'),
          NEXT_BLOCK_DELAY,
        );
      }
    } else if (phase === 'pause') {
      timerRef.current = window.setTimeout(() => {
        setHistory([]);
        setBlockIdx(0);
        setTyped(0);
        setRevealed(0);
        setPhase('typing');
        setIteration((i) => i + 1);
      }, LOOP_PAUSE_MS);
    }

    return clear;
  }, [reduced, phase, blockIdx, typed, revealed]);

  // Spinner ticker — only runs during spinning
  useEffect(() => {
    if (reduced || phase !== 'spinning') return;
    const id = window.setInterval(
      () => setSpinFrame((f) => (f + 1) % SPINNER_FRAMES.length),
      SPINNER_TICK,
    );
    return () => window.clearInterval(id);
  }, [reduced, phase]);

  const current = BLOCKS[blockIdx];
  const typedSlice = current?.prompt.slice(0, typed) ?? '';
  const inLoopPause = phase === 'pause';

  return (
    <div
      id="vision-cli"
      className={`relative mx-auto w-full max-w-[680px] h-[340px] overflow-hidden rounded-[10px] border border-white/15 bg-black shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65),0_1px_0_0_rgba(255,255,255,0.04)_inset] ${className}`}
      aria-label="Operator CLI preview"
    >
      {/* macOS terminal title bar */}
      <div className="relative flex h-[30px] items-center border-b border-white/10 bg-black px-3">
        <div className="flex shrink-0 items-center gap-[6px]">
          <TrafficLight color="#FF5F57" border="#E0443E" />
          <TrafficLight color="#FEBC2E" border="#D89A1C" />
          <TrafficLight color="#28C840" border="#1AAB29" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 text-center text-[11px] font-medium tracking-tight text-neutral-300">
          operator@lobby-02 — nx-cli — 80×24
        </div>
      </div>

      {/* Terminal body — fixed height, content clips if it ever exceeds */}
      <div className="h-[calc(340px-30px)] overflow-hidden bg-black p-4 font-mono text-[11px] leading-relaxed text-neutral-300 md:p-5 md:text-xs">
        <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
          <span
            aria-hidden="true"
            className="relative inline-block h-1.5 w-1.5"
          >
            <span
              className="absolute inset-0 rounded-full"
              style={{ background: '#3DB46D' }}
            />
            {!reduced && (
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: '#3DB46D', animation: 'nx-cli-pulse 1.8s ease-out infinite' }}
              />
            )}
          </span>
          OPERATOR · LOBBY-02
          {!reduced && (
            <span className="ml-auto inline-flex items-center gap-1 text-[9px] tracking-[0.18em] text-neutral-600">
              {inLoopPause ? 'idle' : phase === 'spinning' ? 'running' : phase === 'revealing' ? 'streaming' : 'input'}
            </span>
          )}
        </div>

        <pre className="whitespace-pre-wrap" key={iteration}>
        {reduced ? (
          // Static fallback — show everything at once
          BLOCKS.flatMap<Line>((b) => [
            { kind: 'prompt', text: b.prompt },
            ...b.outputs,
          ]).map((line, i) => (
            <span key={i} className={`block ${KIND_CLASS[line.kind]}`}>
              {KIND_PREFIX[line.kind]}
              {line.text}
            </span>
          ))
        ) : (
          <>
            {/* Completed history blocks */}
            {history.map((hb, hi) => (
              <span key={`hb-${hi}`} className="block">
                <span className={`block ${KIND_CLASS.prompt}`}>
                  {KIND_PREFIX.prompt}
                  {hb.prompt}
                </span>
                {hb.outputs.map((line, li) => (
                  <span key={li} className={`block ${KIND_CLASS[line.kind]}`}>
                    {KIND_PREFIX[line.kind]}
                    {line.text}
                  </span>
                ))}
              </span>
            ))}

            {/* Current block in flight */}
            {!inLoopPause && current && (
              <>
                <span className={`block ${KIND_CLASS.prompt}`}>
                  {KIND_PREFIX.prompt}
                  {typedSlice}
                  {phase === 'typing' && (
                    <span
                      aria-hidden="true"
                      className="ml-0.5 inline-block h-3 w-2 translate-y-0.5 bg-white nx-cli-cursor"
                    />
                  )}
                </span>

                {phase === 'spinning' && (
                  <span className="block text-neutral-500">
                    {'  '}
                    <span className="text-[color:var(--nx-signal-blue,#2D6BFF)]">
                      {SPINNER_FRAMES[spinFrame]}
                    </span>{' '}
                    working…
                  </span>
                )}

                {phase === 'revealing' &&
                  current.outputs.slice(0, revealed).map((line, i) => (
                    <span
                      key={i}
                      className={`block nx-cli-line-in ${KIND_CLASS[line.kind]}`}
                    >
                      {KIND_PREFIX[line.kind]}
                      {line.text}
                    </span>
                  ))}
              </>
            )}

            {/* Idle pause — blinking prompt awaiting next loop */}
            {inLoopPause && (
              <span className={`block ${KIND_CLASS.prompt}`}>
                {KIND_PREFIX.prompt}
                <span
                  aria-hidden="true"
                  className="ml-0.5 inline-block h-3 w-2 translate-y-0.5 bg-white nx-cli-cursor"
                />
              </span>
            )}
          </>
        )}
        </pre>
      </div>

      <style jsx>{`
        @keyframes nx-cli-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes nx-cli-pulse {
          0%   { transform: scale(1);   opacity: 0.55; }
          70%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes nx-cli-line-in {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        :global(.nx-cli-cursor) {
          animation: nx-cli-blink 900ms steps(2) infinite;
        }
        :global(.nx-cli-line-in) {
          animation: nx-cli-line-in 180ms ease-out both;
        }
      `}</style>
    </div>
  );
}

function TrafficLight({ color, border }: { color: string; border: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-block h-[12px] w-[12px] rounded-full"
      style={{
        background: color,
        boxShadow: `inset 0 0 0 0.5px ${border}, inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -1px 1px rgba(0,0,0,0.18)`,
      }}
    />
  );
}
