# Settings

**Status:** Done.

## What was built

**`app/api/uploadthing/core.ts`** — added `profilePhoto` as its own route (image, `maxFileSize: "2MB"`, `maxFileCount: 1`, session-gated in `.middleware()`) — a distinct key from `channelBanner`/`videoThumbnail`, not a reuse.

**`app/(main)/settings/`**:
- `page.tsx` — protected inline (`auth.api.getSession` + `redirect("/")` if absent), NOT added to `proxy.ts`'s matcher, per section 13's explicit exception to the protected-routes rule. "Settings" heading above a single `Card` ("Profile Photo" heading, `ProfilePhotoForm`).
- `actions/index.ts` — `updateProfilePhoto(imageUrl)`: session-required, calls `auth.api.updateUser({ headers, body: { image: imageUrl } })` — a BetterAuth write, not Mongoose, since `image` lives on BetterAuth's own `user` collection (section 6). Returns `ok`/`fail`/`dbFail`.
- `components/profile-photo-form.tsx` — circular avatar (`size-20`, current `session.user.image` or a `UserIcon` fallback) with a red `AvatarBadge` camera icon (`CameraIcon`, sized up via `className` since the badge's built-in size variants only track the `Avatar`'s `sm`/`default`/`lg` presets, none of which match this page's larger custom avatar size), name, "Upload a new profile photo (max 2MB)" hint, `UploadButton` (`profilePhoto` endpoint) below. Per section 13's explicit "no separate Save step" instruction — unlike the channel banner edit dialog's preview-then-save flow — `onClientUploadComplete` calls `updateProfilePhoto` immediately and the avatar preview updates from that result.
- `loading.tsx` / `error.tsx` — card/avatar-shaped skeleton; `Empty` + `UserCogIcon` + `retry()`.

**Spec correction applied**: AGENTS.md section 13 item 1 literally says the settings page "redirects to `/sign-in`" — but no such route exists in this app. Redirected to `/` instead (the sign-in page doubles as the landing page, per section 7), consistent with every other protected-route mechanism already built (`proxy.ts`, the `(auth)` layout). Not asked about — section 7 already makes `/` the unambiguous correct destination.

## Decisions

- `disabled={isUploading}` is a real, documented prop on `UploadButton` (confirmed against the installed `@uploadthing/react` package's types before using it) — gates re-uploading while one is in flight, in addition to the existing `onUploadBegin`/`onClientUploadComplete`/`onUploadError` state tracking.
- No Zod schema/React Hook Form used for this feature — the only "input" is an upload-returned URL string, not user-typed form fields.

## Checks run

`npx tsc --noEmit`, `npm run lint`, `npm run build` all passed clean.

## Scope status

This completes every feature listed in AGENTS.md section 1's product scope. All routes now exist: `/`, `/sign-up`, `/home`, `/home/subscriptions`, `/dashboard`, `/channel/[id]`, `/watch/[id]`, `/search`, `/settings`.
