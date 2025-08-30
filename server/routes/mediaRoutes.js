import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    const name = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage });

export const mediaRouter = Router();

// single image upload
mediaRouter.post("/upload-image", upload.single("image"), (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ ok: false, message: "No file uploaded" });
    const publicPath = `/public/uploads/${req.file.filename}`;
    return res.json({ ok: true, url: publicPath, filename: req.file.filename });
  } catch (err) {
    console.error("upload-image error:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});
