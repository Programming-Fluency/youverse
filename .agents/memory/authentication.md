# Authentication (BetterAuth + landing/sign-in/sign-up + protected routes)

**Status:** Done.

## What was built

**shadcn/ui bootstrap** (first UI feature in the project — nothing existed before this):
- `npx shadcn@latest init -b base --pointer --preset nova` — Base UI-backed (`@base-ui/react`, not Radix), Lucide icons, Geist fonts, global `cursor-pointer` on buttons via `--pointer`.
- Components added: `button`, `input`, `field` (+ `label`, `separator` as its deps), `card`, `spinner`, `sonner`.
- `components/ui/button.tsx`'s `default` variant hover changed from `hover:bg-primary/80` (renders `#ff3333` over white, not `#cc0000`) to `hover:bg-[#cc0000]` — a solid color override, since opacity-blended red doesn't reach the exact brand hover hex AGENTS.md section 22 specifies. User confirmed this approach over leaving the approximate opacity-based hover.
- `app/globals.css` — `--primary` set to `#ff0000` (brand red) for both light theme; used by every `variant="default"` Button app-wide.
- `<Toaster />` (from `components/ui/sonner.tsx`) mounted in `app/layout.tsx` — root-level infra so `toast()` works from any client component going forward.

**BetterAuth:**
- `lib/auth.ts` — `betterAuth()` instance. `MongoClient` (native `mongodb` driver, separate from `lib/db.ts`'s Mongoose connection) → `await client.connect()` → `mongodbAdapter(client.db())`, in that order. `emailAndPassword: { enabled: true }`, `socialProviders.google` from env, `plugins: [nextCookies()]` (last/only plugin).
- `lib/auth-client.ts` — `createAuthClient()` from `better-auth/react`, re-exports `useSession`, `signIn`, `signUp`, `signOut`.
- `app/api/auth/[...all]/route.ts` — `toNextJsHandler(auth)`.
- `proxy.ts` (project root) — `auth.api.getSession`, redirects to `/` when absent, `config.matcher = ["/dashboard", "/home/subscriptions"]`.
- No email verification, password reset, 2FA, or organization plugin — out of scope per AGENTS.md section 1.
- No `role` additional field — nothing in scope uses one yet.
- Rate limiting / CSRF / trusted origins left at BetterAuth defaults.

**Pages:**
- `app/(auth)/layout.tsx` — redirects an authenticated session to `/home`; renders `BrandingPanel` + form panel (`grid lg:grid-cols-2`, branding panel `hidden lg:flex` so only the form shows on small screens).
- `app/(auth)/page.tsx` — sign-in page, doubles as the landing page (no separate marketing page).
- `app/(auth)/sign-up/page.tsx` — sign-up page.
- `app/(auth)/_components/branding-panel.tsx`, `sign-in-form.tsx`, `sign-up-form.tsx` — per AGENTS.md section 7's exact two-panel spec (heading → fields → red submit → divider → outlined Google button with inline SVG "G" icon → cross-link).
- `app/(auth)/validations/index.ts` — `signInSchema`/`SignInValues`, `signUpSchema`/`SignUpValues`, Zod v4 (`z.email()`, RHF-compatible types per the zod skill).
- Forms use `Controller` + `Field`/`FieldLabel`/`FieldError`/`FieldGroup`/`FieldSeparator` — no `register`.
- Deleted the old placeholder `app/page.tsx` — it collided with the new `app/(auth)/page.tsx` (both resolve to `/`; route groups don't add a URL segment).

**New dependencies:** `better-auth`, `mongodb` (native driver), `react-hook-form`, `@hookform/resolvers`, `zod` (installed with `--legacy-peer-deps` — `@hookform/resolvers`'s optional peer `@typeschema/zod@0.14.0` predates zod 4 and isn't used by this project; the actual `zod` peer range `^3.25.0 || ^4.0.0` is satisfied), plus what shadcn's CLI pulled in (`@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`, `sonner`, `next-themes`, `tw-animate-css`).

## Decisions

- `lib/auth.ts` uses top-level `await client.connect()` — confirmed this compiles under the project's `tsconfig.json` (`module: "esnext"`, `moduleResolution: "bundler"`) and builds fine under Turbopack (Next.js 16's default bundler), despite `target: "ES2017"`. No `experiments.topLevelAwait` webpack config needed for this Next.js version.
- Google OAuth redirect URI (`{BETTER_AUTH_URL}/api/auth/callback/google`) must be registered in Google Cloud Console manually — not something the codebase configures.
- `/settings` intentionally not added to `proxy.ts`'s matcher — it protects itself inline per AGENTS.md section 13 (not built yet either way).

## Known environment issue (not a code defect)

The machine's C: drive was at ~76 MB free during `npm run build`, which caused a Turbopack cache-persistence warning ("not enough space on disk" writing an `.sst` file). The build still completed successfully and produced correct output — this only affects incremental build caching, not correctness — but disk space should be freed up to avoid future failures in npm installs or git operations.

## Checks run

`npx tsc --noEmit`, `npm run lint`, and `npm run build` all passed (build succeeded despite the disk-space cache warning above).

## Not built (explicitly out of scope here)

`/home`, `/dashboard`, `/home/subscriptions` pages — referenced only as redirect targets / proxy matcher entries. Navbar (section 8), dashboard (section 9), home feed (section 10) are separate features.
