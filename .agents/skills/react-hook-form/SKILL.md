---
name: react-hook-form
description: Build forms in YouVerse with React Hook Form's Controller pattern, Zod v4 validation via zodResolver, and shadcn Field/FieldLabel/FieldError/FieldGroup components on this project's Base UI installation (not Radix). Use this skill whenever creating or editing any form — sign-in/sign-up, create-channel, edit-banner, upload-video — including the Zod schema in app/(main)/[route]/validations/index.ts or app/(auth)/validations/index.ts, the Controller-wrapped fields, error display, and array fields (e.g. a future multi-item form). Also use when troubleshooting a resolver type mismatch, an uncontrolled-to-controlled input warning, or a field not showing validation errors.
license: Apache-2.0
metadata:
  version: "1.0.0"
  source: "shadcn React Hook Form guide (ui.shadcn.com)"
---

# React Hook Form (YouVerse conventions)

This skill adapts shadcn's React Hook Form guide to YouVerse's actual stack (AGENTS.md sections 16, 18, 21, 22). Two things in the source guide do not carry over as-is:

1. **Zod version** — the source guide's examples (`z.string().email(...)`) are Zod v3 idiom. YouVerse uses **Zod v4** (AGENTS.md section 16, 18): errors read via `.issues` not `.errors`, and string-format validators are top-level functions, not chained methods — see "Zod v4 differences" below.
2. **Base UI, not Radix** — this project's shadcn installation is built on `@base-ui/react` (AGENTS.md section 21). Any doc example carrying Radix conventions (`asChild`, Radix-only prop names) must use the `render` prop instead. The `Controller`/`Field`/`aria-invalid`/`data-invalid` pattern itself is unaffected — that part of the guide applies directly.

## Where things live in this project

- **Schema + inferred type**: one Zod schema per route in `app/(main)/[route]/validations/index.ts` (or `app/(auth)/validations/index.ts` for sign-in/sign-up), exported alongside its inferred `type ...Values` (AGENTS.md section 18). Not inlined in the form component.
- **Form component**: route-scoped, e.g. `app/(auth)/_components/sign-in-form.tsx`, `app/(main)/dashboard/_components/create-channel-form.tsx`. Always `"use client"`.
- **Submission**: the form's `onSubmit` calls a server action (`app/(main)/[route]/actions/index.ts`), not an API route — server actions are callable directly from client components (AGENTS.md section 12 note, section 17).

## Core pattern: `Controller`, never `register`

AGENTS.md section 22 mandates the `Controller` pattern paired with shadcn `Field`/`FieldLabel`/`FieldError`/`FieldGroup` — never `register`. This also matches Base UI's controlled-component model better than uncontrolled `register` refs.

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { createChannelSchema, type CreateChannelValues } from "../validations";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreateChannelForm() {
  const form = useForm<CreateChannelValues>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: { name: "", description: "" },
  });

  async function onSubmit(values: CreateChannelValues) {
    // call the server action here
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Channel name</FieldLabel>
              <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit" className="cursor-pointer">
        Create
      </Button>
    </form>
  );
}
```

Every interactive element — the submit button, any button inside the form — gets `cursor-pointer` per AGENTS.md section 22, same as everywhere else in the app.

## Zod schema conventions (section 18)

- One schema per route, in that route's `validations/index.ts`, exported with its inferred type:

  ```ts
  // app/(main)/dashboard/validations/index.ts
  import * as z from "zod";

  export const createChannelSchema = z.object({
    name: z.string().min(1, "Channel name is required."),
    description: z.string(),
  });

  export type CreateChannelValues = z.infer<typeof createChannelSchema>;
  ```

- Use plain `z.string()` / `z.number()` for every field bound to the form. **Never** `.optional().default("")`— it produces a `string | undefined` input type that conflicts with `zodResolver`'s inferred input type and breaks `useForm`'s generic. An optional text field is still `z.string()` with `defaultValues: { field: "" }` supplying the empty string, and `.min(0)`/no `.min()` if truly optional content is allowed.
- **Zod v4 errors use `.issues`, not `.errors`.** This matters in the server action that re-validates the same schema server-side (AGENTS.md section 17, step 2): `parsed.error.issues[0]?.message`, never `parsed.error.errors[0]`.
- Zod v4 exposes string formats as top-level functions — `z.email()`, `z.url()`, `z.uuid()`, etc. — not chained `.string().email()`. Use the top-level form in new schemas. See the `zod` skill for the full set of schema-authoring conventions.

## Displaying errors (Base UI, not Radix)

Same `data-invalid` / `aria-invalid` pairing as the source guide:

- `data-invalid={fieldState.invalid}` on `<Field>` (styling hook).
- `aria-invalid={fieldState.invalid}` on the actual control (`<Input>`, `<SelectTrigger>`, `<Checkbox>`, `<Switch>`, `<RadioGroupItem>`) for accessibility.
- `{fieldState.invalid && <FieldError errors={[fieldState.error]} />}` directly below the control.

This part of the guide needs no adaptation — it's markup/attributes, not a Radix-specific API.

## Field types, adapted to Base UI's `render` prop

The source guide's Input/Textarea patterns (spread `field` directly onto the control) apply unchanged. For components where the doc's guide assumes Radix trigger composition (Select, Dialog-adjacent pieces), swap any `asChild` usage for the `render` prop per AGENTS.md section 21 — e.g. a `SelectTrigger` wrapping a custom element uses `render={<CustomButton />}`, not `asChild`. The Select/Checkbox/RadioGroup/Switch field-binding pattern itself (`field.value` / `field.onChange` on the primitive, not `register`) is unchanged from the source guide.

Example — Select field, Base UI-safe (no `asChild` needed here since `SelectTrigger` itself isn't being replaced, just noted as the place `render` would apply if it were):

```tsx
<Controller
  name="visibility"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Visibility</FieldLabel>
      <Select name={field.name} value={field.value} onValueChange={field.onChange}>
        <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="public">Public</SelectItem>
          <SelectItem value="unlisted">Unlisted</SelectItem>
        </SelectContent>
      </Select>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

## Uploads inside a form (banner, thumbnail, video)

YouVerse's dialogs (create-channel, upload-video, edit-banner) combine a React Hook Form field with an UploadThing `UploadButton` that is not itself a form field — the uploaded URL is set into the form via `form.setValue("bannerUrl", url, { shouldValidate: true })` from the `UploadButton`'s `onClientUploadComplete`, not via a `Controller`-wrapped file input. See the UploadThing skill(s) and AGENTS.md section 20 for the upload-progress/preview state that must gate the submit button — that gating is separate from and in addition to RHF's own `formState.isSubmitting`.

## Resetting

`form.reset()` on a `type="button"` (never `type="submit"`) Cancel/Reset action, per the source guide — unchanged.

## Array fields (`useFieldArray`)

Not currently used anywhere in YouVerse's scoped feature set (AGENTS.md section 1 — no multi-item form exists: channel creation, video upload, and profile settings are all single-record forms). If a future feature needs one, follow the source guide's pattern directly: `useFieldArray({ control: form.control, name })`, `<Controller key={field.id} name={\`items.${index}.field\`} ...>` per item, `field.id` (not `index`) as the React key, and a Zod `.array(...).min()/.max()` on the schema. Re-derive from the shadcn docs at that point rather than trusting this skill to have anticipated the exact shape.

## Checks

After adding or editing a form, run `npx tsc --noEmit` (resolver generic mismatches from an `.optional().default()` field or a wrong Zod version pattern surface here first) and `npm run lint`, per AGENTS.md section 26.
