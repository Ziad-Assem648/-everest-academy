import express from "express";
import { query, queryOne, execute } from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

const sReq = (r) => r.sales_required !== undefined ? r.sales_required : r.min_direct;
const bVal = (r) => r.bonus !== undefined ? r.bonus : r.weekly_bonus;

// ─── Team tree using Closure Table ───
router.get("/tree", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId query param required" });
  const descendants = await query(`
    SELECT u.id, u.full_name, u.email, u.role, u.rank, u.e_money, u.account_type,
           u.direct_count, u.qualified_direct_count, u.created_at,
           u.referred_by, c.depth
    FROM user_closure c
    JOIN users u ON u.id = c.descendant
    WHERE c.ancestor = ? AND c.descendant != ?
    ORDER BY c.depth, u.created_at DESC
  `, [userId, userId]);
  const buildTree = (parentId) => {
    const children = descendants.filter(d => d.referred_by === parentId);
    return children.map(child => ({ ...child, children: buildTree(child.id) }));
  };
  res.json(buildTree(userId));
});

router.get("/directs/:userId", async (req, res) => {
  const users = await query(
    "SELECT id, full_name, email, role, rank, e_money, direct_count, qualified_direct_count, account_type, status, created_at FROM users WHERE referred_by = ? ORDER BY created_at DESC",
    [req.params.userId]
  );
  res.json(users);
});

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

router.get("/transfer/validate", async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: "from and to query params required" });
  if (from === to) return res.json({ allowed: false, reason: "same_user" });
  const relation = await queryOne(`
    SELECT id FROM users
    WHERE (referred_by = ? AND id = ?) OR (referred_by = ? AND id = ?)
  `, [to, from, from, to]);
  if (!relation) return res.json({ allowed: false, reason: "not_directly_connected" });
  const fromUser = await queryOne("SELECT e_money, negative_allowed FROM users WHERE id = ?", [from]);
  if (!fromUser) return res.json({ allowed: false, reason: "sender_not_found" });
  res.json({ allowed: true, balance: fromUser.e_money, negative_allowed: !!fromUser.negative_allowed });
});

router.post("/transfer", async (req, res) => {
  try {
    const { from_user_id, to_user_id, amount } = req.body;
    if (!from_user_id || !to_user_id || !amount) return res.status(400).json({ error: "from_user_id, to_user_id, and amount required" });
    if (from_user_id === to_user_id) return res.status(400).json({ error: "Cannot transfer to yourself" });
    if (amount <= 0) return res.status(400).json({ error: "Amount must be positive" });
    const relation = await queryOne(`
      SELECT id FROM users
      WHERE (referred_by = ? AND id = ?) OR (referred_by = ? AND id = ?)
    `, [to_user_id, from_user_id, from_user_id, to_user_id]);
    if (!relation) return res.status(403).json({ error: "Transfer allowed only between direct upline/downline" });
    const fromUser = await queryOne("SELECT e_money, negative_allowed FROM users WHERE id = ?", [from_user_id]);
    if (!fromUser) return res.status(404).json({ error: "Sender not found" });
    if (fromUser.e_money < amount && !fromUser.negative_allowed) return res.status(400).json({ error: `Insufficient balance. Available: ${fromUser.e_money}, required: ${amount}` });
    const toUser = await queryOne("SELECT id FROM users WHERE id = ?", [to_user_id]);
    if (!toUser) return res.status(404).json({ error: "Receiver not found" });
    const tid = uuidv4();
    await execute("UPDATE users SET e_money = e_money - ? WHERE id = ?", [amount, from_user_id]);
    await execute("UPDATE users SET e_money = e_money + ? WHERE id = ?", [amount, to_user_id]);
    await execute("INSERT INTO transfers (id, from_user_id, to_user_id, amount, status) VALUES (?, ?, ?, ?, 'completed')", [tid, from_user_id, to_user_id, amount]);
    const txFromId = uuidv4();
    await execute("INSERT INTO wallet_transactions (id, user_id, amount, type, description, status) VALUES (?, ?, ?, ?, ?, 'completed')", [txFromId, from_user_id, amount, "debit", `تحويل إلى ${to_user_id.slice(0,8)}`]);
    const txToId = uuidv4();
    await execute("INSERT INTO wallet_transactions (id, user_id, amount, type, description, status) VALUES (?, ?, ?, ?, ?, 'completed')", [txToId, to_user_id, amount, "credit", `تحويل من ${from_user_id.slice(0,8)}`]);
    const nid1 = uuidv4(); await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'transfer')", [nid1, from_user_id, "💰 تحويل صادر", `تم تحويل ${amount} E-Money إلى حساب آخر`]);
    const nid2 = uuidv4(); await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'transfer')", [nid2, to_user_id, "💰 تحويل وارد", `استلمت ${amount} E-Money من ${from_user_id.slice(0,8)}`]);
    const updatedFrom = await queryOne("SELECT e_money FROM users WHERE id = ?", [from_user_id]);
    const updatedTo = await queryOne("SELECT e_money FROM users WHERE id = ?", [to_user_id]);
    res.json({ success: true, transfer_id: tid, from_balance: updatedFrom.e_money, to_balance: updatedTo.e_money });
  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/transfers/:userId", async (req, res) => {
  const transfers = await query(`
    SELECT t.*, u1.full_name as from_name, u2.full_name as to_name
    FROM transfers t
    JOIN users u1 ON t.from_user_id = u1.id
    JOIN users u2 ON t.to_user_id = u2.id
    WHERE t.from_user_id = ? OR t.to_user_id = ?
    ORDER BY t.created_at DESC LIMIT 50
  `, [req.params.userId, req.params.userId]);
  res.json(transfers);
});

