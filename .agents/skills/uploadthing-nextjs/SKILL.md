---
name: uploadthing-nextjs
description: Integrate and extend UploadThing in YouVerse's Next.js 16 App Router codebase — the file router in app/api/uploadthing/core.ts, the route handler, client helpers in lib/uploadthing.ts, and the upload-confirmation UX every UploadButton must implement (banner, thumbnail, video, profile photo). Use this skill whenever creating or editing app/api/uploadthing/core.ts, app/api/uploadthing/route.ts, lib/uploadthing.ts, or any component that renders an UploadButton/UploadDropzone. Also use when troubleshooting file.url being undefined/deprecated, a new upload host not rendering via next/image, or an SSR loading flash on the upload button.
license: Apache-2.0
metadata:
  version: "1.0.0"
  source: "https://docs.uploadthing.com (Next.js App Router Setup)"
---

# UploadThing with Next.js (YouVerse conventions)

This skill adapts UploadThing's official Next.js App Router guide to YouVerse's actual layout and rules (AGENTS.md section 15, 20). Two things in the source guide don't carry over as-is:

1. **File locations** — the guide's example client helper lives at `src/utils/uploadthing.ts` with a `~/` alias. This project has no `src/` directory and uses the `@/` alias (AGENTS.md section 15): the client helpers live at `lib/uploadthing.ts`, importing `OurFileRouter` from `@/app/api/uploadthing/core`.
2. **Auth** — the guide's `.middleware()` uses a fake `auth(req)` stub. YouVerse's middleware must call the real `auth.api.getSession` from `lib/auth.ts` and throw `UploadThingError("Unauthorized")` when there's no session, per AGENTS.md section 20's explicit rule — never leave the stub in place.

## Where things live in this project

