import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";

const mount = () => {
  try {
    const root = createRoot(document.getElementById("root"));
    root.render(<App />);
  } catch (err) {
    console.error("Client mount error:", err?.message || err);
  }
};

mount();
