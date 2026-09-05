import { notFound } from "next/navigation";
import Image from "next/image";
import { VideoOffIcon } from "lucide-react";
import { getChannelPageData } from "./actions";
import { SubscribeButton } from "./components/subscribe-button";
import { VideoCard } from "../../components/video-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getChannelPageData(id);

  if (!result.success) {
    notFound();
  }

  const channel = result.data;

  return (
    <div>
      <div className="relative aspect-[6/1] w-full overflow-hidden bg-muted">
        {channel.bannerUrl && (
          <Image src={channel.bannerUrl} alt={channel.name} fill className="object-cover" />
        )}
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{channel.name}</h1>
          <p className="text-sm text-muted-foreground">
            {channel.subscriberCount} {channel.subscriberCount === 1 ? "subscriber" : "subscribers"} ·{" "}
            {channel.videos.length} {channel.videos.length === 1 ? "video" : "videos"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{channel.description}</p>
        </div>
        <SubscribeButton
          channelId={channel._id}
          isOwner={channel.isOwner}
          isSubscribed={channel.isSubscribed}
        />
      </div>

      <div className="mx-auto max-w-6xl p-6 pt-0">
        {channel.videos.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <VideoOffIcon />
              </EmptyMedia>
              <EmptyTitle>No videos yet</EmptyTitle>
              <EmptyDescription>
                This channel hasn&apos;t uploaded any videos.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {channel.videos.map((video) => (
              <VideoCard key={video._id} {...video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
