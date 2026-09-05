---
name: mongoose-nextjs
description: Use Mongoose correctly inside YouVerse's Next.js 16 App Router codebase — connection helper in lib/db.ts, model registration in db/models/, and calling models only from "use server" action files, never from client components or Route Handlers directly. Use this skill whenever creating or editing lib/db.ts, any file under db/models/, or any "use server" action file under app/(main)/[route]/actions/index.ts that queries Mongoose. Also use when troubleshooting `OverwriteModelError`, `MongoTopologyClosedError`, model recompilation errors during dev hot reload, or Next.js/Mongoose bundling errors.
license: Apache-2.0
metadata:
  version: "1.0.0"
  source: "https://mongoosejs.com (Using Mongoose With Next.js guide)"
---

# Mongoose with Next.js (YouVerse conventions)

This skill adapts Mongoose's official Next.js guide to YouVerse's actual architecture (AGENTS.md section 15). YouVerse uses the **App Router only** — ignore the source guide's Pages Router (`pages/api`, `getServerSideProps`) sections entirely; they don't apply to this project.

## Where things live in this project

- **Connection helper**: `lib/db.ts`, exporting `connectToDatabase()`. This is distinct from `lib/auth.ts`, which opens its own `MongoClient` for BetterAuth's adapter (see the Better Auth skills) — the two connections are independent.
- **Models**: Mongoose models in `db/models/`, one file per model (`Channel.ts`, `Video.ts`, `Subscription.ts`, `ViewHistory.ts` per AGENTS.md section 6).
- **Callers**: only `"use server"` action files (`app/(main)/[route]/actions/index.ts`) call `connectToDatabase()` and query models. Pages render data returned from actions — they never import Mongoose models or query directly (AGENTS.md section 15, section 17).

## `lib/db.ts` connection helper

Use a cached-connection pattern, not the source guide's bare `dbConnect`. Next.js dev hot-reloading and serverless/edge invocations can otherwise open a new connection per reload/invocation. Cache the connection promise on `global` so repeated calls in dev and across warm serverless invocations reuse it:

```ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = global.mongooseConn;

if (!cached) {
  cached = global.mongooseConn = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

Declare the `global.mongooseConn` type augmentation once (e.g. in `lib/db.ts` itself or a `.d.ts` file) so this compiles under `--strict`:

```ts
declare global {
  var mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}
```

Every `"use server"` action calls `await connectToDatabase()` before any model query (AGENTS.md section 17, step 3) — calling it repeatedly is a safe no-op once connected, per Mongoose's own connection-management guidance.

Do not use this same `MongoClient`/connection for BetterAuth — `lib/auth.ts` manages its own client per the Better Auth skill's `mongodbAdapter` setup (`client.connect()` then `client.db()`), which must not be reordered.

## Model registration

Always use the `mongoose.models.X || mongoose.model('X', schema)` guard — this is what prevents `OverwriteModelError: Cannot overwrite 'X' model once compiled`, which happens during dev hot-reload when a model file re-evaluates without the module cache clearing the previous registration:

```ts
// db/models/Channel.ts
import mongoose, { Schema } from "mongoose";

const ChannelSchema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    bannerUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Channel || mongoose.model("Channel", ChannelSchema);
```

Add indexes declared on the schema (e.g. `Subscription`'s compound unique index on `subscriberUserId` + `channelId`, per AGENTS.md section 6) via `schema.index(...)`, not as a manual `createIndex` call elsewhere.

## Calling models from actions, not pages or client components

Only `"use server"` files touch Mongoose. A page fetches data by calling an action, never by importing a model:

```ts
// app/(main)/dashboard/actions/index.ts
"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Channel from "@/db/models/Channel";
import { ok, fail, dbFail } from "@/lib/action-result";

export async function getOwnedChannels() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail("Not authenticated.");

  try {
    await connectToDatabase();
    const channels = await Channel.find({ userId: session.user.id }).lean();
    return ok(channels);
  } catch {
    return dbFail();
  }
}
```

Never import `db/models/*` or `lib/db.ts` into a `"use client"` file — this would pull server-only code (and potentially `MONGODB_URI` usage) into the client bundle. If a page needs Mongoose data, it awaits a server action or renders a server component that calls one; it does not run its own query (AGENTS.md section 15, section 23).

## Serializing documents for client components

When a server component passes a Mongoose result down as props to a client component, plain documents (and their `ObjectId`/`Date` fields) are not directly serializable. Use `.lean()` on the query and convert `_id` (and any nested `ObjectId`s) to strings in the action before returning — do not rely on the source guide's `JSON.parse(JSON.stringify(...))` trick; prefer explicit mapping so the client-facing shape is typed:

```ts
const channels = await Channel.find({ userId }).lean();
return ok(
  channels.map((c) => ({
    ...c,
    _id: c._id.toString(),
    userId: c.userId.toString(),
  }))
);
```

This also matches AGENTS.md section 6's instruction to update "any action or type that maps the document to a client-facing shape" whenever a model's fields change.

## Common issues

**`OverwriteModelError` / model recompiled on every hot reload** — missing the `mongoose.models.X ||` guard in a `db/models/*.ts` file. Add it.

**`MongoTopologyClosedError` in `lib/auth.ts`** — this is a BetterAuth/MongoClient issue, not a Mongoose one: `client.db()` was called before `client.connect()` resolved. See the Better Auth skills (AGENTS.md section 7) — do not fix it by changing `lib/db.ts`, since the two connections are unrelated.

**`TypeError: Cannot read properties of undefined (reading 'prototype')` or other ESM/bundling errors from `bson`** — caused by MongoDB's `bson` parser using top-level await/dynamic import under Next.js's forced ESM mode. If this surfaces, check `next.config.ts` for `serverExternalPackages: ["mongoose"]` (the current Next.js 16 config key — the source guide's `experimental.serverComponentsExternalPackages` and `experimental.esmExternals` are deprecated/renamed; verify the exact key against `node_modules/next/dist/docs/` per AGENTS.md section 19 before adding it, since names shift between major versions) plus `webpack: (config) => { config.experiments = { topLevelAwait: true }; return config; }` if a webpack build is in use.

**Edge Runtime** — Mongoose cannot connect to MongoDB from Next.js Edge Runtime (no Node.js `net` API there). Nothing in YouVerse's scope needs Edge Runtime; if a route ever sets `export const runtime = "edge"`, it must not import `lib/db.ts` or any `db/models/*`.

## Checks

After adding or editing `lib/db.ts`, `db/models/*`, or an action file that queries Mongoose, run `npx tsc --noEmit` (the `global.mongooseConn` augmentation and `.lean()` return types are where type errors tend to surface) and `npm run lint`, per AGENTS.md section 26.
