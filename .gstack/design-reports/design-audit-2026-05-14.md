# Nexotek Landing Page — UI/UX Design Audit

**Date:** 2026-05-14
**Branch:** main
**Method:** Static code audit using the `design-review` 10-category checklist + `ui-ux-pro-max` design-system lens (camect-skills framework)
**Scope:** Token layer (globals.css), shell (layout/navbar/footer/section-shell), homepage sections (hero + 13 sections under `components/sections/`)

---

## Headline Scores

- **Design Score: B+** — strong, intentional token system, disciplined motion, no slop. Held back by inconsistent token *adoption* in section code and a handful of a11y misses.
- **AI Slop Score: A** — no purple gradients, no 3-icon-in-circle grid, no "Unlock the power of…" copy. Hand-authored, opinionated.

| Category | Grade | One-line verdict |
|----------|-------|------------------|
| Visual Hierarchy | A− | Editorial chapter counters + ghost numerals + ChapterHeader give every section a clear focal point. |
| Typography | B  | System is excellent (`globals.css` 135-192). Sections drift: heading scale varies, mono tracking is scattered. |
| Color & Contrast | A− | 31 tokens, scoped semantically. Signal colors gated correctly. But terrain palette is largely unused and sections bypass `--nx-*` for ad-hoc Tailwind. |
| Spacing & Layout | A− | 4px base, 12-step ladder, `max-w-7xl` consistent. |
| Interaction States | C+ | Hover present; explicit `focus-visible` rings missing on most CTAs. |
| Responsive | A  | Mobile/tablet/desktop breakpoints handled, sticky nav, dvh handling, iOS Safari recenter logic. |
| Motion | B+ | Transform-only, reduced-motion at CSS layer, but section-level handling is uneven. |
| Content | A− | Specific button labels, no lorem, no "all-in-one" — proper copy. |
| AI Slop | A  | None detected. |
| Performance | B  | Transform-only animations + `display: swap` fonts good; `react-three/drei` is an 11MB chunk, single point of fragility. |

---

## Phase 1: First Impression (static read)

The site communicates **editorial seriousness, not SaaS template**. The dual-surface "Paper / Ink" system, terrain palette, chapter-numbered sections with Roman ghost numerals, and Instrument Serif for the founder quote all read as *art-directed*, not assembled. The first three things the eye lands on in section flow are: hero 3D scene → chapter mono eyebrow → display-scale heading. That's intentional and rare. **One-word verdict: composed.**

---

## Phase 2: Inferred Design System (what's actually rendered)

**Tokens (excellent):**
- 31 colors, scoped: 12 grayscale, 7 terrain (sand/clay/canopy/tide/sky), 5 signal, semantic aliases.
- Type: 144→48px display, 40→14px heading, 18→13px body, JetBrains Mono + Instrument Serif as editorial accent.
- Spacing: 4px base, 12 steps (0/4/8/12/16/20/24/32/40/48/64/80/96/128/160/192).
- Radii: 2/4/8/16/20/999 plus brand-derived `--radius-nx-button` (8px), `--radius-nx-card` (20px), `--radius-nx-card-lg` (28px) — named by *use case*, not size.
- Motion: `ease-standard` and `ease-emphasis` curves; 80/160/240/420/800ms duration tokens; transform-only keyframes (line 235 comment explicitly mentions Lighthouse FCP).

**The gap:** the section layer doesn't reach for the tokens consistently. Sections use `text-neutral-300`, `border-white/45`, `bg-neutral-950` directly instead of `--nx-fg-2-on-dark`, `--nx-line-dark`, `--nx-ink`. This is the #1 finding — the system is built, but adoption is partial.

---

## Phase 3: Findings (prioritized)

### HIGH (visible quality hits, fix first)

**H1. Token adoption gap across sections.** `components/sections/thread-train.tsx`, `proof-grid.tsx`, `who-we-serve.tsx`, `contact-cta.tsx`, `credential.tsx` all reach for ad-hoc Tailwind colors (`text-neutral-300/400/500`, `border-white/45`, `bg-neutral-950`) instead of the `--nx-*` palette. Two consequences: (1) re-theming requires touching every section, and (2) the terrain palette (sand/clay/canopy/tide) — defined in globals.css:39-49 with a comment that it should be "conveyed through photography" — is invisible everywhere. Either use it via photo treatment or remove the seven unused tokens.