// ─── WEEKLY COMMISSION PROCESSING ───
// Business rules:
// 1. Direct Sale = any user who registered via referral code (Student OR Registration, must be Active)
// 2. Minimum 2 Direct Sales required for commission eligibility
// 3. Commission is calculated from Student accounts only
// 4. Registration accounts count toward rank but never generate commission
// 5. Members with higher rank than current user are excluded from qualified network
// 6. Every calculation is stored in weekly_history
router.post("/weekly-commission", async (req, res) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysToMonday - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);

    const weekStart = lastMonday.toISOString().slice(0, 10);
    const weekEnd = lastSunday.toISOString().slice(0, 10);
    const calcDate = now.toISOString().slice(0, 19).replace("T", " ");

    const existing = await queryOne("SELECT id FROM weekly_commissions WHERE week_start = ? LIMIT 1", [weekStart]);
    if (existing) return res.status(400).json({ error: `Weekly commission already calculated for week ${weekStart} - ${weekEnd}` });

    // All active users (both student and registration)
    const users = await query(
      "SELECT id, full_name, email, rank, direct_count, e_money, account_type FROM users WHERE role IN ('student','registration') AND status = 'active'"
    );

    const allRanks = await query("SELECT * FROM ranks ORDER BY sort_order ASC");
    const rankMap = {};
    allRanks.forEach(r => { rankMap[r.name] = r; });

    const results = [];
    let totalAwarded = 0;

    for (const user of users) {
      const userRank = rankMap[user.rank];

      // STEP 1: Count all Direct Sales (Level 1 only — both Student + Registration, active only)
      const directs = await query(
        "SELECT u.id, u.account_type, u.status FROM users u WHERE u.referred_by = ?",
        [user.id]
      );
      const activeDirects = directs.filter(d => d.status === 'active');
      const totalDirectSales = activeDirects.length;
      const studentDirectSales = activeDirects.filter(d => d.account_type === 'student').length;
      const registrationDirectSales = activeDirects.filter(d => d.account_type === 'registration').length;

      // STEP 2: Determine Qualified Direct Sales (= total active directs for eligibility)
      const qualifiedDirectSales = totalDirectSales;

      // STEP 3: Verify minimum weekly requirement (2 Direct Sales)
      if (qualifiedDirectSales < 2) {
        const whId = uuidv4();
        await execute(`INSERT INTO weekly_history (id, user_id, week_start, week_end, calculation_date,
          previous_rank, current_rank, total_direct_sales, student_direct_sales, registration_direct_sales,
          qualified_direct_sales, qualified_team_count, qualified_network_count, weekly_commission,
          commission_status, promotion_status, failure_reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [whId, user.id, weekStart, weekEnd, calcDate,
            user.rank, user.rank, totalDirectSales, studentDirectSales, registrationDirectSales,
            qualifiedDirectSales, 0, 0, 0,
            'not_eligible', 'no_change', `Less than 2 qualified direct sales (${qualifiedDirectSales})`]);
        results.push({ user_id: user.id, rank: user.rank, eligible: false, reason: `directs < 2 (${qualifiedDirectSales})`, totalDirectSales, studentDirectSales, registrationDirectSales });
        continue;
      }

      // STEP 4: Recalculate qualified network (exclude higher-ranked members)
      const allTeamMembers = await query(
        "SELECT u.id, u.rank, u.status, u.account_type FROM user_closure c JOIN users u ON u.id = c.descendant WHERE c.ancestor = ? AND c.descendant != ? AND u.account_type IN ('student','registration')",
        [user.id, user.id]
      );

      let qualifiedTeamCount = 0;
      let studentMembers = 0;
      let registrationMembers = 0;
      let higherRankExcluded = 0;
      let inactiveExcluded = 0;
      const higherRankIds = [];

      for (const member of allTeamMembers) {
        if (member.status !== 'active') { inactiveExcluded++; continue; }
        const memberRankData = rankMap[member.rank];
        if (!memberRankData) {
          // Unranked member — always counts
          qualifiedTeamCount++;
          if (member.account_type === 'student') studentMembers++;
          else registrationMembers++;
          continue;
        }
        if (userRank && memberRankData.sort_order > userRank.sort_order) {
          higherRankExcluded++;
          higherRankIds.push(member.id);
          continue;
        }
        qualifiedTeamCount++;
        if (member.account_type === 'student') studentMembers++;
        else registrationMembers++;
      }

      const qualifiedNetworkCount = allTeamMembers.filter(m => m.status === 'active').length;

      // STEP 5: Recalculate rank
      const previousRank = user.rank;
      let promotionStatus = 'no_change';
      let newRank = user.rank;

      if (userRank) {
        // User has a rank — try to advance
        const rankIdx = allRanks.findIndex(r => r.name === user.rank);
        for (let i = (rankIdx >= 0 ? rankIdx + 1 : 0); i < allRanks.length; i++) {
          const next = allRanks[i];
          if (qualifiedTeamCount >= sReq(next)) {
            newRank = next.name;
            const bonusPaid = await queryOne("SELECT id FROM rank_bonuses WHERE user_id = ? AND rank_name = ?", [user.id, next.name]);
            const bonusAmount = bVal(next);
            if (bonusAmount > 0 && !bonusPaid) {
              const bid = uuidv4();
              await execute("INSERT INTO rank_bonuses (id, user_id, rank_name, amount) VALUES (?, ?, ?, ?)", [bid, user.id, next.name, bonusAmount]);
              await execute("UPDATE users SET e_money = e_money + ? WHERE id = ?", [bonusAmount, user.id]);
              const txId = uuidv4();
              await execute("INSERT INTO wallet_transactions (id, user_id, amount, type, description, status) VALUES (?, ?, ?, 'credit', ?, 'completed')",
                [txId, user.id, bonusAmount, `🎉 Rank up bonus - ${next.name}`]);
            }
            await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'success')",
              [uuidv4(), user.id, "🎉 Rank Up!", `You reached ${next.name} rank! Bonus: ${bonusAmount || 0} EM`]);
          } else {
            break;
          }
        }
      } else {
        // Unranked — try to advance from first rank
        for (const next of allRanks) {
          if (qualifiedTeamCount >= sReq(next)) {
            newRank = next.name;
          } else {
            break;
          }
        }
      }

      if (newRank !== previousRank) {
        promotionStatus = 'promoted';
        const progress = allRanks.findIndex(r => r.name === newRank);
        const nextAfter = allRanks[progress + 1];
        const progressPct = nextAfter ? Math.min(100, Math.round((qualifiedTeamCount / sReq(nextAfter)) * 100)) : 100;
        await execute("UPDATE users SET rank = ?, rank_progress = ?, updated_at = datetime('now','localtime') WHERE id = ?", [newRank, progressPct, user.id]);
      }

      // STEP 6: Calculate commission (only from Student accounts)
      const finalRank = rankMap[newRank];
      let weeklyCommission = 0;
      let commissionStatus = 'not_eligible';
      let failureReason = null;

      if (!finalRank) {
        commissionStatus = 'not_eligible';
        failureReason = 'No rank assigned';
      } else {
        const bonus = bVal(finalRank) || 0;
        if (bonus > 0) {
          weeklyCommission = bonus;
          commissionStatus = 'paid';

          // Award commission
          await execute("UPDATE users SET e_money = e_money + ? WHERE id = ?", [bonus, user.id]);
          const comId = uuidv4();
          await execute(
            "INSERT INTO weekly_commissions (id, user_id, rank_name, amount, week_start, week_end, status) VALUES (?, ?, ?, ?, ?, ?, 'paid')",
            [comId, user.id, finalRank.name, bonus, weekStart, weekEnd]
          );
          const txId = uuidv4();
          await execute(
            "INSERT INTO wallet_transactions (id, user_id, amount, type, description, status) VALUES (?, ?, ?, ?, ?, 'completed')",
            [txId, user.id, bonus, "credit", `العمولة الأسبوعية - رتبة ${finalRank.name} (${weekStart})`]
          );
          await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'commission')",
            [uuidv4(), user.id, "🏆 عمولة أسبوعية", `ربحت ${bonus} E-Money كعمولة أسبوعية عن رتبة ${finalRank.name}`]);
          totalAwarded++;
        } else {
          commissionStatus = 'no_bonus';
          failureReason = `Rank ${finalRank.name} has no weekly bonus`;
        }
      }

      // STEP 7: Save Weekly History record
      const whId = uuidv4();
      const details = JSON.stringify({
        totalDirectSales, studentDirectSales, registrationDirectSales,
        qualifiedTeamCount, studentMembers, registrationMembers,
        higherRankExcluded, inactiveExcluded, higherRankIds,
        qualifiedNetworkCount
      });

      await execute(`INSERT INTO weekly_history (id, user_id, week_start, week_end, calculation_date,
        previous_rank, current_rank, total_direct_sales, student_direct_sales, registration_direct_sales,
        qualified_direct_sales, qualified_team_count, qualified_network_count, student_members,
        registration_members, higher_rank_excluded, inactive_excluded, weekly_commission,
        commission_status, promotion_status, failure_reason, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [whId, user.id, weekStart, weekEnd, calcDate,
          previousRank, newRank, totalDirectSales, studentDirectSales, registrationDirectSales,
          qualifiedDirectSales, qualifiedTeamCount, qualifiedNetworkCount, studentMembers,
          registrationMembers, higherRankExcluded, inactiveExcluded, weeklyCommission,
          commissionStatus, promotionStatus, failureReason, details]);

      // STEP 8: Backend logging
      console.log(`[WEEKLY] User: ${user.id} | Prev: ${previousRank || 'None'} → New: ${newRank || 'None'} | Directs: ${totalDirectSales} (S:${studentDirectSales} R:${registrationDirectSales}) | Team: ${qualifiedTeamCount} | Excl(H):${higherRankExcluded} Excl(I):${inactiveExcluded} | Commission: ${weeklyCommission} (${commissionStatus}) | Promotion: ${promotionStatus}`);

      results.push({
        user_id: user.id, rank: newRank, previousRank, eligible: commissionStatus === 'paid',
        bonus: weeklyCommission, totalDirectSales, studentDirectSales, registrationDirectSales,
        qualifiedDirectSales, qualifiedTeamCount, qualifiedNetworkCount, studentMembers,
        registrationMembers, higherRankExcluded, inactiveExcluded, promotionStatus,
        commissionStatus, failureReason
      });
    }

    res.json({ weekStart, weekEnd, total_users: users.length, awarded: totalAwarded, results });
  } catch (err) {
    console.error("Weekly commission error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Weekly History (GET) ───
router.get("/weekly-history/:userId", async (req, res) => {
  try {
    const history = await query(
      "SELECT * FROM weekly_history WHERE user_id = ? ORDER BY week_start DESC LIMIT 52",
      [req.params.userId]
    );
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/weekly-history", async (req, res) => {
  try {
    const { weekStart, weekEnd } = req.query;
    let sql = "SELECT wh.*, u.full_name, u.email FROM weekly_history wh JOIN users u ON wh.user_id = u.id";
    const params = [];
    const conditions = [];
    if (weekStart) { conditions.push("wh.week_start >= ?"); params.push(weekStart); }
    if (weekEnd) { conditions.push("wh.week_end <= ?"); params.push(weekEnd); }
    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY wh.week_start DESC, wh.user_id LIMIT 500";
    const history = await query(sql, params);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Weekly commission history (old) ───
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

// ─── Detailed rank progress (for user frontend) ───
router.get("/rank-progress/:userId", async (req, res) => {
  try {
    const user = await queryOne("SELECT id, full_name, rank, direct_count, qualified_direct_count, e_money, account_type FROM users WHERE id = ?", [req.params.userId]);
    if (!user) return res.status(404).json({ error: "User not found" });

    const allRanks = await query("SELECT * FROM ranks ORDER BY sort_order ASC");
    const currentRankIndex = allRanks.findIndex(r => r.name === user.rank);
    const currentRank = allRanks[currentRankIndex] || null;
    const nextRank = allRanks[currentRankIndex + 1] || null;

    const userSortOrder = currentRank ? currentRank.sort_order : null;

    // Direct sales breakdown
    const directs = await query(
      "SELECT u.id, u.account_type, u.status FROM users u WHERE u.referred_by = ?",
      [user.id]
    );
    const activeDirects = directs.filter(d => d.status === 'active');
    const totalDirectSales = activeDirects.length;
    const studentDirectSales = activeDirects.filter(d => d.account_type === 'student').length;
    const registrationDirectSales = activeDirects.filter(d => d.account_type === 'registration').length;
    const qualifiedDirectSales = totalDirectSales;

    // Qualified team
    const allTeam = await query(
      "SELECT u.rank, u.status, u.account_type FROM user_closure c JOIN users u ON u.id = c.descendant WHERE c.ancestor = ? AND c.descendant != ? AND u.account_type IN ('student','registration')",
      [user.id, user.id]
    );

    const rankSortMap = {};
    allRanks.forEach(r => { rankSortMap[r.name] = r.sort_order; });

    let qualifiedTeamCount = 0;
    let studentMembers = 0;
    let registrationMembers = 0;
    let higherRankExcluded = 0;
    let inactiveExcluded = 0;

    for (const tm of allTeam) {
      if (tm.status !== 'active') { inactiveExcluded++; continue; }
      const tmSort = tm.rank ? (rankSortMap[tm.rank] ?? -1) : -1;
      if (userSortOrder !== null && tmSort > userSortOrder) {
        higherRankExcluded++;
        continue;
      }
      qualifiedTeamCount++;
      if (tm.account_type === 'student') studentMembers++;
      else registrationMembers++;
    }

    res.json({
      user,
      currentRank,
      nextRank,
      allRanks,
      qualifiedDirects: qualifiedTeamCount,
      totalDirects: user.direct_count,
      totalDirectSales,
      studentDirectSales,
      registrationDirectSales,
      qualifiedDirectSales,
      meetsMinDirects: qualifiedDirectSales >= 2,
      studentMembers,
      registrationMembers,
      higherRankExcluded,
      inactiveExcluded,
      qualifiedNetworkCount: allTeam.filter(m => m.status === 'active').length,
      progressToNext: nextRank ? Math.min(100, (qualifiedTeamCount / sReq(nextRank)) * 100) : 100
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
           u.total_team_sales, u.e_money, u.account_type,
           COALESCE(r.weekly_bonus, 0) as weekly_bonus, COALESCE(r.sort_order, 0) as rank_order
    FROM users u
    LEFT JOIN ranks r ON u.rank = r.name
    WHERE u.role != 'admin' AND u.account_type IN ('student','registration')
    ORDER BY r.sort_order DESC, u.total_team_sales DESC
    LIMIT 10
  `);
  res.json(users);
});

router.get("/leaderboard/all", async (req, res) => {
  const users = await query(`
    SELECT u.id, u.full_name, u.email, u.rank, u.direct_count, u.qualified_direct_count,
           u.total_team_sales, u.e_money, u.avatar, u.account_type,
           COALESCE(r.weekly_bonus, 0) as weekly_bonus, COALESCE(r.sort_order, 0) as rank_order
    FROM users u
    LEFT JOIN ranks r ON u.rank = r.name
    WHERE u.role != 'admin' AND u.account_type IN ('student','registration')
    ORDER BY r.sort_order DESC, u.total_team_sales DESC
  `);
  res.json(users);
});

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
