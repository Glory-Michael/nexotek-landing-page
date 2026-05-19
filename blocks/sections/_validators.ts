import type { Validate } from 'payload';

const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1FA70}-\u{1FAFF}\u{1F900}-\u{1F9FF}]/u;

const HYPE_WORDS = [
  'revolutionary',
  'cutting-edge',
  'cutting edge',
  'game-changing',
  'game changing',
  'ai-powered',
  'ai powered',
  'next-gen',
  'next gen',
];

const ROADMAP_DISCLAIMER_PHRASES = [
  'roadmap',
  'where the platform is headed',
  'not a current capability',
];

const richTextToString = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

export const noEmoji: Validate<unknown> = (value) => {
  const s = richTextToString(value);
  if (s && EMOJI_REGEX.test(s)) {
    return 'Emoji are not allowed in homepage content. Use a typographic symbol or remove.';
  }
  return true;
};

export const noHypeWords: Validate<unknown> = (value) => {
  const s = richTextToString(value).toLowerCase();
  if (!s) return true;
  const hit = HYPE_WORDS.find((w) => s.includes(w));
  if (hit) {
    return `Avoid hype-ware language ("${hit}"). Rewrite with a concrete, verifiable claim.`;
  }
  return true;
};

export const noForensicGradeOutsideSpatial: Validate<unknown, unknown, { variant?: string }> = (
  value,
  { siblingData },
) => {
  const s = richTextToString(value).toLowerCase();
  if (!s) return true;
  const variant = siblingData?.variant;
  if (variant && variant !== 'spatial' && s.includes('forensic-grade')) {
    return 'Only the Spatial thread may use "forensic-grade". Rephrase or move to the Spatial section.';
  }
  return true;
};

export const requiresRoadmapDisclaimer: Validate<unknown, unknown, { status?: string }> = (
  value,
  { siblingData },
) => {
  if (siblingData?.status !== 'roadmap') return true;
  const s = richTextToString(value).toLowerCase();
  const hasDisclaimer = ROADMAP_DISCLAIMER_PHRASES.some((p) => s.includes(p));
  if (!hasDisclaimer) {
    return `Roadmap nodes must include a disclaimer phrase such as "${ROADMAP_DISCLAIMER_PHRASES.join('", "')}".`;
  }
  return true;
};

export const warnOnNamedCompetitors: Validate<boolean | undefined | null> = (value) => {
  if (value === true) {
    return 'Naming competitors publicly carries legal risk. Confirm with legal review before saving with this flag enabled.';
  }
  return true;
};

export const compose =
  (...fns: Validate<unknown>[]): Validate<unknown> =>
  (value, options) => {
    for (const fn of fns) {
      const result = fn(value, options);
      if (result !== true) return result;
    }
    return true;
  };

export const noEmojiAndNoHype = compose(noEmoji, noHypeWords);
export const noEmojiAndRoadmapDisclaimer = compose(
  noEmoji,
  requiresRoadmapDisclaimer as Validate<unknown>,
);
export const noEmojiAndForensicGuard = compose(
  noEmoji,
  noForensicGradeOutsideSpatial as Validate<unknown>,
);
