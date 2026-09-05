# Home Feed

## Role

The principal-level full-stack engineer defined in AGENTS.md, scoped to implementing the home feed feature end to end as owned by AGENTS.md section 10 — the home page and the dedicated subscriptions feed page. `VideoCard`, `toggleSubscription`, and `SubscribeButton` (section 10 items 2–3) already exist, built ahead of schedule during the channel/dashboard feature, and are reused as-is.

## Context

**Skills read:** None newly required — this feature is read-only Mongoose queries (same aggregation/`.lean()`/action pattern already used in `app/(main)/dashboard/actions/index.ts` and `app/(main)/channel/[id]/actions/index.ts`, both already built this session) and no forms, so the `mongoose-nextjs`, `react-hook-form`, and `zod` skills' guidance is already reflected in the existing action files this feature's actions will mirror. No UploadThing, no new shadcn components anticipated (see below).

**Existing code inspected:**
- `app/(main)/home/page.tsx` is the **temporary placeholder** created during the navbar feature ("Temporary placeholder — the real home feed... isn't built yet") — this feature replaces it with the real implementation.
- `app/(main)/home/subscriptions/` does not exist yet — fresh build.
- `app/(main)/components/video-card.tsx` — `VideoCard` already implements the full section 10 item 2 contract (`_id`, `title`, `thumbnailUrl`, `duration`, `createdAt`, `viewCount`, optional `channel: { _id, name, isOwner, isSubscribed }`, `horizontal` prop, inline subscribe pill). Reused as-is, not modified.
- `app/(main)/channel/[id]/actions/index.ts` — `toggleSubscription(channelId)` and `SubscribeButton` already exist and fully match section 10 item 3. Not touched by this feature.
- `db/models/Video.ts` (`channelId`, `title`, `description`, `thumbnailUrl`, `videoUrl`, `duration`, timestamps), `db/models/Channel.ts` (`userId`, `name`, ...), `db/models/Subscription.ts` (`subscriberUserId`, `channelId`), `db/models/ViewHistory.ts` (`userId`, `videoId`, `watchedAt`) — all already exist with the fields this feature's queries need.
- `proxy.ts`'s `config.matcher` already includes `/home/subscriptions` (added during the authentication feature, per section 7 item 4) — no `proxy.ts` change needed.
- `lib/db.ts` (`connectToDatabase`), `lib/action-result.ts` (`ok`/`fail`/`dbFail`), `lib/auth.ts` all already exist.
- `components/ui/empty.tsx` already exists (from the loading-error-boundaries work) — used for this feature's empty states.
- `.agents/memory/` has `authentication.md`, `channel-dashboard.md`, `database-layer.md`, `loading-error-boundaries.md`, `metadata-favicon.md`, `navbar.md` — `channel-dashboard.md` explicitly notes "The real home feed content, subscriptions feed page... remain section 10's own scope" and confirms `VideoCard`/`toggleSubscription` are ready to reuse.
- AGENTS.md section 19's standing rule requires `loading.tsx`/`error.tsx` for every route with a `page.tsx`. `app/(main)/home/` already has both (from the placeholder) — this feature updates them to be relevant to the *real* home feed's content (two-section grid), not the placeholder's single line. `app/(main)/home/subscriptions/` is new and needs its own pair.

