import { VideoOffIcon } from "lucide-react";
import { getHomeFeed } from "./actions";
import { VideoCard } from "../components/video-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function HomePage() {
  const result = await getHomeFeed();
  const feed = result.success
    ? result.data
    : { subscribed: [], recommended: [], hasAnyVideos: false };

  if (!feed.hasAnyVideos) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Empty className="min-h-[60vh]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <VideoOffIcon />
            </EmptyMedia>
            <EmptyTitle>No videos yet</EmptyTitle>
            <EmptyDescription>
              Upload a video from your dashboard to get started.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6">
      {feed.subscribed.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Subscribed</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {feed.subscribed.map((video) => (
              <VideoCard key={video._id} {...video} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Recommended</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {feed.recommended.map((video) => (
            <VideoCard key={video._id} {...video} />
          ))}
        </div>
      </section>
    </div>
  );
}
