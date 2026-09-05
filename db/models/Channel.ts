import mongoose, { Schema } from "mongoose";

const ChannelSchema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    bannerUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Channel || mongoose.model("Channel", ChannelSchema);
