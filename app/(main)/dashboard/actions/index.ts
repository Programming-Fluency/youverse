"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Channel from "@/db/models/Channel";
import Video from "@/db/models/Video";
import ViewHistory from "@/db/models/ViewHistory";
import { ok, okVoid, fail, dbFail } from "@/lib/action-result";
import {
  createChannelSchema,
  editBannerSchema,
  uploadVideoSchema,
  type CreateChannelValues,
  type EditBannerValues,
  type UploadVideoValues,
} from "../validations";

export type DashboardVideo = {
  _id: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  createdAt: string;
  viewCount: number;
};

export type DashboardChannel = {
  _id: string;
  name: string;
  description: string;
  bannerUrl: string;
  videos: DashboardVideo[];
};

export async function getOwnedChannels() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail<DashboardChannel[]>("Not authenticated.");

  try {
    await connectToDatabase();

    const channels = await Channel.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const videosByChannel = await Video.find({
      channelId: { $in: channels.map((c) => c._id) },
    })
      .sort({ createdAt: -1 })
      .lean();

    const viewCounts = await ViewHistory.aggregate([
      { $match: { videoId: { $in: videosByChannel.map((v) => v._id) } } },
      { $group: { _id: "$videoId", count: { $sum: 1 } } },
    ]);
    const viewCountByVideoId = new Map(
      viewCounts.map((v) => [v._id.toString(), v.count as number])
    );

    return ok<DashboardChannel[]>(
      channels.map((channel) => ({
        _id: channel._id.toString(),
        name: channel.name,
        description: channel.description ?? "",
        bannerUrl: channel.bannerUrl ?? "",
        videos: videosByChannel
          .filter((v) => v.channelId.toString() === channel._id.toString())
          .map((video) => ({
            _id: video._id.toString(),
            title: video.title,
            thumbnailUrl: video.thumbnailUrl ?? "",
            duration: video.duration ?? 0,
            createdAt: video.createdAt.toISOString(),
            viewCount: viewCountByVideoId.get(video._id.toString()) ?? 0,
          })),
      }))
    );
  } catch {
    return dbFail<DashboardChannel[]>();
  }
}

export async function createChannel(input: CreateChannelValues) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail("Not authenticated.");

  const parsed = createChannelSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  try {
    await connectToDatabase();
    await Channel.create({
      userId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      bannerUrl: parsed.data.bannerUrl,
    });
    return okVoid();
  } catch {
    return dbFail();
  }
}

export async function updateChannelBanner(input: EditBannerValues) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail("Not authenticated.");

  const parsed = editBannerSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  try {
    await connectToDatabase();
    const channel = await Channel.findOne({
      _id: parsed.data.channelId,
      userId: session.user.id,
    });

    if (!channel) return fail("Channel not found.");

    channel.bannerUrl = parsed.data.bannerUrl;
    await channel.save();
    return okVoid();
  } catch {
    return dbFail();
  }
}

export async function uploadVideo(input: UploadVideoValues) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail("Not authenticated.");

  const parsed = uploadVideoSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  try {
    await connectToDatabase();
    const channel = await Channel.findOne({
      _id: parsed.data.channelId,
      userId: session.user.id,
    });

    if (!channel) return fail("Channel not found.");

    await Video.create({
      channelId: channel._id,
      title: parsed.data.title,
      description: parsed.data.description,
      videoUrl: parsed.data.videoUrl,
      thumbnailUrl: parsed.data.thumbnailUrl,
      duration: parsed.data.duration,
    });
    return okVoid();
  } catch {
    return dbFail();
  }
}
