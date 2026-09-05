# Settings

## Role

The principal-level full-stack engineer defined in AGENTS.md, scoped to implementing the settings feature end to end as owned by AGENTS.md section 13 — the settings page, profile photo form, and `updateProfilePhoto` action, plus the `profilePhoto` UploadThing route it depends on.

## Context

**Skills read:**
- `.agents/skills/uploadthing-nextjs/SKILL.md` — per section 13's explicit instruction to read every UploadThing-related skill before drafting. Confirms the skill already anticipated this exact feature: `profilePhoto` as its own named route (not a reuse of `channelBanner`/`videoThumbnail`), session-gated in `.middleware()`, `ufsUrl` (never `url`), and the image-upload confirmation UX (visible preview before/on completion — though this page's spec explicitly differs from the banner dialog's "preview then separate save" flow, see Decisions below).
- Not read: React Hook Form / Zod (no form validation needed — the photo upload has no text fields, just an upload button and a resulting URL passed directly to the action), Better Auth skills (this feature only calls the already-configured `auth.api.updateUser`, it doesn't reconfigure `lib/auth.ts` itself).

**Existing code inspected:**
- No `app/(main)/settings/` exists yet — fresh build, not a modification.
- `app/api/uploadthing/core.ts` has `channelBanner`, `videoThumbnail`, `video` routes; no `profilePhoto` route yet — this feature adds it as its own distinct key, per section 13's explicit instruction not to reuse an existing image route.
- `app/(main)/components/navbar.tsx` already links to `/settings` in its account dropdown (built during the navbar feature) — no navbar change needed, the destination just needs to exist now.
- `components/ui/avatar.tsx` already exports `AvatarBadge` — exactly what's needed for the "small red camera badge in its bottom-right corner" on the profile photo. `components/ui/card.tsx` already exists for the settings page's single card.
- **Spec inconsistency found**: section 13 item 1 says the settings page "redirects to `/sign-in`" when there's no session — but this app has no `/sign-in` route. Every other protected-route mechanism already built in this codebase (`proxy.ts`, the `(auth)` layout) redirects unauthenticated visitors to `/` (the sign-in page doubles as the landing page, per section 7). Treating this as a stale reference in the spec text and redirecting to `/` instead, consistent with the rest of the already-implemented app — not asking the user, since AGENTS.md's own section 7 already establishes `/` as the actual sign-in destination unambiguously.
- `lib/auth.ts`/`lib/auth-client.ts` already exist; `auth.api.updateUser` confirmed (via the installed `better-auth` package's types) to accept a generic `body` record, matching AGENTS.md's `{ image: imageUrl }` usage exactly.
- `lib/action-result.ts` (`ok`/`okVoid`/`fail`/`dbFail`) already exists.
- `.agents/memory/` has `authentication.md`, `channel-dashboard.md`, `database-layer.md`, `home-feed.md`, `loading-error-boundaries.md`, `metadata-favicon.md`, `navbar.md`, `search-page.md`, `watch-page.md` — no prior settings work recorded.
- AGENTS.md section 19's standing rule requires `loading.tsx`/`error.tsx` for the new `/settings` route.

**Decisions / assumptions:**
- **Session handling**: per section 13's explicit exception to the protected-routes rule, `/settings` is NOT added to `proxy.ts`'s matcher — the page itself calls `auth.api.getSession` and redirects (to `/`, per the correction above) inline, since it needs the session object to render (name, email, current image), not just a boolean gate.
- **Profile photo upload flow differs from the banner dialog's flow**: section 13 item 2 explicitly says the avatar preview "updates immediately after a successful upload — no separate 'Save' step, unlike the channel banner edit flow" — so `onClientUploadComplete` calls `updateProfilePhoto(imageUrl)` directly (no intermediate "Save" button), and the preview updates from the action's response. This is a deliberate, spec-mandated deviation from the create-channel/edit-banner dialogs' two-step confirm-then-save pattern, not an oversight.
- **`profilePhoto` UploadThing route**: added to `ourFileRouter` as its own key, image type, "max 2MB" per the page's own copy ("Upload a new profile photo (max 2MB)") — so `maxFileSize` is set to `"2MB"`, distinct from `channelBanner`/`videoThumbnail`'s existing 4MB.
- **`updateProfilePhoto` action**: calls `auth.api.updateUser({ headers, body: { image: imageUrl } })` — not a Mongoose write, since `image` lives on BetterAuth's own `user` collection (section 6). Still follows the general server-actions shape (session check, return `ok`/`fail`/`dbFail`) even though there's no Zod schema to `safeParse` against (a single URL string with no user-typed fields).
- **No new shadcn components needed** — `Card`, `Avatar`/`AvatarImage`/`AvatarFallback`/`AvatarBadge`, and the already-configured `UploadButton` cover every visual requirement.
- **`next.config.ts`/`app/api/uploadthing/route.ts`/`lib/uploadthing.ts`**: no changes needed — `remotePatterns` already covers `*.ufs.sh` (added during the channel/dashboard feature), the route handler and `UploadButton` helper are generic across all `ourFileRouter` keys already.

## Output

**Goal:** A working `/settings` page where a signed-in user can upload and immediately see a new profile photo, backed by a new `profilePhoto` UploadThing route and a `updateProfilePhoto` action that writes through BetterAuth's own user-update API.

**Files likely to change / create:**
- `app/api/uploadthing/core.ts` — modified: add the `profilePhoto` route (image, 2MB, 1 file, session-gated).
- `app/(main)/settings/page.tsx` — new: inline session check + redirect to `/`, renders the "Settings" heading, a `Card` with "Profile Photo" section heading, `ProfilePhotoForm`.
- `app/(main)/settings/loading.tsx`, `error.tsx` — new, per AGENTS.md section 19.
- `app/(main)/settings/actions/index.ts` — new: `updateProfilePhoto(imageUrl)`.
- `app/(main)/settings/components/profile-photo-form.tsx` — new: client component, current avatar (or fallback icon) with `AvatarBadge` camera icon, name, hint text, `UploadButton` (`profilePhoto` endpoint).

**Acceptance criteria:**
- `profilePhoto` exists as its own route in `ourFileRouter` (image, `maxFileSize: "2MB"`, `maxFileCount: 1`), session-gated in `.middleware()` via `auth.api.getSession`, throwing `UploadThingError("Unauthorized")` if absent — same pattern as the three existing routes.
- `/settings` redirects an unauthenticated visitor to `/` (not `/sign-in`, per the corrected understanding above) via an inline `auth.api.getSession` check in the page — `/settings` is NOT added to `proxy.ts`'s matcher.
- Settings page: "Settings" heading above a single `Card`; inside, "Profile Photo" heading, a circular avatar (current `session.user.image` or a fallback person icon) with a small red `AvatarBadge` camera icon in its bottom-right corner, centered above the user's name and the hint "Upload a new profile photo (max 2MB)", then the `UploadButton` centered below.
- Upload confirmation requirement: an in-progress boolean set `true` in `onUploadBegin`, cleared in both `onClientUploadComplete` and `onUploadError` — but per section 13's explicit "no separate Save step" instruction, `onClientUploadComplete` calls `updateProfilePhoto(imageUrl)` immediately and the avatar preview updates from that call's result, not from a held-back preview state awaiting a manual save.
- `updateProfilePhoto(imageUrl)`: requires a session, calls `auth.api.updateUser({ headers: await headers(), body: { image: imageUrl } })`, returns `ok`/`fail`/`dbFail` per the action-result contract — no Mongoose write.
- `onUploadError` returns `void` (block body, not an arrow expression) and shows a toast.
- `/settings` has its own route-relevant `loading.tsx` (card/avatar-shaped skeleton) and `error.tsx` (`Empty` + `retry()`, settings-relevant copy/icon), per AGENTS.md section 19.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass.

**Manual test steps after implementation:**
1. Run `npm run dev`.
2. Signed out, visit `/settings` directly — confirm redirect to `/`.
3. Signed in, visit `/settings` — confirm the "Settings" heading, card, current avatar (or fallback person icon) with the small red camera badge, your name, the "max 2MB" hint, and the upload button.
4. Click the account dropdown's "Settings" link from the navbar — confirm it now navigates to a real page instead of 404ing.
5. Upload a new profile photo — confirm the submit/upload button is disabled while uploading, and the avatar preview updates to the new photo immediately after the upload completes, with no separate "Save" step or button.
6. Reload the page — confirm the new photo persists (now `session.user.image` reflects it).
7. Confirm the navbar's own avatar (top-right, from the `AccountMenu`) also reflects the new photo after a page reload (it reads from the same `session.user.image`).
8. Attempt to upload a file over 2MB — confirm an error toast appears and the avatar does not change.
9. Throttle the network to see the loading skeleton; temporarily break `MONGODB_URI` — note that `updateProfilePhoto` doesn't touch Mongoose at all, so this may not actually trigger the error boundary; instead verify the error boundary by temporarily throwing inside the page or checking `retry()` behavior conceptually.

## Constraints

- Follow AGENTS.md section 13 exactly for scope and layout — profile photo only, no other settings fields.
- Follow the UploadThing skill's exact route/client patterns: `profilePhoto` as its own key, `ufsUrl`, the in-progress-state gating requirement — but per section 13's explicit override, skip the "preview then separate save" two-step pattern used by the banner dialogs; this page saves immediately on upload completion.
- Follow section 17 for `updateProfilePhoto`: session required, `ok`/`fail`/`dbFail` returns.
- Do not add `/settings` to `proxy.ts`'s matcher — it protects itself inline, per section 13's explicit exception.
- Do not reuse `channelBanner` or `videoThumbnail` for the profile photo upload.
- Follow AGENTS.md section 19's standing rule for `/settings`'s `loading.tsx`/`error.tsx`.
- No comments in code unless explaining a non-obvious "why" (AGENTS.md section 25).
- Checks to run after implementation: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
