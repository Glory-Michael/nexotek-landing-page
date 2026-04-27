'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  featureLabel: string;
};

export function AlphaGate({ featureLabel }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/alpha-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
        setIsSubmitting(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 mb-4">
            Alpha Preview
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
            {featureLabel}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
            This feature is in early access.
            <br />
            Enter the password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Access password"
            required
            autoFocus
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-black dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition disabled:opacity-50"
          />

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
          >
            {isSubmitting ? 'Verifying…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
