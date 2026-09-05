# Watch Page

**Status:** Done.

## What was built

**`app/(main)/watch/[id]/`** — new route, so every existing `VideoCard` link across the app (dashboard, channel page, home feed, subscriptions feed) now resolves instead of 404ing:
- `page.tsx` — calls `getVideo(id)`, `notFound()` on failure/missing; then `getSuggestedVideos(video._id, video.channel._id)` (sequential, since the second call needs the first's result). Two-column responsive grid (`lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`, stacked below `lg`). Left column: `VideoPlayer` → title → view count + upload date → `Separator` → channel name link → description. Right column ("Up next" + `VideoCard` list in `horizontal` variant) entirely omitted, not shown empty, when there are no suggestions.
- `actions/index.ts`:
  - `getVideo(id)` — public read, fetches the video + its channel in two queries, computes `viewCount` via `ViewHistory.countDocuments`, returns `fail(...)` (→ `notFound()` in the page) if either the video or its channel is missing.
  - `recordView(videoId)` — the only mutation; session-required, but a **silent no-op** (`okVoid()`, not an error) when signed out, per section 11's wording that signed-out visitors simply don't get a view recorded, rather than being shown a failure. Appends a `ViewHistory` document.
  - `getSuggestedVideos(currentVideoId, channelId)` — same-channel videos first (≤8, excluding current), backfilled with other-channel videos (≤12), most recent first in each group; batches channel lookups, subscription-membership checks, and view-count aggregation once across the combined result set (same batching pattern as `getHomeFeed`). Returns `FeedVideo[]` — reused from `app/(main)/home/actions/index.ts` rather than redefining an equivalent type, since the shape `VideoCard` needs is identical.
- `components/video-player.tsx` — `VideoPlayer`: plain `<video controls>`, 16:9, black background (`aspect-video bg-black`). Records the view exactly once per mount via a `useRef` boolean guard inside a `useEffect` — the ref is checked and set before calling `recordView`, so React 18/19 double-invocation in development and any re-render both remain safe.
- `loading.tsx` — two-column skeleton (player/title/meta/divider/channel/description shape on the left, 6 horizontal-card placeholders on the right).
- `error.tsx` — `Empty` + `PlayCircleIcon`, "This video couldn't load" + `retry()`.

`VideoCard` was not modified — its existing `horizontal` prop already covered this feature's sidebar needs exactly.

## Decisions

- `getVideo`/`getSuggestedVideos` are public reads (no session check) per section 11; `recordView` is the only mutation and requires a session.
- View counts are always a live `ViewHistory` read (`countDocuments` for the single watched video, `$group` aggregation for the batch of suggested videos) — never a stored field, consistent with every prior feature.
- Suggested-videos caps are literal per the spec's wording: up to 8 same-channel + up to 12 other-channel, not a single combined "up to 12."

## Checks run

`npx tsc --noEmit`, `npm run lint`, `npm run build` all passed. One minor lint fix during implementation: removed an unnecessary `eslint-disable-next-line jsx-a11y/media-has-caption` comment on the `<video>` element — that a11y rule isn't configured in this project's ESLint setup, so the disable comment itself was flagged as unused.

## Not built (explicitly out of scope here)

Nothing deferred — this completes section 11 in full. The only remaining unbuilt features per AGENTS.md are search (page UI — the `search` action already exists), settings (profile photo), and accurate subscriber counts in search results (explicitly flagged as an opt-in scope item in section 12, not default).