**H2. Monospace tracking scale is undefined.** `tracking-[0.22em]` (proof-grid rails, trust-strip sublabel), `[0.24em]` (navbar, ChapterHeader eyebrow, FAQ, trust-strip label), `[0.28em]` (partner-carousel category), `[0.32em]` (testimonial eyebrow). Four values, no pattern. Mono labels read inconsistent at scan. Recommend a 2-3 step scale, e.g. `tracking-mono-tight` (.18em for body mono), `tracking-mono-label` (.24em standard), `tracking-mono-eyebrow` (.32em for hero eyebrow only).

**H3. Focus-visible rings missing on CTAs.** Navbar links (`navbar.tsx:95`), CTA buttons (`navbar.tsx`, `mobile-menu.tsx`, `contact-cta.tsx`), FAQ summary toggles, partner-carousel — none declare `focus-visible:ring-*` or `focus-visible:outline-*`. Keyboard navigation is invisible. Fix: add a single `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nx-signal-blue` utility and apply to every interactive element. WCAG 2.1 AA 2.4.7.

**H4. Heading scale drift between sections.** `chapter-header.tsx:52` declares `text-3xl md:text-5xl` for "section title". `thread-train.tsx` uses `text-4xl md:text-6xl`. `loop-diagram.tsx` node label uses `text-2xl md:text-4xl`. Same semantic role (section heading), three sizes. Either lift section heading sizing into one utility class (`.nx-section-title`) or always render through `ChapterHeader`.

**H5. Mobile menu button below 44px touch target.** `mobile-menu.tsx:79` is `h-10 w-10` (40×40). WCAG 2.5.5 enhanced target is 44×44. Bump to `h-11 w-11` or `min-h-11 min-w-11`.

### MEDIUM (polish + consistency)

**M1. Testimonial uses raw `font-serif`, not the editorial token.** `testimonial-section.tsx` quote is `font-serif text-[28px] md:text-5xl`. The token system has `--nx-font-editorial: var(--font-instrument-serif…)`. Either wire the section to the token (so swapping serifs is one knob) or accept that the testimonial is intentionally generic-serif and document it.

**M2. Radius scale not enforced.** `contact-cta.tsx` uses `rounded-nx-button`, `loop-diagram.tsx` status badge uses `rounded-sm`, most cards have no radius, FAQ icon is `rounded` default. Pick: pill chips, 8px CTAs, 20px cards. The tokens exist (`--radius-nx-button`, `--radius-nx-card`). Apply them.

**M3. Icon sizing inconsistent.** Trust-strip uses `size={22}`, FAQ icon container is `h-8 w-8`, proof-grid micro-viz is `h-[18px] w-[18px]`, mobile menu icon is `h-5 w-5`. The `ui-ux-pro-max` rule of thumb: stick to a fixed 24×24 viewBox and 3 render sizes (16/20/24). Currently looks ad-hoc.

**M4. `font-light` (300) on the hero subtitle pair with `font-semibold` (600) skips 400/500.** Two weights are enough, but a single 400 body weight would feel more grounded; 300 on body-sized text reads slightly thin at <19px on non-Retina displays.

**M5. Reduced-motion handling is inconsistent.** `partner-carousel.tsx` uses `html[data-motion='reduced']`. `testimonial-section.tsx` uses the `useReducedMotion()` hook. Most other animated sections rely on the CSS-layer `@media (prefers-reduced-motion: reduce)` blocks in globals.css. Three patterns is one too many. Centralize on the CSS-layer + `motion-reduce:` utilities; drop the hook unless the animation is JS-only.

**M6. Section vertical rhythm.** `section-shell.tsx` uses `py-20 md:py-28` (80/112px). Hero is `min-h-[88vh]`. Who-we-serve is also `min-h-[88vh]`. Testimonial is `160vh`. Loop-diagram is `~90vh per node`. Two competing rhythms (fixed-padding vs viewport-locked). Acceptable, but document which sections are "hero-scale" vs "editorial-scale" so future sections fall in line.

