"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { toggleSubscription } from "@/app/(main)/channel/[id]/actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type VideoCardChannel = {
  _id: string;
  name: string;
  isOwner: boolean;
  isSubscribed: boolean;
};

export function VideoCard({
  _id,
  title,
  thumbnailUrl,
  duration,
  createdAt,
  viewCount,
  channel,
  horizontal = false,
}: {
  _id: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  createdAt: string;
  viewCount: number;
  channel?: VideoCardChannel;
  horizontal?: boolean;
}) {
  return (
    <Link
      href={`/watch/${_id}`}
      className={cn("group flex gap-3", horizontal ? "flex-row" : "flex-col")}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg bg-muted",
          horizontal ? "aspect-video w-40" : "aspect-video w-full"
        )}
      >
        {thumbnailUrl && (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
          />
        )}
        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-xs font-medium text-white">
          {formatDuration(duration)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{title}</h3>
        {channel && (
          <div className="flex items-center gap-2">
            <Link
              href={`/channel/${channel._id}`}
              onClick={(event) => event.stopPropagation()}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {channel.name}
            </Link>
            {!channel.isOwner && (
              <InlineSubscribePill
                channelId={channel._id}
                isSubscribed={channel.isSubscribed}
              />
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {formatViewCount(viewCount)} · {formatRelativeDate(createdAt)}
        </p>
      </div>
    </Link>
  );
}

function InlineSubscribePill({
  channelId,
  isSubscribed,
}: {
  channelId: string;
  isSubscribed: boolean;
}) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [isPending, setIsPending] = useState(false);

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

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
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "min-w-24 cursor-pointer rounded-full",
        subscribed
          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          : "bg-primary text-primary-foreground hover:bg-[#cc0000]"
      )}
    >
      {isPending ? <Spinner /> : subscribed ? "Subscribed" : "Subscribe"}
    </Button>
  );
}

function formatDuration(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatViewCount(count: number) {
  return `${count} ${count === 1 ? "view" : "views"}`;
}

function formatRelativeDate(isoDate: string) {
  const date = new Date(isoDate);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];

  for (const [secondsInUnit, label] of intervals) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) {
      return `${value} ${label}${value > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}
