"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Channel from "@/db/models/Channel";
import Video from "@/db/models/Video";
import Subscription from "@/db/models/Subscription";
import ViewHistory from "@/db/models/ViewHistory";
import { ok, okVoid, fail, dbFail } from "@/lib/action-result";
import type { FeedVideo } from "../../../home/actions";

export type WatchVideo = {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  createdAt: string;
  viewCount: number;
  channel: {
    _id: string;
    name: string;
  };
};

export async function getVideo(id: string) {
  try {
    await connectToDatabase();

    const video = await Video.findById(id).lean();
    if (!video) {
      return fail<WatchVideo>("Video not found.");
    }

    const channel = await Channel.findById(video.channelId).lean();
    if (!channel) {
      return fail<WatchVideo>("Video not found.");
    }

    const viewCount = await ViewHistory.countDocuments({ videoId: video._id });

    return ok<WatchVideo>({
      _id: video._id.toString(),
      title: video.title,
      description: video.description ?? "",
      videoUrl: video.videoUrl,
      duration: video.duration ?? 0,
      createdAt: video.createdAt.toISOString(),
      viewCount,
      channel: {
        _id: channel._id.toString(),
        name: channel.name,
      },
    });
  } catch {
    return dbFail<WatchVideo>();
  }
}

export async function recordView(videoId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return okVoid();

  try {
    await connectToDatabase();
    await ViewHistory.create({ userId: session.user.id, videoId });
    return okVoid();
  } catch {
    return dbFail();
  }
}

export async function getSuggestedVideos(currentVideoId: string, channelId: string) {
  try {
    await connectToDatabase();

    const session = await auth.api.getSession({ headers: await headers() });

    const sameChannelVideos = await Video.find({
      channelId,
      _id: { $ne: currentVideoId },
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const excludedVideoIds = [
      currentVideoId,
      ...sameChannelVideos.map((v) => v._id.toString()),
    ];

    const otherChannelVideos = await Video.find({
      channelId: { $ne: channelId },
      _id: { $nin: excludedVideoIds },
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const allVideos = [...sameChannelVideos, ...otherChannelVideos];
    if (allVideos.length === 0) {
      return ok<FeedVideo[]>([]);
    }

    const channelIds = [...new Set(allVideos.map((v) => v.channelId.toString()))];
    const channels = await Channel.find({ _id: { $in: channelIds } }).lean();
    const channelById = new Map(channels.map((c) => [c._id.toString(), c]));

    const subscriptions = session
      ? await Subscription.find({
          subscriberUserId: session.user.id,
          channelId: { $in: channelIds },
        }).lean()
      : [];
    const subscribedChannelIds = new Set(
      subscriptions.map((s) => s.channelId.toString())
    );

    const viewCounts = await ViewHistory.aggregate([
      { $match: { videoId: { $in: allVideos.map((v) => v._id) } } },
      { $group: { _id: "$videoId", count: { $sum: 1 } } },
    ]);
    const viewCountByVideoId = new Map(
      viewCounts.map((v) => [v._id.toString(), v.count as number])
    );

    const userId = session?.user.id;

    const suggested: FeedVideo[] = allVideos.flatMap((video) => {
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
            isOwner: userId === channel.userId,
            isSubscribed: subscribedChannelIds.has(channel._id.toString()),
          },
        },
      ];
    });

    return ok(suggested);
  } catch {
    return dbFail<FeedVideo[]>();
  }
}
