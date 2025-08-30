import { Router } from "express";
import { User } from "../models/User.js";

export const userRouter = Router();

// Upsert by phoneNumber — create if missing, update name/phone if exists.
userRouter.post("/upsert", async (req, res) => {
  try {
    const { name, phoneNumber } = req.body || {};
    if (!name || !phoneNumber) {
      return res
        .status(400)
        .json({ ok: false, message: "name and phoneNumber are required" });
    }

    const user = await User.findOneAndUpdate(
      { phoneNumber },
      { $set: { name, phoneNumber } },
      { new: true, upsert: true }
    );

    return res.json({ ok: true, user });
  } catch (err) {
    console.error("Upsert user error:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Update by _id (allows changing both name and phoneNumber)
userRouter.put("/:id", async (req, res) => {
  try {
    const { name, phoneNumber } = req.body || {};
    const { id } = req.params;

    if (!id)
      return res.status(400).json({ ok: false, message: "Missing user id" });

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { ...(name && { name }), ...(phoneNumber && { phoneNumber }) } },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ ok: false, message: "User not found" });
    return res.json({ ok: true, user: updated });
  } catch (err) {
    console.error("Update user error:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});
