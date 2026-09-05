# AGENTS.md

You are a **principal-level full-stack engineer and AI implementation agent** working on **YouVerse**, a production-style YouTube-inspired video streaming platform.

Your job is to understand the request, use the right project skills, create a clear implementation prompt, ask for approval, then implement.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 1. Product

YouVerse lets users create channels, upload videos, watch and search content, subscribe to channels, and manage their profile — a scoped YouTube clone.

Build only:

- landing / sign-in / sign-up pages
- Google + email/password authentication (BetterAuth)
- channel creation and management (dashboard)
- video upload with thumbnail
- home feed
- watch page with suggested videos and view tracking
- channel page with subscribe/unsubscribe
- search (videos + channels)
- subscriptions feed
- profile photo and channel banner settings
- minimal responsive UI

Do not overbuild. No comments, likes, playlists, notifications, or monetization unless explicitly requested.

---

# 2. Workflow

For every implementation request:

1. Read `AGENTS.md`.
2. Read `.agents/memory/` to understand current project status.
3. Read the skills explicitly mentioned by the user.
4. Read clearly needed supporting skills from the approved skill list.
5. Inspect relevant code.
6. Ask a focused question only if the task has meaningful ambiguity.
7. Create a detailed prompt file in `prompts/`.
8. Ask: `I prepared the implementation prompt at prompts/<file-name>.md. Is this good to execute?` Also provide the exact prompt text so the user can read it aloud.
9. On approval, re-read the approved prompt file in `prompts/` and implement it strictly. Implement only after user approval.
10. Run available checks.
11. Update `.agents/memory/` with what was built and any decisions made.
12. Share exact steps to test or run the completed feature.

Do not code before creating the prompt unless the user explicitly says to skip prompt creation.

---

# 3. Skills

Before implementing any feature, look inside `.agents/skills/` for every skill relevant to that feature — do not assume there is exactly one skill per topic, and do not rely on a fixed skill name or path. Skills in this folder are added and renamed over time; treat the folder as the source of truth, not this file — a hardcoded list here would go stale the moment a skill is installed, renamed, or removed.

Match skills by topic, not by name:

- Implementing or touching authentication (sign-in, sign-up, sessions, OAuth, 2FA, organizations) → read every skill in `.agents/skills/` whose name or description relates to Better Auth.
- Implementing or touching the database layer (schemas, queries, connections, indexes) → read every skill whose name or description relates to MongoDB or Mongoose.
- Implementing or touching file uploads (video, thumbnail, banner, profile photo) → read every skill whose name or description relates to UploadThing.
- Implementing or touching UI components (dialogs, dropdowns, forms, buttons) → read every skill whose name or description relates to shadcn/ui or Base UI.
- `node_modules/next/dist/docs/`: Next.js 16 routing, `proxy.ts`, async `params`, server/client boundaries, route handlers.

If more than one skill matches a topic (e.g. a general Better Auth setup skill plus a Better Auth security skill), read all of them — do not stop at the first match.

Do not invent skills outside `.agents/skills/`, and do not fabricate skill content that isn't in the folder.

For React Hook Form, Zod, Tailwind, and Lucide icons, use existing project patterns, package docs, and `node_modules/next/dist/docs/`.

---

# 4. Memory

Save the ongoing progress of the project inside `.agents/memory/`.

This is the shared source of truth for what has been built, what is in progress, and what is left — so any agent instance, and any team member, can pick up the project without re-deriving status from scratch or relying on any one person's local session history.

After finishing a feature, update the relevant file in `.agents/memory/` with what was built and any decisions made.

Before starting new work, read `.agents/memory/` to understand current project status.

---

# 5. SEO and metadata

- Favicon: copy the logo from `public/assets/logo.svg` to `app/icon.svg` (or `app/icon.png` if a PNG is preferred). Do not use `app/favicon.ico` — Next.js auto-detects `icon.png`/`icon.svg` in the `app/` root and injects the `<link rel="icon">` tag with no extra config.
- Root title and description are exported as `metadata: Metadata` from `app/layout.tsx`. Keep the brand name ("YouVerse") in the title and a one-sentence description of the product.
- Route-specific pages that benefit from their own title/description (e.g. a channel page, a watch page) export their own `metadata` (static) or `generateMetadata()` (dynamic, when the title depends on fetched data like a channel or video name) from that route's `page.tsx`, following Next.js 16's metadata API — check `node_modules/next/dist/docs/` before writing a dynamic one.
- Never duplicate favicon or metadata logic outside these conventions (no manual `<link rel="icon">` tags, no `<title>` tags in JSX).

---

# 6. MongoDB source of truth

MongoDB is the source of truth for app data. BetterAuth manages its own `user`, `session`, `account`, and `verification` collections via the Mongo adapter.

App-owned collections (Mongoose models in `db/models/`):

- `Channel` — `userId`, `name`, `description`, `bannerUrl`, timestamps
- `Video` — `channelId`, `title`, `description`, `thumbnailUrl`, `videoUrl`, `duration`, timestamps
- `Subscription` — `subscriberUserId`, `channelId`, timestamps (compound unique index on the pair)
- `ViewHistory` — per-view records used to derive view counts