- **File router**: `app/api/uploadthing/core.ts`, exporting `ourFileRouter` (all routes) and `OurFileRouter` (the type). One route per upload kind: `channelBanner`, `videoThumbnail`, `video`, and — once the settings feature (AGENTS.md section 13) is built — `profilePhoto`. Each is its own named key, not a shared route reused across kinds, even though several accept images (section 13's explicit rule).
- **Route handler**: `app/api/uploadthing/route.ts` — `createRouteHandler({ router: ourFileRouter })`, exporting `GET`/`POST`. This is the one place in the app where a route handler's own method conventions come from the UploadThing adapter, not AGENTS.md's own POST-for-mutations rule (section 23 carves out this exact exception).
- **Client helpers**: `lib/uploadthing.ts` — `generateUploadButton<OurFileRouter>()` and `generateUploadDropzone<OurFileRouter>()` (only if a dropzone is actually used somewhere; this app's dialogs use `UploadButton` per AGENTS.md section 9), re-exported as `UploadButton`/`UploadDropzone`.
- **SSR hydration plugin**: `<NextSSRPlugin />` mounted in `app/layout.tsx`, inside `<body>`, before `{children}` — this app's root layout already has other body-level infra (`<Toaster />` after `{children}`), so add the plugin alongside it, not as a replacement.

## `app/api/uploadthing/core.ts`

```ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const f = createUploadthing();

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new UploadThingError("Unauthorized");
  return session;
}

export const ourFileRouter = {
  channelBanner: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await requireSession();
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, userId: metadata.userId };
    }),

  videoThumbnail: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await requireSession();
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, userId: metadata.userId };
    }),

  video: f({ video: { maxFileSize: "512MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await requireSession();
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, userId: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

`profilePhoto` (settings feature, section 13) follows the same shape as `channelBanner` — a distinct key, not a reuse of it, since each route's `.middleware()`/naming should stay scoped to its actual use even when the accepted type is identical.

File size limits above are starting points, not prescribed by AGENTS.md — confirm against the actual product requirement when each upload dialog is built (e.g. video max size should match whatever the upload UI's copy promises the user).

## `app/api/uploadthing/route.ts`

```ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
```

Nothing else goes in this file — no auth check here (that's the `.middleware()`'s job per-route), no custom method handling.

## `lib/uploadthing.ts`

```ts
import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
```

Add `generateUploadDropzone` only if a feature actually calls for a dropzone — don't export it speculatively.

## Reading the uploaded URL

Always `file.ufsUrl` in `.onUploadComplete()`, and the same field name in the client's `onClientUploadComplete` result — never `file.url`, which is deprecated (AGENTS.md section 20's explicit rule, and the reason this skill exists: the raw upstream docs sometimes still show `file.url` in older examples, but this project standardizes on `ufsUrl` everywhere).

## Client usage and the upload-confirmation requirement

AGENTS.md section 20 layers a stricter UX contract on top of the plain `UploadButton` the source guide shows. Every `UploadButton` in the app must:

1. Track an in-progress boolean: `true` in `onUploadBegin`, cleared in **both** `onClientUploadComplete` and `onUploadError`. Disable the dialog's/form's submit button while `true`.
2. For image uploads (banner, thumbnail, future profile photo): show a visible `<img>` preview from the returned URL once `onClientUploadComplete` fires, before the user can submit — don't auto-save on completion alone (the edit-banner dialog's "Save Banner" button persists it separately, so a wrong upload can be replaced first).
3. For video uploads: no image preview is possible — show the file name + "Video uploaded" confirmation, then a "Reading video duration…" status while duration is extracted client-side (e.g. via a hidden `<video>` element's `loadedmetadata` event), keeping submit disabled through both stages.

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";

export function BannerUploadField({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Banner preview" className="aspect-video w-full rounded-md object-cover" />
      )}
      <UploadButton
        endpoint="channelBanner"
        onUploadBegin={() => setIsUploading(true)}
        onClientUploadComplete={(res) => {
          setIsUploading(false);
          const url = res[0]?.ufsUrl;
          if (url) {
            setPreviewUrl(url);
            onUploaded(url);
          }
        }}
        onUploadError={(error: Error) => {
          setIsUploading(false);
          toast.error(error.message);
        }}
      />
    </div>
  );
}
```

`onUploadError` must return `void` — always a block body (`{ toast.error(...); }` shape as above), never an arrow expression that would implicitly return whatever `toast.error()` returns (AGENTS.md section 20's explicit rule).

Whatever consumes `isUploading` (a dialog's save/submit `Button`) sets `disabled={isUploading}` — this is a separate, additional gate from React Hook Form's own `formState.isSubmitting` (see the `react-hook-form` skill), not a replacement for it.

## `next.config.ts` — remote image hosts

Any new UploadThing-served image must be renderable via `next/image`, which requires listing its host under `images.remotePatterns`. UploadThing serves files from a per-app subdomain — confirm the actual hostname from a real uploaded file's `ufsUrl` (it follows the pattern `https://<app-id>.ufs.sh/f/...` for current UploadThing, but treat the literal value in a real response as authoritative over a remembered pattern) and add it:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
    ],
  },
};

export default nextConfig;
```

Do this once, the first time any UploadThing-served image needs to render through `next/image` (channel banner or video thumbnail — whichever is built first) — not preemptively for every possible future host.

## SSR hydration plugin (optional, reduces upload-button loading flash)

```tsx
// app/layout.tsx
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
```

```tsx
<body className="min-h-full flex flex-col">
  <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
  {children}
  <Toaster />
</body>
```

`extractRouterConfig` strips everything except the route configs (file types/limits), so nothing from `.middleware()` or `.onUploadComplete()` leaks to the client — safe to include even though `ourFileRouter` itself is a server-only module with an `auth` import inside it.

## Tailwind styles

This project is already on Tailwind v4 with shadcn's own generated imports in `app/globals.css` (`@import "shadcn/tailwind.css"` etc., per the authentication feature). Add UploadThing's plugin import as an **additional** line, not a replacement for the existing imports:

```css
@import "tailwindcss";
@import "uploadthing/tw/v4";
@source "../node_modules/@uploadthing/react/dist";
```

Place it near the top alongside the other `@import`s already in that file.

## Environment variable

`UPLOADTHING_TOKEN` — server-only, already present in `.env` (confirmed in this project's actual `.env`; per AGENTS.md section 24 it must never be referenced from a `"use client"` file). No client-exposed `NEXT_PUBLIC_*` variant is needed — `lib/uploadthing.ts`'s generated components call the app's own `/api/uploadthing` route, which is same-origin.

## Checks

After adding or editing `app/api/uploadthing/core.ts`, `route.ts`, `lib/uploadthing.ts`, or any upload-bearing form, run `npx tsc --noEmit` and `npm run lint`, per AGENTS.md section 26. Run `npm run build` too if `next.config.ts`'s `remotePatterns` changed, since that's a config-level change per section 26's build-trigger condition.
