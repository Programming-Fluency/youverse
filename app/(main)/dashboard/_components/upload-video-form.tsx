"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadVideo } from "../actions";
import { uploadVideoSchema, type UploadVideoValues } from "../validations";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";

export function UploadVideoForm({ channelId }: { channelId: string }) {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [videoState, setVideoState] = useState<
    "idle" | "uploading" | "uploaded" | "reading-duration" | "ready"
  >("idle");
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [closeSignal, setCloseSignal] = useState(0);

  const form = useForm<UploadVideoValues>({
    resolver: zodResolver(uploadVideoSchema),
    defaultValues: {
      channelId,
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      duration: 0,
    },
  });

  useEffect(() => {
    if (closeSignal > 0) {
      closeRef.current?.click();
    }
  }, [closeSignal]);

  function readVideoDuration(videoUrl: string) {
    setVideoState("reading-duration");
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.src = videoUrl;
    videoEl.onloadedmetadata = () => {
      form.setValue("duration", Math.round(videoEl.duration), { shouldValidate: true });
      setVideoState("ready");
    };
  }

  async function onSubmit(values: UploadVideoValues) {
    const result = await uploadVideo(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Video uploaded.");
    form.reset({ ...values, title: "", description: "", videoUrl: "", thumbnailUrl: "", duration: 0 });
    setVideoState("idle");
    setVideoFileName(null);
    setThumbnailPreviewUrl(null);
    router.refresh();
    setCloseSignal((n) => n + 1);
  }

  const isVideoBusy = videoState === "uploading" || videoState === "reading-duration";
  const isVideoReady = videoState === "ready";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Title</FieldLabel>
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
          name="videoUrl"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Video file</FieldLabel>
              {videoFileName && (
                <p className="text-sm text-muted-foreground">
                  {videoFileName} —{" "}
                  {videoState === "reading-duration"
                    ? "Reading video duration…"
                    : videoState === "ready"
                      ? "Video uploaded"
                      : "Uploading…"}
                </p>
              )}
              <UploadButton
                endpoint="video"
                onUploadBegin={(fileName) => {
                  setVideoState("uploading");
                  setVideoFileName(fileName);
                }}
                onClientUploadComplete={(res) => {
                  const url = res[0]?.ufsUrl;
                  if (url) {
                    field.onChange(url);
                    readVideoDuration(url);
                  }
                }}
                onUploadError={(error: Error) => {
                  setVideoState("idle");
                  toast.error(error.message);
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="thumbnailUrl"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Thumbnail</FieldLabel>
              {thumbnailPreviewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailPreviewUrl}
                  alt="Thumbnail preview"
                  className="aspect-video w-full rounded-md object-cover"
                />
              )}
              <UploadButton
                endpoint="videoThumbnail"
                onUploadBegin={() => setIsThumbnailUploading(true)}
                onClientUploadComplete={(res) => {
                  setIsThumbnailUploading(false);
                  const url = res[0]?.ufsUrl;
                  if (url) {
                    setThumbnailPreviewUrl(url);
                    field.onChange(url);
                  }
                }}
                onUploadError={(error: Error) => {
                  setIsThumbnailUploading(false);
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
          disabled={
            isVideoBusy ||
            !isVideoReady ||
            isThumbnailUploading ||
            form.formState.isSubmitting
          }
        >
          Upload Video
        </Button>
      </DialogFooter>
    </form>
  );
}
