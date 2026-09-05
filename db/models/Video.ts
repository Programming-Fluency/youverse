import mongoose, { Schema } from "mongoose";

const VideoSchema = new Schema(
  {
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    title: { type: String, required: true },
    description: { type: String },
    thumbnailUrl: { type: String },
    videoUrl: { type: String, required: true },
    duration: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.models.Video || mongoose.model("Video", VideoSchema);
