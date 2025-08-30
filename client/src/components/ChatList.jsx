import React, { useEffect, useState } from "react";
import { api } from "../api.js";

const ChatList = ({ phoneNumber, onSelectChat }) => {
  const [chats, setChats] = useState([]);

  const fetchChats = async () => {
    try {
      if (!phoneNumber) return;
      const res = await api.get(
        `/api/chats/for/${encodeURIComponent(phoneNumber)}`
      );
      if (res?.data?.ok) setChats(res.data.chats || []);
    } catch (err) {
      console.error("fetchChats error:", err?.message || err);
    }
  };

  useEffect(() => {
    try {
      fetchChats();
      const id = setInterval(fetchChats, 5000); // poll for simplicity
      return () => clearInterval(id);
    } catch (err) {
      console.error("ChatList init error:", err?.message || err);
    }
  }, [phoneNumber]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="m-0">Chats</h6>
        <button className="btn btn-sm btn-outline-primary" onClick={fetchChats}>
          Refresh
        </button>
      </div>

      <div className="list-group">
        {chats.length === 0 && (
          <div className="text-muted small">No chats yet</div>
        )}
        {chats.map((c) => {
          const other =
            (c.participants || []).filter((p) => p !== phoneNumber)[0] ||
            c.participants[0];
          return (
            <button
              key={c._id}
              className="list-group-item list-group-item-action"
              onClick={() => onSelectChat(c)}
            >
              <div className="d-flex w-100 justify-content-between">
                <h6 className="mb-1 small">{c.title || other}</h6>
                <small className="text-muted">
                  {c.lastMessage?.at
                    ? new Date(c.lastMessage.at).toLocaleTimeString()
                    : ""}
                </small>
              </div>
              <p className="mb-1 small text-truncate">
                {c.lastMessage?.text || ""}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
