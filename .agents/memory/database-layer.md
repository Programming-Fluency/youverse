# Database layer (MongoDB source of truth)

**Status:** Done.

## What was built

- `mongoose` added as a dependency.
- `lib/db.ts` — `connectToDatabase()`, a cached-connection helper (connection promise cached on `global.mongooseConn`) so repeated calls across dev hot-reloads and warm invocations reuse the same connection instead of reconnecting. Reads `process.env.MONGODB_URI`, throws at module load if unset.
- `db/models/Channel.ts` — `userId` (String), `name` (String), `description` (String), `bannerUrl` (String), timestamps.
- `db/models/Video.ts` — `channelId` (ObjectId ref Channel), `title` (String), `description` (String), `thumbnailUrl` (String), `videoUrl` (String), `duration` (Number, seconds), timestamps.
- `db/models/Subscription.ts` — `subscriberUserId` (String), `channelId` (ObjectId ref Channel), timestamps; compound unique index on `(subscriberUserId, channelId)` to block duplicate subscriptions at the DB level.
- `db/models/ViewHistory.ts` — `userId` (String), `videoId` (ObjectId ref Video), `watchedAt` (Date, defaults to now), timestamps.

All four models use the `mongoose.models.X || mongoose.model(...)` registration guard to avoid `OverwriteModelError` during dev hot-reload, per `.agents/skills/mongoose-nextjs/SKILL.md`.

## Decisions

- `userId`/`subscriberUserId` are `String`, not Mongoose `ObjectId` — they store BetterAuth's own string user ids, not ids from this app's Mongoose models.
- `channelId`/`videoId` are Mongoose `ObjectId` refs, since `Channel`/`Video` are this app's own models.
- No `viewCount`/`subscriberCount` fields anywhere — those are derived later via aggregation over `ViewHistory`/`Subscription` in whichever action needs them (not yet built).
- Existing `.env` had a `DATABASE_URI` key from project setup; renamed to `MONGODB_URI` (value unchanged) to match the canonical name in AGENTS.md section 24. `lib/db.ts` reads `process.env.MONGODB_URI`.
- `lib/db.ts` needed an explicit `const MONGODB_URI: string = process.env.MONGODB_URI` reassignment after the guard — TypeScript doesn't narrow a module-scope `const` across the `connectToDatabase` closure boundary, so referencing `process.env.MONGODB_URI` directly inside the guarded block still typed as `string | undefined` without this.

## Scope not included (by design)

- No action files, pages, dialogs, or UI — this was data-layer only, per AGENTS.md section 6. `lib/auth.ts` (BetterAuth) is separate, owned by section 7, and untouched here.
- No aggregation queries for view/subscriber counts — those land with whichever feature first needs them (dashboard, channel page, etc.).

## Checks run

`npx tsc --noEmit` and `npm run lint` both passed clean.
