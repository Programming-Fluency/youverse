# Metadata and Favicon

## Role

The principal-level full-stack engineer defined in AGENTS.md, scoped to implementing SEO/metadata setup (AGENTS.md section 5) for the YouVerse root app shell.

## Context

**Skills read:** None apply — this task doesn't touch auth, MongoDB, uploads, or shadcn/Base UI components, so no `.agents/skills/` entries are relevant (folder does not exist yet in this project). Consulted `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md` and `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md` per AGENTS.md's Next.js 16 rule (section 19) and the top-of-file instruction to read the relevant guide before writing code.

**Existing code inspected:**
- `app/layout.tsx` — currently exports the default create-next-app `metadata` object (`title: "Create Next App"`, generic description) alongside `Geist`/`Geist_Mono` fonts. No `icon` file exists yet.
- `app/page.tsx` — placeholder `<h1>Youverse app</h1>`, unrelated to this task.
- `public/assets/logo.png` — the only logo asset present (734KB PNG). No `.svg` version exists.
- No `.agents/memory/` directory exists yet (fresh project) — this is genuinely a first build, not a modification.
- `app/icon.*` / `app/favicon.ico` do not exist yet.

**Decision:** AGENTS.md section 5 says to copy `public/assets/logo.svg` to `app/icon.svg`, "or `app/icon.png` if a PNG is preferred." Since only a PNG logo exists in this repo, this implementation follows the PNG branch explicitly anticipated by that rule: copy `public/assets/logo.png` to `app/icon.png`. No `app/favicon.ico` is added, per the rule's explicit instruction not to use it — Next.js auto-detects `app/icon.png` and injects the `<link rel="icon">` tag itself.

## Output

**Goal:** Give the app a real favicon (sourced from the YouVerse logo) and a real root title/description, replacing the create-next-app placeholders, using Next.js 16's file-based metadata conventions — no manual `<link>` or `<title>` tags.

**Files likely to change:**
- `app/icon.png` — new file, copied byte-for-byte from `public/assets/logo.png`.
- `app/layout.tsx` — update the exported `metadata: Metadata` object's `title` and `description` fields only; no other changes to the file (fonts, html/body structure stay as-is).

**Acceptance criteria:**
- `app/icon.png` exists and is a valid copy of the YouVerse logo.
- `app/layout.tsx` exports `metadata: Metadata` with `title: "YouVerse"` and a one-sentence `description` describing the product (a scoped YouTube-inspired video streaming platform where users create channels, upload videos, and watch/search/subscribe).
- No manual `<link rel="icon">` or `<title>` tags added anywhere in JSX.
- `app/favicon.ico` is not created.
- `npm run lint` and `npx tsc --noEmit` both pass.

**Manual test steps after implementation:**
1. Run `npm run dev`.
2. Open the app in a browser at the dev server URL.
3. Confirm the browser tab shows the YouVerse logo as the favicon.
4. View page source or inspect `<head>` in devtools and confirm `<title>YouVerse</title>` and a `<meta name="description" content="...">` tag are present, and a generated `<link rel="icon" href="/icon?...">` tag pointing at the PNG icon.
5. Confirm no console errors related to the icon or metadata.

## Constraints

- Follow AGENTS.md section 5 exactly (icon file convention, root metadata export, no manual tags).
- Do not touch `app/page.tsx` or any other files outside the two listed above.
- No comments added to code (AGENTS.md section 25) unless explaining a non-obvious "why" — not needed here.
- Checks to run after implementation: `npm run lint`, `npx tsc --noEmit`. Skip `npm run build` — this change doesn't add routes or touch server modules, but it's cheap/safe to run if quick confirmation is wanted; not required by AGENTS.md's build-trigger condition.
