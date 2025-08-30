import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    sender: { type: String, required: true }, // phone number
    type: {
      type: String,
      enum: ["text", "image", "sticker", "system"],
      required: true,
    },
    content: { type: String, required: true }, // text or image path or sticker id
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    meta: { type: Object, default: {} }, // for width/height/fileSize etc
  },
  { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);
