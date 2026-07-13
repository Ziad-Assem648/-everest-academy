import { v4 as uuidv4 } from "uuid";
import express from "express";
import { query, queryOne, execute } from "../db.js";

const router = express.Router();

const sReq = (r) => r.sales_required !== undefined ? r.sales_required : r.min_direct;
const bVal = (r) => r.bonus !== undefined ? r.bonus : r.weekly_bonus;

router.get("/", async (req, res) => {
  const { all } = req.query;
  let sql = `
    SELECT r.*,
      (SELECT COUNT(*) FROM users u WHERE u.rank = r.name AND u.role != 'admin' AND u.account_type = 'student') as user_count
    FROM ranks r
  `;
  if (all === "true") sql += " ORDER BY r.sort_order";
  else sql += " WHERE r.is_active = 1 ORDER BY r.sort_order";
  const ranks = await query(sql);
  res.json(ranks);
});

router.get("/leaderboard", async (req, res) => {
  try {
    const users = await query(`
      SELECT id, full_name, avatar, rank, direct_count, e_money
      FROM users
      WHERE role != 'admin' AND rank IS NOT NULL AND rank != '' AND account_type = 'student'
      ORDER BY direct_count DESC
      LIMIT 30
    `);
    // Enrich with closure count
    const enriched = await Promise.all(users.map(async (u) => {
      const teamCount = await getTeamCount(u.id);
      return { ...u, total_team_sales: teamCount, position: 0 };
    }));
    enriched.sort((a, b) => b.total_team_sales - a.total_team_sales);
    enriched.forEach((u, i) => u.position = i + 1);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, sales_required, bonus, is_active, image } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const id = uuidv4();
    const maxSort = await queryOne("SELECT COALESCE(MAX(sort_order), -1) as m FROM ranks");
    // Write to both new and old columns for backward compat
    await execute("INSERT INTO ranks (id, name, sales_required, min_direct, bonus, weekly_bonus, sort_order, is_active, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, sales_required || 0, sales_required || 0, bonus || 0, bonus || 0, (maxSort?.m ?? -1) + 1, is_active ?? 1, image || null]);
    const rank = await queryOne("SELECT * FROM ranks WHERE id = ?", [id]);
    res.json(rank);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, sales_required, bonus, sort_order, is_active, image } = req.body;
    const existing = await queryOne("SELECT id FROM ranks WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Rank not found" });
    const sets = []; const params = [];
    if (name !== undefined) { sets.push("name = ?"); params.push(name); }
    if (sales_required !== undefined) {
      sets.push("sales_required = ?"); params.push(sales_required);
      sets.push("min_direct = ?"); params.push(sales_required); // backward compat
    }
    if (bonus !== undefined) {
      sets.push("bonus = ?"); params.push(bonus);
      sets.push("weekly_bonus = ?"); params.push(bonus); // backward compat
    }
    if (image !== undefined) { sets.push("image = ?"); params.push(image); }
    if (sort_order !== undefined) { sets.push("sort_order = ?"); params.push(sort_order); }
    if (is_active !== undefined) { sets.push("is_active = ?"); params.push(is_active); }
    if (sets.length) {
      params.push(req.params.id);
      await execute("UPDATE ranks SET " + sets.join(", ") + " WHERE id = ?", params);
    }
    const rank = await queryOne("SELECT * FROM ranks WHERE id = ?", [req.params.id]);
    res.json(rank);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await queryOne("SELECT id FROM ranks WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Rank not found" });
    await execute("DELETE FROM ranks WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

async function getTeamCount(userId) {
  const closure = await queryOne(
    "SELECT COUNT(*) - 1 as cnt FROM user_closure c JOIN users u ON u.id = c.descendant WHERE c.ancestor = ? AND u.account_type = 'student'",
    [userId]
  );
  const direct = await queryOne("SELECT direct_count FROM users WHERE id = ?", [userId]);
  return Math.max(closure?.cnt || 0, direct?.direct_count || 0);
}

async function advanceUserRank(userId) {
  const user = await queryOne("SELECT id, rank, e_money FROM users WHERE id = ?", [userId]);
  if (!user) return null;
  const allRanks = await query("SELECT * FROM ranks WHERE is_active = 1 ORDER BY sort_order ASC");
  if (allRanks.length === 0) return null;

  let currentRankIdx = allRanks.findIndex(r => r.name === user.rank);
  if (currentRankIdx === -1) currentRankIdx = 0;

  const teamCount = await getTeamCount(userId);

  let changed = false;
  for (let i = currentRankIdx + 1; i < allRanks.length; i++) {
    const next = allRanks[i];
    if (teamCount >= sReq(next)) {
      user.rank = next.name;
      changed = true;

      const bonusPaid = await queryOne("SELECT id FROM rank_bonuses WHERE user_id = ? AND rank_name = ?", [userId, next.name]);
      const bonusAmount = bVal(next);
      if (bonusAmount > 0 && !bonusPaid) {
        const bid = uuidv4();
        await execute("INSERT INTO rank_bonuses (id, user_id, rank_name, amount) VALUES (?, ?, ?, ?)", [bid, userId, next.name, bonusAmount]);
        await execute("UPDATE users SET e_money = e_money + ? WHERE id = ?", [bonusAmount, userId]);
        const txId = uuidv4();
        await execute("INSERT INTO wallet_transactions (id, user_id, amount, type, description, status) VALUES (?, ?, ?, 'credit', ?, 'completed')",
          [txId, userId, bonusAmount, `🎉 Rank up bonus - ${next.name}`]);
      }

      await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'success')",
        [uuidv4(), userId, "🎉 Rank Up!", `You reached ${next.name} rank! Bonus: ${bonusAmount || 0} EM`]);
    } else {
      break;
    }
  }

  if (changed) {
    const newRankIdx = allRanks.findIndex(r => r.name === user.rank);
    let progress = 100;
    if (newRankIdx < allRanks.length - 1) {
      const nextRank = allRanks[newRankIdx + 1];
      progress = Math.min(100, Math.round((teamCount / sReq(nextRank)) * 100));
    }
    await execute("UPDATE users SET rank = ?, rank_progress = ?, updated_at = datetime('now','localtime') WHERE id = ?",
      [user.rank, progress, userId]);
  } else {
    const newRankIdx = allRanks.findIndex(r => r.name === user.rank);
    if (newRankIdx < allRanks.length - 1 && newRankIdx >= 0) {
      const nextRank = allRanks[newRankIdx + 1];
      let progress = Math.min(100, Math.round((teamCount / sReq(nextRank)) * 100));
      await execute("UPDATE users SET rank_progress = ?, updated_at = datetime('now','localtime') WHERE id = ?", [progress, userId]);
    }
  }
  return { rank: user.rank };
}

