# Navbar

## Role

The principal-level full-stack engineer defined in AGENTS.md, scoped to implementing the navbar feature end to end as owned by AGENTS.md section 8, plus its two direct dependencies: the `(main)` authenticated app shell layout that renders it, and the minimal `search` server action it calls.

## Context

**Skills read:** No dedicated shadcn/Base UI skill exists in `.agents/skills/` — the composition rules (`render` prop instead of `asChild`, `DropdownMenuLabel` inside `DropdownMenuGroup`, `PopoverTrigger` replacing its default `<button>` via `render`) are specified directly in AGENTS.md sections 8, 20, and 21, and confirmed against the actual installed component source (see below). No MongoDB/Mongoose skill read for this prompt — the `search` action queries `Video`/`Channel` directly with simple regex `find()` calls, no aggregation. `react-hook-form`/`zod` skills not applicable — the navbar's search input is a plain controlled input with debouncing, not a form.

**Existing code inspected:**
- No `app/(main)` directory exists yet — confirmed via glob, fresh build not a modification.
- No `app/(main)/search/` exists yet either (section 12 is unbuilt) — confirmed with the user this prompt will build only the `search(query)` server action (section 12, item 2) as a dependency of the navbar's live popover, not the `/search` page itself (still a separate future feature).
- `components/ui/`: `button`, `input`, `field`, `label`, `card`, `separator`, `sonner`, `spinner` are installed. `avatar`, `dropdown-menu`, and `popover` are **not** installed yet — needed for this feature.
- Previewed the actual `avatar`, `dropdown-menu` component source from the project's shadcn registry (`base-nova`, Base UI-backed): confirmed `DropdownMenuItem` already ships with `cursor-default` in its base class list — exactly what AGENTS.md section 8 says to flip to `cursor-pointer` (paired with `data-disabled:cursor-not-allowed`) once, at the component level, not per navbar item.
- `lib/auth.ts` / `lib/auth-client.ts` exist (authentication feature) — `auth.api.getSession` (server) and `useSession`/`signOut` (client) are available.
- `db/models/Channel.ts` and `db/models/Video.ts` exist (database-layer feature) with `name`/`title` fields respectively, ready for the `search` action's regex match.
- `lib/db.ts` exports `connectToDatabase()`.
- `public/assets/logo.png` — the only logo asset, already used at `app/icon.png` and in the `(auth)` `BrandingPanel`.
- No `next.config.ts` `images.remotePatterns` entries exist yet — not needed for this feature since avatars come from BetterAuth's `user.image` (an UploadThing-hosted URL once settings/section 13 is built) or fall back to an icon; no remote image is rendered by the navbar today since profile photo upload doesn't exist yet. `AvatarImage`'s `src` will simply be `session.user.image ?? undefined`, falling back to `AvatarFallback`.
- `.agents/memory/` has `authentication.md`, `database-layer.md`, `metadata-favicon.md` — no prior navbar/search work recorded.

