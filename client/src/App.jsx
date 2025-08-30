import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getSocket } from "./utils/socket.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const App = () => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [user, setUser] = useState(null);
  const [socketStatus, setSocketStatus] = useState("disconnected");

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

  // Connect socket when phoneNumber is available
  const socket = useMemo(() => {
    try {
      if (!phoneNumber) return null;
      const s = getSocket(phoneNumber);
      s?.on("connect", () => setSocketStatus("connected"));
      s?.on("disconnect", () => setSocketStatus("disconnected"));
      return s;
    } catch (err) {
      console.error("socket memo error:", err?.message || err);
      return null;
    }
  }, [phoneNumber]);

  const handleSaveProfile = async (e) => {
    try {
      e.preventDefault();
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
          <div className="card shadow-sm">
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
                    placeholder="e.g. +91 98765 43210"
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

          <div className="small text-muted mt-2">
            Tip: iChat uses your phone number for identification. We’ll add
            OTP/verification in a later step.
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Chats (coming next)</h2>
              <p className="mb-0">
                You’re connected: <strong>{socketStatus}</strong>
                {user ? (
                  <>
                    {" "}
                    as <strong>{user.name}</strong> ({user.phoneNumber})
                  </>
                ) : (
                  " — save your profile to continue."
                )}
              </p>
              <hr />
              <div className="alert alert-info mb-0">
                In the next step we’ll add: conversations, real-time messages,
                image & sticker upload, and offline/PWA.
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-muted mt-4">
        <small>
          Responsive by Bootstrap — resize the window to see it adapt.
        </small>
      </footer>
    </div>
  );
};

export default App;