router.post("/update", async (req, res) => {
  try {
    const users = await query("SELECT id FROM users WHERE role != 'admin' AND account_type = 'student'");
    let updatedCount = 0;
    for (const u of users) {
      const result = await advanceUserRank(u.id);
      if (result) updatedCount++;
    }
    res.json({ success: true, updatedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/progress/:userId", async (req, res) => {
  try {
    const user = await queryOne("SELECT id, rank, rank_progress, e_money FROM users WHERE id = ?", [req.params.userId]);
    if (!user) return res.status(404).json({ error: "User not found" });
    const allRanks = await query("SELECT * FROM ranks WHERE is_active = 1 ORDER BY sort_order ASC");
    const idx = allRanks.findIndex(r => r.name === user.rank);
    let nextRank = null;
    let salesRequired = 0;
    let progress = user.rank_progress || 0;
    const teamCount = await getTeamCount(req.params.userId);

    if (idx < allRanks.length - 1) {
      nextRank = allRanks[idx + 1];
      salesRequired = sReq(nextRank);
    }

    return res.json({
      currentRank: user.rank,
      currentBonus: idx >= 0 ? bVal(allRanks[idx]) : 0,
      currentSalesRequired: idx >= 0 ? sReq(allRanks[idx]) : 0,
      nextRank: nextRank ? nextRank.name : null,
      nextBonus: nextRank ? bVal(nextRank) : 0,
      salesRequired: nextRank ? salesRequired : 0,
      totalTeamSales: teamCount,
      progress: progress,
      e_money: user.e_money || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/pay-sale", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const user = await queryOne("SELECT id, e_money, commission_per_sale, account_type FROM users WHERE id = ?", [userId]);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.account_type !== "student") return res.status(400).json({ error: "Only student accounts can receive commissions" });

    const comAmount = user.commission_per_sale || 1000;

    await execute("UPDATE users SET e_money = e_money + ? WHERE id = ?", [comAmount, userId]);

    const comId = uuidv4();
    await execute("INSERT INTO commissions (id, from_user_id, to_user_id, level, amount) VALUES (?, ?, ?, 0, ?)",
      [comId, userId, userId, comAmount]);

    await advanceUserRank(userId);

    res.json({ success: true, commission: comAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
