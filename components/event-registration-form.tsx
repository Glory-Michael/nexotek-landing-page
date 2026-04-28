'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { validateEmail, validatePhone } from '@/lib/validation';

interface RequiredFields {
  name?: boolean;
  organization?: boolean;
  phone?: boolean;
  email?: boolean;
}

interface EventRegistrationFormProps {
  eventSlug: string;
  isOpen: boolean;
  ctaLabel?: string;
  boothInfo?: string;
  dark?: boolean;
  bare?: boolean;
  hideHeading?: boolean;
  requiredFields?: RequiredFields;
}

interface FormState {
  name: string;
  organization: string;
  phone: string;
  email: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error' | 'duplicate';

function formatPhoneInput(value: string): string {
  if (value.startsWith('+')) return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function AnimatedInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  onBlur,
  disabled,
  placeholder,
  dark = false,
  required = false,
  error,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled: boolean;
  placeholder?: string;
  dark?: boolean;
  required?: boolean;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={`block text-[10px] font-semibold mb-2 tracking-widest uppercase ${
          dark ? 'text-white/40' : 'text-neutral-600'
        }`}
      >
        {label}
        {required && <span className={`ml-0.5 ${dark ? 'text-red-400' : 'text-red-500'}`}>*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full bg-transparent pb-2.5 text-sm outline-none transition-colors duration-200 disabled:opacity-40 ${
            dark
              ? 'text-white placeholder:text-white/20 border-b border-white/15'
              : 'text-black placeholder:text-neutral-400 border-b border-neutral-300'
          }`}
          required
        />
        <motion.div
          className={`absolute bottom-0 left-0 h-px origin-left ${error ? 'bg-red-500' : dark ? 'bg-white' : 'bg-black'}`}
          initial={false}
          animate={{ scaleX: focused ? 1 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ width: '100%' }}
        />
      </div>
      {error && (
        <p className={`text-[11px] mt-1.5 ${dark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
      )}
    </div>
  );
}

