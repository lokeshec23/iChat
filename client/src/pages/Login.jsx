import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const Login = () => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    try {
      e.preventDefault();
      if (!name.trim() || !phoneNumber.trim()) {
        alert("Enter both name and phone number");
        return;
      }

      const res = await api.post("/api/users/upsert", {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      if (res?.data?.ok) {
        localStorage.setItem("ichat_user", JSON.stringify(res.data.user));
        navigate("/chat");
      } else {
        alert(res?.data?.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err?.message || err);
      alert("Server error during login");
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div
        className="card shadow-sm p-4"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <h2 className="h4 text-center mb-4">Welcome to iChat</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Phone Number</label>
            <input
              className="form-control"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Your phone number"
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
