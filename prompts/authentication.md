# Authentication (BetterAuth + landing/sign-in/sign-up + protected routes)

## Role

The principal-level full-stack engineer defined in AGENTS.md, scoped to implementing the authentication feature end to end as owned by AGENTS.md section 7: BetterAuth integration, the landing/sign-in page, the sign-up page, and protected-route wiring via `proxy.ts`.

## Context

**Skills read:**
- `.agents/skills/better-auth-best-practices/SKILL.md` — setup workflow, env vars, config options, session management, client/server API shape.
- `.agents/skills/better-auth-security-best-practices/SKILL.md` — secret handling, rate limiting, CSRF, trusted origins, cookie/session security defaults.
- `.agents/skills/create-auth/SKILL.md` — Next.js App Router route handler setup, `nextCookies()` note for Server Components, MongoDB adapter reference, auth UI implementation pattern.
- `.agents/skills/email-and-password-best-practices/SKILL.md` — email/password config shape, password requirements, verification/reset flows (see Decisions below on why these are not enabled).
- `.agents/skills/react-hook-form/SKILL.md` — `Controller` pattern, `Field`/`FieldLabel`/`FieldError`/`FieldGroup` composition, Base UI (not Radix) notes, form-to-server-action wiring.
- `.agents/skills/zod/SKILL.md` — schema shape rules for RHF compatibility (no `.optional().default("")`), `.issues` not `.errors`, `z.email()` top-level form.
- `.agents/skills/mongoose-nextjs/SKILL.md` — confirms `lib/auth.ts`'s own `MongoClient` is separate from `lib/db.ts`'s Mongoose connection; nothing in this prompt touches Mongoose models directly.
- Not read: `organization-best-practices`, `two-factor-authentication-best-practices` (AGENTS.md section 1 excludes organizations and 2FA from this product's scope), `migrate-radix-to-base` (nothing to migrate — this is a fresh Base UI install, not a Radix codebase).

**Existing code inspected:**
- No `app/(auth)` directory exists yet — confirmed via glob, fresh build not a modification (per section 7's "before generating" checklist).
- No `lib/auth.ts`, `lib/auth-client.ts`, or `proxy.ts` exist yet.
- `package.json` — `better-auth` is not yet a dependency. `mongoose` is installed (unrelated connection, per the mongoose-nextjs skill).
- **No shadcn/ui installation exists yet** — no `components.json`, no `components/ui/`. This is the first UI feature in the project, so shadcn itself must be initialized (`npx shadcn@latest init`, Base UI-backed per AGENTS.md section 21) before any `Field`/`Button`/`Input`/`Card` component can be used. `npx shadcn@latest add` will be needed for each component this feature uses: `button`, `input`, `field`, `card` (optional, for the split-panel container if used), and whatever else the branding/form panels need.
- `app/globals.css` currently only has the default create-next-app Tailwind v4 setup (no shadcn CSS variables/theme yet) — shadcn init will rewrite this.
- `.env` already has `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — all five required env vars for this feature are already present and named per AGENTS.md section 24's canonical table. Confirmed present, values not inspected further than key names.
- `public/assets/logo.png` — the only logo asset (PNG, no SVG), already used for `app/icon.png` (metadata-favicon feature). This is what `BrandingPanel` will render.
- Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` per AGENTS.md's top-of-file instruction and section 19: confirms `proxy.ts` (not `middleware.ts`) at project root, named export `proxy` (or default export), `export const config = { matcher: [...] }`, Node.js runtime by default (no `runtime` export allowed in proxy files).
- `.agents/memory/` has `database-layer.md` and `metadata-favicon.md` — no prior auth work recorded.

**Decisions / assumptions:**
- **Scope is exactly AGENTS.md section 7**: BetterAuth server/client instances, the `(auth)` route group (landing = sign-in page, sign-up page, shared layout, `BrandingPanel`/`SignInForm`/`SignUpForm` components, validations), and `proxy.ts` protecting `/dashboard` and `/home/subscriptions`. It does **not** include the dashboard or home pages themselves (sections 9–10) — those routes are only referenced as redirect targets and `matcher` entries, not built here.
- **Email verification and password reset are NOT enabled.** AGENTS.md section 1 says "do not overbuild" and section 7's scope list has no mention of verification/reset flows or their pages; the `email-and-password-best-practices` skill's flows are opt-in features layered on top of the base config, not required by it. `emailAndPassword: { enabled: true }` is sufficient. If the user wants verification/reset later, that's new scope, not a silent addition here.
- **No `twoFactor` or `organization` plugins** — explicitly excluded by AGENTS.md section 1.
- **shadcn/ui bootstrap is in scope** because section 7's UI requirements (Field-based forms, Button, the split-panel layout) cannot be built without it, and no prior feature has installed it yet. This prompt initializes shadcn (Base UI-backed) and adds only the components this feature needs: `button`, `input`, `field`, `label` (if not bundled with field), and `card` if used for layout framing. Additional components (`dialog`, `dropdown-menu`, `avatar`, etc.) needed by later features (navbar, dashboard) are **not** added here — added when those features are built, per the "add via CLI when needed" rule in AGENTS.md section 22.
- **MongoDB adapter**: `lib/auth.ts` opens its own `MongoClient` (via the native `mongodb` driver, a new dependency alongside `better-auth`), calls `client.connect()`, then passes `mongodbAdapter(client.db())` — per AGENTS.md section 7's explicit ordering rule and the `create-auth` skill's adapter table. This is a **separate** connection from `lib/db.ts`'s Mongoose connection (confirmed via the mongoose-nextjs skill) — BetterAuth manages its own `user`/`session`/`account`/`verification` collections directly through the Mongo driver, not through any Mongoose model.
- **`nextCookies()` plugin is last in the `plugins` array** — required per AGENTS.md section 7 and the create-auth skill's Next.js Server Components note, so `signIn`/`signUp` server actions (if any are added later) can set cookies from a Server Action context. No plugin ordering conflicts since no other plugins are used (2FA/organization excluded).
- **`role` additional field**: AGENTS.md section 7 mentions `user.additionalFields` (e.g. `role`) as an example pattern but does not require a `role` field for this feature's scope (channel/dashboard ownership is scoped by `userId`, not a role system, per section 9). Not adding a speculative `role` field — nothing in sections 1–13 uses one.
- **Rate limiting / CSRF / trusted origins**: left at BetterAuth's defaults (rate limiting enabled automatically in production, CSRF enabled by default, `baseURL`'s origin auto-trusted). Not adding `trustedOrigins`, custom `rateLimit.customRules`, or `advanced.useSecureCookies` overrides — nothing in AGENTS.md section 7 or 24 asks for hardening beyond defaults, and inventing production security config not requested risks masking real deployment needs later. `BETTER_AUTH_URL` already covers the trusted base origin.
- **Password hashing**: default `scrypt` — no custom Argon2id hasher, since AGENTS.md doesn't request one and adding an extra native dependency (`@node-rs/argon2`) isn't justified by anything in scope.
- **`proxy.ts` matcher**: exactly `["/dashboard", "/home/subscriptions"]` per AGENTS.md section 7, item 4 — using path-only matchers (no wildcard needed since neither route currently has nested dynamic segments in scope; `/dashboard` has no sub-routes and `/home/subscriptions` is a single page). If a matcher needs `:path*` later (e.g. a future `/dashboard/[channelId]`), that's a change to make when that route is built, not now.
- **Settings page (`/settings`) is explicitly NOT added to the matcher** — AGENTS.md section 13 states settings protects itself inline as the sole exception to the matcher rule. Not building `/settings` in this prompt either way (out of scope, section 13's own feature).
- **Google OAuth redirect URI**: not configurable from this codebase — the user must ensure the Google Cloud Console OAuth client has `{BETTER_AUTH_URL}/api/auth/callback/google` registered as an authorized redirect URI. Documented in manual test steps, not something this prompt can verify automatically.

## Output

**Goal:** A working BetterAuth setup (Google + email/password, MongoDB adapter) with a landing/sign-in page and sign-up page matching AGENTS.md section 7's exact layout spec, and `proxy.ts` protecting `/dashboard` and `/home/subscriptions`.

**Files likely to change / create:**
- `package.json` — add `better-auth`, `mongodb` (native driver, for the adapter's `MongoClient`), plus whatever `shadcn` init adds (`class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@base-ui/react` or equivalent, per the CLI's own choices).
- `components.json` — new, from `npx shadcn@latest init`.
- `app/globals.css` — updated by shadcn init (CSS variables, base layer).
- `lib/utils.ts` — new, from shadcn init (`cn()` helper).
- `components/ui/button.tsx`, `input.tsx`, `field.tsx`, `label.tsx`, (`card.tsx` if used) — new, from `npx shadcn@latest add`.
- `lib/auth.ts` — new: BetterAuth server instance, `MongoClient` connect-then-`db()` pattern, Google + email/password providers, `mongodbAdapter`, `nextCookies()` last in `plugins`.
- `lib/auth-client.ts` — new: `createAuthClient()` from `better-auth/react`, exporting `useSession`, `signIn`, `signUp`, `signOut`.
- `app/api/auth/[...all]/route.ts` — new: `toNextJsHandler(auth)` route handler, `{ GET, POST }` exports.
- `proxy.ts` — new, project root: calls `auth.api.getSession`, redirects to `/` when no session, `config.matcher = ["/dashboard", "/home/subscriptions"]`.
- `app/(auth)/layout.tsx` — new: redirects authenticated users to `/home`, renders `BrandingPanel` + form panel side by side (form-only on small screens).
- `app/(auth)/page.tsx` — new: renders `SignInForm` (this is also the landing page).
- `app/(auth)/sign-up/page.tsx` — new: renders `SignUpForm`.
- `app/(auth)/_components/branding-panel.tsx` — new: logo, heading, one line of supporting text, nothing else.
- `app/(auth)/_components/sign-in-form.tsx` — new.
- `app/(auth)/_components/sign-up-form.tsx` — new.
- `app/(auth)/validations/index.ts` — new: `signInSchema`/`SignInValues`, `signUpSchema`/`SignUpValues` (Zod v4, RHF-compatible per the zod skill).
- `.env` — no new keys needed (all five already present); may add non-secret defaults to a `.env.example` only if the user wants one (not created unless asked, consistent with the earlier database-layer decision to not introduce example-env files unprompted).

**Acceptance criteria:**
- `npx shadcn@latest init` completes with the Base UI-backed setup; `components.json` reflects that base library (not Radix).
- `lib/auth.ts` exports `auth`, constructed with `MongoClient` → `await client.connect()` → `client.db()` → `mongodbAdapter(...)`, in that order (never `client.db()` before `connect()` resolves).
- `emailAndPassword: { enabled: true }` and `socialProviders.google` both configured, reading `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` from env.
- `nextCookies()` is the last entry in `plugins`.
- `lib/auth-client.ts` exports a client built with `createAuthClient()` from `better-auth/react`.
- `app/api/auth/[...all]/route.ts` exports `GET`/`POST` via `toNextJsHandler(auth)`.
- `proxy.ts` exists at the project root (not `middleware.ts`), exports `proxy` (or default) and `config.matcher = ["/dashboard", "/home/subscriptions"]`, calls `auth.api.getSession({ headers: request.headers })` and redirects unauthenticated requests to `/`.
- `app/(auth)/layout.tsx` redirects an authenticated session to `/home`.
- Landing/sign-in page (`app/(auth)/page.tsx`) and sign-up page match AGENTS.md section 7's exact two-panel layout: left panel is logo + heading + one supporting line only (no form fields, no buttons); right panel top-to-bottom is heading+subtext → fields (sign-up adds name above email) → primary red full-width submit button → divider with "or" → outlined "Continue with Google" button with the Google "G" icon → one line linking to the other auth page.
- Google sign-in button is visually secondary (below the divider), never above or in place of the email/password form.
- Forms use the `Controller` pattern with `Field`/`FieldLabel`/`FieldError`/`FieldGroup` per the react-hook-form skill — no `register`.
- Zod schemas in `app/(auth)/validations/index.ts` use RHF-compatible types (no `.optional().default("")`) per the zod skill.
- On successful sign-in or sign-up, the user is redirected to `/home`.
- All interactive elements use `cursor-pointer` (AGENTS.md section 22).
- No `role` additional field, no `twoFactor`/`organization` plugins, no email verification/password reset flows.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass (build check included since this adds routes, a route handler, and `proxy.ts` — meets AGENTS.md section 26's build-trigger condition).

**Manual test steps after implementation:**
1. Run `npm run dev`.
2. Visit `/` — confirm the split layout renders: left panel (logo, heading, one line of text, nothing else) and right panel (Welcome back heading, email+password fields, red "Sign In" button, divider, outlined "Continue with Google" button with G icon, "Don't have an account? Sign up" link). Shrink the viewport and confirm only the right panel shows on small screens.
3. Click "Sign up" — confirm `/sign-up` renders the same layout with "Create your account" heading, name+email+password fields, "Create Account" button, and "Already have an account? Sign in" link.
4. Sign up with a new email/password — confirm redirect to `/home` (this route doesn't exist yet, so expect a 404 there; the redirect itself is what's being verified, not the destination page).
5. Sign out (no sign-out UI exists yet — verify via clearing cookies or `authClient.signOut()` in the browser console) and confirm visiting `/dashboard` directly redirects to `/`.
6. In Google Cloud Console, confirm `{BETTER_AUTH_URL}/api/auth/callback/google` is registered as an authorized redirect URI for the OAuth client referenced by `GOOGLE_CLIENT_ID`; then test "Continue with Google" end to end.
7. Confirm `GET /api/auth/ok` (if exposed by the installed better-auth version) or a basic session check returns successfully, indicating the handler and MongoDB adapter are wired correctly.

## Constraints

- Follow AGENTS.md section 7 exactly for scope, layout, and BetterAuth wiring rules (connect-then-db ordering, `nextCookies()` last, redirect to `/home` after auth).
- Follow AGENTS.md section 21 (Base UI, not Radix): no `asChild`, use `render` prop; `DialogTrigger`/`DropdownMenuLabel` rules don't apply here (no dialogs/dropdowns in this feature) but the general Base UI component API applies to whatever shadcn components are installed.
- Follow AGENTS.md section 22: brand red `#ff0000`/hover `#cc0000` for primary buttons, `cursor-pointer` on all interactive elements, React Hook Form `Controller` pattern with `Field`/`FieldLabel`/`FieldError`/`FieldGroup`.
- Follow the zod skill's RHF-compatibility rule and `.issues` (not `.errors`) for any server-side re-validation.
- Do not build `/home`, `/dashboard`, or `/home/subscriptions` pages — they're referenced only as redirect targets / matcher entries.
- Do not add email verification, password reset, 2FA, or organization features.
- Do not commit real secrets — `.env` already has them and is gitignored; do not print secret values in any output.
- Never expose `MONGODB_URI`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, or `BETTER_AUTH_URL` to client code (AGENTS.md section 24) — `lib/auth.ts` is server-only, `lib/auth-client.ts` never imports server env vars directly.
- No comments in code unless explaining a non-obvious "why" (AGENTS.md section 25) — e.g. the `connect()`-before-`db()` ordering is worth a one-line comment; field definitions are not.
- Checks to run after implementation: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
