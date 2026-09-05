"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleSubscription } from "../actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function SubscribeButton({
  channelId,
  isOwner,
  isSubscribed,
  className,
}: {
  channelId: string;
  isOwner: boolean;
  isSubscribed: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [isPending, setIsPending] = useState(false);

  if (isOwner) {
    return null;
  }

  async function handleClick() {
    setIsPending(true);
    const result = await toggleSubscription(channelId);
    setIsPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setSubscribed(result.data.isSubscribed);
    router.refresh();
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "min-w-32 cursor-pointer rounded-full",
        subscribed
          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          : "bg-primary text-primary-foreground hover:bg-[#cc0000]",
        className
      )}
    >
      {isPending ? <Spinner /> : subscribed ? "Subscribed" : "Subscribe"}
    </Button>
  );
}
