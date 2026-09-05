# Loading and error boundaries (retroactive, all routes)

**Status:** Done — new standing rule added to AGENTS.md section 19, applied to every route segment that existed at the time.

## What was built

New standing rule in AGENTS.md section 19: every route segment with a `page.tsx` gets its own `loading.tsx` and `error.tsx`, route-relevant (not generic), checked against `node_modules/next/dist/docs/.../loading.md` and `.../error.md` before writing. This version's `error.tsx` takes a stable `retry` prop (v16.3.0+), not just `reset`.

Added retroactively to every existing route:
- `app/(auth)/loading.tsx` — skeleton matching the sign-in form's two fields + submit + divider + Google button shape.
- `app/(auth)/error.tsx` — `Empty` + `LogInIcon`, "Sign-in is unavailable".
- `app/(auth)/sign-up/loading.tsx` — same shape plus a name field skeleton.
- `app/(auth)/sign-up/error.tsx` — `Empty` + `UserPlusIcon`, "Sign-up is unavailable".
- `app/(main)/loading.tsx` — video-grid skeleton (8 cards, thumbnail+title+meta), since this is the shared fallback for any future `(main)` page (home, dashboard, channel, search, subscriptions) that doesn't define a more specific one.
- `app/(main)/error.tsx` — `Empty` + `TriangleAlertIcon`, generic-but-route-group-appropriate "Something went wrong", since this is a group-level fallback.
- `app/(main)/home/loading.tsx` / `error.tsx` — deliberately minimal/honest, since `app/(main)/home/page.tsx` is itself only a temporary placeholder (not the real section 10 home feed yet) — the skeleton is a single line matching the placeholder text, and the error copy says "Home couldn't load," not something implying the full feed.

**New shadcn components added:** `skeleton`, `empty` — both didn't exist yet and are now the standard building blocks for every `loading.tsx`/`error.tsx` pair going forward.

`app/api/auth/[...all]/route.ts` was **not** given a `loading.tsx`/`error.tsx` — those are page-rendering/Suspense/Error-Boundary conventions and don't apply to Route Handlers.

## Decisions

- `error.tsx` uses `retry()` (this version's stable prop, confirmed in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` — `reset()` still exists but is now documented as the fallback for a narrower "don't re-fetch" case).
- Route-group-level (`(main)`) loading/error act as the fallback for any nested page without its own — but per the user's explicit instruction, a nested route with genuinely distinct content (like `home`) still gets its own more specific pair rather than relying on the ancestor's.

## Follow-up for future features

Every new route built from here forward (dashboard, channel, watch, search, subscriptions, settings) must include its own `loading.tsx`/`error.tsx` from the start, per the new AGENTS.md section 19 rule — this should be baked into each feature's prompt's "files likely to change" list, not treated as a separate retrofit each time.

## Checks run

`npx tsc --noEmit`, `npm run lint`, `npm run build` all passed clean.
