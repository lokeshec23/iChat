import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/db.js";
import { userRouter } from "./routes/userRoutes.js";
import { mediaRouter } from "./routes/mediaRoutes.js";
import { chatRouter } from "./routes/chatRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import { initSocket } from "./sockets/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bootstrap = async () => {
  try {
    await connectDB();

    const app = express();
    app.use(express.json({ limit: "10mb" }));
    app.use(
      cors({
        origin: process.env.CLIENT_ORIGIN || "*",
        credentials: true,
      })
    );

    // serve uploads as static
    app.use("/public", express.static(path.join(__dirname, "public")));

    // Health check
    app.get("/api/health", (_req, res) => {
      try {
        return res.json({
          ok: true,
          service: "iChat server",
          time: new Date().toISOString(),
        });
      } catch (err) {
        return res.status(500).json({ ok: false });
      }
    });

    // Routes
    app.use("/api/users", userRouter);
    app.use("/api/media", mediaRouter);
    app.use("/api/chats", chatRouter);

    // HTTP + Socket.IO
    const server = http.createServer(app);
    const io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_ORIGIN || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
      },
    });

    initSocket(io);

    const PORT = Number(process.env.PORT || 5000);
    server.listen(PORT, () => {
      console.log(`iChat server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server bootstrap error:", err?.message || err);
    process.exit(1);
  }
};

bootstrap();
