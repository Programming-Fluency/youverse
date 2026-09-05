import { VideoOffIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getOwnedChannels } from "./actions";
import { CreateChannelDialog } from "./_components/create-channel-dialog";
import { EditBannerDialog } from "./_components/edit-banner-dialog";
import { UploadVideoDialog } from "./_components/upload-video-dialog";
import { VideoCard } from "../components/video-card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function DashboardPage() {
  const result = await getOwnedChannels();
  const channels = result.success ? result.data : [];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Your Channels</h1>
        <CreateChannelDialog />
      </div>

      {channels.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <VideoOffIcon />
            </EmptyMedia>
            <EmptyTitle>No channels yet</EmptyTitle>
            <EmptyDescription>
              Create a channel to start uploading videos.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateChannelDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-8">
          {channels.map((channel) => (
            <div key={channel._id} className="flex flex-col gap-4">
              <div className="relative aspect-[6/1] w-full overflow-hidden rounded-lg bg-muted">
                {channel.bannerUrl && (
                  <Image
                    src={channel.bannerUrl}
                    alt={channel.name}
                    fill
                    className="object-cover"
                  />
                )}
                <EditBannerDialog channelId={channel._id} />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/channel/${channel._id}`}
                    className="text-lg font-semibold text-foreground hover:underline"
                  >
                    {channel.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                </div>
                <UploadVideoDialog channelId={channel._id} />
              </div>

              {channel.videos.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {channel.videos.map((video) => (
                    <VideoCard key={video._id} {...video} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
