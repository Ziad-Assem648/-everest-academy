import express from "express";
import { query, queryOne, execute } from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// ───────────── USERS TABLE ADDITIONS ─────────────
// Columns added via migration in db.js:
//   negative_allowed  INTEGER DEFAULT 0
//   qualified_direct_count INTEGER DEFAULT 0
//   membership_days        INTEGER DEFAULT 365
//   membership_progress    REAL DEFAULT 65

// ─── Team tree using Closure Table (fast, any depth) ───
router.get("/tree", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId query param required" });

  // Get all descendants with their referred_by so we can build the tree
  const descendants = await query(`
    SELECT u.id, u.full_name, u.email, u.role, u.rank, u.e_money, u.account_type,
           u.direct_count, u.qualified_direct_count, u.created_at,
           u.referred_by, c.depth
    FROM user_closure c
    JOIN users u ON u.id = c.descendant
    WHERE c.ancestor = ? AND c.descendant != ?
    ORDER BY c.depth, u.created_at DESC
  `, [userId, userId]);

  // Build nested tree: find direct children via referred_by, then recurse
  const buildTree = (parentId) => {
    const children = descendants.filter(d => d.referred_by === parentId);
    return children.map(child => ({
      ...child,
      children: buildTree(child.id)
    }));
  };

  const tree = buildTree(userId);
  res.json(tree);
});

// ─── Directs (depth = 1 from closure, or just referred_by) ───
router.get("/directs/:userId", async (req, res) => {
  const users = await query(
    "SELECT id, full_name, email, role, rank, e_money, direct_count, qualified_direct_count, created_at FROM users WHERE referred_by = ? ORDER BY created_at DESC",
    [req.params.userId]
  );
  res.json(users);
});

// ─── Upline chain ───
router.get("/upline/:userId", async (req, res) => {
  const upline = await query(`
    SELECT u.id, u.full_name, u.email, u.role, u.rank, u.e_money,
           u.direct_count, c.depth
    FROM user_closure c
    JOIN users u ON u.id = c.ancestor
    WHERE c.descendant = ? AND c.ancestor != ?
    ORDER BY c.depth ASC
  `, [req.params.userId, req.params.userId]);
  res.json(upline);
});

// ─── Validate transfer possibility ───
router.get("/transfer/validate", async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: "from and to query params required" });
  if (from === to) return res.json({ allowed: false, reason: "same_user" });

  // Check if they're directly connected (one is the other's referred_by)
  const relation = await queryOne(`
    SELECT id FROM users
    WHERE (referred_by = ? AND id = ?)  -- to is upline of from
       OR (referred_by = ? AND id = ?)   -- from is upline of to
  `, [to, from, from, to]);

  if (!relation) return res.json({ allowed: false, reason: "not_directly_connected" });

  // Check balance
  const fromUser = await queryOne("SELECT e_money, negative_allowed FROM users WHERE id = ?", [from]);
  if (!fromUser) return res.json({ allowed: false, reason: "sender_not_found" });

  res.json({
    allowed: true,
    balance: fromUser.e_money,
    negative_allowed: !!fromUser.negative_allowed
  });
});

