'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface EmailFormProps {
  placeholder?: string;
  buttonText?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  successMessage?: any; // RichText or undefined
  successMessageText?: string; // Plain text fallback
}

export function EmailForm({
  placeholder = 'Enter your email address...',
  buttonText = 'Join',
  successMessage,
  successMessageText = "You're on the list. We'll be in touch.",
}: EmailFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/join-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('Waitlist error:', data.error);
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
        return;
      }

      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }
    
    // Reset after 3 seconds
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-start lg:justify-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{successMessageText}</span>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="relative flex items-center w-full group"
          >
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              disabled={status === 'loading'}
              className="w-full px-6 py-4 rounded-xl bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 text-black dark:text-white placeholder:text-sm placeholder:text-neutral-600 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black/40 dark:focus:border-white/40 transition-all duration-300 pr-32 disabled:opacity-50 shadow-sm"
              required
            />
            <button
              type="submit"
              disabled={status === 'loading' || !email}
              className="absolute right-2 top-2 bottom-2 z-0 px-6 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/50 dark:focus:ring-white/50 transition-all duration-300 disabled:bg-neutral-200 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500 disabled:opacity-100 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {status === 'loading' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {buttonText}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      
      <p className="text-[10px] sm:text-[11px] text-neutral-800 dark:text-neutral-200 mt-4 text-left lg:text-center whitespace-nowrap tracking-tight font-medium">
        By joining, you agree to our <Link href="/terms" className="underline hover:text-black dark:hover:text-white transition-colors">Terms</Link> & <Link href="/privacy" className="underline hover:text-black dark:hover:text-white transition-colors">Privacy Policy</Link>.
      </p>
    </div>
  );
}
