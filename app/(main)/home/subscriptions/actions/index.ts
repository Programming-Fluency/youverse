"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Channel from "@/db/models/Channel";
import Video from "@/db/models/Video";
import Subscription from "@/db/models/Subscription";
import ViewHistory from "@/db/models/ViewHistory";
import { ok, fail, dbFail } from "@/lib/action-result";
import type { FeedVideo } from "../../actions";

export async function getSubscriptionsFeed() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail<FeedVideo[]>("Not authenticated.");

  try {
    await connectToDatabase();

    const subscriptions = await Subscription.find({
      subscriberUserId: session.user.id,
    }).lean();
    const channelIds = subscriptions.map((s) => s.channelId.toString());

    if (channelIds.length === 0) {
      return ok<FeedVideo[]>([]);
    }

    const videos = await Video.find({ channelId: { $in: channelIds } })
      .sort({ createdAt: -1 })
      .lean();

    const channels = await Channel.find({ _id: { $in: channelIds } }).lean();
    const channelById = new Map(channels.map((c) => [c._id.toString(), c]));

    const viewCounts = await ViewHistory.aggregate([
      { $match: { videoId: { $in: videos.map((v) => v._id) } } },
      { $group: { _id: "$videoId", count: { $sum: 1 } } },
    ]);
    const viewCountByVideoId = new Map(
      viewCounts.map((v) => [v._id.toString(), v.count as number])
    );

    const feedVideos: FeedVideo[] = videos.flatMap((video) => {
      const channel = channelById.get(video.channelId.toString());
      if (!channel) return [];
      return [
        {
          _id: video._id.toString(),
          title: video.title,
          thumbnailUrl: video.thumbnailUrl ?? "",
          duration: video.duration ?? 0,
          createdAt: video.createdAt.toISOString(),
          viewCount: viewCountByVideoId.get(video._id.toString()) ?? 0,
          channel: {
            _id: channel._id.toString(),
            name: channel.name,
            isOwner: session.user.id === channel.userId,
            isSubscribed: true,
          },
        },
      ];
    });

    return ok(feedVideos);
  } catch {
    return dbFail<FeedVideo[]>();
  }
}
