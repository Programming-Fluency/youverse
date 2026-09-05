---
name: zod
description: Define and validate Zod v4 schemas in YouVerse — schema shape rules for React Hook Form compatibility, string-format validators (z.email(), z.url(), etc.), error handling via .issues (not .errors), and object/array patterns. Use this skill whenever creating or editing a Zod schema in app/(main)/[route]/validations/index.ts or app/(auth)/validations/index.ts, or whenever a "use server" action parses input with safeParse. Also use when troubleshooting a resolver type mismatch, a .errors is not a function error, or deciding between z.string().email() and z.email().
license: Apache-2.0
metadata:
  version: "1.0.0"
  source: "https://zod.dev (Zod 4 — Basic usage, Defining schemas)"
---

# Zod v4 (YouVerse conventions)

This skill adapts Zod's own v4 docs to YouVerse's actual usage: one schema per route, consumed by both a client-side `zodResolver` (via `react-hook-form`, see that skill) and a server action's own `safeParse` re-validation (AGENTS.md section 17). Those two consumers constrain which parts of Zod's general API are safe to reach for.

## Where schemas live

One schema per route in `app/(main)/[route]/validations/index.ts` (or `app/(auth)/validations/index.ts`), exported alongside its inferred type (AGENTS.md section 18):

```ts
// app/(main)/dashboard/validations/index.ts
import * as z from "zod";

export const createChannelSchema = z.object({
  name: z.string().min(1, "Channel name is required.").max(100, "Channel name is too long."),
  description: z.string().max(1000, "Description is too long."),
});

export type CreateChannelValues = z.infer<typeof createChannelSchema>;
```

The same schema object is imported in two places: the form's `useForm({ resolver: zodResolver(schema) })` (client) and the action's `schema.safeParse(input)` (server, AGENTS.md section 17 step 2) — never redefine the shape twice.

## The RHF-compatibility rule (AGENTS.md section 18)

**Every field bound to a React Hook Form input must be a plain, always-defined type** — `z.string()`, `z.number()`, `z.boolean()` — never `.optional()` combined with `.default("")`. `.optional().default("")` produces an input type of `string | undefined` (the `.optional()` half) while the output type is `string` (the `.default()` half); `zodResolver`'s generic wants the form's `defaultValues` to satisfy the **input** type, and `useForm`'s single type parameter can't reconcile the two, so it either fails to compile or silently disagrees with the form's actual runtime shape.

- A required text field: `z.string().min(1, "...")`.
- A field that's allowed to be empty (e.g. `description`): still `z.string()` (no `.min()`, or `.min(0)`), with `defaultValues: { description: "" }` supplying the empty string — the emptiness is enforced by the default value and the UI, not by making the Zod type itself optional.
- Never reach for `.optional()`, `.nullable()`, or `.default()` on a field a `Controller` binds to. Those are fine on fields that are *not* form-bound (e.g. a server-only field merged in after parsing, like `channelId` added by the action itself rather than submitted by the form).

## Error handling: `.issues`, not `.errors`

Zod v4's `ZodError` exposes issues at `.issues` (the v3 alias many blog posts and older training data use is `.errors` — that's gone in v4). Every action's `safeParse` failure path reads:

```ts
const parsed = createChannelSchema.safeParse(input);
if (!parsed.success) {
  return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
}
```

Never write `parsed.error.errors[0]` — that's v3 idiom and will not type-check against v4's `ZodError`.

## String formats: prefer the top-level function form

Zod v4 exposes common string formats as **top-level functions**, not chained `.string().x()` methods: `z.email()`, `z.url()`, `z.uuid()`, `z.iso.date()`, `z.iso.datetime()`, `z.iso.time()`, etc. — not `z.string().email()`. Use the top-level form in new schemas:

```ts
// Good — v4 idiom
email: z.email("Enter a valid email address."),

// Avoid — v3 idiom; do not introduce new instances of this pattern
email: z.string().email("Enter a valid email address."),
```

If an existing schema in the codebase already uses `.string().email()`, match the file you're editing rather than mixing both styles inline — but any *new* schema should use the top-level form since that's what the current Zod docs define as canonical.

## Objects: unknown keys are stripped by default

`z.object({...})` silently drops keys not in the shape (`Dog.parse({ name: "x", extra: true })` → `{ name: "x" }`). This is almost always what YouVerse's form schemas want — the client only ever submits the fields the form defines. Reach for `z.strictObject({...})` only if an action needs to reject unexpected extra fields outright (not currently a requirement anywhere in AGENTS.md's scope); don't add it speculatively.

## Arrays (for a future `useFieldArray` form)

No form in YouVerse's current scope needs array fields (AGENTS.md section 1 lists only single-record forms: channel creation, video upload, profile photo). If one is added later:

```ts
emails: z
  .array(z.object({ address: z.email("Enter a valid email address.") }))
  .min(1, "Add at least one email address.")
  .max(5, "You can add up to 5 email addresses."),
```

See the `react-hook-form` skill's `useFieldArray` section for the component-side pairing.

## Numbers and coercion

Native `<input type="number">` values arrive as strings from the DOM unless a form library coerces them. React Hook Form's `Controller` pattern (this project's pattern, per AGENTS.md section 22) hands you the raw field value — if a schema field is `z.number()`, ensure the input's `onChange` converts to a number before calling `field.onChange`, rather than reaching for `z.coerce.number()` on a form-bound field (coercion schemas have `unknown` input type by default, which reintroduces the same resolver-generic mismatch the `.optional().default()` rule above warns about, unless a generic parameter is pinned explicitly). YouVerse's current schema (section 6/9: title, description, name, banner/thumbnail/video URLs) has no numeric form inputs today — `duration` is read from the video file client-side, not typed in by a user.

## Checks

After adding or editing a schema, run `npx tsc --noEmit` — this is where an `.optional().default()` mistake or a stale `.errors` reference surfaces — and `npm run lint`, per AGENTS.md section 26.
