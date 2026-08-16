# Metadata and favicon

**Status:** Done.

## What was built

- `app/icon.png` — YouVerse favicon, copied from `public/assets/logo.png` (Next.js 16 auto-detects `app/icon.png` and injects the `<link rel="icon">` tag, no config needed).
- `app/layout.tsx` — root `metadata: Metadata` export updated from the create-next-app placeholder to `title: "YouVerse"` and a one-sentence product description.

## Decisions

- AGENTS.md section 5 names `public/assets/logo.svg` as the source, but only `public/assets/logo.png` exists in this repo — used the PNG branch the rule explicitly allows (`app/icon.png` "if a PNG is preferred") instead of asking, since the rule already anticipates this case.
- No `app/favicon.ico` was added — intentionally excluded per AGENTS.md section 5.
- No route-specific metadata added yet (no routes exist beyond the placeholder `app/page.tsx`); route-specific `metadata`/`generateMetadata` per AGENTS.md section 5 is deferred until those pages (channel, watch, etc.) are built.

## Checks run

`npm run lint` and `npx tsc --noEmit` both passed clean.
