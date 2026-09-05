"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createChannel } from "../actions";
import { createChannelSchema, type CreateChannelValues } from "../validations";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";

export function CreateChannelForm() {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [closeSignal, setCloseSignal] = useState(0);

  const form = useForm<CreateChannelValues>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: { name: "", description: "", bannerUrl: "" },
  });

  useEffect(() => {
    if (closeSignal > 0) {
      closeRef.current?.click();
    }
  }, [closeSignal]);

  async function onSubmit(values: CreateChannelValues) {
    const result = await createChannel(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Channel created.");
    form.reset();
    setPreviewUrl(null);
    router.refresh();
    setCloseSignal((n) => n + 1);
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
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <Textarea {...field} id={field.name} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="bannerUrl"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Banner</FieldLabel>
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Banner preview"
                  className="aspect-video w-full rounded-md object-cover"
                />
              )}
              <UploadButton
                endpoint="channelBanner"
                onUploadBegin={() => setIsUploading(true)}
                onClientUploadComplete={(res) => {
                  setIsUploading(false);
                  const url = res[0]?.ufsUrl;
                  if (url) {
                    setPreviewUrl(url);
                    field.onChange(url);
                  }
                }}
                onUploadError={(error: Error) => {
                  setIsUploading(false);
                  toast.error(error.message);
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <DialogFooter>
        <DialogClose ref={closeRef} className="hidden" />
        <Button
          type="submit"
          className="cursor-pointer"
          disabled={isUploading || form.formState.isSubmitting}
        >
          Create Channel
        </Button>
      </DialogFooter>
    </form>
  );
}
