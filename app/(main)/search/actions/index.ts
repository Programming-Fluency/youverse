"use server";

import { connectToDatabase } from "@/lib/db";
import Channel from "@/db/models/Channel";
import Video from "@/db/models/Video";
import { ok, dbFail } from "@/lib/action-result";

export type SearchChannelResult = {
  _id: string;
  name: string;
  description: string;
};

export type SearchVideoResult = {
  _id: string;
  title: string;
  thumbnailUrl: string;
};

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

    const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const [channels, videos] = await Promise.all([
      Channel.find({ name: regex })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Video.find({ title: regex })
        .sort({ createdAt: -1 })
        .limit(24)
        .lean(),
    ]);

    return ok<SearchResult>({
      channels: channels.map((channel) => ({
        _id: channel._id.toString(),
        name: channel.name,
        description: channel.description ?? "",
      })),
      videos: videos.map((video) => ({
        _id: video._id.toString(),
        title: video.title,
        thumbnailUrl: video.thumbnailUrl ?? "",
      })),
    });
  } catch {
    return dbFail<SearchResult>();
  }
}