**Decisions / assumptions:**
- **Scope is section 8 (Navbar) plus two minimal dependencies**: the `app/(main)/layout.tsx` shell (session fetch + render `<Navbar session={session} />` + `{children}`) and `app/(main)/search/actions/index.ts`'s `search(query)` function only (section 12, item 2) — regex-match `Video.title` (24 results) and `Channel.name` (6 results) in parallel, most recent first, no session required. The `/search` page (section 12, item 1) is explicitly **not** built here — the "See all results" link and Enter-to-navigate both point to `/search?q=...`, which will 404 until that page exists; this is expected and called out in manual test steps.
- **No other `(main)` pages are built** — `/home`, `/dashboard`, `/settings`, `/channel/[id]` don't exist yet. The navbar's links to Dashboard/Subscriptions/Settings and the logo's link to `/home` will all be real `<Link>`s that 404 until those features are built — this is correct per AGENTS.md's own dependency ordering (section 9, 10, 13 each say "make sure navbar already exists first"), not a defect to fix here.
- **Avatar image**: `session.user.image` (BetterAuth's own field, nullable) is passed to `AvatarImage`; `AvatarFallback` renders a `UserIcon` (lucide) at `size-6` per section 8's exact spec. No `next/image` involved — shadcn's `Avatar` uses a plain `<img>`-wrapping Base UI primitive, not `next/image`, so no `remotePatterns` config is needed even once real photo URLs exist.
- **Search popover results shape**: the `search` action returns `{ channels: {_id, name}[], videos: {_id, title}[] }` (trimmed to what a compact popover row needs — full detail like descriptions/thumbnails is the `/search` page's concern per section 12, not the popover's). The popover renders up to 5 of each per section 8, even though the action itself returns up to 6 channels / 24 videos for the future full page — the popover slices client-side (`.slice(0, 5)`) rather than the action taking a `limit` param, so the same action serves both surfaces without a variant.
- **Debouncing**: implemented with a `useEffect` + `setTimeout`/`clearTimeout` around the 300ms window (no new dependency needed — no `use-debounce` package, section 16's stack doesn't list one).
- **`cursor-pointer` on `DropdownMenuItem`**: fixed at `components/ui/dropdown-menu.tsx` (`cursor-default` → `cursor-pointer`, paired with `data-disabled:cursor-not-allowed`) immediately after installing it via the CLI, per section 8's explicit instruction — this is a one-line edit to generated shadcn code, not a hand-rolled workaround, and matches the already-established pattern of editing `button.tsx`'s hover color from the authentication feature.
- **Sign out**: calls `authClient.signOut()` then `router.push("/")` — BetterAuth's `signOut` doesn't redirect on its own from a client hook.
- **No new env vars, no UploadThing, no Mongoose model changes** — this feature only reads existing `Channel`/`Video` collections and the existing session.

## Output

**Goal:** A shared, sticky navbar (logo, live search popover, account area) rendered once from a new `(main)` route group shell, backed by a minimal `search` server action.

**Files likely to change / create:**
- `components/ui/avatar.tsx`, `dropdown-menu.tsx`, `popover.tsx` — new, via `npx shadcn@latest add avatar dropdown-menu popover`.
- `components/ui/dropdown-menu.tsx` — one-line edit post-install: `DropdownMenuItem`'s base class `cursor-default` → `cursor-pointer`, add `data-disabled:cursor-not-allowed`.
- `app/(main)/layout.tsx` — new: fetches session server-side, renders `<Navbar session={session} />` then `{children}`.
- `app/(main)/components/navbar.tsx` — new: logo (84×84, links to `/home`), search bar (centered, `h-12`/`text-base`, debounced popover), account area (signed-out: Sign In link to `/`; signed-in: `size-12` avatar → dropdown with name/email, Dashboard/Subscriptions/Settings links, Sign Out).
- `app/(main)/search/actions/index.ts` — new: `search(query)` — regex-matches `Video.title` (≤24) and `Channel.name` (≤6) case-insensitively, most recent first, in parallel via `Promise.all`, no session check (public read).
- `app/(main)/search/validations/index.ts` — new (if a query-length/shape check is warranted) or the action validates inline — see Constraints.

**Acceptance criteria:**
- `app/(main)/layout.tsx` calls `auth.api.getSession({ headers: await headers() })` and passes the result as a prop to `Navbar` — the navbar itself never calls `getSession`/`useSession` to fetch its own session.
- Navbar renders: 84×84 logo linking to `/home`; centered flexible-width search `Input` at `h-12`/`text-base` with no submit button; signed-out state shows a Sign In link/button to `/`; signed-in state shows a `size-12` circular avatar (fallback icon `size-6`) opening a dropdown (`min-w-56`) with name/email (display-only), Dashboard/Subscriptions/Settings links, and a visually-separated red Sign Out action.
- Search input: typing debounces 300ms, then calls `search(query)` directly (no API route), shows up to 5 channel + 5 video results in a `Popover` anchored via `PopoverTrigger` `render` replacing its default trigger with the actual `Input`; clearing the input closes the popover; zero results shows a compact "No results" line; a `Spinner` shows while the debounced request is in flight; a "See all results for `<query>`" link and pressing Enter both navigate to `/search?q=<query>`.
- `DropdownMenuItem` shows `cursor-pointer` on hover for every item (fixed at the component level) and `cursor-not-allowed` when disabled.
- No `asChild` anywhere; `DropdownMenuLabel` is inside a `DropdownMenuGroup`; `PopoverTrigger`'s `render` prop is used, not a nested interactive element.
- The navbar is sticky (stays visible while scrolling) at the top of every `(main)` page.
- Sign Out calls `signOut()` then redirects to `/`.
- `search(query)` returns results scoped to what's actually asked (no session check, case-insensitive regex, most-recent-first ordering, capped at 24 videos / 6 channels).
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass (new route segment + route group layout meets AGENTS.md section 26's build-trigger condition).

**Manual test steps after implementation:**
1. Run `npm run dev`.
2. Sign in (per the authentication feature) so a session exists, then manually navigate to a `(main)`-group URL — since no page under `(main)` exists yet except `/search` (action only, no page) and the layout itself has no index page, temporarily visit any path that resolves under the group to see the navbar render, OR verify via a quick temporary test page if nothing currently routes into `(main)` — note in the report if this step needs a placeholder page to be visually verifiable at all.
3. Confirm the logo is visibly larger than a standard nav icon and links toward `/home` (will 404 — expected, page not built yet).
4. Type into the search bar; confirm a popover appears after ~300ms showing matching channels/videos if any exist in the database (create a channel/video via `mongosh`/Compass directly if none exist, since the dashboard upload UI isn't built yet either).
5. Clear the input and confirm the popover closes; type a nonsense query and confirm a "No results" line appears instead of an empty panel.
6. Press Enter in the search input, or click "See all results" — confirm navigation to `/search?q=...` (will 404 — expected, page not built).
7. Click the avatar — confirm the dropdown opens with `min-w-56`, shows name/email, and hovering any item (Dashboard/Subscriptions/Settings/Sign Out) shows a pointer cursor.
8. Click Sign Out — confirm redirect to `/`.
9. Sign out fully and reload a `(main)` URL — confirm the navbar shows a Sign In link instead of the avatar.

## Constraints

- Follow AGENTS.md section 8 exactly for layout, sizing (`84×84` logo, `h-12`/`text-base` search, `size-12` avatar/`size-6` fallback, `min-w-56` dropdown), and behavior (debounce, popover contents, sticky positioning).
- Follow section 12, item 2 exactly for the `search` action's matching/limit/ordering rules — do not build the `/search` page or any UI beyond the navbar's popover in this prompt.
- Follow section 21 (Base UI): no `asChild`; `render` prop for the `PopoverTrigger`↔`Input` composition and any link-rendering `DropdownMenuItem`s (`render={<Link href="..." />}`); `DropdownMenuLabel` inside `DropdownMenuGroup`.
- Fix `cursor-pointer` on `DropdownMenuItem` at the component level (`components/ui/dropdown-menu.tsx`), not per navbar item — per section 8's explicit instruction.
- The navbar takes `session` as a prop from `(main)/layout.tsx` — it must not call `auth.api.getSession` or `useSession` itself to determine its own session state (section 8's "Behavior rules").
- `search` must not require a session (public read) and must not expose Mongoose models to client code — it's a `"use server"` function called directly from the navbar's client component (server actions are callable from client components without an API route, per section 12's own note).
- No comments in code unless explaining a non-obvious "why" (AGENTS.md section 25).
- Checks to run after implementation: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
