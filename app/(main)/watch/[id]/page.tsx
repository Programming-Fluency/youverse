import { notFound } from "next/navigation";
import Link from "next/link";
import { getVideo, getSuggestedVideos } from "./actions";
import { VideoPlayer } from "./components/video-player";
import { VideoCard } from "../../components/video-card";
import { Separator } from "@/components/ui/separator";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getVideo(id);

  if (!result.success) {
    notFound();
  }

  const video = result.data;
  const suggestedResult = await getSuggestedVideos(video._id, video.channel._id);
  const suggested = suggestedResult.success ? suggestedResult.data : [];

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <VideoPlayer videoId={video._id} videoUrl={video.videoUrl} />

        <h1 className="text-xl font-semibold text-foreground">{video.title}</h1>

        <p className="text-sm text-muted-foreground">
          {video.viewCount} {video.viewCount === 1 ? "view" : "views"} ·{" "}
          {new Date(video.createdAt).toLocaleDateString()}
        </p>

        <Separator />

        <Link
          href={`/channel/${video.channel._id}`}
          className="font-medium text-foreground hover:underline"
        >
          {video.channel.name}
        </Link>

        <p className="whitespace-pre-line text-sm text-muted-foreground">
          {video.description}
        </p>
      </div>

      {suggested.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Up next</h2>
          <div className="flex flex-col gap-3">
            {suggested.map((suggestedVideo) => (
              <VideoCard key={suggestedVideo._id} {...suggestedVideo} horizontal />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
