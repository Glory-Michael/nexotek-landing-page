# Nexotek Landing Page

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values
3. Run the app:
   `npm run dev`

## Dormant: Tegaki Handwriting Animation

The `tegaki` npm package is installed and a shell component exists at
`components/tegaki-hero-title.tsx`. It is **not active** — the hero title
uses an SVG stroke-reveal animation instead (`components/stroke-reveal-title.tsx`).

Tegaki requires pre-generated font bundles with stroke-path data. Only
script/handwriting fonts (Caveat, Italianno, Parisienne, Tangerine) are
bundled; the `tegaki-generator` CLI is not yet publicly available to create
bundles for custom fonts like Space Grotesk.

To reactivate tegaki in the future:
1. Generate a Space Grotesk bundle at https://gkurt.com/tegaki/generator/
2. Import the bundle in `components/tegaki-hero-title.tsx` and restore the
   `TegakiRenderer` usage
3. Swap `StrokeRevealTitle` back to `TegakiHeroTitle` in `hero-section.tsx`
