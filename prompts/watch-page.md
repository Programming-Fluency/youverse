# Watch Page

## Role

The principal-level full-stack engineer defined in AGENTS.md, scoped to implementing the watch page feature end to end as owned by AGENTS.md section 11 — the player, video details, suggested videos sidebar, and view tracking.

## Context

**Skills read:**
- `.agents/skills/mongoose-nextjs/SKILL.md` — per section 11's explicit instruction ("Read every skill... related to MongoDB or Mongoose... since suggested videos and view counts both rely on aggregation queries"). Confirms the established pattern already used throughout this codebase: actions call `connectToDatabase()` before querying, `.lean()` + explicit `_id`/`ObjectId` → string mapping for client-facing shapes, models never imported into client components, `mongoose.models.X ||` guard already present on all four models.
- Not read: React Hook Form / Zod skills (no forms in this feature — `recordView`/`getSuggestedVideos` take plain string arguments, not form input), UploadThing skill (no uploads here).

**Existing code inspected:**
- No `app/(main)/watch/` exists yet — fresh build, not a modification.
- `app/(main)/components/video-card.tsx` — `VideoCard` already supports the `horizontal` prop exactly as section 11 item 4 requires (thumbnail on the left, title/channel/views stacked on the right when `horizontal={true}`) — confirmed by reading the component; no changes needed to it for this feature.
- `db/models/Video.ts` (`channelId`, `title`, `description`, `thumbnailUrl`, `videoUrl`, `duration`, timestamps), `db/models/Channel.ts` (`userId`, `name`, `description`, `bannerUrl`), `db/models/ViewHistory.ts` (`userId`, `videoId`, `watchedAt` — already defaults to `Date.now`) — all already exist with the fields this feature needs.
- `lib/db.ts` (`connectToDatabase`), `lib/action-result.ts` (`ok`/`okVoid`/`fail`/`dbFail`), `lib/auth.ts` all already exist.
- `app/(main)/channel/[id]/page.tsx` already establishes the `notFound()` pattern for a missing document (`if (!result.success) notFound();`) — this feature's watch page follows the same pattern.
- `components/ui/separator.tsx` already exists — used for the divider between title/meta row and channel/description per section 11's exact layout spec.
- `.agents/memory/` has `authentication.md`, `channel-dashboard.md`, `database-layer.md`, `home-feed.md`, `loading-error-boundaries.md`, `metadata-favicon.md`, `navbar.md` — `home-feed.md` explicitly notes the watch page is not yet built and that `VideoCard` links there already (so every existing card's link starts working once this feature ships).
- AGENTS.md section 19's standing rule requires `loading.tsx`/`error.tsx` for the new `/watch/[id]` route.

**Decisions / assumptions:**
- **`getVideo`/`getSuggestedVideos` are public reads** (no session check), per section 11's explicit statement — the watch page itself is public. **`recordView` is the only mutation** and requires a session; signed-out visitors simply don't get a view recorded (no error surfaced to them for this — it's a silent no-op from the visitor's perspective, since section 11 says signed-out visitors "do not have their views recorded," not that they see an error).
- **View count everywhere** (this page's own view count line, and every `viewCount` passed to `VideoCard` in the suggested-videos sidebar) is a live `ViewHistory` aggregate/count, never a stored field, per section 6 — same pattern as every prior feature.
- **`VideoPlayer`**: a plain HTML `<video>` with native `controls`, 16:9 aspect ratio, black background per section 11's exact layout. View recording uses a `useRef` boolean guard inside a `useEffect` with an empty dependency array (`[]`) so `recordView` fires exactly once per page mount, never on re-renders — this is the exact mechanism section 11 item 2 describes, and matters because a naive `useEffect` without the ref guard (e.g. depending on `videoId` alone, which doesn't change) would still be safe from *re-renders* but the ref guard is the explicit, described mechanism to follow rather than relying on effect dependency semantics alone.
- **Suggested videos algorithm** (`getSuggestedVideos(currentVideoId, channelId)`): same-channel videos first (up to 8, most recent first, excluding the current video), then backfilled with recent videos from *other* channels (up to 12) if the same-channel result is short of covering the sidebar — per section 11 item 4's exact wording ("Prioritizes... first (up to 8), then backfills... (up to 12)"). Total sidebar list is therefore at most 8 same-channel + 12 other-channel = 20 videos, not a single flat "up to 12" cap — matching the spec literally rather than assuming a combined cap.
- **Suggested videos pass a `channel` prop to `VideoCard`** (cross-channel context, like the home feed) so each sidebar entry shows its channel name and, where applicable, an inline subscribe pill — consistent with how `VideoCard`'s optional `channel` prop is used everywhere except the dashboard/single-channel-page contexts. `isOwner`/`isSubscribed` computed the same way `getHomeFeed` already does (compare `channel.userId` to the current session's `user.id`; check subscription membership for the current session).
- **Sidebar omission**: if `getSuggestedVideos` returns zero results (e.g. only one video exists in the whole app), the "Up next" heading and sidebar column are omitted entirely — not rendered empty — per section 11's explicit instruction, mirroring how the home feed's Subscribed section is omitted rather than shown empty.
- **Layout**: two columns on large screens via CSS grid (`lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]` or similar), stacked vertically below that breakpoint — matching the responsive pattern already used elsewhere in this codebase (`sm:`/`lg:` breakpoints in the dashboard/channel-page grids).
- **No `Separator` misuse**: the "divider" between the view-count/date row and the channel/description block is a plain `<Separator />` from the already-installed component, not a hand-rolled `<hr>` or border utility, per AGENTS.md section 22's "always use an installed shadcn component" rule.