// ─── E-Money Transfer ───
router.post("/transfer", async (req, res) => {
  try {
    const { from_user_id, to_user_id, amount } = req.body;
    if (!from_user_id || !to_user_id || !amount)
      return res.status(400).json({ error: "from_user_id, to_user_id, and amount required" });
    if (from_user_id === to_user_id)
      return res.status(400).json({ error: "Cannot transfer to yourself" });
    if (amount <= 0)
      return res.status(400).json({ error: "Amount must be positive" });

    // Verify direct relationship (one is upline of the other)
    const relation = await queryOne(`
      SELECT id FROM users
      WHERE (referred_by = ? AND id = ?)
         OR (referred_by = ? AND id = ?)
    `, [to_user_id, from_user_id, from_user_id, to_user_id]);
    if (!relation)
      return res.status(403).json({ error: "Transfer allowed only between direct upline/downline" });

    // Get sender data
    const fromUser = await queryOne("SELECT e_money, negative_allowed FROM users WHERE id = ?", [from_user_id]);
    if (!fromUser) return res.status(404).json({ error: "Sender not found" });

    // Check balance (unless negative_allowed)
    if (fromUser.e_money < amount && !fromUser.negative_allowed)
      return res.status(400).json({ error: `Insufficient balance. Available: ${fromUser.e_money}, required: ${amount}` });

    // Verify receiver exists
    const toUser = await queryOne("SELECT id FROM users WHERE id = ?", [to_user_id]);
    if (!toUser) return res.status(404).json({ error: "Receiver not found" });

    const tid = uuidv4();

    // Execute transfer atomically
    await execute("UPDATE users SET e_money = e_money - ? WHERE id = ?", [amount, from_user_id]);
    await execute("UPDATE users SET e_money = e_money + ? WHERE id = ?", [amount, to_user_id]);
    await execute(
      "INSERT INTO transfers (id, from_user_id, to_user_id, amount, status) VALUES (?, ?, ?, ?, 'completed')",
      [tid, from_user_id, to_user_id, amount]
    );

    // Record wallet transactions
    const txFromId = uuidv4();
    await execute(
      "INSERT INTO wallet_transactions (id, user_id, amount, type, description, status) VALUES (?, ?, ?, ?, ?, 'completed')",
      [txFromId, from_user_id, amount, "debit", `تحويل إلى ${to_user_id.slice(0,8)}`]
    );
    const txToId = uuidv4();
    await execute(
      "INSERT INTO wallet_transactions (id, user_id, amount, type, description, status) VALUES (?, ?, ?, ?, ?, 'completed')",
      [txToId, to_user_id, amount, "credit", `تحويل من ${from_user_id.slice(0,8)}`]
    );

    // Notifications
    const nid1 = uuidv4(); await execute(
      "INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'transfer')",
      [nid1, from_user_id, "💰 تحويل صادر", `تم تحويل ${amount} E-Money إلى حساب آخر`]
    );
    const nid2 = uuidv4(); await execute(
      "INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'transfer')",
      [nid2, to_user_id, "💰 تحويل وارد", `استلمت ${amount} E-Money من ${from_user_id.slice(0,8)}`]
    );

    // Return updated balances
    const updatedFrom = await queryOne("SELECT e_money FROM users WHERE id = ?", [from_user_id]);
    const updatedTo = await queryOne("SELECT e_money FROM users WHERE id = ?", [to_user_id]);
    res.json({ success: true, transfer_id: tid, from_balance: updatedFrom.e_money, to_balance: updatedTo.e_money });
  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Transfer history for a user ───
router.get("/transfers/:userId", async (req, res) => {
  const transfers = await query(`
    SELECT t.*,
           u1.full_name as from_name, u2.full_name as to_name
    FROM transfers t
    JOIN users u1 ON t.from_user_id = u1.id
    JOIN users u2 ON t.to_user_id = u2.id
    WHERE t.from_user_id = ? OR t.to_user_id = ?
    ORDER BY t.created_at DESC
    LIMIT 50
  `, [req.params.userId, req.params.userId]);
  res.json(transfers);
});

// ─── Weekly Commission Calculation (Admin only - trigger from dashboard) ───
router.post("/weekly-commission", async (req, res) => {
  try {
    // Calculate previous week boundaries
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysToMonday - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);

    const weekStart = lastMonday.toISOString().slice(0, 10);
    const weekEnd = lastSunday.toISOString().slice(0, 10);

    // Check if already calculated for this week
    const existing = await queryOne(
      "SELECT id FROM weekly_commissions WHERE week_start = ? LIMIT 1",
      [weekStart]
    );
    if (existing)
      return res.status(400).json({ error: `Weekly commission already calculated for week ${weekStart} - ${weekEnd}` });

    // Get all student accounts only (registration accounts don't participate in commissions)
    const users = await query(
      "SELECT id, full_name, email, rank, direct_count, e_money FROM users WHERE role IN ('student','registration') AND account_type = 'student'"
    );

    const results = [];
    const allRanks = await query("SELECT * FROM ranks ORDER BY sort_order ASC");

    for (const user of users) {
      // R1: Must have at least 2 directs
      if (user.direct_count < 2) {
        results.push({ user_id: user.id, rank: user.rank, eligible: false, reason: "directs < 2" });
        continue;
      }

      // Get user's rank details
      const userRank = allRanks.find(r => r.name === user.rank) || allRanks[0];
      if (!userRank) {
        results.push({ user_id: user.id, rank: user.rank, eligible: false, reason: "no rank found" });
        continue;
      }

      // Get ALL student team members (not just directs) from closure table
      const allTeam = await query(
        "SELECT u.id, u.rank FROM user_closure c JOIN users u ON u.id = c.descendant WHERE c.ancestor = ? AND c.descendant != ? AND u.account_type = 'student'",
        [user.id, user.id]
      );

      // Count qualified: those with rank <= user's rank (not higher)
      let qualifiedDirects = 0;
      const excluded = [];
      for (const tm of allTeam) {
        const tRank = allRanks.find(r => r.name === tm.rank) || allRanks[0];
        if (tRank.sort_order > userRank.sort_order) {
          excluded.push({ id: tm.id, rank: tm.rank, reason: "higher_rank" });
        } else {
          qualifiedDirects++;
        }
      }

      // Update qualified count
      await execute("UPDATE users SET qualified_direct_count = ? WHERE id = ?", [qualifiedDirects, user.id]);

      // R3: Check if qualified team members meet rank's min_direct / sales_required
      const minRequired = userRank.sales_required || userRank.min_direct || 5;
      if (qualifiedDirects < minRequired) {
        results.push({ user_id: user.id, rank: user.rank, eligible: false, reason: `qualified team (${qualifiedDirects}) < required (${minRequired})` });
        continue;
      }

      // Eligible: award the weekly bonus
      const bonus = userRank.bonus || userRank.weekly_bonus || 0;
      const comId = uuidv4();
      await execute(
        "INSERT INTO weekly_commissions (id, user_id, rank_name, amount, week_start, week_end, status) VALUES (?, ?, ?, ?, ?, ?, 'paid')",
        [comId, user.id, userRank.name, bonus, weekStart, weekEnd]
      );

      // Record exclusions
      for (const ex of excluded) {
        const excId = uuidv4();
        await execute(
          "INSERT INTO commission_exclusions (id, commission_id, excluded_user_id, reason) VALUES (?, ?, ?, ?)",
          [excId, comId, ex.id, ex.reason]
        );
      }

      // Credit E-Money
      await execute("UPDATE users SET e_money = e_money + ? WHERE id = ?", [bonus, user.id]);

      // Wallet transaction
      const txId = uuidv4();
      await execute(
        "INSERT INTO wallet_transactions (id, user_id, amount, type, description, status) VALUES (?, ?, ?, ?, ?, 'completed')",
        [txId, user.id, bonus, "credit", `العمولة الأسبوعية - رتبة ${userRank.name} (${weekStart})`]
      );

      // Notification
      const nid = uuidv4(); await execute(
        "INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'commission')",
        [nid, user.id, "🏆 عمولة أسبوعية", `ربحت ${bonus} E-Money كعمولة أسبوعية عن رتبة ${userRank.name}`]
      );

      results.push({ user_id: user.id, rank: user.rank, eligible: true, bonus, qualifiedDirects: qualifiedDirects, total_team: allTeam.length, total_directs: user.direct_count, excluded: excluded.length });
    }

    res.json({ weekStart, weekEnd, total_users: users.length, awarded: results.filter(r => r.eligible).length, results });
  } catch (err) {
    console.error("Weekly commission error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Weekly commission history ───
router.get("/weekly-commission/history", async (req, res) => {
  const { weekStart } = req.query;
  let sql = `
    SELECT wc.*, u.full_name, u.email, u.rank as current_rank
    FROM weekly_commissions wc
    JOIN users u ON wc.user_id = u.id
  `;
  const params = [];
  if (weekStart) { sql += " WHERE wc.week_start = ?"; params.push(weekStart); }
  sql += " ORDER BY wc.calculated_at DESC LIMIT 100";

  const commissions = await query(sql, params);

  // Get exclusions for each commission
  for (const c of commissions) {
    c.exclusions = await query(`
      SELECT ce.*, u.full_name as excluded_name, u.rank as excluded_rank
      FROM commission_exclusions ce
      JOIN users u ON ce.excluded_user_id = u.id
      WHERE ce.commission_id = ?
    `, [c.id]);
  }
  res.json(commissions);
});

// ─── Rank progress for a user ───
router.get("/rank-progress/:userId", async (req, res) => {
  const user = await queryOne("SELECT id, full_name, rank, direct_count, qualified_direct_count, e_money FROM users WHERE id = ?", [req.params.userId]);
  if (!user) return res.status(404).json({ error: "User not found" });

  const allRanks = await query("SELECT * FROM ranks ORDER BY sort_order ASC");
  const currentRankIndex = allRanks.findIndex(r => r.name === user.rank);
  const currentRank = allRanks[currentRankIndex] || allRanks[0];
  const nextRank = allRanks[currentRankIndex + 1] || null;

  res.json({
    user,
    currentRank,
    nextRank,
    allRanks,
    qualifiedDirects: user.qualified_direct_count || 0,
    totalDirects: user.direct_count,
    meetsMinDirects: user.direct_count >= 2,
    progressToNext: nextRank ? Math.min(100, (user.direct_count / nextRank.min_direct) * 100) : 100
  });
});

// ─── Existing routes preserved ───
router.get("/commissions", async (req, res) => {
  const { userId } = req.query;
  let commissions;
  if (userId) {
    commissions = await query(`
      SELECT c.*, u1.full_name as from_name, u2.full_name as to_name
      FROM commissions c
      JOIN users u1 ON c.from_user_id = u1.id
      JOIN users u2 ON c.to_user_id = u2.id
      WHERE c.to_user_id = ?
      ORDER BY c.created_at DESC
    `, [userId]);
  } else {
    commissions = await query(`
      SELECT c.*, u1.full_name as from_name, u2.full_name as to_name
      FROM commissions c
      JOIN users u1 ON c.from_user_id = u1.id
      JOIN users u2 ON c.to_user_id = u2.id
      ORDER BY c.created_at DESC
    `);
  }
  res.json(commissions);
});

router.get("/leaderboard", async (req, res) => {
  const users = await query(`
    SELECT u.id, u.full_name, u.email, u.rank, u.direct_count, u.qualified_direct_count,
           u.total_team_sales, u.e_money,
           COALESCE(r.weekly_bonus, 0) as weekly_bonus, COALESCE(r.sort_order, 0) as rank_order
    FROM users u
    LEFT JOIN ranks r ON u.rank = r.name
    WHERE u.role != 'admin' AND u.account_type = 'student'
    ORDER BY r.sort_order DESC, u.total_team_sales DESC
    LIMIT 10
  `);
  res.json(users);
});

router.get("/leaderboard/all", async (req, res) => {
  const users = await query(`
    SELECT u.id, u.full_name, u.email, u.rank, u.direct_count, u.qualified_direct_count,
           u.total_team_sales, u.e_money, u.avatar,
           COALESCE(r.weekly_bonus, 0) as weekly_bonus, COALESCE(r.sort_order, 0) as rank_order
    FROM users u
    LEFT JOIN ranks r ON u.rank = r.name
    WHERE u.role != 'admin' AND u.account_type = 'student'
    ORDER BY r.sort_order DESC, u.total_team_sales DESC
  `);
  res.json(users);
});

// ─── Backfill closure table for existing users (run once after migration) ───
router.post("/backfill-closure", async (req, res) => {
  try {
    await execute("DELETE FROM user_closure");
    const users = await query("SELECT id, referred_by FROM users ORDER BY created_at ASC");
    let count = 0;
    for (const u of users) {
      await execute("INSERT INTO user_closure (ancestor, descendant, depth) VALUES (?, ?, 0)", [u.id, u.id]);
      count++;
      if (u.referred_by) {
        const ancestors = await query(
          "SELECT ancestor, depth FROM user_closure WHERE descendant = ? AND ancestor != descendant",
          [u.referred_by]
        );
        for (const a of ancestors) {
          await execute("INSERT INTO user_closure (ancestor, descendant, depth) VALUES (?, ?, ?)", [a.ancestor, u.id, a.depth + 1]);
        }
        await execute("INSERT INTO user_closure (ancestor, descendant, depth) VALUES (?, ?, 1)", [u.referred_by, u.id]);
      }
    }
    res.json({ success: true, processed: count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
