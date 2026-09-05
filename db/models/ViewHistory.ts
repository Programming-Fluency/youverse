import mongoose, { Schema } from "mongoose";

const ViewHistorySchema = new Schema(
  {
    userId: { type: String, required: true },
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    watchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.ViewHistory || mongoose.model("ViewHistory", ViewHistorySchema);
