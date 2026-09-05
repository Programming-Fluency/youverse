import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadVideoForm } from "./upload-video-form";

export function UploadVideoDialog({ channelId }: { channelId: string }) {
  return (
    <Dialog>
      <DialogTrigger
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
      >
        Upload Video
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a video</DialogTitle>
        </DialogHeader>
        <UploadVideoForm channelId={channelId} />
      </DialogContent>
    </Dialog>
  );
}