### POLISH (note, don't block)

**P1. `text-wrap: balance` on display headings.** Not visible in audited sections. Add to `.nx-h1` / `.nx-display-*` for one-line tightening on long headlines.

**P2. Curly quotes vs straight quotes.** `testimonial-section.tsx` renders `"` / `"` literals — verify these are curly. The opening/closing quote marks at `text-5xl md:text-7xl` are doing real visual work; straight quotes there would be visibly cheap.

**P3. `font-variant-numeric: tabular-nums` on stat numbers.** `credential.tsx` stats grid (`SmartNumericHeadline`) and proof-grid count-ups should use tabular-nums so digits don't shift width during animation. The `.nx-numeral` utility exists in globals.css for this.

**P4. CTA hover uses `transition-colors` only.** No explicit duration. Tailwind's default is 150ms, which is fine, but pin it to `duration-160` (your `--nx-dur-fast`) so the motion language is consistent.

**P5. `prefers-reduced-transparency` / `prefers-contrast`.** Glass navbar (`bg-white/70 dark:bg-black/40 backdrop-blur-md`) doesn't drop the blur for users who request reduced transparency. Worth a one-liner override.

**P6. Long viewport `.site-main` legacy.** `scroll-center.tsx` still applies dvh height to a fallback path. Recent observation thread (memory entry 628) flagged this. If only the hero needs it, scope tighter; otherwise plan to remove.

### NON-FINDINGS (kept around to anchor the call)

- No purple/violet gradients anywhere.
- No 3-feature icon-in-circle grid.
- No emoji as UI element.
- No "Welcome to Nexotek" / "Your all-in-one" copy.
- No `text-align: center` slop on every heading.
- Dark mode uses pure white for body text on near-black surfaces — correct for WCAG contrast (not the off-white anti-pattern).
- Borders use opaque `--nx-line-light` (#D8D5CE) in light mode — not the invisible `border-white/10` anti-pattern.

---

## Phase 4: AI-Slop Test (passed)

Run against the design-review blacklist:

| Slop pattern | Present? |
|---|---|
| Purple/violet/indigo gradients | No |
| 3-column icon-in-colored-circle feature grid | No |
| Centered everything | No (left-aligned editorial rhythm) |
| Uniform bubbly border-radius on every element | No (radii are scoped by use case) |
| Decorative blobs / floating circles / wavy SVG | No |
| Emoji as design elements | No |
| Colored left-border on cards (`border-left: 3px solid <accent>`) | No |
| Generic hero copy | No (specific, role-based) |
| Cookie-cutter section rhythm | No (sections vary by intent — sticky scrub, parallax photo, testimonial scrub) |

Would a human designer at a respected studio ship this? **Yes.**

---

## Phase 5: Recommended Fix Order

1. **One PR — token adoption sweep (H1).** Codemod-style replace `text-neutral-{300,400,500}` → `text-nx-fg-{2,3}-on-dark`, `border-white/45` → `border-nx-line-dark`, etc., across `components/sections/`. ~30 min of focused work.
2. **One PR — mono tracking scale (H2).** Add 3 utilities to `globals.css`, sweep `tracking-[0.2*em]` arbitrary values.
3. **One PR — focus-visible utility (H3) + touch target bump (H5).** ~15 min.
4. **One PR — heading scale unification (H4).** Lift to one `.nx-section-title` class; either pass-through or replace per-section overrides.
5. Medium findings can ship incrementally over the next two iterations.

---

## What Would Move This to A

- Token adoption everywhere (H1) — biggest single lever.
- Focus rings + 44px targets (H3, H5) — pulls a11y from C+ to A−.
- Mono tracking scale (H2) + heading unification (H4) — pulls Typography from B to A.

The system was built carefully. Make the sections use it.

---

*Generated by static code audit applying the `camect-skills/design-review` 10-category methodology and `ui-ux-pro-max` design-system criteria. No live browser audit was performed; LCP/CLS metrics, real contrast ratios, and live touch-target measurements need a `$B perf` + `$B snapshot -a` run.*
