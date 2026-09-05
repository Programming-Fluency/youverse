# Search Page

## Role

The principal-level full-stack engineer defined in AGENTS.md, scoped to implementing the search feature end to end as owned by AGENTS.md section 12 — the `/search` page, and the extensions to the existing `search` action it requires.

## Context

**Skills read:**
- `.agents/skills/mongoose-nextjs/SKILL.md` — per section 12's explicit instruction to read every MongoDB/Mongoose-related skill before drafting. Confirms the established pattern already used throughout this codebase (actions call `connectToDatabase()`, `.lean()` + explicit `_id`/`ObjectId` → string mapping, batched channel/view-count lookups to avoid N+1 — same pattern as `getHomeFeed`/`getSuggestedVideos`).
- Not read: React Hook Form / Zod (no form on this page — it reads a URL query param, not user input through a form), UploadThing (no uploads).

**Existing code inspected:**
- `app/(main)/search/actions/index.ts` **already exists** (built during the navbar feature) — `search(query)` matches section 12 item 2's core spec (case-insensitive regex, `Video.title` ≤24 / `Channel.name` ≤6, most recent first, parallel queries, no session, `Promise<ActionResult<SearchResult>>`). It's consumed by the navbar's live popover already. **This is a modification, not a fresh build**, per section 12's "before generating" checklist.
- **Gap identified and confirmed with the user**: `SearchVideoResult` currently only has `_id`/`title`/`thumbnailUrl` — missing `duration`, `createdAt`, `viewCount`, and a `channel` object, all required because section 12 item 1 mandates the Videos section render "a standard `VideoCard` grid" (section 10 item 2's full prop contract), not a simplified list. `SearchChannelResult` is missing `bannerUrl` (needed for the page's "circular banner thumbnail" row) and `subscriberCount` (AGENTS.md's own "known gap" note assumes this field exists, hardcoded to `0` — the field isn't present in the code at all today). **User decision: extend both result shapes to match `VideoCard`'s contract, AND compute a real aggregated `subscriberCount`** from `Subscription.countDocuments({ channelId })` — going beyond AGENTS.md section 12's stated default (which says to leave the hardcoded-0 gap alone unless explicitly asked), per the user's explicit instruction this time.
- `app/(main)/components/navbar.tsx` — consumes `search`'s existing `SearchResult` type, destructuring only `channel._id`/`channel.name` and `video._id`/`video.title`. Confirmed the widened return shape is purely additive and doesn't break the navbar's popover — no navbar changes needed.
- `app/(main)/components/video-card.tsx` — `VideoCard`'s exact prop contract (`_id`, `title`, `thumbnailUrl`, `duration`, `createdAt`, `viewCount`, optional `channel: { _id, name, isOwner, isSubscribed }`) is what the extended `search` action's video results must satisfy.
- `db/models/Channel.ts`, `db/models/Video.ts`, `db/models/Subscription.ts`, `db/models/ViewHistory.ts` — all already have the fields needed.
- `lib/db.ts`, `lib/action-result.ts`, `lib/auth.ts` already exist.
- `components/ui/empty.tsx`, `components/ui/avatar.tsx` already exist — used for this page's placeholder/empty states and the circular channel-banner thumbnails respectively.
- No `app/(main)/search/page.tsx` exists yet — this is the actual fresh-build part of this feature.
- `.agents/memory/` has `authentication.md`, `channel-dashboard.md`, `database-layer.md`, `home-feed.md`, `loading-error-boundaries.md`, `metadata-favicon.md`, `navbar.md`, `watch-page.md` — no prior `search.md` entry; `navbar.md` documents the original `search` action build.
- AGENTS.md section 19's standing rule requires `loading.tsx`/`error.tsx` for the new `/search` route.

**Decisions / assumptions:**
- **`search` action is extended in place**, not duplicated — same function signature (`search(query: string)`), same file, widened `SearchVideoResult`/`SearchChannelResult` types. The navbar's popover automatically benefits from the richer data (though it still only renders name/title today — not in scope to enhance the popover's own UI here, since section 8's popover spec doesn't ask for banners/durations in the compact preview).
- **Video results' `channel` prop**: since search results span multiple channels (like the home feed and suggested videos), each video result's `channel` field is populated (`_id`, `name`, `isOwner`, `isSubscribed`) using the same pattern as `getHomeFeed`/`getSuggestedVideos` — requires a session lookup and a subscription-membership check batched across the result set, and `getSession` becomes necessary even though the action has no session *requirement* (still no `fail` on missing session — session is only used to compute `isOwner`/`isSubscribed`, defaulting both to `false` when signed out).
- **`subscriberCount`**: computed via `Subscription.countDocuments({ channelId: channel._id })`, batched per section 6's aggregation-over-storage rule (one aggregate covering all matched channel IDs, not N separate `countDocuments` calls) — per the user's explicit instruction to fix this now rather than leave it hardcoded.
- **Search page** (`app/(main)/search/page.tsx`): reads `q` from `searchParams` (a `Promise`, per section 19). Three states per section 12's exact spec: (1) no `q` — centered placeholder (icon, "Search YouVerse", a prompt to type); (2) `q` present, zero matches in both channels and videos — centered empty state (icon, `No results for "<query>"`, a suggestion to try a different term); (3) `q` present with matches — "Results for `<query>`" line, then a **Channels** section (each result a row: circular banner via `Avatar`/`AvatarImage`+`AvatarFallback`, name, one-line description, linking to `/channel/[id]`) if any matched, then a **Videos** section (`VideoCard` grid) if any matched. Either section fully omitted (no heading) when it has zero matches — never a heading over nothing.
- **No new shadcn components needed** — `Empty`, `Avatar`, `VideoCard`, and existing grid/link patterns cover every visual requirement.
- **Route metadata**: section 12 doesn't call for dynamic `generateMetadata` here (no per-query title requirement in the spec), so no metadata export is added beyond what's inherited from the root layout — not introducing scope not asked for.

