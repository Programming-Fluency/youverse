# Database Layer (MongoDB source of truth)

## Role

The principal-level full-stack engineer defined in AGENTS.md, scoped to implementing the database layer described in AGENTS.md section 6 ("MongoDB source of truth").

## Context

**Skills read:**
- `.agents/skills/mongoose-nextjs/SKILL.md` — YouVerse-specific Mongoose conventions: `lib/db.ts` cached-connection pattern, `db/models/` registration guard (`mongoose.models.X || mongoose.model(...)`), models only ever queried from `"use server"` action files, `.lean()` + explicit `_id`/`ObjectId` → string mapping for client-facing shapes, and the note that this connection is fully separate from `lib/auth.ts`'s own `MongoClient`.
- Skimmed `.agents/skills/mongodb-schema-design/references/fundamental-embed-vs-reference.md` for embed-vs-reference confirmation — not applied as new design, since AGENTS.md section 6 already prescribes reference-based schemas (`Video.channelId`, `Subscription.subscriberUserId`/`channelId`, `ViewHistory.userId`/`videoId`) and derived counts over denormalized fields. The other MongoDB skills (`mongodb-connection`, `mongodb-query-optimizer`, `mongodb-atlas-stream-processing`, `mongodb-search-and-ai`, `mongodb-natural-language-querying`, `mongodb-mcp-setup`) are generic vendor skills not specific to this task's scope (schema authoring + connection helper, no query optimization, streaming, or search involved yet).

**Existing code inspected:**
- No `lib/` or `db/` directories exist yet — confirmed via glob, fresh build not a modification.
- `package.json` — `mongoose` is not yet a dependency. Needs installing.
- A `.env` file already exists at the project root with a `DATABASE_URI` key — the user confirmed this is the file to use; no `.env.example`/`.env.local` should be created. The key is currently named `DATABASE_URI`, not `MONGODB_URI` as AGENTS.md section 24 specifies as canonical; per user decision, this prompt renames the key to `MONGODB_URI` in the existing `.env` so it matches AGENTS.md section 24 and the codebase's own documented convention, rather than making `lib/db.ts` read a different variable name than the rest of the docs expect.
- `.gitignore` already ignores `.env*`, so `.env` is already untracked/safe.
- `.agents/memory/` only has `metadata-favicon.md` — no prior database work recorded.
- `lib/auth.ts` (BetterAuth) does not exist yet either — out of scope here per section 7, which owns it separately. This prompt does not touch authentication.

