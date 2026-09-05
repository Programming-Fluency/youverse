import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateChannelForm } from "./create-channel-form";

export function CreateChannelDialog() {
  return (
    <Dialog>
      <DialogTrigger
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-[#cc0000]"
      >
        <PlusIcon className="size-4" />
        New Channel
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a channel</DialogTitle>
        </DialogHeader>
        <CreateChannelForm />
      </DialogContent>
    </Dialog>
  );
}
