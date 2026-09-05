# Channel and Dashboard

**Status:** Done.

## What was built

**UploadThing bootstrap** (first upload feature in the project):
- `npm install uploadthing @uploadthing/react` — see "Known issue" below re: a flagged advisory.
- `app/api/uploadthing/core.ts` — `ourFileRouter` with three routes: `channelBanner` (image, 4MB), `videoThumbnail` (image, 4MB), `video` (video, 512MB), each session-gated in `.middleware()` via `auth.api.getSession`, throwing `UploadThingError("Unauthorized")` if absent. `.onUploadComplete()` returns `{ url: file.ufsUrl, userId }` — `ufsUrl`, never the deprecated `url`.
- `app/api/uploadthing/route.ts` — `createRouteHandler({ router: ourFileRouter })`.
- `lib/uploadthing.ts` — `UploadButton` via `generateUploadButton<OurFileRouter>()`.
- `next.config.ts` — `images.remotePatterns` added for `*.ufs.sh` (UploadThing's serving host).

**shadcn components added:** `dialog`, `textarea`, `skeleton`, `empty` (the latter two already existed from the loading-error-boundaries work). `components/ui/dialog.tsx`'s `DialogContent` was missing the `max-h-[calc(100svh-2rem)] overflow-y-auto` AGENTS.md section 21 requires — added it at the component level (same pattern as the earlier `button.tsx` hover-color and `dropdown-menu.tsx` cursor fixes). The shadcn `add` command's overwrite prompt for `button.tsx` was declined to preserve the existing brand-red hover fix.

**Shared components built now (formally owned by section 10, hard-required by section 9):**
- `app/(main)/components/video-card.tsx` — `VideoCard` with the full section 10 prop contract: `_id`, `title`, `thumbnailUrl`, `duration`, `createdAt`, `viewCount`, optional `channel: { _id, name, isOwner, isSubscribed }`, `horizontal` prop. Renders an inline subscribe pill (`min-w-24`) when `channel` is supplied and the viewer isn't the owner, with `preventDefault`/`stopPropagation` on its click since the card is a link. This feature doesn't pass a `channel` prop anywhere (dashboard/channel-page context), but the component is built to the full spec so section 10 reuses it as-is.
- `app/(main)/channel/[id]/actions/index.ts` — `toggleSubscription(channelId)` (section 10 item 3: session required, scoped to `subscriberUserId: session.user.id`, returns `{ isSubscribed }`) and `getChannelPageData(channelId)` (read, computes `subscriberCount`/`isOwner`/`isSubscribed`/per-video `viewCount` via aggregation).
- `app/(main)/channel/[id]/components/subscribe-button.tsx` — `SubscribeButton` (`min-w-32` pill, red/gray states, spinner while pending, hides when `isOwner`, updates label from the action's response not an optimistic flip, `router.refresh()` after toggling).

**Dashboard** (`app/(main)/dashboard/`):
- `page.tsx` — "Your Channels" heading + `CreateChannelDialog`; empty state via shadcn `Empty` when no channels; each channel is a card (banner with overlaid `EditBannerDialog` button, name linking to `/channel/[id]`, description, `UploadVideoDialog`, `VideoCard` grid with no `channel` prop).
- `actions/index.ts` — `getOwnedChannels()` (read, aggregates view counts across all owned videos in one `$group` to avoid N+1), `createChannel`, `updateChannelBanner`, `uploadVideo` (all mutations, owner-scoped via `Channel.findOne({ _id, userId: session.user.id })`).
- `validations/index.ts` — `createChannelSchema`, `editBannerSchema`, `uploadVideoSchema` (Zod v4, RHF-compatible).
- `_components/create-channel-dialog.tsx` + `create-channel-form.tsx` — name/description/banner, preview before submit, dialog closes via the `DialogClose` ref pattern.
- `_components/edit-banner-dialog.tsx` — re-upload + preview, persists only on a separate "Save Banner" click.
- `_components/upload-video-dialog.tsx` + `upload-video-form.tsx` — title/description/video/thumbnail; video upload shows filename → "Video uploaded" → "Reading video duration…" (via a hidden `<video>` element's `loadedmetadata` event) → ready, submit disabled through all non-ready stages; duration sent to the action as a plain number, not part of the Zod-validated form fields users type.
- `loading.tsx` / `error.tsx` — channel-card-shaped skeleton; `Empty` + `TvMinimalPlayIcon` + `retry()`.

**Public channel page** (`app/(main)/channel/[id]/`):
- `page.tsx` — full-width banner (not max-width constrained), name/subscriber-count/video-count/description on the left, `SubscribeButton` on the right (hidden for owner), `VideoCard` grid or empty state. Calls `notFound()` when the channel doesn't exist.
- `loading.tsx` / `error.tsx` — banner+header+grid-shaped skeleton; `Empty` + `TvIcon` + `retry()`.

## Decisions

- View counts and subscriber counts are computed via aggregation on every read (`ViewHistory` `$group` for videos, `Subscription.countDocuments` for channels) — never stored fields, per AGENTS.md section 6.
- Dialogs close via the uncontrolled `DialogClose` ref pattern (AGENTS.md section 21), not controlled `open` state.
- `app/(main)/home/page.tsx` (the temporary navbar-testing placeholder) was left untouched — not this feature's scope.

## Issues hit and fixed during implementation

- **ESLint `react-hooks/refs`**: `form.handleSubmit(onSubmit)` is called during render, and since `onSubmit` closed over a `closeRef` used to programmatically close the dialog, the rule flagged reading `ref.current` from a function reachable via a render-time call. Fixed by removing the ref read from `onSubmit` entirely — it now just increments a `closeSignal` counter state, and a separate `useEffect` (keyed on that counter) performs `closeRef.current?.click()`. Applied to both `create-channel-form.tsx` and `upload-video-form.tsx`.
- Along the way, that fix's first draft (a boolean `shouldClose` reset back to `false` inside the same effect) triggered `react-hooks/set-state-in-effect` (synchronous `setState` in an effect body) — resolved by using a monotonically increasing counter instead, so the effect never needs to reset anything.
- Removed unused `Button` imports from `create-channel-dialog.tsx` and `upload-video-dialog.tsx` — both style `DialogTrigger` directly via `className` per AGENTS.md section 21's rule against nesting a `Button` inside it.

## Known issue (dependency, not a code defect)

`npm install uploadthing @uploadthing/react` pulled in `effect@3.17.7` as a transitive dependency, which has a real high-severity advisory (`GHSA-38f7-945m-qr2g`: `AsyncLocalStorage` context contamination under concurrent RPC load, fixed in `effect@3.20.0+`). `npm audit fix`'s suggested remedy would downgrade `uploadthing` to an older major version. **User decision: proceed as-is** — the advisory's attack surface (concurrent RPC load) doesn't match how this server-only file-router code runs, and downgrading risked breaking the `ufsUrl`/`createUploadthing` API surface this integration depends on. Revisit in a future dependency-update pass once `uploadthing` itself bumps its `effect` dependency past 3.20.0.

## Not built (explicitly out of scope here)

- The real home feed content, subscriptions feed page, search page UI (section 10/12's own scope — `search` action already existed from the navbar feature).
- Watch page (`/watch/[id]`) — `VideoCard` links to it, but it doesn't exist yet (section 11), so clicking a thumbnail 404s. Expected.
- `profilePhoto` UploadThing route (section 13's own scope).

## Checks run

`npx tsc --noEmit`, `npm run lint`, `npm run build` all passed clean.