## Output

**Goal:** A working `/search` page consuming an extended `search` action, so the navbar's "See all results" link and Enter-to-navigate (already implemented, currently pointing to a 404) resolve to a real, fully-featured results page.

**Files likely to change / create:**
- `app/(main)/search/actions/index.ts` — modified: widen `SearchVideoResult` to the full `VideoCard` shape (including `channel`), widen `SearchChannelResult` to add `bannerUrl` and a real aggregated `subscriberCount`; `search()`'s query logic (regex, limits, sort, no session requirement) stays the same, only the returned shape and the additional lookups (channel-for-video, subscription-membership, view-count aggregation, subscriber-count aggregation) are added.
- `app/(main)/search/page.tsx` — new.
- `app/(main)/search/loading.tsx`, `error.tsx` — new, per AGENTS.md section 19.

**Acceptance criteria:**
- `search(query)`'s core matching behavior (case-insensitive regex, `Video.title` ≤24 / `Channel.name` ≤6, most recent first, parallel, public) is unchanged.
- `SearchVideoResult` now includes `duration`, `createdAt`, `viewCount` (live `ViewHistory` aggregation, never stored), and `channel: { _id, name, isOwner, isSubscribed }`.
- `SearchChannelResult` now includes `bannerUrl` and a real aggregated `subscriberCount` (via `Subscription.countDocuments`/`$group`, batched — not N+1).
- The navbar's existing popover still compiles and renders correctly against the widened types (no navbar file changes needed, but verify after the action changes).
- `/search` page: no `q` → centered "Search YouVerse" placeholder; `q` with zero matches → centered `No results for "<query>"` empty state; `q` with matches → "Results for `<query>`" line, then Channels section (circular banner, name, description, link) if any matched, then Videos section (`VideoCard` grid) if any matched — each section fully omitted when empty, never shown with a heading and no content.
- `/search` has its own route-relevant `loading.tsx` (results-shaped skeleton: a couple of channel-row placeholders + a video-grid placeholder) and `error.tsx` (`Empty` + `retry()`, search-relevant copy/icon), per AGENTS.md section 19.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass.

**Manual test steps after implementation:**
1. Run `npm run dev`.
2. Visit `/search` with no query — confirm the centered "Search YouVerse" placeholder.
3. Type a query into the navbar's search bar and press Enter, or use "See all results" — confirm navigation to `/search?q=...` now renders real results instead of 404ing.
4. Search for something matching only a channel name — confirm the Channels section renders (circular banner or fallback, name, description) with no Videos heading beneath it.
5. Search for something matching only a video title — confirm the Videos section renders as a real `VideoCard` grid (thumbnail, duration badge, title, channel link, view count) with no Channels heading above it.
6. Search for a query matching both — confirm both sections render, Channels first.
7. Search for a nonsense query — confirm the centered `No results for "<query>"` empty state.
8. Click a search result's channel-name link or video thumbnail — confirm navigation to `/channel/[id]` / `/watch/[id]` respectively.
9. Confirm a channel with real subscribers shows an accurate (non-zero) subscriber count in its search row, matching what its own public channel page shows.
10. Confirm the navbar's existing live-search popover still works correctly (no regressions from the widened `search` return type).
11. Throttle the network to see the loading skeleton; temporarily break `MONGODB_URI` to see the error state.

## Constraints

- Follow AGENTS.md section 12 exactly for the search page's three states and section layout.
- Follow section 10 item 2 exactly for the `VideoCard` prop contract the extended video results must satisfy — do not modify `VideoCard` itself.
- Follow section 6 for all derived counts (view counts, subscriber counts) — aggregation, batched, never stored fields.
- Follow section 17: `search` remains a public read (no session requirement) even though it now looks up session-dependent `isOwner`/`isSubscribed` fields for display purposes only.
- Follow section 19's standing rule for `/search`'s `loading.tsx`/`error.tsx`.
- Do not modify the navbar's popover UI — only the `search` action's return shape changes; the popover keeps rendering its existing compact preview.
- No comments in code unless explaining a non-obvious "why" (AGENTS.md section 25).
- Checks to run after implementation: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
