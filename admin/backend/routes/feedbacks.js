import express from "express";
import { query, execute } from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// GET all feedbacks with user info (paginated)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const countResult = await query("SELECT COUNT(*) as total FROM feedbacks");
    const total = countResult[0]?.total || 0;
    const feedbacks = await query(`
      SELECT f.*, u.full_name, u.email, u.avatar
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    res.json({ feedbacks, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create feedback
router.post("/", async (req, res) => {
  try {
    const { userId, message, rating } = req.body;
    if (!userId || !message) return res.status(400).json({ error: "userId and message required" });
    const id = uuidv4();
    await execute(
      "INSERT INTO feedbacks (id, user_id, message, rating) VALUES (?, ?, ?, ?)",
      [id, userId, message, rating || 5]
    );
    const feedbacks = await query(`
      SELECT f.*, u.full_name, u.email, u.avatar
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.id = ?
    `, [id]);
    res.json(feedbacks[0] || { id, user_id: userId, message, rating, created_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE feedback (admin only)
router.delete("/:id", async (req, res) => {
  try {
    await execute("DELETE FROM feedbacks WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