**Decisions / assumptions:**
- **Home page session handling**: per section 10's explicit note, the whole page must render for signed-out visitors (Recommended only) — it does **not** gate behind `proxy.ts`'s matcher (which doesn't include `/home`) and does not early-return/redirect on a missing session. `auth.api.getSession` is called once and used to conditionally decide whether to run the Subscribed query at all.
- **Subscribed section query**: only runs, and only renders, when there's a session **and** the visitor has ≥1 subscription — found via `Subscription.find({ subscriberUserId: session.user.id })` for channel IDs, then `Video.find({ channelId: { $in: [...] } })`, most recent first. If zero subscriptions, skip the query and section entirely (per section 10's explicit "omit... don't render it empty").
- **Recommended section query**: `Video.find({})` most recent first across all channels, always runs regardless of session, **excluding** any video ID already present in the Subscribed section's results (per section 10's explicit de-dup rule) so nothing repeats on the page. No ranking/personalization logic — literally "latest across the app," and UI copy will say "Recommended" without implying an algorithm.
- **View counts**: computed via `ViewHistory` aggregation per video, same `$group` pattern already used in the dashboard/channel-page actions — never a stored field (section 6).
- **`channel` prop passed to `VideoCard` on the home/subscriptions grids**: since these are multi-channel feeds (unlike the dashboard/channel page's single-channel context), every video's `channel` prop is populated with `{ _id, name, isOwner, isSubscribed }` so the channel name renders as a link and the inline subscribe pill shows for non-owned channels. `isOwner` compares `channel.userId` to the current session's `user.id` (false for a signed-out visitor). `isSubscribed` is true only for videos in the Subscribed section (by definition) and computed per-channel for the Recommended section based on the same subscription set already fetched.
- **Empty-app state**: per section 10, if there are zero videos in the whole app, show a single centered empty state in place of both sections (icon, "No videos yet", a line pointing to the dashboard) — this is a distinct, whole-page empty state from the "no subscriptions" case (section 10 has two different empty states: no-videos-at-all vs. no-subscriptions-yet, the latter affecting only the Subscribed section).
- **`app/(main)/home/subscriptions/page.tsx`**: protected by `proxy.ts` (already in the matcher, so no proxy change needed), same query/layout as the home page's Subscribed section but as its own page — "Subscriptions" heading, `VideoCard` grid, or an empty state (icon, "No subscriptions yet", link back to `/home`) distinct from the home page's empty states.
- **No new shadcn components needed** — `Empty`, grid layout, and `VideoCard` cover every visual requirement in section 10's spec.
- **Two actions files**: `app/(main)/home/actions/index.ts` (`getHomeFeed()`, returns both sections) and `app/(main)/home/subscriptions/actions/index.ts` (`getSubscriptionsFeed()`) — kept separate per-route per AGENTS.md section 15/17's per-route actions-file convention, even though their underlying queries overlap; a shared query helper is not introduced speculatively since the two callers' exact response shapes differ slightly (home needs two arrays, subscriptions needs one).

## Output

**Goal:** Replace the temporary home placeholder with the real two-section home feed, and add the dedicated subscriptions feed page — both rendering the existing `VideoCard` grid.

**Files likely to change / create:**
- `app/(main)/home/page.tsx` — replaced: real Subscribed/Recommended sections.
- `app/(main)/home/loading.tsx` — replaced: two-section video-grid skeleton (was the placeholder's single-line skeleton).
- `app/(main)/home/error.tsx` — replaced: home-feed-relevant `Empty` copy/icon (was the placeholder's generic "Home couldn't load" — now can be more specific since real content exists).
- `app/(main)/home/actions/index.ts` — new: `getHomeFeed()`.
- `app/(main)/home/subscriptions/page.tsx` — new.
- `app/(main)/home/subscriptions/loading.tsx`, `error.tsx` — new.
- `app/(main)/home/subscriptions/actions/index.ts` — new: `getSubscriptionsFeed()`.

**Acceptance criteria:**
- Home page renders for signed-out visitors (Recommended only, no redirect, no session gate).
- Subscribed section renders only when session exists AND ≥1 subscription; otherwise omitted entirely (no heading, no empty placeholder in its place).
- Recommended section always renders (unless the whole app has zero videos), excludes any video already shown in Subscribed, most recent first.
- Each section has its own heading ("Subscribed", "Recommended") above a responsive `VideoCard` grid (1 col mobile → 4 cols large screens), matching the existing dashboard/channel-page grid classes for consistency.
- Every video's `channel` prop is populated (`_id`, `name`, `isOwner`, `isSubscribed`) so `VideoCard` renders the channel-name link and, where applicable, the inline subscribe pill.
- If zero videos exist anywhere in the app: single centered empty state replacing both sections (icon, "No videos yet", pointer to the dashboard) — not two empty sections.
- `app/(main)/home/subscriptions/page.tsx`: "Subscriptions" heading, `VideoCard` grid of the same Subscribed query, or its own empty state (icon, "No subscriptions yet", link to `/home`) when the visitor has none. Already covered by `proxy.ts`'s matcher (verify, don't re-add).
- View counts computed via `ViewHistory` aggregation, never a stored field.
- `app/(main)/home/loading.tsx`/`error.tsx` and `app/(main)/home/subscriptions/loading.tsx`/`error.tsx` are all route-relevant per AGENTS.md section 19 (video-grid skeletons, specific `Empty` copy, `retry()`).
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass.

**Manual test steps after implementation:**
1. Run `npm run dev`.
2. Signed out: visit `/home` — confirm only "Recommended" renders (no "Subscribed" heading anywhere), showing the videos already created during the channel/dashboard feature's manual testing, most recent first.
3. Signed in, with no subscriptions: visit `/home` — confirm still only "Recommended" (no empty "Subscribed" section).
4. Subscribe to a channel (via its public channel page or a `VideoCard`'s inline pill on a Recommended video), then revisit `/home` — confirm "Subscribed" now appears above "Recommended," shows that channel's videos, and none of those videos are duplicated in "Recommended."
5. Click a `VideoCard`'s channel name — confirm it navigates to `/channel/[id]` without triggering the card's own video link.
6. Click a `VideoCard`'s inline subscribe pill on a Recommended card — confirm it toggles without navigating, and the page refreshes to reflect the new subscription state.
7. Visit `/home/subscriptions` directly while signed out — confirm redirect to `/` (via `proxy.ts`, already configured).
8. Visit `/home/subscriptions` signed in with subscriptions — confirm the "Subscriptions" heading and grid match the home page's Subscribed section's content.
9. Visit `/home/subscriptions` signed in with zero subscriptions — confirm the "No subscriptions yet" empty state with a working link back to `/home`.
10. Throttle the network in devtools and reload `/home` and `/home/subscriptions` to see each route's skeleton; temporarily break `MONGODB_URI` to see each route's error state.

## Constraints

- Follow AGENTS.md section 10 exactly: session-handling rules for the home page (no gate, conditional Subscribed query), the de-dup rule between Subscribed and Recommended, the two distinct empty states (no-videos-at-all vs. no-subscriptions-yet), and `/home/subscriptions` as a fully protected route reusing the same query/layout as the home page's Subscribed section.
- Do not modify `VideoCard`, `toggleSubscription`, or `SubscribeButton` — they already fully satisfy section 10 items 2–3; this feature only consumes them.
- Do not modify `proxy.ts` — `/home/subscriptions` is already in the matcher.
- Follow section 17 for both new action files: `connectToDatabase()` before querying, `ok`/`fail`/`dbFail` returns; `getHomeFeed`/`getSubscriptionsFeed` are read-only and may skip a hard session requirement per section 17's "read-only action functions... may skip session checks only when the data is meant to be public" — but `getSubscriptionsFeed` still needs the session to know *whose* subscriptions to fetch, so it returns `fail(...)` (not a throw) when there's no session, consistent with the page being proxy-protected as defense in depth.
- Follow section 6 for derived view counts (aggregation, never stored).
- No comments in code unless explaining a non-obvious "why" (AGENTS.md section 25).
- Checks to run after implementation: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
