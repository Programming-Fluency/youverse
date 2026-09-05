"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Channel from "@/db/models/Channel";
import Video from "@/db/models/Video";
import Subscription from "@/db/models/Subscription";
import ViewHistory from "@/db/models/ViewHistory";
import { ok, fail, dbFail } from "@/lib/action-result";

export type ChannelPageVideo = {
  _id: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  createdAt: string;
  viewCount: number;
};

export type ChannelPageData = {
  _id: string;
  name: string;
  description: string;
  bannerUrl: string;
  subscriberCount: number;
  isOwner: boolean;
  isSubscribed: boolean;
  videos: ChannelPageVideo[];
};

export async function getChannelPageData(channelId: string) {
  try {
    await connectToDatabase();

    const channel = await Channel.findById(channelId).lean();
    if (!channel) {
      return fail<ChannelPageData>("Channel not found.");
    }

    const session = await auth.api.getSession({ headers: await headers() });

    const [videos, subscriberCount, subscription] = await Promise.all([
      Video.find({ channelId }).sort({ createdAt: -1 }).lean(),
      Subscription.countDocuments({ channelId }),
      session
        ? Subscription.findOne({
            subscriberUserId: session.user.id,
            channelId,
          }).lean()
        : null,
    ]);

    const viewCounts = await ViewHistory.aggregate([
      { $match: { videoId: { $in: videos.map((v) => v._id) } } },
      { $group: { _id: "$videoId", count: { $sum: 1 } } },
    ]);
    const viewCountByVideoId = new Map(
      viewCounts.map((v) => [v._id.toString(), v.count as number])
    );

    return ok<ChannelPageData>({
      _id: channel._id.toString(),
      name: channel.name,
      description: channel.description ?? "",
      bannerUrl: channel.bannerUrl ?? "",
      subscriberCount,
      isOwner: session?.user.id === channel.userId,
      isSubscribed: Boolean(subscription),
      videos: videos.map((video) => ({
        _id: video._id.toString(),
        title: video.title,
        thumbnailUrl: video.thumbnailUrl ?? "",
        duration: video.duration ?? 0,
        createdAt: video.createdAt.toISOString(),
        viewCount: viewCountByVideoId.get(video._id.toString()) ?? 0,
      })),
    });
  } catch {
    return dbFail<ChannelPageData>();
  }
}

export async function toggleSubscription(channelId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail<{ isSubscribed: boolean }>("Not authenticated.");

  try {
    await connectToDatabase();

    const existing = await Subscription.findOne({
      subscriberUserId: session.user.id,
      channelId,
    });

    if (existing) {
      await existing.deleteOne();
      return ok({ isSubscribed: false });
    }

    await Subscription.create({
      subscriberUserId: session.user.id,
      channelId,
    });
    return ok({ isSubscribed: true });
  } catch {
    return dbFail<{ isSubscribed: boolean }>();
  }
}
