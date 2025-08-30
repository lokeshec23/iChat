import React, { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

const STATUS_MAP = {
  sent: "✓",
  delivered: "✓✓",
  read: "✓✓ (read)",
};

const ChatWindow = ({ chat, phoneNumber, socket }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const listRef = useRef(null);

  const fetchMessages = async () => {
    try {
      if (!chat?._id) return;
      const res = await api.get(`/api/chats/${chat._id}/messages`);
      if (res?.data?.ok) setMessages(res.data.messages || []);
    } catch (err) {
      console.error("fetchMessages error:", err?.message || err);
    }
  };

  useEffect(() => {
    try {
      fetchMessages();
      // join chat room
      socket?.emit("join_chat", { chatId: chat._id });
      // listeners
      const onMessage = (m) => {
        if (m.chatId === chat._id) setMessages((prev) => [...prev, m]);
      };
      const onStatus = ({ messageId, status }) => {
        setMessages((prev) =>
          prev.map((x) => (x._id === messageId ? { ...x, status } : x))
        );
      };
      const onTyping = ({ chatId, sender, isTyping }) => {
        if (chatId === chat._id && sender !== phoneNumber)
          setIsTyping(!!isTyping);
      };

      socket?.on("message", onMessage);
      socket?.on("message_status", onStatus);
      socket?.on("typing", onTyping);

      return () => {
        try {
          socket?.off("message", onMessage);
          socket?.off("message_status", onStatus);
          socket?.off("typing", onTyping);
        } catch (err) {
          console.error("cleanup listeners error:", err?.message || err);
        }
      };
    } catch (err) {
      console.error("ChatWindow effect error:", err?.message || err);
    }
  }, [chat?._id, socket]);

  useEffect(() => {
    try {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    } catch (err) {
      // ignore
    }
  }, [messages.length, isTyping]);

  const sendText = async (ev) => {
    try {
      ev?.preventDefault();
      const content = (text || "").trim();
      if (!content) return;

      const payload = {
        chatId: chat._id,
        sender: phoneNumber,
        type: "text",
        content,
      };

      // optimistic UI
      const temp = {
        _id: `tmp-${Date.now()}`,
        chatId: chat._id,
        sender: phoneNumber,
        type: "text",
        content,
        status: "sent",
        createdAt: new Date().toISOString(),
      };
      setMessages((p) => [...p, temp]);
      setText("");

      // send via socket if connected, else queue
      if (socket?.connected) {
        socket.emit("send_message", payload);
      } else {
        queueOutgoingMessage(payload);
      }
    } catch (err) {
      console.error("sendText error:", err?.message || err);
    }
  };

  const queueOutgoingMessage = (payload) => {
    try {
      const q = JSON.parse(
        localStorage.getItem("ichat_outgoing_queue") || "[]"
      );
      q.push(payload);
      localStorage.setItem("ichat_outgoing_queue", JSON.stringify(q));
    } catch (err) {
      console.error("queueOutgoingMessage error:", err?.message || err);
    }
  };

  const sendImage = async (file) => {
    try {
      if (!file) return;
      setUploading(true);
      const form = new FormData();
      form.append("image", file);
      const res = await api.post("/api/media/upload-image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res?.data?.ok) {
        const url = res.data.url;
        const payload = {
          chatId: chat._id,
          sender: phoneNumber,
          type: "image",
          content: url,
        };
        // optimistic
        setMessages((p) => [
          ...p,
          {
            _id: `tmp-${Date.now()}`,
            chatId: chat._id,
            sender: phoneNumber,
            type: "image",
            content: url,
            status: "sent",
            createdAt: new Date().toISOString(),
          },
        ]);
        if (socket?.connected) socket.emit("send_message", payload);
        else queueOutgoingMessage(payload);
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error("sendImage error:", err?.message || err);
      alert("Upload error");
    } finally {
      setUploading(false);
    }
  };

  // Flush outgoing queue when channel reconnects (handled in parent)
  const renderMessage = (m) => {
    const mine = m.sender === phoneNumber;
    return (
      <div
        key={m._id}
        className={`d-flex mb-2 ${
          mine ? "justify-content-end" : "justify-content-start"
        }`}
      >
        <div
          className={`p-2 rounded-3 ${
            mine ? "bg-primary text-white" : "bg-light"
          }`}
          style={{ maxWidth: "75%" }}
        >
          {m.type === "text" && <div>{m.content}</div>}
          {m.type === "image" && (
            <img
              src={m.content}
              alt="img"
              className="img-fluid rounded"
              style={{ maxHeight: 300 }}
            />
          )}
          {m.type === "sticker" && (
            <div style={{ fontSize: 48 }}>{m.content}</div>
          )}
          <div className="small text-muted mt-1 d-flex justify-content-end">
            <span>{mine ? STATUS_MAP[m.status] || m.status : ""}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="d-flex flex-column h-100" style={{ minHeight: 400 }}>
      <div
        className="border rounded p-2 mb-2 bg-white"
        style={{ height: 320, overflowY: "auto" }}
        ref={listRef}
      >
        {messages.map(renderMessage)}
        {isTyping && <div className="small text-muted">Typing...</div>}
      </div>

      <form onSubmit={sendText} className="d-flex gap-2">
        <input
          className="form-control"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            socket?.emit("typing", {
              chatId: chat._id,
              sender: phoneNumber,
              isTyping: !!e.target.value,
            });
          }}
        />
        <div className="d-flex gap-2">
          <label className="btn btn-outline-secondary mb-0">
            📎
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) sendImage(file);
                e.target.value = "";
              }}
            />
          </label>
          <div className="dropdown">
            <button
              className="btn btn-outline-secondary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
            >
              😀
            </button>
            <ul
              className="dropdown-menu dropdown-menu-end p-2"
              style={{ minWidth: 160 }}
            >
              {["😀", "😂", "🥳", "🔥", "👍", "❤️"].map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="btn btn-sm btn-light w-100 mb-1"
                    onClick={() => {
                      const payload = {
                        chatId: chat._id,
                        sender: phoneNumber,
                        type: "sticker",
                        content: s,
                      };
                      setMessages((p) => [
                        ...p,
                        {
                          _id: `tmp-${Date.now()}`,
                          chatId: chat._id,
                          sender: phoneNumber,
                          type: "sticker",
                          content: s,
                          status: "sent",
                          createdAt: new Date().toISOString(),
                        },
                      ]);
                      if (socket?.connected)
                        socket.emit("send_message", payload);
                      else queueOutgoingMessage(payload);
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{s}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={!text.trim()}
          >
            Send
          </button>
        </div>
      </form>

      {uploading && (
        <div className="small text-muted mt-2">Uploading image...</div>
      )}
    </div>
  );
};

export default ChatWindow;
