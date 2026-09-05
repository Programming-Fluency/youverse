# Home Feed

**Status:** Done.

## What was built

**`app/(main)/home/`** — replaced the temporary navbar-testing placeholder with the real feed:
- `page.tsx` — two sections, top to bottom: **Subscribed** (only rendered when a session exists AND the visitor has ≥1 subscription — omitted entirely otherwise, never rendered empty) and **Recommended** (always rendered unless the whole app has zero videos, excludes any video already shown in Subscribed). Both use the existing `VideoCard` grid (1 col mobile → 4 cols large).
- `actions/index.ts` — `getHomeFeed()`: short-circuits to a whole-app "no videos" result via `Video.countDocuments()` before running any subscription logic; fetches the visitor's subscribed channel IDs (empty set if signed out), queries subscribed videos, excludes those IDs (`$nin`) from the Recommended query, then batches channel lookups and `ViewHistory` view-count aggregation once across both result sets (not per-video). Every video's `channel` prop (`_id`, `name`, `isOwner`, `isSubscribed`) is populated so `VideoCard` renders the channel-name link and inline subscribe pill.
- `loading.tsx` / `error.tsx` — replaced the placeholder's single-line versions with a real two-section video-grid skeleton and home-feed-specific `Empty` copy (`HomeIcon`, "Your feed couldn't load").

**`app/(main)/home/subscriptions/`** — new:
- `page.tsx` — "Subscriptions" heading, `VideoCard` grid of the same subscribed-videos query, or an empty state (`UsersIcon`, "No subscriptions yet", link back to `/home`) distinct from the home page's own empty states.
- `actions/index.ts` — `getSubscriptionsFeed()`: requires a session (`fail(...)` if absent — the page itself is also protected by `proxy.ts`'s existing matcher, so this is defense in depth, not the only gate), reuses `FeedVideo`'s shape from the home actions file (`isSubscribed: true` always, since every result is by definition a subscribed channel's video).
- `loading.tsx` / `error.tsx` — single-grid skeleton; `Empty` + `UsersIcon` + `retry()`.

Neither `VideoCard`, `toggleSubscription`, nor `SubscribeButton` were modified — all three already existed from the channel/dashboard feature and were consumed as-is, matching section 10 items 2–3 exactly. `proxy.ts` was not touched — `/home/subscriptions` was already in its matcher from the authentication feature.

## Decisions

- Two separate action files (`home/actions`, `home/subscriptions/actions`) despite overlapping queries, per the per-route actions-file convention — `getSubscriptionsFeed` imports the `FeedVideo` type from `home/actions` rather than redefining it.
- View counts and subscriber-relevant channel data are batched (one `Channel.find({ _id: { $in } })`, one `ViewHistory.aggregate` `$group`) across the combined subscribed+recommended result set in `getHomeFeed`, not queried per-section or per-video, to avoid N+1 queries — same pattern already established in the dashboard/channel-page actions.
- The whole-app "no videos yet" empty state is checked first via a cheap `countDocuments()` before any subscription/channel work runs, since it's a distinct case from "no subscriptions yet" (which only affects the Subscribed section, not the whole page).

## Checks run

`npx tsc --noEmit`, `npm run lint`, `npm run build` all passed clean on the first pass — no fixes needed during implementation this time.

## Not built (explicitly out of scope here)

Watch page (`/watch/[id]`) — `VideoCard` links there but it doesn't exist yet (section 11); clicking a thumbnail still 404s, same as noted in the channel-dashboard memory entry.
