'use client';

import { useEffect, useRef } from 'react';
import { NxIcon, type NxIconName } from '@/components/brand/nx-icon';

type Badge = { label: string; sub?: string; icon?: string };

const VALID_ICONS = new Set<string>([
  'arrow-right', 'arrow-down', 'asset', 'close', 'globe', 'grid', 'hex',
  'menu', 'pause', 'play', 'play-circle', 'plus', 'radar', 'search',
  'shield', 'target', 'trend', 'user',
]);

function autoIconForCredential(label: string): NxIconName {
  const s = label.toUpperCase();
  if (/\bSOC\b|\bISO\b|HIPAA|GDPR|CCPA|COMPLI|AUDIT|ACCRED|\bCERT/.test(s)) return 'shield';
  if (/PATENT|TRADEMARK|\bIP\b|INNOVATION|TECH(?:NOLOGY)?\s+TRANSFER/.test(s)) return 'asset';
  if (/AWARD|RECOG|HONOR|FELLOW|RANKED/.test(s)) return 'target';
  if (/RESEARCH|\bLAB\b|STUDY|METHOD|PUBLISH|FORENSIC/.test(s)) return 'radar';
  if (/PARTNER|ALLIANCE|MEMBER|CONSORTIUM|NETWORK/.test(s)) return 'hex';
  if (/DEPLOY|LIVE|PRODUCTION|FIELDED|OPERAT/.test(s)) return 'play-circle';
  if (/GLOBAL|REGION|INTERNATIONAL|WORLDWIDE/.test(s)) return 'globe';
  if (/TREND|GROWTH|UPLIFT|IMPROVE/.test(s)) return 'trend';
  return 'shield';
}

function resolveIcon(badgeIcon: string | undefined, label: string): NxIconName {
  if (badgeIcon && VALID_ICONS.has(badgeIcon)) return badgeIcon as NxIconName;
  return autoIconForCredential(label);
}

export function CredentialCard({ badge }: { badge: Badge }) {
  const cardRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--shine-x', `${x.toFixed(2)}%`);
      el.style.setProperty('--shine-y', `${y.toFixed(2)}%`);
      el.style.setProperty('--shine-opacity', '1');
    };
    const onLeave = () => {
      el.style.setProperty('--shine-opacity', '0');
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <li
      ref={cardRef}
      className="nx-credential-card relative overflow-hidden border border-white/70 p-6"
    >
      <NxIcon
        name={resolveIcon(badge.icon, badge.label)}
        size={22}
        className="mb-5 text-neutral-300"
        aria-hidden
      />
      <p className="font-display text-lg font-semibold uppercase tracking-tight">
        {badge.label}
      </p>
      {badge.sub && (
        <p className="mt-2 text-sm text-neutral-400">{badge.sub}</p>
      )}
    </li>
  );
}
