# Nexotek Landing Page — WCAG 2.1 / 2.2 AA Audit

**Date:** 2026-05-14
**Branch:** main
**Method:** Static code audit. Three parallel scans (forms, interactive elements, media/semantics) cross-checked against WCAG 2.1 AA and 2.2 AA Success Criteria.
**Caveat:** Static analysis cannot replace screen-reader smoke tests (NVDA/VoiceOver), keyboard-only walkthroughs, or color-picker contrast probes on real renders. Treat this as a code-level pass; queue a manual AT pass before claiming conformance.

---

## Headline Verdict

**Status: PARTIAL CONFORMANCE — 5 critical AA fails, 8 moderate, 6 polish.**

The site has the bones right — `<html lang="en">`, semantic landmarks, ARIA on the mobile dialog, `prefers-reduced-motion` respected at the CSS layer and in most JS scenes. The fails cluster around three areas: **forms** (labels, autocomplete, error semantics), **the mobile menu dialog** (no focus trap, no focus return), and **media without text alternatives** (3D scenes, data viz, custom cursor).

---

## Confirmed Passes

- **3.1.1 Language of Page** — `<html lang="en">` at [layout.tsx:190](app/(site)/layout.tsx#L190).
- **2.4.6 Top-level heading** — `<h1>` exists exactly once at [hero-section.tsx:160](components/hero-section.tsx#L160).
- **2.5.5 / 2.5.8 Target Size** — most CTAs ≥36px tall; mobile menu button 40×40 (passes 2.2 AA's 24px floor, below AAA 44).
- **2.2.2 Pause/Stop/Hide** — partner-carousel pauses on hover and obeys `prefers-reduced-motion`; testimonial scroll-highlight short-circuits if reduced; ascii-skyline gates spin/bob at [ascii-skyline.tsx:266](components/ascii-skyline.tsx#L266).
- **1.3.1 Landmarks** — `<section>` blocks carry `id` or `aria-label`; testimonial uses `aria-label="Founder testimonial"`; partner carousel uses `aria-label="Partners we're building with"`.
- **2.1.4 Escape closes** mobile menu ([mobile-menu.tsx:38-40](components/mobile-menu.tsx#L38-L40)) and lead-form modal ([lead-form-button.tsx:39-41](components/lead-form-button.tsx#L39-L41)).
- **2.4.4 Some link purpose** — primary nav links carry full label text.
- **1.4.3 Body contrast** — fixed in the previous turn for forced-dark sections via `onInk` prop in RichTextRenderer.

---

## CRITICAL — AA fails, fix before claiming conformance

### C1. Mobile menu dialog: no focus trap, no focus return (2.1.2 + 2.4.3)

[components/mobile-menu.tsx:73-101](components/mobile-menu.tsx#L73-L101) declares `role="dialog" aria-modal="true"`, locks body scroll, and listens for Escape. But:
- Focus is **not moved into the dialog** when it opens. Screen reader / keyboard users get no signal the dialog is now in front.
- Tab order is **not trapped** — pressing Tab inside the open dialog reaches the (visually hidden) page content behind it.
- Focus is **not returned to the trigger** on close. The user is dropped at the start of the page.

`role="dialog" aria-modal="true"` is a *promise*. A modal that doesn't trap focus is one of the most common WCAG fails. Fix: store the trigger ref, focus first interactive element of the panel on open, install a Tab/Shift-Tab cycler over the panel's tabbable nodes, restore focus to the trigger ref on close.

### C2. Form inputs missing explicit `<label>` (3.3.2)

- [email-form.tsx:73](components/email-form.tsx#L73) — `<input type="email">` has only a `placeholder="Enter your email address"`. Placeholder is **not a label** per WCAG (disappears on focus, can't be focused, often fails contrast).
- [alpha-gate.tsx:37](components/alpha-gate.tsx#L37) — same problem: password input with placeholder only.

Fix: add a `<label htmlFor>` (visually hidden with `sr-only` if the design rejects a visible label, but present in the DOM).

### C3. Missing `autocomplete` on personal-data fields (1.3.5)

- [event-registration-form.tsx:159-162](components/event-registration-form.tsx#L159-L162) — name, organization, phone, email inputs lack `autocomplete`. Browsers can't autofill; assistive tools that key off purpose hints get nothing.
- [email-form.tsx:73](components/email-form.tsx#L73) — `autocomplete="email"` missing.

Fix: `autocomplete="name"`, `"organization"`, `"tel"`, `"email"` on the right inputs.

### C4. Form errors not programmatically connected (3.3.1 + 4.1.3)

- [event-registration-form.tsx:99-101](components/event-registration-form.tsx#L99-L101) — error `<p>` renders but the input has no `aria-describedby` pointing at it, and the error region has no `role="alert"` / `aria-live`.
- [alpha-gate.tsx:41](components/alpha-gate.tsx#L41) — same. The error appears visually but is silent to assistive tech.
- [email-form.tsx:55](components/email-form.tsx#L55) — success message uses `aria-hidden={!isSuccess}` which is correct, but no `aria-live="polite"` to announce on flip.

Fix: give each error a stable `id`, point the input's `aria-describedby` at it, add `role="alert"` (errors) or `aria-live="polite"` (status/success).

### C5. No skip-to-content link (2.4.1)

Confirmed missing from [layout.tsx](app/(site)/layout.tsx) and [navbar.tsx](components/navbar.tsx). Keyboard users have to Tab through every nav link on every page before reaching content. With six nav items + theme toggle + mobile button, that's ~8 tabs before reaching the hero.

Fix: a single `<a class="sr-only focus:not-sr-only" href="#main">Skip to content</a>` as the first child of `<body>` (or in the layout shell before the navbar). `<main id="main">` already exists.

---

## MODERATE — AA risk, fix in the next pass

### M1. Heading hierarchy: H1 → H3 skip (1.3.1 + 2.4.6)

[chapter-header.tsx](components/sections/chapter-header.tsx) always renders the section heading as `<h2>`. Good. But the SmartNumericHeadline stat in proof-grid renders as `<h3>` ([proof-grid.tsx:387](components/sections/proof-grid.tsx#L387)) — fine if the parent is `<h2>`. Two specific drift points to verify in browser:
- [hero-section.tsx:204](components/hero-section.tsx#L204) — there's an `<h2 class="sr-only">` inside the hero, *after* the `<h1>` at line 160. Two heading levels for one logical section reads inconsistent to screen-reader outlines.
- RichTextRenderer can emit any of h1-h6 ([rich-text-renderer.tsx:87-95](components/rich-text-renderer.tsx#L87-L95)) based on CMS authoring. Currently no guardrail prevents an editor from putting an `<h1>` in a body block, which would duplicate the page H1.

Fix: scope RichTextRenderer to h3-h6 only when used inside a section that already has an h2.

### M2. 3D scenes have no accessible name (1.1.1)

- `<HeroScene>` ([hero-section.tsx:123](components/hero-section.tsx#L123)) — interactive R3F canvas, no `aria-label`.
- `<InteractiveSkyline>` and `<AsciiSkyline>` — neither wraps the canvas in a labeled container.
- `<SplatViewerLoader>`, `<SpatialPeek>` in thread-spatial — same.
- `<CameraGridPeek>`, `<DetectionMixDonut>`, `<HazardCategoryBars>`, `<ComplianceTrend>` in proof-grid and thread-vision — SVG/canvas data viz with no `role="img"` and `aria-label`.

These are decorative-leaning, but the proof-grid demos carry *real claims* (compliance trend, detection mix). They need a text alternative — either an `aria-label` describing the headline finding, or a sibling `<figcaption>` / sr-only paragraph.

### M3. interactive-skyline doesn't gate motion by `prefers-reduced-motion` (2.3.3 / 2.2.2)

[interactive-skyline.tsx:564](components/interactive-skyline.tsx#L564) checks `(pointer: coarse)` and viewport width, not motion preference. ascii-skyline does it correctly. If the user has reduced motion set, the hero scene still spins/animates.

Fix: read `window.matchMedia('(prefers-reduced-motion: reduce)')` and disable the auto-rotation / formation animation when set.

### M4. proof-grid stage swap is silent (4.1.3)

[proof-grid.tsx:427-448](components/sections/proof-grid.tsx#L427-L448) renders `<article key={activeIndex}>` that swaps content as the user scrolls. Screen-reader users get no notification that the displayed tile changed. The rail labels are buttons, but scroll-driven changes don't fire them.

Fix: wrap the stage in `<div aria-live="polite" aria-atomic="true">` so each headline change is announced once.

### M5. Native `<details>/<summary>` is fine, but the link inside isn't (2.4.4)

[faq.tsx:40](components/sections/faq.tsx#L40) — "LEARN MORE →" repeats on every FAQ row. Same problem at [loop-diagram.tsx:62](components/sections/loop-diagram.tsx#L62) — "DETAIL →" gives no context out of order. Screen-reader users who list links see "Learn more, Learn more, Learn more, Detail, Detail."

Fix: either visually-hidden suffix (`<span class="sr-only"> about {question}</span>`) or `aria-label` on each anchor.

### M6. MagneticButton lacks focus-visible style (2.4.7)

[components/magnetic-button.tsx:29-40](components/magnetic-button.tsx#L29-L40) — the transform-based magnetic effect is mouse-only. No `focus-visible:` ring in the className. Keyboard users tabbing through can't see where they are.

### M7. Toggle state changes are not announced (4.1.3)

- [theme-toggle.tsx:24](components/theme-toggle.tsx#L24) — static `aria-label="Toggle theme"`. After click, no indication theme changed.
- [motion-toggle.tsx](components/motion-toggle.tsx) — dynamic `aria-label`, no `aria-live`.

Fix: either update `aria-label` to the new state ("Switch to light theme" / "Switch to dark theme") so the new accessible name announces on focus, or add a polite live region for the result.

### M8. Custom cursor stacks on system cursor (1.4.4 / 2.4.7)

[custom-cursor.tsx:63-76](components/custom-cursor.tsx#L63-L76) renders a `mix-blend-difference` dot but **does not** set `cursor: none` on the host. So users see *both* their OS cursor and a decorative dot. That's fine for sighted desktop pointer users (and avoids a worse a11y fail — hiding the cursor entirely), but on touch the dot can flicker behind taps, and on focus the dot doesn't represent keyboard focus. Worth a comment in the code so future maintainers don't "fix" it by hiding the system cursor.

---

## POLISH — note, don't block

### P1. Status / success messages need an `aria-live` region

email-form's success `<p>` flips visibility via `aria-hidden`. Add `aria-live="polite"` to the success container so the message reads on flip.

### P2. `<details>/<summary>` browsers auto-expose `aria-expanded`, but APG recommends explicit declaration

Low-stakes — keep an eye if you ever swap for a custom disclosure.

### P3. Mobile menu button below AAA 44×44

[mobile-menu.tsx:79](components/mobile-menu.tsx#L79) is `h-10 w-10` (40×40). Passes 2.2 AA (24×24) but not AAA. Bump to `h-11 w-11` for the safer floor.

### P4. Tab strip in who-we-serve

[who-we-serve.tsx](components/sections/who-we-serve.tsx) tab buttons are real `<button>`s — keyboard-accessible. But they don't implement the WAI-ARIA tabs pattern (role=tablist/tab/tabpanel, arrow-key navigation, aria-selected). That's optional — buttons + visible state is conformant — but if you ever call it a "tab strip" in copy, consider the full pattern.

### P5. Form field truncation announcement

Long error strings should be in a region with `aria-atomic="true"` so the full message reads on update, not just the diff.

### P6. Reduced-motion: dot-matrix morph in contact-cta

Worth double-checking [contact-cta.tsx](components/sections/contact-cta.tsx) DotMatrixMorph stops or skips frames under reduced-motion. The CSS-layer animations are gated; need to verify the JS-driven morph loop is too.

---

## Recommended Fix Order

| Order | Finding | Effort (CC) | Why first |
|------:|---------|-------------|-----------|
| 1 | C5 skip-to-content link | 5 min | One-liner. Largest perceived-quality bump for keyboard users. |
| 2 | C2 + C3 labels + autocomplete on forms | 20 min | Both fixes touch the same JSX. Combine. |
| 3 | C4 error/success aria-live + describedby | 25 min | Same files as C2. |
| 4 | C1 mobile menu focus trap + return | 45 min | Real engineering. Use a lightweight `useFocusTrap` hook, no library. |
| 5 | M2 aria-label on demo viz (proof-grid in particular) | 30 min | Each chart needs a one-sentence text alt. |
| 6 | M4 proof-grid live region | 10 min | One wrapper. |
| 7 | M3 reduced-motion gate on interactive-skyline | 15 min | Already a pattern in ascii-skyline — copy it. |
| 8 | M5 link-purpose suffixes | 20 min | FAQ + loop-diagram. |
| 9 | M6 MagneticButton focus-visible | 5 min | One className. |
| 10 | M7 toggle state announcements | 10 min | dynamic aria-label. |
| 11 | M1 heading guardrail in RichTextRenderer | 30 min | Cap CMS-rendered h1/h2. |

Time-boxed budget: ~3.5 hours of CC effort to clear all CRITICAL and MODERATE findings.

---

## What This Audit Did Not Check

- **Real-screen contrast** — color values look conformant on paper; verify with a contrast picker against the rendered page.
- **Screen reader smoke** — NVDA + Chrome and VoiceOver + Safari pass.
- **Keyboard-only walkthrough** — Tab from page load to last footer link, no mouse.
- **Zoom 200% reflow** — open at 200% zoom, check no horizontal scroll and no clipped content (1.4.10).
- **Touch target hit areas in browser devtools** — measured rather than read from className.
- **Lighthouse a11y score** — automated baseline, not a substitute for manual.

These five should be run as the next session's first move.

---

*Generated by static WCAG 2.1 / 2.2 AA audit applying SC 1.1.1, 1.3.1, 1.3.5, 1.4.3, 1.4.4, 1.4.10, 1.4.11, 2.1.1, 2.1.2, 2.1.4, 2.2.2, 2.3.1, 2.4.1, 2.4.3, 2.4.4, 2.4.6, 2.4.7, 2.4.11, 2.5.5, 2.5.7, 2.5.8, 3.1.1, 3.1.2, 3.2.1, 3.2.6, 3.3.1, 3.3.2, 3.3.4, 3.3.7, 4.1.2, 4.1.3.*
