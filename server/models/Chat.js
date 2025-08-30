import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    // participants store phone numbers
    participants: { type: [String], required: true, index: true },
    title: { type: String, default: "" }, // optional for group chats
    lastMessage: {
      text: { type: String, default: "" },
      type: {
        type: String,
        enum: ["text", "image", "sticker", "system"],
        default: "text",
      },
      at: { type: Date },
    },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });

export const Chat = mongoose.model("Chat", chatSchema);