export function EventRegistrationForm({
  eventSlug,
  isOpen,
  ctaLabel = 'Request a Demo',
  boothInfo,
  dark = false,
  bare = false,
  hideHeading = false,
  requiredFields,
}: EventRegistrationFormProps) {
  const req = {
    name:         requiredFields?.name         ?? true,
    organization: requiredFields?.organization ?? true,
    phone:        requiredFields?.phone        ?? true,
    email:        requiredFields?.email        ?? true,
  };
  const [form, setForm] = useState<FormState>({ name: '', organization: '', phone: '', email: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; email?: string }>({});

  const setField = (field: keyof FormState) => (value: string) => {
    const formatted = field === 'phone' ? formatPhoneInput(value) : value;
    setForm((prev) => ({ ...prev, [field]: formatted }));
    if (field === 'phone' || field === 'email') {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: 'phone' | 'email') => () => {
    if (field === 'phone') {
      let err: string | null = null;
      if (form.phone) err = validatePhone(form.phone);
      else if (req.phone) err = 'Phone number is required.';
      setFieldErrors((prev) => ({ ...prev, phone: err ?? undefined }));
    } else {
      let err: string | null = null;
      if (form.email) err = validateEmail(form.email);
      else if (req.email) err = 'A valid email address is required.';
      setFieldErrors((prev) => ({ ...prev, email: err ?? undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;

    let phoneErr: string | null = null;
    if (form.phone) phoneErr = validatePhone(form.phone);
    else if (req.phone) phoneErr = 'Phone number is required.';

    let emailErr: string | null = null;
    if (form.email) emailErr = validateEmail(form.email);
    else if (req.email) emailErr = 'A valid email address is required.';
    if (phoneErr || emailErr) {
      setFieldErrors({ phone: phoneErr ?? undefined, email: emailErr ?? undefined });
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/events/${eventSlug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.status === 409) {
        setStatus('duplicate');
        setTimeout(() => setStatus('idle'), 4000);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error || 'Something went wrong. Please try again.');
        setStatus('error');
        setTimeout(() => setStatus('idle'), 4000);
        return;
      }
      setStatus('success');
      setForm({ name: '', organization: '', phone: '', email: '' });
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  const isSuccess = status === 'success';
  const isLoading = status === 'loading';

  if (!isOpen) {
    return (
      <div className={`h-full flex items-center justify-center ${bare || dark ? 'px-8 py-8' : 'bg-white border border-neutral-200 rounded-2xl shadow-sm p-8'}`}>
        <p className={`text-sm text-center ${dark ? 'text-white/40' : 'text-neutral-600'}`}>
          We&apos;re no longer connecting at this event.
        </p>
      </div>
    );
  }

  const wrapperCls = dark
    ? 'h-full flex flex-col px-8 py-8 relative overflow-hidden'
    : bare
      ? 'h-full flex flex-col px-8 py-8 relative overflow-hidden'
      : 'bg-white border border-neutral-200 rounded-2xl shadow-sm p-8 relative overflow-hidden';

  return (
    <div className={wrapperCls}>

      {/* Success overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 p-8 ${dark ? 'bg-neutral-950' : 'bg-white'}`}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-base font-medium text-center ${dark ? 'text-white' : 'text-black'}`}
            >
              We&apos;ll be in touch.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-sm text-center ${dark ? 'text-white/50' : 'text-neutral-600'}`}
            >
              See you there.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heading — suppressed when embedded below a page-level title */}
      {!hideHeading && (
        <div className="flex-shrink-0">
          <h2 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-black'}`}>
            Connect with our team
          </h2>
          <div className={`mt-4 border-t ${dark ? 'border-white/10' : 'border-neutral-100'}`} />
        </div>
      )}

      {/* Form — flex-1 pushes submit to bottom in dark/tall layout */}
      <form onSubmit={handleSubmit} className={`flex-1 flex flex-col justify-between ${hideHeading ? 'mt-0' : 'mt-6'}`}>
        <div className="space-y-6">
          <AnimatedInput label="Full Name" id="ev-name" value={form.name} onChange={setField('name')} disabled={isLoading} dark={dark} required={req.name} />
          <AnimatedInput label="Organization" id="ev-org" value={form.organization} onChange={setField('organization')} disabled={isLoading} dark={dark} required={req.organization} />
          <AnimatedInput label="Phone" id="ev-phone" type="tel" value={form.phone} onChange={setField('phone')} onBlur={handleBlur('phone')} disabled={isLoading} dark={dark} required={req.phone} error={fieldErrors.phone} />
          <AnimatedInput label="Work Email" id="ev-email" type="email" value={form.email} onChange={setField('email')} onBlur={handleBlur('email')} disabled={isLoading} dark={dark} required={req.email} error={fieldErrors.email} />

          <AnimatePresence mode="wait">
            {status === 'error' && (
              <motion.p key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-600">
                {errorMsg}
              </motion.p>
            )}
            {status === 'duplicate' && (
              <motion.p key="dup" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`text-xs ${dark ? 'text-white/50' : 'text-neutral-700'}`}>
                You&apos;re already registered for this event.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Submit area — anchored to bottom */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={
              isLoading ||
              (req.name && !form.name) ||
              (req.organization && !form.organization) ||
              (req.phone && !form.phone) ||
              (req.email && !form.email) ||
              !!fieldErrors.phone ||
              !!fieldErrors.email
            }
            className={`w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
              focus:outline-none focus:ring-2 focus:ring-offset-2
              disabled:opacity-40 disabled:cursor-not-allowed ${
              dark
                ? 'bg-white text-neutral-950 hover:bg-neutral-100 focus:ring-white focus:ring-offset-neutral-950'
                : 'bg-black text-white hover:bg-neutral-800 hover:shadow-[0_0_0_3px_rgba(0,0,0,0.12)] focus:ring-black'
            }`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : ctaLabel}
          </button>

          {boothInfo && (
            <p className={`text-[11px] text-center mt-2.5 ${dark ? 'text-white/30' : 'text-neutral-500'}`}>
              {boothInfo}
            </p>
          )}
          <p className={`text-[11px] text-center mt-2 ${dark ? 'text-white/25' : 'text-neutral-500'}`}>
            We&apos;ll reach out shortly. No spam.
          </p>
        </div>
      </form>

    </div>
  );
}
