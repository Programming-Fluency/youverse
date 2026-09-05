import * as z from "zod";

export const createChannelSchema = z.object({
  name: z.string().min(1, "Channel name is required.").max(100, "Channel name is too long."),
  description: z.string().max(1000, "Description is too long."),
  bannerUrl: z.string(),
});

export type CreateChannelValues = z.infer<typeof createChannelSchema>;

export const editBannerSchema = z.object({
  channelId: z.string().min(1, "Channel is required."),
  bannerUrl: z.string().min(1, "Upload a banner image first."),
});

export type EditBannerValues = z.infer<typeof editBannerSchema>;

export const uploadVideoSchema = z.object({
  channelId: z.string().min(1, "Channel is required."),
  title: z.string().min(1, "Video title is required.").max(100, "Title is too long."),
  description: z.string().max(5000, "Description is too long."),
  videoUrl: z.string().min(1, "Upload a video file first."),
  thumbnailUrl: z.string().min(1, "Upload a thumbnail first."),
  duration: z.number(),
});

export type UploadVideoValues = z.infer<typeof uploadVideoSchema>;
