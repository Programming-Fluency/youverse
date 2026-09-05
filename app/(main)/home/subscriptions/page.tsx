import Link from "next/link";
import { UsersIcon } from "lucide-react";
import { getSubscriptionsFeed } from "./actions";
import { VideoCard } from "../../components/video-card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

export default async function SubscriptionsPage() {
  const result = await getSubscriptionsFeed();
  const videos = result.success ? result.data : [];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Subscriptions</h1>

      {videos.length === 0 ? (
        <Empty className="min-h-[60vh]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No subscriptions yet</EmptyTitle>
            <EmptyDescription>
              Subscribe to channels to see their videos here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button className="cursor-pointer" render={<Link href="/home" />}>
              Go to home
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video._id} {...video} />
          ))}
        </div>
      )}
    </div>
  );
}
