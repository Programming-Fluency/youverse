# Channel and Dashboard

## Role

The principal-level full-stack engineer defined in AGENTS.md, scoped to implementing the channel/dashboard feature end to end as owned by AGENTS.md section 9, plus its two hard cross-references into section 10 (the shared `VideoCard` component and the `toggleSubscription` action + `SubscribeButton`) that section 9 requires but doesn't itself own.

## Context

**Skills read:**
- `.agents/skills/uploadthing-nextjs/SKILL.md` — file router shape (`channelBanner`, `videoThumbnail`, `video` routes), `lib/uploadthing.ts` client helper, `ufsUrl` (not `url`), the upload-confirmation state machine (in-progress boolean, image preview before submit, video's two-stage "uploaded → reading duration" flow), `next.config.ts` `remotePatterns` requirement.
- `.agents/skills/mongoose-nextjs/SKILL.md` — actions call `connectToDatabase()` before querying, `.lean()` + explicit `_id`/`ObjectId` → string mapping, models never imported into client components.
- `.agents/skills/react-hook-form/SKILL.md` — `Controller` pattern, `Field`/`FieldLabel`/`FieldError`/`FieldGroup`, upload URL set into the form via `form.setValue(..., { shouldValidate: true })` rather than a `Controller`-wrapped file input.
- `.agents/skills/zod/SKILL.md` — RHF-compatible schema shapes (no `.optional().default()`), `.issues` not `.errors`.
- Not read: Better Auth skills (this feature doesn't touch `lib/auth.ts` itself, only reads `session` via `auth.api.getSession`), `migrate-radix-to-base` (nothing to migrate), the other generic MongoDB vendor skills (no query optimization/search/streaming involved).

**Existing code inspected:**
- No `app/(main)/dashboard/` or `app/(main)/channel/` exists yet — fresh build, not a modification.
- `app/(main)/layout.tsx` and `app/(main)/components/navbar.tsx` already exist (navbar feature) — this feature's pages render under that shell automatically.
- `app/(main)/home/page.tsx` is a **temporary placeholder** (created to test the navbar) — untouched by this feature; the real home feed is section 10's separate scope.
- `db/models/Channel.ts` (`userId`, `name`, `description`, `bannerUrl`, timestamps), `db/models/Video.ts` (`channelId`, `title`, `description`, `thumbnailUrl`, `videoUrl`, `duration`, timestamps), `db/models/Subscription.ts` (`subscriberUserId`, `channelId`, compound unique index), `db/models/ViewHistory.ts` (`userId`, `videoId`, `watchedAt`) all already exist with the exact fields this feature needs.
- `lib/db.ts` (`connectToDatabase`), `lib/action-result.ts` (`ok`/`okVoid`/`fail`/`dbFail`), `lib/auth.ts`/`lib/auth-client.ts` all already exist.
- `components/ui/`: `button`, `input`, `field`, `label`, `card`, `separator`, `sonner`, `spinner`, `avatar`, `dropdown-menu`, `popover`, `skeleton`, `empty` installed. **Not installed**: `dialog`, `textarea` — both needed by this feature (3 dialogs, description fields).
- `uploadthing` is **not installed** — confirmed via `package.json`; this is the first feature that uploads files, per section 9's own note to integrate UploadThing first.
- `next.config.ts` has no `images.remotePatterns` yet — needed once a banner/thumbnail URL renders via `next/image`.
- `.env` already has `UPLOADTHING_TOKEN` — confirmed present.
- `.agents/memory/` has `authentication.md`, `database-layer.md`, `loading-error-boundaries.md`, `metadata-favicon.md`, `navbar.md` — no prior channel/dashboard/video-card/subscription work recorded.
- AGENTS.md section 19's standing rule (added this session) requires every route segment with a `page.tsx` to also have `loading.tsx` and `error.tsx`, route-relevant, checked against `node_modules/next/dist/docs/`. This applies to `/dashboard` and `/channel/[id]`, both new in this feature.

**Decisions / assumptions (confirmed with the user):**
- **`VideoCard` and `toggleSubscription`/`SubscribeButton` are built now**, even though section 10 formally owns them — section 9 explicitly requires the public channel page to render videos "using the shared `VideoCard` component" and to have a working subscribe button, and section 10 itself describes `VideoCard`'s optional `channel` prop specifically anticipating the dashboard/channel-page's single-channel usage (no `channel` prop passed). User confirmed: build both now, matching section 10's exact prop contract, so section 10's later implementation reuses these files as-is rather than rebuilding them.
- **Not built in this prompt**: the home page's actual feed content, the subscriptions feed page, the search page UI (search action already exists from the navbar feature) — those remain section 10/12's own scope. `VideoCard`'s `horizontal` prop is implemented per spec (since it's part of the component's contract) even though nothing in this feature uses `horizontal={true}` yet — the watch page (section 11) will.
- **View counts and subscriber counts are computed via aggregation**, not stored fields, per section 6: `viewCount` per video via `ViewHistory.countDocuments({ videoId })` (or a single `$group` aggregate when listing multiple videos, to avoid N+1 queries), subscriber count via `Subscription.countDocuments({ channelId })`. Every action that returns videos/channels computes these inline before returning.
- **UploadThing file router** (`app/api/uploadthing/core.ts`): three routes — `channelBanner` (image, 4MB, 1 file), `videoThumbnail` (image, 4MB, 1 file), `video` (video, 512MB, 1 file) — per the skill's exact shape, each gated by `auth.api.getSession` in `.middleware()`. `profilePhoto` (section 13) is explicitly not added here.
- **Video duration**: read client-side via a hidden `<video>` element's `loadedmetadata` event against the uploaded `videoUrl`, per the UploadThing skill's suggested approach and section 20's "Reading video duration…" status requirement. The extracted duration (seconds) is sent to the `uploadVideo` action as a plain number alongside the form fields — not part of the Zod-validated form schema itself (it's derived, not user-typed), consistent with the zod skill's note that no numeric form inputs exist in this app's scope.
- **Dialog open/close**: per AGENTS.md section 21, each dialog closes programmatically after a successful submit via a hidden `<DialogClose ref={closeRef} className="hidden" />` + `closeRef.current?.click()` (uncontrolled dialog pattern) rather than controlled `open` state, since nothing in this feature needs the dialog's open state read elsewhere.
- **Page refresh after mutations**: create-channel, edit-banner, upload-video, and toggle-subscription all call `router.refresh()` (or rely on the dialog closing plus the page being a server component that re-fetches) after a successful action, so the dashboard/channel page reflects the new data without a full reload.
- **`app/(main)/home/page.tsx` (the temporary placeholder) is left untouched** — not part of this feature's scope, and not the real home feed.
- **New `loading.tsx`/`error.tsx`**: `/dashboard` and `/channel/[id]` each get their own, per the standing rule in AGENTS.md section 19 — dashboard's loading state is a channel-card skeleton (banner + text + video-grid shape), channel page's is a banner + header + video-grid shape; both error states use the shadcn `Empty` component with route-relevant copy (not generic).

## Output

**Goal:** Owner-facing dashboard (create channels, upload videos, edit banners) and the public channel page every visitor sees, backed by UploadThing (first upload feature) and Mongoose, with the shared `VideoCard` component and subscribe/unsubscribe action that section 9 depends on.

**Files likely to change / create:**
- `package.json` — add `uploadthing`, `@uploadthing/react`.
- `next.config.ts` — add `images.remotePatterns` for UploadThing's `*.ufs.sh` host.
- `app/api/uploadthing/core.ts` — new: `ourFileRouter` (`channelBanner`, `videoThumbnail`, `video`), `OurFileRouter` type.
- `app/api/uploadthing/route.ts` — new: `createRouteHandler({ router: ourFileRouter })`.
- `lib/uploadthing.ts` — new: `UploadButton` via `generateUploadButton<OurFileRouter>()`.
- `components/ui/dialog.tsx`, `components/ui/textarea.tsx` — new, via `npx shadcn@latest add dialog textarea`.
- `app/(main)/dashboard/page.tsx` — new: lists owned channels + their videos, protected by `proxy.ts` matcher (already includes `/dashboard`).
- `app/(main)/dashboard/loading.tsx`, `error.tsx` — new.
- `app/(main)/dashboard/actions/index.ts` — new: `getOwnedChannels()` (read), `createChannel(input)`, `updateChannelBanner(channelId, bannerUrl)`, `uploadVideo(input)` (all mutations, session-scoped).
- `app/(main)/dashboard/validations/index.ts` — new: `createChannelSchema`/`CreateChannelValues`, `uploadVideoSchema`/`UploadVideoValues`.
- `app/(main)/dashboard/_components/create-channel-dialog.tsx`, `create-channel-form.tsx` — new.
- `app/(main)/dashboard/_components/edit-banner-dialog.tsx` — new.
- `app/(main)/dashboard/_components/upload-video-dialog.tsx`, `upload-video-form.tsx` — new.
- `app/(main)/channel/[id]/page.tsx` — new: public channel page.
- `app/(main)/channel/[id]/loading.tsx`, `error.tsx` — new.
- `app/(main)/channel/[id]/actions/index.ts` — new: `getChannelPageData(channelId)` (read), `toggleSubscription(channelId)` (mutation, section 10 item 3).
- `app/(main)/channel/[id]/components/subscribe-button.tsx` — new (section 10 item 3, consumed by section 9 item 5).
- `app/(main)/components/video-card.tsx` — new (section 10 item 2, consumed by this feature's dashboard and channel page without a `channel` prop).

**Acceptance criteria:**
- UploadThing installed and wired: `channelBanner`/`videoThumbnail`/`video` routes each require a session in `.middleware()`; `ufsUrl` used everywhere (never `url`); `next.config.ts` allows the UploadThing host.
- Every `UploadButton` follows the upload-confirmation requirement: in-progress state disables the dialog's submit button; image uploads (banner, thumbnail) show a preview before submit; video upload shows filename/"Video uploaded" then "Reading video duration…", submit disabled through both stages.
- Dashboard: "Your Channels" heading + "New Channel" button top right; empty state (icon, "No channels yet", create button) when the user owns none; each channel is its own card (banner with an overlaid edit-banner button in its top-right corner, name linking to `/channel/[id]`, description, "Upload Video" button, video grid below using `VideoCard` with no `channel` prop — thumbnail, duration badge, title, view count).
- Create-channel dialog: name, description, banner upload (preview before submit); creates a `Channel` scoped to `session.user.id`.
- Edit-banner dialog: re-uploads a banner; shows a preview and only persists on a separate "Save Banner" click, not on upload completion alone.
- Upload-video dialog: title, description, video file, thumbnail; creates a `Video` under the selected channel; duration read client-side and stored.
- Public channel page: full-width banner (not max-width constrained); name, subscriber count (aggregated), video count, description on the left; `SubscribeButton` on the right, hidden entirely when the viewer owns the channel; video grid below using `VideoCard` (no `channel` prop) or an empty state.
- `VideoCard` matches section 10 item 2's exact prop contract (`_id`, `title`, `thumbnailUrl`, `duration`, `createdAt`, `viewCount`, optional `channel: { _id, name, isOwner, isSubscribed }`, `horizontal` prop) and renders its own inline subscribe pill when `channel` is supplied and the viewer isn't the owner — even though nothing in this prompt passes a `channel` prop yet.
- `toggleSubscription(channelId)`: session required, scoped to `subscriberUserId: session.user.id`, returns `{ isSubscribed }`; `SubscribeButton` reads initial state from `isSubscribed`/`isOwner`, updates its label from the action's response (not an optimistic pre-flip), hides when `isOwner`, shows a small spinner while pending, refreshes the page after toggling. Pill styling and `min-w-32` per section 10's exact spec.
- Every write scoped to the authenticated owner (`Channel.findOne({ _id, userId: session.user.id })` pattern) — no cross-user mutation possible.
- `/dashboard` and `/channel/[id]` each have their own `loading.tsx` (route-relevant skeleton) and `error.tsx` (route-relevant `Empty` + `retry()`), per AGENTS.md section 19's standing rule.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass.

**Manual test steps after implementation:**
1. Run `npm run dev`, sign in.
2. Visit `/dashboard` — confirm the empty state (no channels yet) with a working "New Channel" button.
3. Create a channel: fill name/description, upload a banner image, confirm a preview appears before the dialog's submit button is enabled, submit, confirm the dialog closes and the new channel card appears with its banner.
4. Click the edit-banner button on the card's banner, upload a different image, confirm a preview appears, confirm the banner does NOT change until "Save Banner" is clicked, then confirm it does.
5. Click "Upload Video" on the channel card: fill title/description, upload a video file, confirm "Video uploaded" then "Reading video duration…" appear in sequence with submit disabled throughout, upload a thumbnail (with preview), submit, confirm the new video appears in the channel's grid with a duration badge and view count of 0.
6. Click the channel name to visit `/channel/[id]` — confirm the full-width banner, name/subscriber count/video count/description, and the video grid. Confirm the `SubscribeButton` is hidden (you're the owner).
7. Sign in as a different user (or sign out and view the channel while signed out) — confirm the `SubscribeButton` now shows "Subscribe", click it, confirm it flips to "Subscribed" (light gray) and the subscriber count updates on refresh.
8. Watch a video's page directly isn't built yet (section 11) — clicking a `VideoCard`'s thumbnail will 404; this is expected.
9. Confirm `/dashboard` and `/channel/[id]` both show a relevant skeleton on slow network (throttle in devtools) and a relevant error state if you temporarily break the DB connection string.

## Constraints

- Follow AGENTS.md section 9 exactly for scope, layout, and the owner-scoping rule on every write.
- Follow section 10, items 2 and 3, exactly for `VideoCard`'s prop contract and `toggleSubscription`/`SubscribeButton`'s behavior — these files must be reusable as-is when section 10 is implemented later, not a simplified stand-in.
- Follow section 6 for derived counts (no stored `viewCount`/`subscriberCount` fields).
- Follow the UploadThing skill's exact file-router shape and upload-confirmation state machine.
- Follow section 21 (Base UI): no `asChild`; `render` prop where needed; `DialogClose` ref pattern for programmatic close; never add a per-dialog height/scroll override (the installed `DialogContent` already handles this).
- Follow section 17 for every action: session check, `safeParse` with the route's Zod schema, `connectToDatabase()` before querying, `ok`/`fail`/`dbFail` returns, owner-scoped writes.
- Follow AGENTS.md section 19's new standing rule: `loading.tsx`/`error.tsx` for both new routes, route-relevant, checked against `node_modules/next/dist/docs/` conventions (`retry` prop, not just `reset`).
- No comments in code unless explaining a non-obvious "why" (AGENTS.md section 25).
- Checks to run after implementation: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
