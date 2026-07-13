import { v4 as uuidv4 } from "uuid";
import express from "express";
import { query, queryOne, execute } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  // If ?top=1, return top users by rank (ignores the manual leaders table)
  if (req.query.top === "1") {
    const topUsers = await query(`
      SELECT id, full_name as name, avatar, rank, e_money, direct_count
      FROM users
      WHERE role != 'admin' AND rank IS NOT NULL AND rank != ''
      ORDER BY
        CASE rank
          WHEN 'Star' THEN 1
          WHEN 'Executive' THEN 2
          WHEN 'Executive Star' THEN 3
          WHEN 'Team Leader' THEN 4
          WHEN 'Senior Leader' THEN 5
          WHEN 'Regional Leader' THEN 6
          WHEN 'Everest Elite' THEN 7
          WHEN 'Everest Master' THEN 8
          WHEN 'Everest Legend' THEN 9
          WHEN 'Everest Ambassador' THEN 10
          ELSE 0
        END DESC,
        direct_count DESC
      LIMIT 10
    `);
    // Enrich with rank display
    const icons = { "Star":"⭐","Executive":"🚀","Executive Star":"💎","Team Leader":"🏆","Senior Leader":"🌍","Regional Leader":"⚡","Everest Elite":"🔱","Everest Master":"🔥","Everest Legend":"🌟","Everest Ambassador":"👑" };
    const result = topUsers.map(u => ({ ...u, icon: icons[u.rank] || "🏆" }));
    return res.json(result);
  }
  const leaders = await query("SELECT * FROM leaders ORDER BY sort_order ASC, created_at DESC");
  res.json(leaders);
});

router.post("/", async (req, res) => {
  const { name, rank, avatar, icon } = req.body;
  if (!name || !rank) return res.status(400).json({ error: "Name and rank required" });
  const id = uuidv4();
  await execute("INSERT INTO leaders (id, name, rank, avatar, icon) VALUES (?, ?, ?, ?, ?)",
    [id, name, rank, avatar || null, icon || "🏆"]);
  const leader = await queryOne("SELECT * FROM leaders WHERE id = ?", [id]);
  res.json(leader);
});

router.put("/:id", async (req, res) => {
  const { name, rank, avatar, icon } = req.body;
  await execute("UPDATE leaders SET name = ?, rank = ?, avatar = ?, icon = ? WHERE id = ?",
    [name, rank, avatar || null, icon || "🏆", req.params.id]);
  const leader = await queryOne("SELECT * FROM leaders WHERE id = ?", [req.params.id]);
  res.json(leader);
});

router.delete("/:id", async (req, res) => {
  await execute("DELETE FROM leaders WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

// ---- Top 10 auto leaders (GET handler already exists for ?top=1)

router.post("/top/add", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });
  const user = await queryOne("SELECT id, full_name, avatar, rank, e_money, direct_count FROM users WHERE id = ? AND role != 'admin'", [userId]);
  if (!user) return res.status(404).json({ error: "User not found or is admin" });
  if (!user.rank) return res.status(400).json({ error: "User has no rank" });
  // Remove if already exists and re-add
  await execute("DELETE FROM leaders WHERE id = ?", [userId]);
  const icons = { "Star":"⭐","Executive":"🚀","Executive Star":"💎","Team Leader":"🏆","Senior Leader":"🌍","Regional Leader":"⚡","Everest Elite":"🔱","Everest Master":"🔥","Everest Legend":"🌟","Everest Ambassador":"👑" };
  await execute("INSERT INTO leaders (id, name, rank, avatar, icon) VALUES (?, ?, ?, ?, ?)",
    [userId, user.full_name, user.rank, user.avatar, icons[user.rank] || "🏆"]);
  const leader = await queryOne("SELECT * FROM leaders WHERE id = ?", [userId]);
  res.json(leader);
});

router.delete("/top/:id", async (req, res) => {
  await execute("DELETE FROM leaders WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

export default router;