## Output

**Goal:** A working `/watch/[id]` page — player, details, suggested sidebar, view tracking — so every existing `VideoCard` link across the app (dashboard, channel page, home feed, subscriptions feed) resolves to a real destination instead of 404ing.

**Files likely to change / create:**
- `app/(main)/watch/[id]/page.tsx` — new.
- `app/(main)/watch/[id]/loading.tsx`, `error.tsx` — new, per AGENTS.md section 19.
- `app/(main)/watch/[id]/actions/index.ts` — new: `getVideo(id)`, `recordView(videoId)`, `getSuggestedVideos(currentVideoId, channelId)`.
- `app/(main)/watch/[id]/components/video-player.tsx` — new.

**Acceptance criteria:**
- `getVideo(id)` returns the video + its channel (name, `_id` at minimum) in one read; the page calls `notFound()` when it returns a failure/missing result, matching the existing channel-page pattern.
- `VideoPlayer` renders a native `<video controls>` element, 16:9, black background; calls `recordView(videoId)` exactly once per mount via a `useRef` guard in a `useEffect`, never on re-render.
- `recordView(videoId)`: requires a session (silent no-op, not a surfaced error, when signed out), appends a `ViewHistory` document, returns `okVoid()`/`fail(...)` per the action-result contract.
- `getSuggestedVideos(currentVideoId, channelId)`: same-channel videos first (≤8, excluding current), backfilled with other-channel videos (≤12) most recent first; each result includes a populated `channel` prop for `VideoCard`.
- Watch page layout: two columns on large screens (player+details left, "Up next" sidebar right), stacked on small screens. Left column top-to-bottom: player → title → view count + upload date row → `Separator` → channel name (links to `/channel/[id]`) → description. Right column: "Up next" heading + vertical `VideoCard` list in `horizontal` variant — entirely omitted (heading and column both) when there are no suggested videos.
- View counts everywhere in this feature are live `ViewHistory` aggregation reads, never stored fields.
- `/watch/[id]` has its own route-relevant `loading.tsx` (player/details/sidebar-shaped skeleton) and `error.tsx` (`Empty` + `retry()`, video-playback-relevant copy/icon), per AGENTS.md section 19.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass.

**Manual test steps after implementation:**
1. Run `npm run dev`.
2. From `/home`, `/dashboard`, or a channel page, click a `VideoCard`'s thumbnail — confirm it now navigates to `/watch/[id]` instead of 404ing.
3. Confirm the player shows a 16:9 black-background video with native controls, and the video actually plays.
4. Confirm title, view count, upload date, a visible divider, channel name (linking to `/channel/[id]`), and description all render in that order.
5. Reload the page while signed in — confirm the view count increments by exactly 1 per reload (one `ViewHistory` document per page load, not per re-render — check via `mongosh`/Compass if needed).
6. Reload the page while signed out — confirm the view count does NOT increment.
7. If the video's channel has other videos, confirm "Up next" shows those first; if fewer than 8 exist, confirm the list backfills with other channels' recent videos up to the combined cap.
8. If only one video exists in the whole app (no possible suggestions), confirm "Up next" and the entire right column are omitted, not shown empty.
9. Click a suggested video's channel name — confirm it navigates to that channel's page without triggering the card's own video link.
10. Throttle the network in devtools to see the loading skeleton; visit `/watch/<a-fake-id>` to confirm `notFound()` renders the standard Next.js 404 (or a project-level `not-found.tsx` if one exists — check whether one does before assuming default behavior).

## Constraints

- Follow AGENTS.md section 11 exactly: two-column responsive layout, exact left-column element order, `horizontal` `VideoCard` sidebar, the `useRef`-guarded single-fire view recording, the same-channel-first/backfill suggestion algorithm with its exact caps (8 then 12).
- Follow section 6 for derived view counts (aggregation, never stored).
- Follow section 17: `getVideo`/`getSuggestedVideos` are public reads (no session check); `recordView` requires a session and is the only mutation in this feature.
- Do not modify `VideoCard` — its existing `horizontal` prop already satisfies this feature's needs.
- Follow AGENTS.md section 22: use the installed `Separator` component for the divider, not hand-rolled markup.
- Follow AGENTS.md section 19's standing rule: route-relevant `loading.tsx`/`error.tsx`, checked against `node_modules/next/dist/docs/` conventions (`retry` prop).
- No comments in code unless explaining a non-obvious "why" (AGENTS.md section 25) — the `useRef` guard's purpose is worth a one-line comment; field mappings are not.
- Checks to run after implementation: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
