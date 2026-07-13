import express from "express";
import { query, execute } from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// GET all logs, ordered by most recent
router.get("/", async (req, res) => {
  try {
    const logs = await query("SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 1000");
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a log entry
router.post("/", async (req, res) => {
  try {
    const { admin_id, admin_name, action, target_user_id, target_user_name, details } = req.body;
    if (!admin_id || !admin_name || !action) {
      return res.status(400).json({ error: "admin_id, admin_name and action are required" });
    }
    const id = uuidv4();
    await execute(
      "INSERT INTO admin_logs (id, admin_id, admin_name, action, target_user_id, target_user_name, details) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, admin_id, admin_name, action, target_user_id || null, target_user_name || null, details || null]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE all logs (admin)
router.delete("/all", async (req, res) => {
  try {
    await execute("DELETE FROM admin_logs");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
