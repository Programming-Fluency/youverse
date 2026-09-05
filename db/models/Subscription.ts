import mongoose, { Schema } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    subscriberUserId: { type: String, required: true },
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
  },
  { timestamps: true }
);

// Prevents a user from subscribing to the same channel more than once.
SubscriptionSchema.index({ subscriberUserId: 1, channelId: 1 }, { unique: true });

export default mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);
