import React, { useEffect, useState, useMemo } from "react";
import { getSocket } from "../utils/socket.js";

const Chat = () => {
  const user = JSON.parse(localStorage.getItem("ichat_user") || "null");
  const [socketStatus, setSocketStatus] = useState("disconnected");

  const socket = useMemo(() => {
    if (!user?.phoneNumber) return null;
    const s = getSocket(user.phoneNumber);
    s.on("connect", () => setSocketStatus("connected"));
    s.on("disconnect", () => setSocketStatus("disconnected"));
    return s;
  }, [user?.phoneNumber]);

  return (
    <div className="container py-4">
      <header className="d-flex justify-content-between mb-4">
        <h1 className="h4 m-0">iChat</h1>
        <span
          className={`badge ${
            socketStatus === "connected" ? "bg-success" : "bg-secondary"
          }`}
        >
          {socketStatus}
        </span>
      </header>

      <div className="card shadow-sm">
        <div className="card-body">
          <h2 className="h5">Hello, {user?.name} 👋</h2>
          <p className="text-muted">Phone: {user?.phoneNumber}</p>
          <hr />
          <p>Chats UI will be here (from previous step).</p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