**Decisions / assumptions:**
- Scope is exactly AGENTS.md section 6: the `lib/db.ts` connection helper and the four Mongoose models (`Channel`, `Video`, `Subscription`, `ViewHistory`) in `db/models/`. No pages, actions, dialogs, or UI — those belong to later features (sections 9–13) that will each read these models from their own action files.
- `mongoose` will be added as a dependency (`npm install mongoose`) since it's not present yet — required for `lib/db.ts` and every model file to even compile.
- No `.env.example`/`.env.local` will be created. The existing `.env` file's `DATABASE_URI` key will be renamed to `MONGODB_URI` so it matches the canonical name in AGENTS.md section 24 and what `lib/db.ts` reads (`process.env.MONGODB_URI`).
- View counts and subscriber counts are **not** stored fields on `Video`/`Channel` — per section 6, they're derived via aggregation over `ViewHistory`/`Subscription` in application code (i.e., in whichever future action reads them). This prompt only lays down the schemas and indexes that make those aggregations efficient; it does not write the aggregation queries themselves, since no action file consumes them yet.
- `Subscription` gets a compound unique index on `(subscriberUserId, channelId)` per section 6, enforced via `schema.index({ subscriberUserId: 1, channelId: 1 }, { unique: true })` — prevents duplicate subscriptions at the database level.
- Field types: `userId`, `subscriberUserId` are `String` (BetterAuth's `user._id` is a string id from the Mongo adapter, not a Mongoose `ObjectId`) to match how BetterAuth's own collections store ids. `channelId`, `videoId` are Mongoose `ObjectId` refs (`Schema.Types.ObjectId`, `ref: "Channel"` / `ref: "Video"`) since those documents are created by this app's own Mongoose models.
- `Video.duration` is stored as a `Number` (seconds) — matches how the watch page/upload flow will need to render a duration badge (section 9, section 11) as a simple numeric value.

## Output

**Goal:** Stand up the MongoDB/Mongoose data layer YouVerse's app-owned collections depend on — a reusable connection helper and the four Mongoose schemas/models listed in AGENTS.md section 6 — so every subsequent feature (dashboard, home feed, watch page, search) has models to import from its action files.

**Files likely to change:**
- `package.json` / `package-lock.json` — add `mongoose` dependency.
- `.env` — rename the existing `DATABASE_URI` key to `MONGODB_URI` (value unchanged).
- `lib/db.ts` — new file, `connectToDatabase()` cached-connection helper per the skill's pattern.
- `db/models/Channel.ts` — new file: `userId` (String, required), `name` (String, required), `description` (String), `bannerUrl` (String), timestamps.
- `db/models/Video.ts` — new file: `channelId` (ObjectId ref Channel, required), `title` (String, required), `description` (String), `thumbnailUrl` (String), `videoUrl` (String, required), `duration` (Number), timestamps.
- `db/models/Subscription.ts` — new file: `subscriberUserId` (String, required), `channelId` (ObjectId ref Channel, required), timestamps, compound unique index on `(subscriberUserId, channelId)`.
- `db/models/ViewHistory.ts` — new file: `userId` (String, required), `videoId` (ObjectId ref Video, required), `watchedAt` (Date, default now), timestamps.

**Acceptance criteria:**
- `npm install mongoose` completes and `mongoose` appears in `package.json` dependencies.
- `lib/db.ts` exports `connectToDatabase()`, caches the connection via `global`, throws a clear error if `MONGODB_URI` is unset, and compiles under `--strict` (global type augmentation included).
- All four models exist in `db/models/`, each using the `mongoose.models.X || mongoose.model(...)` guard, with fields matching AGENTS.md section 6 exactly.
- `Subscription` has a compound unique index on `(subscriberUserId, channelId)`.
- No model stores a denormalized `viewCount`/`subscriberCount` field.
- `.env`'s key is renamed from `DATABASE_URI` to `MONGODB_URI` (same value), matching the section 24 table.
- No action files, pages, or UI are added — this prompt is data-layer only.
- `npm run lint` and `npx tsc --noEmit` both pass.

**Manual test steps after implementation:**
1. Confirm `.env` now has `MONGODB_URI` (not `DATABASE_URI`) with the original value intact.
2. In a scratch script or a temporary route handler, call `connectToDatabase()` then `Channel.create({ userId: "test", name: "Test Channel" })` and confirm a document appears in the `channels` collection via `mongosh` or MongoDB Compass.
3. Confirm calling `connectToDatabase()` a second time in the same process does not open a second connection (e.g. log `mongoose.connection.readyState` before/after, or check `connections.current` on the server stays flat across repeated calls).
4. Confirm creating two `Subscription` documents with the same `(subscriberUserId, channelId)` pair throws a duplicate-key error.
5. Delete the scratch script/route handler used for steps 2–4 — it's test-only, not part of the deliverable.

## Constraints

- Follow AGENTS.md section 6 exactly for field names/types on all four models; follow section 15 (Mongoose models live only in `db/models/`, connection helper in `lib/db.ts`) and section 17 (actions — not covered here, but models must be shaped so a future action can call `connectToDatabase()` before every query) for architecture boundaries.
- Follow the `mongoose-nextjs` skill's cached-connection pattern and model-registration guard exactly — do not use the bare `dbConnect()` pattern from the raw Mongoose docs (no caching), since that reconnects on every dev hot-reload.
- Do not create `lib/auth.ts`, any action file, any page, or any UI component — strictly data-layer scope.
- Do not add denormalized count fields to `Video` or `Channel`.
- `MONGODB_URI` must never be referenced from a `"use client"` file (none are touched in this prompt, but `lib/db.ts` itself must have no `"use client"` directive and must only be importable from server contexts).
- No comments in code unless explaining a non-obvious "why" (AGENTS.md section 25) — e.g. the compound unique index or the `global` caching rationale are acceptable one-line comments; field definitions are not.
- Checks to run after implementation: `npm run lint`, `npx tsc --noEmit`.
