"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Channel from "@/db/models/Channel";
import Video from "@/db/models/Video";
import Subscription from "@/db/models/Subscription";
import ViewHistory from "@/db/models/ViewHistory";
import { ok, dbFail } from "@/lib/action-result";
import type { FeedVideo } from "../../home/actions";

export type SearchChannelResult = {
  _id: string;
  name: string;
  description: string;
  bannerUrl: string;
  subscriberCount: number;
};

export type SearchVideoResult = FeedVideo;

export type SearchResult = {
  channels: SearchChannelResult[];
  videos: SearchVideoResult[];
};

export async function search(query: string) {
  const trimmed = query.trim();

  if (!trimmed) {
    return ok<SearchResult>({ channels: [], videos: [] });
  }

  try {
    await connectToDatabase();

    const session = await auth.api.getSession({ headers: await headers() });

    const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const [matchedChannels, matchedVideos] = await Promise.all([
      Channel.find({ name: regex }).sort({ createdAt: -1 }).limit(6).lean(),
      Video.find({ title: regex }).sort({ createdAt: -1 }).limit(24).lean(),
    ]);

    const matchedChannelIds = matchedChannels.map((c) => c._id);

    const subscriberCounts = await Subscription.aggregate([
      { $match: { channelId: { $in: matchedChannelIds } } },
      { $group: { _id: "$channelId", count: { $sum: 1 } } },
    ]);
    const subscriberCountByChannelId = new Map(
      subscriberCounts.map((s) => [s._id.toString(), s.count as number])
    );

    const channels: SearchChannelResult[] = matchedChannels.map((channel) => ({
      _id: channel._id.toString(),
      name: channel.name,
      description: channel.description ?? "",
      bannerUrl: channel.bannerUrl ?? "",
      subscriberCount: subscriberCountByChannelId.get(channel._id.toString()) ?? 0,
    }));

    const videoChannelIds = [
      ...new Set(matchedVideos.map((v) => v.channelId.toString())),
    ];
    const videoChannels = await Channel.find({ _id: { $in: videoChannelIds } }).lean();
    const videoChannelById = new Map(
      videoChannels.map((c) => [c._id.toString(), c])
    );

    const subscriptions = session
      ? await Subscription.find({
          subscriberUserId: session.user.id,
          channelId: { $in: videoChannelIds },
        }).lean()
      : [];
    const subscribedChannelIds = new Set(
      subscriptions.map((s) => s.channelId.toString())
    );

    const viewCounts = await ViewHistory.aggregate([
      { $match: { videoId: { $in: matchedVideos.map((v) => v._id) } } },
      { $group: { _id: "$videoId", count: { $sum: 1 } } },
    ]);
    const viewCountByVideoId = new Map(
      viewCounts.map((v) => [v._id.toString(), v.count as number])
    );

    const userId = session?.user.id;

    const videos: SearchVideoResult[] = matchedVideos.flatMap((video) => {
      const channel = videoChannelById.get(video.channelId.toString());
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
            isOwner: userId === channel.userId,
            isSubscribed: subscribedChannelIds.has(channel._id.toString()),
          },
        },
      ];
    });

    return ok<SearchResult>({ channels, videos });
  } catch {
    return dbFail<SearchResult>();
  }
}
