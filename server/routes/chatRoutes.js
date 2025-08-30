import { Router } from "express";
import { Chat } from "../models/Chat.js";
import { Message } from "../models/Message.js";
import mongoose from "mongoose";

export const chatRouter = Router();

// Create or get one-to-one chat by participants (array of phone numbers)
chatRouter.post("/one-to-one", async (req, res) => {
  try {
    const { a, b } = req.body || {};
    if (!a || !b)
      return res.status(400).json({ ok: false, message: "a and b required" });
    const participants = [a, b].sort();
    let chat = await Chat.findOne({ participants });
    if (!chat) {
      chat = await Chat.create({ participants });
    }
    return res.json({ ok: true, chat });
  } catch (err) {
    console.error("one-to-one error:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Fetch chats for a phoneNumber
chatRouter.get("/for/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone)
      return res.status(400).json({ ok: false, message: "phone required" });

    const chats = await Chat.find({ participants: phone })
      .sort({ updatedAt: -1 })
      .lean();
    return res.json({ ok: true, chats });
  } catch (err) {
    console.error("get chats error:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Fetch messages for chatId with pagination
chatRouter.get("/:chatId/messages", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;
    if (!mongoose.Types.ObjectId.isValid(chatId))
      return res.status(400).json({ ok: false, message: "Invalid chatId" });

    const q = { chatId };
    if (before) q.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(q)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    return res.json({ ok: true, messages: messages.reverse() });
  } catch (err) {
    console.error("get messages error:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Send message via REST (backup) — server will save and emit via sockets if possible
chatRouter.post("/:chatId/messages", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { sender, type, content, meta } = req.body || {};
    if (!sender || !type || !content)
      return res
        .status(400)
        .json({ ok: false, message: "sender, type, content required" });

    // Save message
    const message = await Message.create({
      chatId,
      sender,
      type,
      content,
      meta: meta || {},
    });

    // Update chat lastMessage
    await Chat.findByIdAndUpdate(chatId, {
      $set: {
        lastMessage: {
          text: type === "text" ? content : `[${type}]`,
          type,
          at: new Date(),
        },
      },
    });

    // Return message to client — socket emission handled separately in sockets
    return res.json({ ok: true, message });
  } catch (err) {
    console.error("post message error:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});
