import { v4 as uuidv4 } from "uuid";
import express from "express";
import { query, queryOne, execute } from "../db.js";

const router = express.Router();

const RANK_ICONS = { "Star":"⭐","Executive":"🚀","Executive Star":"💎","Team Leader":"🏆","Senior Leader":"🌍","Regional Leader":"⚡","Everest Elite":"🔱","Everest Master":"🔥","Everest Legend":"🌟","Everest Ambassador":"👑" };

const RANK_ORDER = `CASE rank
  WHEN 'Everest Ambassador' THEN 10
  WHEN 'Everest Legend' THEN 9
  WHEN 'Everest Master' THEN 8
  WHEN 'Everest Elite' THEN 7
  WHEN 'Regional Leader' THEN 6
  WHEN 'Senior Leader' THEN 5
  WHEN 'Team Leader' THEN 4
  WHEN 'Executive Star' THEN 3
  WHEN 'Executive' THEN 2
  WHEN 'Star' THEN 1
  ELSE 0
END DESC`;

async function refreshLeaders() {
  const excluded = await query("SELECT user_id FROM excluded_leaders");
  const excludedIds = excluded.map(e => e.user_id);
  let excludeClause = "";
  const params = [];
  if (excludedIds.length > 0) {
    excludeClause = `AND id NOT IN (${excludedIds.map(() => "?").join(",")})`;
    params.push(...excludedIds);
  }
  const topUsers = await query(`
    SELECT id, full_name as name, avatar, rank, e_money, direct_count
    FROM users
    WHERE role NOT IN ('admin', 'manager') AND rank IS NOT NULL AND rank != '' ${excludeClause}
    ORDER BY ${RANK_ORDER}, direct_count DESC
    LIMIT 10
  `, params);
  await execute("DELETE FROM leaders");
  for (const u of topUsers) {
    await execute(
      "INSERT INTO leaders (id, name, rank, avatar, icon) VALUES (?, ?, ?, ?, ?)",
      [u.id, u.name, u.rank, u.avatar, RANK_ICONS[u.rank] || "🏆"]
    );
  }
  await execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('leaders_last_refresh', datetime('now','localtime'))");
  console.log(`🏆 Leaders refreshed: ${topUsers.length} users`);
  return topUsers.length;
}

router.get("/", async (req, res) => {
  try {
    const lastRefresh = await queryOne("SELECT value FROM settings WHERE key = 'leaders_last_refresh'");
    let shouldRefresh = false;
    if (!lastRefresh || !lastRefresh.value) {
      shouldRefresh = true;
    } else {
      const last = new Date(lastRefresh.value);
      const now = new Date();
      const daysSince = (now - last) / (1000 * 60 * 60 * 24);
      if (daysSince >= 7) shouldRefresh = true;
    }
    if (shouldRefresh) await refreshLeaders();

    const leaders = await query(`SELECT * FROM leaders ORDER BY ${RANK_ORDER}, created_at ASC`);
    res.json(leaders);
  } catch (err) {
    console.error("Leaders error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const count = await refreshLeaders();
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/add", async (req, res) => {
  try {
    const count = await queryOne("SELECT COUNT(*) as c FROM leaders");
    if (count.c >= 10) return res.status(400).json({ error: "Maximum 10 leaders allowed" });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const user = await queryOne("SELECT id, full_name, avatar, rank, e_money, direct_count FROM users WHERE id = ? AND role NOT IN ('admin', 'manager')", [userId]);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.rank) return res.status(400).json({ error: "User has no rank" });

    const existing = await queryOne("SELECT id FROM leaders WHERE id = ?", [userId]);
    if (existing) return res.status(400).json({ error: "User already in leaders" });

    await execute("DELETE FROM excluded_leaders WHERE user_id = ?", [userId]);

    await execute(
      "INSERT INTO leaders (id, name, rank, avatar, icon) VALUES (?, ?, ?, ?, ?)",
      [userId, user.full_name, user.rank, user.avatar, RANK_ICONS[user.rank] || "🏆"]
    );
    const leader = await queryOne("SELECT * FROM leaders WHERE id = ?", [userId]);
    res.json(leader);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  await execute("INSERT OR IGNORE INTO excluded_leaders (user_id) VALUES (?)", [req.params.id]);
  await execute("DELETE FROM leaders WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

export default router;
