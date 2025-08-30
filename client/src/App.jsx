import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { getSocket } from "./utils/socket.js";
import ChatList from "./components/ChatList.jsx";
import ChatWindow from "./components/ChatWindow.jsx";

const App = () => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [user, setUser] = useState(null);
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [activeChat, setActiveChat] = useState(null);

  // Load cached user
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("ichat_user") || "null");
      if (cached?.name) setName(cached.name);
      if (cached?.phoneNumber) setPhoneNumber(cached.phoneNumber);
      if (cached) setUser(cached);
    } catch (err) {
      console.error("load cache error:", err?.message || err);
    }
  }, []);

  // Socket instance
  const socket = useMemo(() => {
    try {
      if (!phoneNumber) return null;
      const s = getSocket(phoneNumber);
      s.on("connect", () => setSocketStatus("connected"));
      s.on("disconnect", () => setSocketStatus("disconnected"));

      // Flush queue on connect
      s.on("connect", () => {
        try {
          const q = JSON.parse(
            localStorage.getItem("ichat_outgoing_queue") || "[]"
          );
          if (Array.isArray(q) && q.length) {
            q.forEach((msg) => s.emit("send_message", msg));
            localStorage.removeItem("ichat_outgoing_queue");
          }
        } catch (err) {
          console.error("flush queue error:", err?.message || err);
        }
      });

      return s;
    } catch (err) {
      console.error("socket memo error:", err?.message || err);
      return null;
    }
  }, [phoneNumber]);

  const handleSaveProfile = async (e) => {
    try {
      e?.preventDefault();
      if (!name?.trim() || !phoneNumber?.trim()) return;

      const res = await api.post("/api/users/upsert", {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      if (res?.data?.ok) {
        localStorage.setItem("ichat_user", JSON.stringify(res.data.user));
        setUser(res.data.user);
        alert("Profile saved!");
      } else {
        alert(res?.data?.message || "Failed to save profile");
      }
    } catch (err) {
      console.error("save profile error:", err?.message || err);
      alert("Server error while saving profile");
    }
  };

  const startChatWith = async (otherPhone) => {
    try {
      if (!phoneNumber || !otherPhone) return;
      const payload = { a: phoneNumber, b: otherPhone };
      const res = await api.post("/api/chats/one-to-one", payload);
      if (res?.data?.ok) {
        setActiveChat(res.data.chat);
      } else {
        alert("Unable to open chat");
      }
    } catch (err) {
      console.error("startChatWith error:", err?.message || err);
    }
  };

  return (
    <div className="container py-4">
      <header className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 m-0">iChat</h1>
        <span
          className={`badge ${
            socketStatus === "connected" ? "bg-success" : "bg-secondary"
          }`}
        >
          {socketStatus}
        </span>
      </header>

      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <h2 className="h5 mb-3">Your Profile</h2>
              <form onSubmit={handleSaveProfile}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Lokesh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-control"
                    placeholder="e.g. 9361062252"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <button className="btn btn-primary w-100" type="submit">
                  Save
                </button>
              </form>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <ChatList
                phoneNumber={phoneNumber}
                onSelectChat={(c) => setActiveChat(c)}
              />
              <hr />
              <div>
                <h6 className="small">Start chat (quick)</h6>
                <StartChatForm onStart={startChatWith} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="card shadow-sm h-100">
            <div className="card-body d-flex flex-column">
              {activeChat ? (
                <>
                  <div className="mb-2 d-flex align-items-center justify-content-between">
                    <h5 className="h6 m-0">
                      {activeChat.title ||
                        activeChat.participants.find((p) => p !== phoneNumber)}
                    </h5>
                    <small className="text-muted">Chat</small>
                  </div>
                  <ChatWindow
                    chat={activeChat}
                    phoneNumber={phoneNumber}
                    socket={socket}
                  />
                </>
              ) : (
                <div className="text-center text-muted my-5">
                  <p>Select a chat or start a new one to begin messaging.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-muted mt-4">
        <small>
          Responsive by Bootstrap — messages are real-time using Socket.IO.
          Offline messages are queued locally and flushed when reconnected.
        </small>
      </footer>
    </div>
  );
};

const StartChatForm = ({ onStart }) => {
  const [other, setOther] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (other?.trim()) onStart(other.trim());
        setOther("");
      }}
      className="d-flex gap-2 mt-2"
    >
      <input
        className="form-control form-control-sm"
        placeholder="Other phone"
        value={other}
        onChange={(e) => setOther(e.target.value)}
      />
      <button className="btn btn-sm btn-outline-primary" type="submit">
        Open
      </button>
    </form>
  );
};

export default App;
