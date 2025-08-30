import { Chat } from "../models/Chat.js";
import { Message } from "../models/Message.js";

export const initSocket = (io) => {
  try {
    io.on("connection", (socket) => {
      try {
        const { phoneNumber } = socket.handshake.query || {};
        if (phoneNumber) socket.join(`user:${phoneNumber}`);

        console.log(
          "Socket connected:",
          socket.id,
          "phone:",
          phoneNumber || "unknown"
        );

        // Join chat room
        socket.on("join_chat", async (payload = {}) => {
          try {
            const { chatId } = payload;
            if (!chatId) return;
            socket.join(`chat:${chatId}`);
          } catch (err) {
            console.error("join_chat error:", err?.message || err);
          }
        });

        // Send message event: create message, broadcast to chat room and participant rooms
        socket.on("send_message", async (payload = {}) => {
          try {
            const { chatId, sender, type, content, meta } = payload;
            if (!chatId || !sender || !type || !content) return;

            const msg = await Message.create({
              chatId,
              sender,
              type,
              content,
              meta: meta || {},
            });

            // update lastMessage on chat
            await Chat.findByIdAndUpdate(chatId, {
              $set: {
                lastMessage: {
                  text: type === "text" ? content : `[${type}]`,
                  type,
                  at: new Date(),
                },
              },
            });

            const messageObj = msg.toObject();

            // Emit to chat room (everyone in that chat)
            io.to(`chat:${chatId}`).emit("message", messageObj);

            // Emit to each participant's personal room for push/notifications
            const chat = await Chat.findById(chatId).lean();
            if (chat?.participants?.length) {
              chat.participants.forEach((p) => {
                io.to(`user:${p}`).emit("new_message_notification", {
                  chatId,
                  message: messageObj,
                });
              });
            }
          } catch (err) {
            console.error("send_message error:", err?.message || err);
          }
        });

        // Delivered / read ack
        socket.on("message_delivered", async (payload = {}) => {
          try {
            const { messageId, by } = payload;
            if (!messageId) return;
            const m = await Message.findByIdAndUpdate(
              messageId,
              { $set: { status: "delivered" } },
              { new: true }
            );
            if (m) {
              io.to(`chat:${m.chatId}`).emit("message_status", {
                messageId,
                status: "delivered",
                by,
              });
            }
          } catch (err) {
            console.error("message_delivered error:", err?.message || err);
          }
        });

        socket.on("message_read", async (payload = {}) => {
          try {
            const { messageId, by } = payload;
            if (!messageId) return;
            const m = await Message.findByIdAndUpdate(
              messageId,
              { $set: { status: "read" } },
              { new: true }
            );
            if (m) {
              io.to(`chat:${m.chatId}`).emit("message_status", {
                messageId,
                status: "read",
                by,
              });
            }
          } catch (err) {
            console.error("message_read error:", err?.message || err);
          }
        });

        // Typing indicator
        socket.on("typing", (payload = {}) => {
          try {
            const { chatId, sender, isTyping } = payload;
            if (!chatId || !sender) return;
            socket
              .to(`chat:${chatId}`)
              .emit("typing", { chatId, sender, isTyping });
          } catch (err) {
            console.error("typing error:", err?.message || err);
          }
        });

        socket.on("disconnect", () => {
          try {
            console.log("Socket disconnected:", socket.id);
          } catch (err) {
            console.error("disconnect handler error:", err?.message || err);
          }
        });
      } catch (err) {
        console.error("connection handler error:", err?.message || err);
      }
    });
  } catch (err) {
    console.error("initSocket error:", err?.message || err);
  }
};
