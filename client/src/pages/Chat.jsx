import React, { useEffect, useMemo, useState } from "react";
import { getSocket } from "../utils/socket.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const Chat = () => {
  const user = JSON.parse(localStorage.getItem("ichat_user") || "null");
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [chats, setChats] = useState([]); // list of chats
  const [activeChat, setActiveChat] = useState(null); // selected chat
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // socket connection
  const socket = useMemo(() => {
    if (!user?.phoneNumber) return null;
    const s = getSocket(user.phoneNumber);
    s.on("connect", () => setSocketStatus("connected"));
    s.on("disconnect", () => setSocketStatus("disconnected"));
    return s;
  }, [user?.phoneNumber]);

  // Load chats (dummy for now — later will fetch from server)
  useEffect(() => {
    const dummyChats = [
      { _id: "1", name: "Alice", phoneNumber: "1111111111" },
      { _id: "2", name: "Bob", phoneNumber: "2222222222" },
    ];
    setChats(dummyChats);
    setActiveChat(dummyChats[0]);
  }, []);

  // Load messages when activeChat changes (dummy data for now)
  useEffect(() => {
    if (!activeChat) return;
    setMessages([
      {
        _id: "m1",
        chatId: activeChat._id,
        sender: "Alice",
        text: "Hey Lokesh 👋",
        createdAt: new Date(),
      },
      {
        _id: "m2",
        chatId: activeChat._id,
        sender: user.name,
        text: "Hello!",
        createdAt: new Date(),
      },
    ]);
  }, [activeChat]);

  // Handle receiving new messages
  useEffect(() => {
    if (!socket || !activeChat) return;

    const handleNewMessage = (msg) => {
      if (msg.chatId === activeChat._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, activeChat]);

  // send message
  const handleSendMessage = async (e) => {
    try {
      e.preventDefault();
      if (!activeChat || !text.trim()) return;

      const tempId = uuidv4();
      const optimisticMsg = {
        _id: tempId,
        chatId: activeChat._id,
        sender: user.name,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        optimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      socket.emit("message:send", {
        chatId: activeChat._id,
        senderId: user._id,
        text: text.trim(),
      });

      setText("");
    } catch (err) {
      console.error("send message error:", err?.message || err);
    }
  };

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        {/* Sidebar */}
        <div className="col-12 col-md-4 border-end p-0">
          <div className="list-group list-group-flush">
            {chats.map((c) => (
              <button
                key={c._id}
                className={`list-group-item list-group-item-action ${
                  activeChat?._id === c._id ? "active" : ""
                }`}
                onClick={() => setActiveChat(c)}
              >
                <strong>{c.name}</strong>
                <div className="small text-muted">{c.phoneNumber}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="col-12 col-md-8 d-flex flex-column p-0">
          {activeChat ? (
            <>
              <div className="border-bottom p-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{activeChat.name}</h5>
                <span
                  className={`badge ${
                    socketStatus === "connected" ? "bg-success" : "bg-secondary"
                  }`}
                >
                  {socketStatus}
                </span>
              </div>

              <div
                className="flex-grow-1 overflow-auto p-3"
                style={{ background: "#f8f9fa" }}
              >
                {messages.map((m) => (
                  <div
                    key={m._id}
                    className={`d-flex mb-2 ${
                      m.sender === user.name
                        ? "justify-content-end"
                        : "justify-content-start"
                    }`}
                  >
                    <div
                      className={`p-2 rounded ${
                        m.sender === user.name
                          ? "bg-primary text-white"
                          : "bg-light"
                      }`}
                      style={{ maxWidth: "75%" }}
                    >
                      <div>{m.text}</div>
                      <div className="small text-muted text-end">
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="d-flex border-top p-2"
              >
                <input
                  className="form-control me-2"
                  placeholder="Type a message"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button className="btn btn-primary" type="submit">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="d-flex flex-grow-1 align-items-center justify-content-center text-muted">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
