"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PencilIcon } from "lucide-react";
import { updateChannelBanner } from "../actions";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EditBannerDialog({ channelId }: { channelId: string }) {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!previewUrl) return;

    setIsSaving(true);
    const result = await updateChannelBanner({ channelId, bannerUrl: previewUrl });
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Banner updated.");
    setPreviewUrl(null);
    router.refresh();
    closeRef.current?.click();
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="secondary"
            size="icon-sm"
            className="absolute top-2 right-2 cursor-pointer"
          >
            <PencilIcon />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit banner</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
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
              if (url) setPreviewUrl(url);
            }}
            onUploadError={(error: Error) => {
              setIsUploading(false);
              toast.error(error.message);
            }}
          />
        </div>

        <DialogFooter>
          <DialogClose ref={closeRef} className="hidden" />
          <Button
            type="button"
            className="cursor-pointer"
            disabled={!previewUrl || isUploading || isSaving}
            onClick={handleSave}
          >
            Save Banner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