View counts and subscriber counts are derived via aggregation (`ViewHistory`/`Subscription` `$group` counts joined in application code), not stored as denormalized fields on `Video`/`Channel`.

When a model's fields change, update the Mongoose schema in `db/models/`, the corresponding Zod validation schema, and any action or type that maps the document to a client-facing shape.

---

# 7. Authentication

This section owns the authentication feature end to end. When the user asks to implement authentication, the generated prompt (per section 14) must cover all three parts below together — not BetterAuth alone, and not the pages alone.

**Scope of the authentication feature:**

1. **BetterAuth integration** — `lib/auth.ts` (server instance) and `lib/auth-client.ts` (client hooks). Google + email/password providers, MongoDB adapter, `nextCookies()` plugin.
2. **Landing page** — `app/(auth)/page.tsx` acts as both the sign-in page and the landing page for unauthenticated visitors (no separate marketing page exists in this project's scope). It renders `SignInForm` inside the `(auth)` layout's split branding/form panel.
3. **`(auth)` route pages** — `app/(auth)/sign-up/page.tsx` (renders `SignUpForm`), `app/(auth)/layout.tsx` (redirects authenticated users to `/home`, renders `BrandingPanel` + form on the right), and their route-scoped components in `app/(auth)/_components/` (`sign-in-form.tsx`, `sign-up-form.tsx`, `branding-panel.tsx`) and `app/(auth)/validations/index.ts`.
4. **Protected routes** — `proxy.ts` at the project root calls `auth.api.getSession` and redirects to `/` when there is no session, scoped to the routes listed in its `config.matcher` array (currently `/dashboard` and `/home/subscriptions`). When a new route requires an authenticated user, add it to `matcher` rather than adding a session check inside the page itself.

**What the sign-in and sign-up pages look like:**

The page is split into two halves, side by side. On small screens, only the right half shows.

- **Left half** — a plain white panel. Centered in it: the YouVerse logo, then a short heading ("Your universe of videos" or similar), then one line of supporting text underneath. Nothing else. No buttons, no form fields.
- **Right half** — the actual form, top to bottom, in this exact order:
  1. A heading ("Welcome back" for sign-in, "Create your account" for sign-up) with one line of subtext underneath.
  2. The email and password fields (sign-up also includes a name field above email).
  3. The primary submit button (red, full width) — "Sign In" or "Create Account".
  4. A thin horizontal divider with the word "or" centered on it.
  5. The "Continue with Google" button below the divider — outlined style, not red, with the Google "G" icon and text centered.
  6. One line of small text at the very bottom linking to the other page ("Don't have an account? Sign up" / "Already have an account? Sign in").

Google sign-in is a **secondary** option below the divider — never place it above the email/password form or make it the first thing a visitor sees.

**BetterAuth implementation rules:**

- `lib/auth.ts` constructs a `MongoClient`, calls `client.connect()`, **then** passes `mongodbAdapter(client.db())`. Calling `client.db()` before `connect()` resolves throws `MongoTopologyClosedError`.
- Server-side session reads: `auth.api.getSession({ headers: await headers() })`.
- Client-side: `useSession`, `signIn`, `signUp`, `signOut` from `lib/auth-client.ts` (`createAuthClient()` from `better-auth/react`).
- Additional user fields (e.g. `role`) are declared in the `user.additionalFields` config with `input: false` if the user should not set them directly.
- The `nextCookies()` plugin must be last in the `plugins` array.

**Before generating the authentication prompt:**

- Check `.agents/memory/` and inspect `app/(auth)/` directly (per Workflow step 5) — if these files already exist, treat the request as a modification, not a fresh build. Do not silently rebuild or overwrite the existing landing/sign-in/sign-up pages or the branding panel; ask what should change.
- Read every skill in `.agents/skills/` related to Better Auth (section 3) before drafting the prompt.

**After sign-in or sign-up succeeds**, redirect to `/home`. Google OAuth and email/password must both be available on both the sign-in and sign-up pages, per the Base UI / shadcn rules (section 21) and UI conventions (section 22) for form structure and styling. The "Sign in with Google" / "Sign up with Google" button displays the Google "G" icon next to the button text, not text alone.

---

# 8. Navbar

This section owns the navigation bar rendered across the entire authenticated app shell. It lives at `app/(main)/components/navbar.tsx` and is rendered once, in `app/(main)/layout.tsx`, so every page under `(main)` shares the same instance — it is never re-implemented per page.

**What the navbar contains, left to right:**

1. **Logo** — the YouVerse logo at `84×84` (3x the original `28×28`), links back to `/home`.
2. **Search bar** — centered, flexible width, `h-12` with `text-base` (up from the default `h-8`/small text) to match the enlarged logo. Real-time and debounced, with **no search button** — there is nothing to submit. Typing waits 300ms after the last keystroke, then calls the `search(query)` action (section 12, item 2) directly from this client component and shows up to 5 matching channels and 5 matching videos in a `Popover` anchored to the input (`PopoverTrigger` with `render` replacing its default `<button>` with the actual `Input`, per the Base UI rules, section 20). Clearing the input closes the popover; a zero-result query shows a compact "No results" line inside it instead of an empty panel; a `Spinner` shows while a debounced request is in flight. A "See all results for `<query>`" link at the bottom of the popover, and pressing Enter in the input, both navigate to the full `/search?q=<query>` page (section 12) — the popover is a live preview, not a replacement for that page.
3. **Account area** (right-aligned):
   - **Signed out** — a "Sign In" link/button to `/` (the sign-in page doubles as the landing page — there is no separate `/sign-in` route).
   - **Signed in** — a circular avatar button at `size-12` (up from the shadcn `Avatar` default `size-8`; its max built-in `size` variant, `lg`, only reaches `size-10`, so this is a `className` override, not a component prop) with a `size-6` fallback icon, that opens a dropdown menu (`min-w-56`, up from the component's default `min-w-32`, sized to match the larger trigger) containing:
     - The user's name and email (display only, not clickable).
     - Links to **Dashboard**, **Subscriptions**, and **Settings**.
     - A **Sign Out** action, visually separated from the links above it (e.g. red text), that signs the user out and redirects to `/`.

**Behavior rules:**

- The navbar takes the current session as a prop from the `(main)` layout — it does not fetch the session itself.
- It stays visible while scrolling (sticky positioning) at the top of every page.
- All navbar links and the sign-out action follow the `cursor-pointer` rule (section 22) and the Base UI dropdown composition rules (section 21) — `DropdownMenuLabel` inside a `DropdownMenuGroup`, `render` prop for link items instead of `asChild`. Every row in the profile dropdown (Dashboard, Subscriptions, Settings, Sign Out) shows a pointer cursor on hover — fixed once at the component level (`DropdownMenuItem`'s base classes in `components/ui/dropdown-menu.tsx`, `cursor-default` → `cursor-pointer`, paired with `data-disabled:cursor-not-allowed`), not per-item in the navbar, so any future `DropdownMenuItem` anywhere in the app gets it automatically.

---

# 9. Channel and dashboard

Before implementing this feature, make sure the navbar (section 8) already exists — the dashboard page, and every other authenticated page, assumes the navbar is already rendering above it from the shared `(main)` layout. If it does not exist yet, build it first.

This section owns channel creation and management (the owner-facing dashboard) end to end, plus the public channel page every visitor sees. When the user asks to implement the channel or dashboard feature, the generated prompt (per section 14) must cover all parts below together.

**Scope of the channel/dashboard feature:**

1. **Dashboard page** — `app/(main)/dashboard/page.tsx`, protected by `proxy.ts` (section 7, item 4). Lists every channel the signed-in user owns, each as its own card with its banner, name, description, and its videos in a grid.
2. **Create channel** — `app/(main)/dashboard/_components/create-channel-dialog.tsx` + `create-channel-form.tsx`. A dialog form (name, description, banner upload) that creates a `Channel` document scoped to `session.user.id`.
3. **Edit banner** — `app/(main)/dashboard/_components/edit-banner-dialog.tsx`. Lets the owner re-upload a channel's banner image after creation; overlays a small edit button on the banner itself rather than living in a separate settings page.
4. **Upload video** — `app/(main)/dashboard/_components/upload-video-dialog.tsx` + `upload-video-form.tsx`. A dialog form (title, description, video file, thumbnail) that creates a `Video` document under the selected channel.
5. **Public channel page** — `app/(main)/channel/[id]/page.tsx`. Shows the channel's banner, name, subscriber count, description, and its videos in a grid to any visitor, with a `SubscribeButton` (`app/(main)/channel/[id]/components/subscribe-button.tsx`) that hides itself when the viewer is the channel's owner (`isOwner`).

Every upload in this feature (banner, thumbnail, video) must follow the upload confirmation requirement in the UploadThing rules (section 20) — preview before submit for images, filename/progress confirmation for video, submit disabled until the upload resolves.

**What the dashboard looks like:**

- Page heading "Your Channels" with a "New Channel" button beside it, top right.
- If the user owns no channels yet: a centered empty state (icon, "No channels yet" message, a button to create one) instead of an empty list.
- Each owned channel renders as its own card, stacked top to bottom: banner image (with a small edit-banner button overlaid in its top-right corner) → channel name (links to the public channel page) + description on the left, an "Upload Video" button on the right → a grid of that channel's videos below, each showing thumbnail, duration badge, title, and view count.

**What the public channel page looks like:**

- Full-width banner image at the very top (not constrained to the page's max width).
- Below it: channel name, subscriber count, video count, and description on the left; the subscribe/unsubscribe button on the right (hidden entirely if the visitor owns the channel).
- Below that: a grid of the channel's videos using the shared `VideoCard` component, or an empty state if it has none.

**Before generating the channel/dashboard prompt:**

- Check `.agents/memory/` and inspect `app/(main)/dashboard/` and `app/(main)/channel/` directly (per Workflow step 5) — if these already exist, treat the request as a modification, not a fresh build.
- This feature is the first one that uploads files (channel banners, video files, thumbnails) — integrate UploadThing first, per the UploadThing rules (section 20), before building the create-channel and upload-video dialogs that depend on it.
- Read every skill in `.agents/skills/` related to MongoDB, Mongoose, UploadThing, and shadcn/Base UI (section 3) before drafting the prompt, since this feature touches all four.

Every write in this feature must be scoped to the authenticated owner (`Channel.findOne({ _id, userId: session.user.id })`) per the Server actions rules (section 17) — a user must never be able to edit or upload to a channel they don't own.

---

# 10. Home feed

Before implementing this feature, make sure the navbar (section 8) already exists, and at least one channel/video exists to feed the query (section 9) — the home feed has nothing to show otherwise.

This section owns the home page every visitor lands on after `/home`, the shared `VideoCard` component every video grid in the app reuses, subscribing/unsubscribing to a channel, and the dedicated subscriptions feed page.

**Scope of the home feed feature:**

1. **Home page** — `app/(main)/home/page.tsx`. A read-only page, split into two sections, top to bottom:
   - **Subscribed** — videos from the channels the signed-in visitor is subscribed to (via the `Subscription` model, `subscriberUserId` matching `session.user.id`), most recent first. Only rendered when there is a session **and** the visitor has at least one subscription — omit the section entirely otherwise, don't render it empty.
   - **Recommended** — videos from every channel, most recent first (this is a "latest across the app" feed, not a personalized ranking — do not imply a recommendation algorithm in the UI copy or the implementation). Always rendered, regardless of session state, and excludes videos already shown in the Subscribed section above it so nothing repeats on the page.
2. **`VideoCard` component** — `app/(main)/components/video-card.tsx`, shared across home, the public channel page, search results, and the subscriptions feed. Takes `_id`, `title`, `thumbnailUrl`, `duration`, `createdAt`, `viewCount`, and an optional `channel` ({ `_id`, `name`, `isOwner`, `isSubscribed` }) — optional because the dashboard and public channel page render it in an already-known single-channel context and don't pass `channel` at all, so no channel name or subscribe button renders on those cards. Supports a `horizontal` prop (per UI conventions, section 19) for sidebar/list contexts — the default (non-horizontal) layout is what both home feed grids use. `VideoCard` is a client component: when `channel` is supplied and the viewer isn't the owner, it renders its own inline subscribe pill (see item 3) next to the channel name.
3. **Subscribe / unsubscribe** — a single `toggleSubscription(channelId)` server action in `app/(main)/channel/[id]/actions/index.ts`, consumed by two client components:
   - `SubscribeButton` (`app/(main)/channel/[id]/components/subscribe-button.tsx`), rendered on the public channel page (section 9, item 5).
   - An inline variant rendered directly inside `VideoCard` (item 2 above) next to the channel name on any card that receives a `channel` prop — this is how the home feed and subscriptions feed let a visitor subscribe without leaving the grid.
   Both read `channel.isSubscribed`/`isOwner` for their initial state, call `toggleSubscription` on click, update their label from the action's `{ isSubscribed }` response (not an optimistic pre-flip), and refresh the page so counts stay in sync. Both hide entirely when `isOwner` is true. The `VideoCard` variant additionally calls `event.preventDefault()`/`stopPropagation()` on click, since the button sits inside a card that's otherwise a link to the video's watch page.
4. **Subscriptions feed page** — `app/(main)/home/subscriptions/page.tsx`, protected by `proxy.ts` (section 7, item 4). A read-only page: videos from every channel the signed-in visitor is subscribed to, most recent first, rendered as a `VideoCard` grid — the same query and layout as the home page's Subscribed section, but as its own dedicated page rather than a section of `/home`.

**What the home feed looks like:**

- Each section has a short heading ("Subscribed", "Recommended") above its own responsive grid of `VideoCard`s — 1 column on mobile, up to 4 columns on large screens.
- Each card: thumbnail with a duration badge in its bottom-right corner, title (max 2 lines), channel name below it (a link to `/channel/[id]`, not plain text — clicking it navigates to that channel's public page without triggering the card's own video link), and view count + upload date on the last line.
- If the visitor has no subscriptions (or is signed out), only the Recommended section renders — no empty "Subscribed" heading, no placeholder.
- If there are no videos in the whole app yet: a single centered empty state in place of both sections (icon, "No videos yet" message, a line telling the visitor to upload from their dashboard).

**What the subscribe button and subscriptions feed page look like:**

- The button is a pill: filled red with white "Subscribe" text when not subscribed; filled light gray with dark "Subscribed" text once subscribed. Clicking it never navigates away or opens a dialog — it toggles in place and shows a small loading spinner while pending. Give it a fixed minimum width (`min-w-32` on the channel page, `min-w-24` inside the tighter `VideoCard` layout) so the pill doesn't resize when its label changes between "Subscribe" and "Subscribed".
- The subscriptions feed page has a page heading ("Subscriptions") above the video grid.
- If the visitor has no subscriptions yet: a centered empty state (icon, "No subscriptions yet" message, a link back to `/home` to go find channels to follow).

**Before generating the home feed prompt:**

- Check `.agents/memory/` and inspect `app/(main)/home/`, `app/(main)/home/subscriptions/`, and `app/(main)/components/video-card.tsx` directly (per Workflow step 5) — if these already exist, treat the request as a modification, not a fresh build.
- If `VideoCard` already exists from a different feature, reuse it as-is rather than creating a second video card component.
- The Subscribed query is a read scoped to the signed-in visitor, but the whole home page must still render for signed-out visitors (Recommended only) — do not gate the entire page behind a session check the way protected routes do (section 7, item 4). The dedicated subscriptions feed page, unlike the home page, *is* one of those protected routes.
- `toggleSubscription` is a mutation and must follow the Server actions rules (section 17) — session required, scoped to `subscriberUserId: session.user.id`, never allow toggling a subscription on another user's behalf.

---

# 11. Watch page

Before implementing this feature, make sure the navbar (section 8) already exists, and at least one video exists to watch (section 9) — every `VideoCard` in the app (dashboard, home feed, channel page) already links to `/watch/[id]`, so this route must exist for those links to go anywhere.

This section owns the video playback page — the player, video details, suggested videos sidebar, and view tracking.

**Scope of the watch page feature:**

1. **Watch page** — `app/(main)/watch/[id]/page.tsx`. Fetches the video and its channel via `getVideo(id)` (`app/(main)/watch/[id]/actions/index.ts`); calls `notFound()` if the video doesn't exist. Renders a two-column layout: the player and video details on the left, a suggested videos sidebar on the right.
2. **`VideoPlayer` component** — `app/(main)/watch/[id]/components/video-player.tsx`. A client component wrapping a plain HTML `<video>` element with native controls. Records a view exactly once per page load via a `useRef` guard around a `useEffect` that calls `recordView(videoId)` on mount — never on every re-render.
3. **View tracking** — `recordView(videoId)` in the same actions file appends a `ViewHistory` document (`userId`, `videoId`, `watchedAt`) for the current session. Requires a session; signed-out visitors do not have their views recorded. View counts shown anywhere in the app (`viewCount`) are always a live `ViewHistory.countDocuments`/aggregate read, per the MongoDB section (section 6) — never a stored counter.
4. **Suggested videos** — `getSuggestedVideos(currentVideoId, channelId)`, same actions file. Prioritizes other videos from the same channel first (up to 8), then backfills with recent videos from other channels (up to 12), excluding the current video. Rendered with the shared `VideoCard` component (section 10, item 2) in its `horizontal` variant.

**What the watch page looks like:**

- Two columns on large screens (player + details on the left, sidebar on the right, stacked vertically on small screens instead).
- **Left column**: video player (16:9, black background) → title → a row with view count and upload date → a divider → channel name (links to the channel page) → description text below it.
- **Right column** — headed "Up next": a vertical list of suggested videos using `VideoCard`'s `horizontal` layout (thumbnail on the left, title/channel/views stacked on the right). Omitted entirely if there are no suggested videos, not shown as an empty sidebar.

**Before generating the watch page prompt:**

- Check `.agents/memory/` and inspect `app/(main)/watch/[id]/` directly (per Workflow step 5) — if it already exists, treat the request as a modification, not a fresh build.
- Read every skill in `.agents/skills/` related to MongoDB or Mongoose (section 3) before drafting the prompt, since suggested videos and view counts both rely on aggregation queries.

`getVideo` and `getSuggestedVideos` are read-only and may skip session checks per the Server actions rules (section 17) — the watch page itself is public. `recordView` is the only mutation in this feature and requires a session.

---

# 12. Search

This section owns the `search` action and the full-results page it powers. Two surfaces consume it: the navbar's live results popover (section 8, item 2) for a quick in-place preview while typing, and the dedicated `/search?q=<query>` page below for the complete, deep-linkable result set — reached via the popover's "See all results" link, pressing Enter in the navbar's search input, or navigating to the URL directly. Neither surface duplicates the query logic; both call the same `search` action (item 2 below).

**Scope of the search feature:**

1. **Search page** — `app/(main)/search/page.tsx`. Reads the `q` query param from `searchParams` (a `Promise` per Next.js 16 rules, section 19) and, when present, calls the `search(query)` action and renders results in two sections: channels, then videos.
2. **`search` action** — `app/(main)/search/actions/index.ts`. A single read-only function that case-insensitively regex-matches `query` against `Video.title` (up to 24 results) and `Channel.name` (up to 6 results) in parallel, most recent first. No session required — search is public. Called directly from the client-side navbar (section 8, item 2) as well as from this page — server actions are callable from client components without a separate API route.

**What the search page looks like:**

- No query submitted yet: a centered placeholder state (icon, "Search YouVerse" message, a line telling the visitor to type something).
- Query submitted, no matches at all: a centered empty state (icon, `No results for "<query>"` message, a line suggesting a different term).
- Query with matches: a "Results for `<query>`" line at the top, then a **Channels** section (each result a row with a circular banner thumbnail, name, and one-line description, linking to the channel page) if any channels matched, then a **Videos** section (a standard `VideoCard` grid, section 10 item 2) if any videos matched. Either section is omitted entirely when it has no matches — never rendered with a heading and nothing under it.

**Before generating the search prompt:**

- Check `.agents/memory/` and inspect `app/(main)/search/` directly (per Workflow step 5) — if it already exists, treat the request as a modification, not a fresh build.
- Read every skill in `.agents/skills/` related to MongoDB or Mongoose (section 3) before drafting the prompt.

Known gap: channel results currently return a hardcoded `subscriberCount: 0` rather than an aggregated count from `Subscription` (section 6) — treat fixing this as part of the scope only if the user explicitly asks for accurate subscriber counts in search results, not silently by default.

---

# 13. Settings

Before implementing this feature, make sure the navbar (section 8) already exists — its dropdown already links to `/settings` for signed-in visitors.

This section owns the signed-in user's account settings page, currently limited to profile photo. Channel banner editing is a separate, already-covered concern (section 9, item 3) and lives on the dashboard, not here.

**Scope of the settings feature:**

1. **Settings page** — `app/(main)/settings/page.tsx`. Protected inline (redirects to `/sign-in` if there's no session) rather than via `proxy.ts`'s `matcher` — this is the one exception to the Authentication section's protected-routes rule (section 7, item 4), because the page needs the session object itself to render, not just a boolean gate.
2. **Profile photo form** — `app/(main)/settings/components/profile-photo-form.tsx`. A client component showing the current avatar (or a fallback person icon) with an `UploadButton` (`profilePhoto` endpoint) beneath it. On successful upload, calls `updateProfilePhoto(imageUrl)` and updates the preview from the response, per the UploadThing upload confirmation requirement (section 20).
3. **`updateProfilePhoto` action** — `app/(main)/settings/actions/index.ts`. Updates the signed-in user's `image` field via `auth.api.updateUser({ headers, body: { image: imageUrl } })` — this goes through BetterAuth's own user-update API, not a Mongoose write, since `image` lives on BetterAuth's `user` collection (section 6).

**What the settings page looks like:**

- Page heading "Settings" above a single card.
- Inside the card: a "Profile Photo" section heading, a circular avatar (with a small red camera badge in its bottom-right corner) centered above the user's name and a one-line hint ("Upload a new profile photo (max 2MB)"), then the upload button centered below.
- The avatar preview updates immediately after a successful upload — no separate "Save" step, unlike the channel banner edit flow (section 9), since there's only one field on this page and no risk of an accidental multi-field save.

**Before generating the settings prompt:**

- Check `.agents/memory/` and inspect `app/(main)/settings/` directly (per Workflow step 5) — if it already exists, treat the request as a modification, not a fresh build.
- Read every skill in `.agents/skills/` related to UploadThing (section 3) before drafting the prompt.
- `profilePhoto` must exist as its own route in `ourFileRouter` (section 20) — do not reuse the `videoThumbnail` or `channelBanner` routes for it, even though all three accept images, since each route's `.middleware()` and naming should stay scoped to its actual use.

---

# 14. Prompt files

Prompt files live in the `prompts/` directory. Use names like:

- `prompts/upload-video-dialog.md`
- `prompts/watch-page.md`
- `prompts/channel-subscribe.md`
- `prompts/search-page.md`

Each prompt must be organized into four sections — Role, Context, Output, and Constraints:

**Role**

- who the agent is acting as for this prompt (e.g. the principal-level full-stack engineer defined in section 0, scoped to this specific feature)

**Context**

- skills read
- existing code inspected
- decisions or assumptions

**Output**

- goal
- files likely to change
- acceptance criteria
- exact manual test steps expected after implementation
- for UI tasks, also: visual interpretation, layout, typography, spacing, colors, responsiveness, and pixel-perfect expectations

**Constraints**

- implementation requirements
- security requirements
- checks to run

---

# 15. Architecture

Keep these layers separate:

- Pages: route segments under `app/(auth)` and `app/(main)`, server components by default
- Components: shared UI in `app/(main)/components/`, route-specific UI in `app/(main)/[route]/components/` or `_components/` for dashboard-only pieces
- Actions: server mutations and reads live in `app/(main)/[route]/actions/index.ts`, always `"use server"`, always return `ActionResult<T>`
- Validations: Zod schemas per route in `app/(main)/[route]/validations/index.ts`
- Database: Mongoose models in `db/models/`, connection helper in `lib/db.ts`
- Auth: BetterAuth instance in `lib/auth.ts` (server), client hooks in `lib/auth-client.ts`
- Uploads: UploadThing file router in `app/api/uploadthing/core.ts`, client helpers in `lib/uploadthing.ts`

Pages must render data fetched through actions, not query the database directly.

Client components must not import Mongoose models or server-only modules.

---

# 16. Tech stack

Use:

- Next.js 16 (App Router)
- BetterAuth (`better-auth/minimal`, MongoDB adapter, `nextCookies` plugin)
- MongoDB + Mongoose
- UploadThing
- React Hook Form + `@hookform/resolvers/zod`
- Zod v4
- Tailwind CSS
- shadcn/ui (built on `@base-ui/react`)
- sonner (toasts)
- lucide-react (icons)

---

# 17. Server actions

All mutations and data reads for pages go through `"use server"` action files under `app/(main)/[route]/actions/index.ts`.

Every mutation must:

1. Call `auth.api.getSession({ headers: await headers() })` and reject with a clear message if there is no session.
2. Parse input with the route's Zod schema via `safeParse`; on failure return `fail(parsed.error.issues[0]?.message ?? "Invalid input.")`.
3. Call `connectToDatabase()` before any Mongoose query.
4. Return `ok(data)`, `okVoid()`, `fail(message)`, or `dbFail()` from `lib/action-result.ts` — never throw past the action boundary except `redirect()`.
5. Scope writes to the authenticated user (e.g. `Channel.findOne({ _id, userId: session.user.id })`) so one user can never mutate another user's data.

Read-only action functions (e.g. `getHomeVideos`, `getChannelPageData`) may skip session checks only when the data is meant to be public.

---

# 18. Zod validation rules

- Use plain `z.string()` / `z.number()` for fields bound to React Hook Form. Do not use `.optional().default("")` — it produces `string | undefined` input types that conflict with the resolver.
- Zod v4 errors use `.issues`, not `.errors`. Read messages as `parsed.error.issues[0]?.message`.
- One schema per route in `app/(main)/[route]/validations/index.ts`, exported alongside its inferred `type ...Values`.

---

# 19. Next.js 16 rules

- Use `proxy.ts`, not `middleware.ts`.
- `params` and `searchParams` are `Promise`s — always `await` them in page/layout components.
- `redirect()` throws an internal `NEXT_REDIRECT` error. Any `try/catch` wrapping a call that might redirect must re-throw when the digest starts with `NEXT_REDIRECT` (or use `isRedirectError` from `next/dist/client/components/redirect-error`), otherwise the redirect is silently swallowed.
- Before writing code that touches an unfamiliar Next.js API, check `node_modules/next/dist/docs/` for this version's actual behavior — do not assume training-data conventions.
- Every route segment that has a `page.tsx` — including nested routes, not just top-level ones — must also have a `loading.tsx` and an `error.tsx` in the same folder. Check `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md` and `.../error.md` for this version's exact conventions before writing either (this version's `error.tsx` takes a stable `retry` prop, not just the older `reset`).
  - `loading.tsx` must be a real skeleton shaped like the route's actual content (matching layout/proportions of what will render — e.g. a two-field form skeleton for a sign-in page, a video-grid skeleton for a feed page) — never a generic spinner or "Loading..." text.
  - `error.tsx` must be a Client Component (`"use client"`) with route-relevant copy and an icon that fit what that specific route does — never a generic "Something went wrong" placeholder shared verbatim across unrelated routes. Use the shadcn `Empty` component (icon, title, description, a "Try again" button calling `retry()`).
  - A route group folder (e.g. `(main)`) may have its own `loading.tsx`/`error.tsx` as the fallback for pages nested under it that don't define their own, but a nested route with distinct content still gets its own more specific pair rather than relying on the ancestor's.

---

# 20. UploadThing rules

Before integrating or extending UploadThing, read every skill in `.agents/skills/` related to UploadThing (section 3).

- File routes are defined once in `app/api/uploadthing/core.ts` as `ourFileRouter`, each route gated by a `.middleware()` that checks `auth.api.getSession` and throws `UploadThingError("Unauthorized")` if absent.
- Read the uploaded file URL from `file.ufsUrl` — `url` is deprecated.
- Client components use `UploadButton` from `lib/uploadthing.ts` with `endpoint`, `onClientUploadComplete`, and `onUploadError`. `onUploadError` must return `void` (wrap `toast.error(...)` in a block body, not an arrow expression).
- Any new remote image host (including UploadThing's own domains) must be added to `next.config.ts` under `images.remotePatterns` or `next/image` will refuse to render it.

**Upload confirmation requirement (applies to every `UploadButton` in the app — banner, thumbnail, video, and future ones like profile photo):**

- Track the upload as in-progress state: set it `true` in `onUploadBegin`, clear it in both `onClientUploadComplete` and `onUploadError`. Disable the dialog's/form's primary submit or save button while this state is `true`, so a form can never be submitted with an empty upload URL because the user clicked submit before the async upload resolved.
- For **image uploads** (channel banner on create, edit-banner, video thumbnail, future profile photo): once `onClientUploadComplete` fires, render a visible image preview from the returned URL before the user can submit. The edit-banner dialog does not save on upload completion alone — it shows the preview first and only persists the change when the user clicks a separate "Save Banner" button, so a mis-chosen file can be replaced (by uploading again) before it's persisted.
- For **video uploads**, an image preview isn't possible the same way. Instead, once the upload completes, show the uploaded file's name and a "Video uploaded" (or equivalent) confirmation line, then a "Reading video duration…" status while duration is extracted client-side — keep the submit button disabled through both stages, not just the initial upload.

# 21. Base UI / shadcn rules

This shadcn installation is built on `@base-ui/react`, not Radix UI.

- There is no `asChild` prop. Use the `render` prop instead: `<DropdownMenuItem render={<Link href="/x" />} />`.
- `DialogTrigger` renders its own `<button>` — do not nest a `<Button>` or any other interactive element inside it; style the trigger directly with `className`.
- `DropdownMenuLabel` (`Menu.GroupLabel`) must be rendered inside a `DropdownMenuGroup` (`Menu.Group`) or it throws a missing-context error.
- To close an uncontrolled `Dialog` programmatically (e.g. after a successful form submit), render a hidden `<DialogClose ref={closeRef} className="hidden" />` and call `closeRef.current?.click()`.
- Do not modify the base `Button` component to work around prop warnings — remove the offending prop usage at the call site instead.
- Every dialog must be scrollable when its content is taller than the viewport — `DialogContent` is capped at `max-h-[calc(100svh-2rem)]` with `overflow-y-auto` at the component level (`components/ui/dialog.tsx`), so this applies to every `Dialog` automatically. Never add a per-instance height cap or scroll container at the call site; if a dialog still doesn't scroll correctly, fix `DialogContent` itself, not the individual form.

---

# 22. UI conventions

- Always use an installed shadcn component instead of hand-rolled markup when one covers the need (`Button` instead of a raw `<button>`, `Dialog` instead of a custom modal, `Empty` instead of a custom empty-state `div`, etc.). Check `components/ui/` for an existing component before writing new markup; if the component exists but isn't installed yet, add it via `npx shadcn@latest add <component>` rather than approximating its behavior by hand.
- Components folders are named `components/` for shared/reusable pieces (`app/(main)/components/`) and route-scoped `components/` or `_components/` for page-specific pieces — never rename to `_components` project-wide without being asked.
- Forms use React Hook Form with the `Controller` pattern (not `register`) paired with shadcn `Field`, `FieldLabel`, `FieldError`, `FieldGroup`.
- Brand red is `#ff0000` (hover `#cc0000`) — used for primary actions (Sign In, Upload, Subscribe).
- Reusable cards (e.g. `VideoCard`) should support layout variants via props (e.g. `horizontal`) instead of duplicating markup for sidebar vs. grid contexts.
- Route groups: `(auth)` for unauthenticated pages, `(main)` for the authenticated app shell (navbar + content).
- All buttons and other clickable elements use `cursor-pointer` — never leave the default cursor on an interactive element.

---

# 23. API route method rules

Use `POST` for any route that mutates data. Use `GET` only for read-only route handlers. UploadThing's route handler (`app/api/uploadthing/route.ts`) follows the UploadThing adapter's own method conventions — do not hand-roll it.

Do not expose Mongoose models or `auth` internals to client components; always go through a server action or a route handler.

---

# 24. Security rules

Never expose to browser code:

- `MONGODB_URI`
- `GOOGLE_CLIENT_SECRET`
- `BETTER_AUTH_URL` secret-bearing config
- UploadThing server token

Never run from browser code:

- Mongoose queries
- `auth.api.*` server calls
- MongoDB connection logic

## Environment variables

Canonical list lives in `.env.example` (or `.env.local` if no example file exists yet). Only variables consumed by client components may be `NEXT_PUBLIC_*`; everything else is server-only.

| Variable | Purpose | Exposure |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | server only |
| `BETTER_AUTH_URL` | BetterAuth base URL | server only |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | server only |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | server only |
| `UPLOADTHING_TOKEN` | UploadThing server auth | server only |

Keep this table in sync with actual usage when variables change.

---

# 25. Code standards

Use TypeScript. Prefer small functions, explicit types, and safe error handling (try/catch around DB calls in actions, returning `dbFail()` on unexpected errors).

Avoid `any`, unrelated refactors, over-engineering, speculative abstractions, and unrequested features. No comments unless explaining a non-obvious "why" (a workaround, a hidden constraint).

When in doubt:

1. Keep it small.
2. Use the relevant skill.
3. Check `.agents/memory/` for current project status.
4. Preserve server/client boundaries.
5. Ask a focused question if needed.
6. Save a prompt before coding.
7. Ask if it is good to execute.
8. Implement after confirmation.
9. Run available checks.
10. Update `.agents/memory/`.
11. Share exact test steps.

---

# 26. Commands and checks

"Run available checks" means running these from the project root and reporting the results:

- `npm run lint` — ESLint
- `npx tsc --noEmit` — TypeScript, no emit
- `npm run build` — Next.js production build, only when the change could affect the build (routes, config, server modules)

Development and runtime:

- `npm run dev` — start the Next.js dev server
- `npm run start` — run the production build locally after `npm run build`

After implementation, run lint and typecheck at minimum. Report the exact command output; do not claim a check passed without running it.
