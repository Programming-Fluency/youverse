import Link from "next/link";
import { SearchIcon, TvIcon } from "lucide-react";
import { search } from "./actions";
import { VideoCard } from "../components/video-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Empty className="min-h-[60vh]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>Search YouVerse</EmptyTitle>
            <EmptyDescription>
              Type something in the search bar to find channels and videos.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const result = await search(query);
  const { channels, videos } = result.success
    ? result.data
    : { channels: [], videos: [] };

  if (channels.length === 0 && videos.length === 0) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Empty className="min-h-[60vh]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TvIcon />
            </EmptyMedia>
            <EmptyTitle>No results for &quot;{query}&quot;</EmptyTitle>
            <EmptyDescription>Try a different search term.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6">
      <p className="text-sm text-muted-foreground">Results for &quot;{query}&quot;</p>

      {channels.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Channels</h2>
          <div className="flex flex-col gap-2">
            {channels.map((channel) => (
              <Link
                key={channel._id}
                href={`/channel/${channel._id}`}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent"
              >
                <Avatar className="size-12">
                  <AvatarImage src={channel.bannerUrl} alt={channel.name} />
                  <AvatarFallback>{channel.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{channel.name}</p>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {channel.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Videos</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {videos.map((video) => (
              <VideoCard key={video._id} {...video} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
