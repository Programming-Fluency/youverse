"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Channel from "@/db/models/Channel";
import Video from "@/db/models/Video";
import Subscription from "@/db/models/Subscription";
import ViewHistory from "@/db/models/ViewHistory";
import { ok, dbFail } from "@/lib/action-result";

export type FeedVideo = {
  _id: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  createdAt: string;
  viewCount: number;
  channel: {
    _id: string;
    name: string;
    isOwner: boolean;
    isSubscribed: boolean;
  };
};

export type HomeFeed = {
  subscribed: FeedVideo[];
  recommended: FeedVideo[];
  hasAnyVideos: boolean;
};

function toFeedVideo(
  video: {
    _id: { toString(): string };
    title: string;
    thumbnailUrl?: string | null;
    duration?: number | null;
    createdAt: Date;
  },
  channel: { _id: { toString(): string }; name: string; userId: string },
  viewCount: number,
  userId: string | undefined,
  subscribedChannelIds: Set<string>
): FeedVideo {
  return {
    _id: video._id.toString(),
    title: video.title,
    thumbnailUrl: video.thumbnailUrl ?? "",
    duration: video.duration ?? 0,
    createdAt: video.createdAt.toISOString(),
    viewCount,
    channel: {
      _id: channel._id.toString(),
      name: channel.name,
      isOwner: userId === channel.userId,
      isSubscribed: subscribedChannelIds.has(channel._id.toString()),
    },
  };
}

export async function getHomeFeed() {
  try {
    await connectToDatabase();

    const session = await auth.api.getSession({ headers: await headers() });

    const totalVideoCount = await Video.countDocuments();
    if (totalVideoCount === 0) {
      return ok<HomeFeed>({ subscribed: [], recommended: [], hasAnyVideos: false });
    }

    const subscriptions = session
      ? await Subscription.find({ subscriberUserId: session.user.id }).lean()
      : [];
    const subscribedChannelIds = new Set(
      subscriptions.map((s) => s.channelId.toString())
    );

    const subscribedVideos =
      subscribedChannelIds.size > 0
        ? await Video.find({ channelId: { $in: [...subscribedChannelIds] } })
            .sort({ createdAt: -1 })
            .lean()
        : [];

    const excludedVideoIds = new Set(subscribedVideos.map((v) => v._id.toString()));

    const recommendedVideos = await Video.find({
      _id: { $nin: [...excludedVideoIds] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const allVideos = [...subscribedVideos, ...recommendedVideos];
    const channelIds = [...new Set(allVideos.map((v) => v.channelId.toString()))];

    const channels = await Channel.find({ _id: { $in: channelIds } }).lean();
    const channelById = new Map(channels.map((c) => [c._id.toString(), c]));

    const viewCounts = await ViewHistory.aggregate([
      { $match: { videoId: { $in: allVideos.map((v) => v._id) } } },
      { $group: { _id: "$videoId", count: { $sum: 1 } } },
    ]);
    const viewCountByVideoId = new Map(
      viewCounts.map((v) => [v._id.toString(), v.count as number])
    );

    const userId = session?.user.id;

    function mapVideos(videos: typeof allVideos) {
      return videos.flatMap((video) => {
        const channel = channelById.get(video.channelId.toString());
        if (!channel) return [];
        return [
          toFeedVideo(
            video,
            channel,
            viewCountByVideoId.get(video._id.toString()) ?? 0,
            userId,
            subscribedChannelIds
          ),
        ];
      });
    }

    return ok<HomeFeed>({
      subscribed: mapVideos(subscribedVideos),
      recommended: mapVideos(recommendedVideos),
      hasAnyVideos: true,
    });
  } catch {
    return dbFail<HomeFeed>();
  }
}
