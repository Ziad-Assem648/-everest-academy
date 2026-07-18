import express from "express";
import bcrypt from "bcryptjs";
import { query, queryOne, execute } from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

const stripPassword = (u) => { if (u) delete u.password; return u; };

const logAdminAction = async (req, action, targetId, targetName, details) => {
  try {
    const adminName = req.headers["x-user-name"] || "Admin";
    const adminId = req.headers["x-admin-id"] || "unknown";
    const id = uuidv4();
    await execute(
      "INSERT INTO admin_logs (id, admin_id, admin_name, action, target_user_id, target_user_name, details) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, adminId, adminName, action, targetId || null, targetName || null, details || null]
    );
  } catch (e) {
    console.error("Failed to log admin action:", e.message);
  }
};

router.get("/", async (req, res) => {
  const users = await query("SELECT id, full_name, email, phone, address, role, account_type, referral_code, rank, e_money, academic_points, total_team_sales, direct_count, qualified_direct_count, negative_allowed, blocked, status, avatar, created_at FROM users ORDER BY created_at DESC");
  res.json(users);
});

// Pending registration approvals (must be before /:id)
router.get("/pending-registrations", async (req, res) => {
  const users = await query("SELECT id, full_name, email, phone, role, referral_code, referred_by, created_at FROM users WHERE status = 'pending' ORDER BY created_at DESC");
  res.json(users);
});

router.get("/:id", async (req, res) => {
  const user = await queryOne("SELECT id, full_name, email, phone, address, role, account_type, referral_code, rank, e_money, academic_points, total_team_sales, direct_count, qualified_direct_count, negative_allowed, blocked, status, bio, avatar, created_at, membership_expires_at FROM users WHERE id = ?", [req.params.id]);
  if (!user) return res.status(404).json({ error: "User not found" });
  const teamLevels = await query(`
    SELECT u.id, u.full_name, u.email, u.role, u.rank, u.e_money, u.created_at, uc.depth
    FROM user_closure uc
    JOIN users u ON u.id = uc.descendant
    WHERE uc.ancestor = ?
    ORDER BY uc.depth ASC, u.created_at DESC
  `, [req.params.id]);
  const rankBonuses = await query("SELECT * FROM rank_bonuses WHERE user_id = ? ORDER BY created_at DESC", [req.params.id]);
  res.json({ ...user, teamLevels, rankBonuses });
});

router.put("/:id", async (req, res) => {
  const fields = [];
  const vals = [];
  for (const key of ["full_name","email","phone","address","role","bio","avatar"]) {
    if (req.body[key] !== undefined) { fields.push(`${key}=?`); vals.push(req.body[key]); }
  }
  if (req.body.password) {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    fields.push("password=?");
    vals.push(hashedPassword);
  }
  if (fields.length === 0) return res.json(stripPassword(await queryOne("SELECT * FROM users WHERE id=?", [req.params.id])));
  fields.push("updated_at=datetime('now','localtime')");
  vals.push(req.params.id);
  await execute(`UPDATE users SET ${fields.join(",")} WHERE id=?`, vals);
  const user = await queryOne("SELECT * FROM users WHERE id = ?", [req.params.id]);
  res.json(stripPassword(user));
});

router.put("/:id/role", async (req, res) => {
  const { role } = req.body;
  await execute("UPDATE users SET role=?, updated_at=datetime('now','localtime') WHERE id=?", [role, req.params.id]);
  res.json({ success: true });
});

router.put("/:id/e-money", async (req, res) => {
  const { amount, allow_negative } = req.body;
  const user = await queryOne("SELECT * FROM users WHERE id = ?", [req.params.id]);
  if (!user) return res.status(404).json({ error: "User not found" });

  const newBalance = (user.e_money || 0) + amount;
  if (newBalance < 0 && !user.negative_allowed && !allow_negative)
    return res.status(400).json({ error: `Cannot go negative. Current balance: ${user.e_money}. Enable negative balance first.` });

  await execute("UPDATE users SET e_money = e_money + ?, updated_at=datetime('now','localtime') WHERE id=?", [amount, req.params.id]);
  const tid = uuidv4();
  const type = amount >= 0 ? "credit" : "debit";
  await execute("INSERT INTO wallet_transactions (id, user_id, amount, type, description, status) VALUES (?, ?, ?, ?, ?, 'completed')",
    [tid, req.params.id, Math.abs(amount), type, "Manual adjustment by admin"]);
  await logAdminAction(req, `e-money ${type}`, req.params.id, user.full_name, `${Math.abs(amount)} E-Money`);
  const updated = await queryOne("SELECT id, full_name, email, e_money, negative_allowed FROM users WHERE id = ?", [req.params.id]);
  res.json(updated);
});

// Toggle negative balance permission
router.put("/:id/negative-toggle", async (req, res) => {
  const user = await queryOne("SELECT id, negative_allowed FROM users WHERE id = ?", [req.params.id]);
  if (!user) return res.status(404).json({ error: "User not found" });
  const newVal = user.negative_allowed ? 0 : 1;
  await execute("UPDATE users SET negative_allowed = ?, updated_at=datetime('now','localtime') WHERE id=?", [newVal, req.params.id]);
  res.json({ success: true, negative_allowed: !!newVal });
});

router.get("/filter/:role", async (req, res) => {
  const role = req.params.role === "all" ? "%" : req.params.role;
  const users = await query("SELECT id, full_name, email, role, rank, e_money, blocked, created_at FROM users WHERE role LIKE ? ORDER BY created_at DESC", [role]);
  res.json(users);
});

router.put("/:id/block", async (req, res) => {
  const user = await queryOne("SELECT id, full_name FROM users WHERE id = ?", [req.params.id]);
  await execute("UPDATE users SET blocked = 1, updated_at = datetime('now','localtime') WHERE id = ?", [req.params.id]);
  await logAdminAction(req, "block", req.params.id, user?.full_name, null);
  res.json({ success: true, blocked: true });
});

router.put("/:id/unblock", async (req, res) => {
  const user = await queryOne("SELECT id, full_name FROM users WHERE id = ?", [req.params.id]);
  await execute("UPDATE users SET blocked = 0, updated_at = datetime('now','localtime') WHERE id = ?", [req.params.id]);
  await logAdminAction(req, "unblock", req.params.id, user?.full_name, null);
  res.json({ success: true, blocked: false });
});

router.delete("/:id", async (req, res) => {
  try {
    const user = await queryOne("SELECT id FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    // Delete related records first to avoid FK issues
    await execute("DELETE FROM enrollments WHERE user_id = ?", [req.params.id]);
    await execute("DELETE FROM commissions WHERE from_user_id = ? OR to_user_id = ?", [req.params.id, req.params.id]);
    await execute("DELETE FROM wallet_transactions WHERE user_id = ?", [req.params.id]);
    await execute("DELETE FROM notifications WHERE user_id = ?", [req.params.id]);
    await execute("DELETE FROM quiz_attempts WHERE user_id = ?", [req.params.id]);
    await execute("DELETE FROM upgrade_requests WHERE user_id = ?", [req.params.id]);
    await execute("DELETE FROM top_up_requests WHERE user_id = ?", [req.params.id]);
    await execute("DELETE FROM feedbacks WHERE user_id = ?", [req.params.id]);
    await execute("UPDATE users SET referred_by = NULL WHERE referred_by = ?", [req.params.id]);
    await execute("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/approve-registration", async (req, res) => {
  try {
    const user = await queryOne("SELECT id, full_name, email, status, referred_by FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.status !== 'pending') return res.status(400).json({ error: "User is not pending" });
    const accountType = req.body.account_type || "student";
    console.log("[approve-registration] userId:", req.params.id, "body:", JSON.stringify(req.body), "accountType:", accountType);
    if (!["student","registration"].includes(accountType)) return res.status(400).json({ error: "Invalid account_type" });

    // Determine role from account_type
    const role = accountType === "student" ? "student" : "registration";

    // Activate membership based on admin setting
    const durationRow = await queryOne("SELECT value FROM settings WHERE key = 'membership_duration'");
    const days = parseInt(durationRow?.value) || 183;
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    const expiresStr = expires.toISOString().slice(0, 19).replace("T", " ");

    await execute("UPDATE users SET status = 'active', role = ?, account_type = ?, membership_expires_at = ?, updated_at = datetime('now','localtime') WHERE id = ?", [role, accountType, expiresStr, req.params.id]);
    console.log("[approve-registration] Updated:", req.params.id, "role:", role, "account_type:", accountType);

    // If approved as student AND has a sponsor → pay commission to direct referrer ONLY (Level 1)
    if (accountType === "student" && user.referred_by) {
      // Prevent double commission
      const existingCommission = await queryOne("SELECT id FROM commissions WHERE from_user_id = ? AND level = 1", [req.params.id]);
      if (!existingCommission) {
        const directReferrer = await queryOne("SELECT id, account_type FROM users WHERE id = ?", [user.referred_by]);
        if (directReferrer && directReferrer.account_type === "student") {
          const comId = uuidv4();
          await execute("INSERT INTO commissions (id, from_user_id, to_user_id, level, amount) VALUES (?, ?, ?, 1, 1000)",
            [comId, req.params.id, directReferrer.id]);
          await execute("UPDATE users SET e_money = e_money + 1000 WHERE id = ?", [directReferrer.id]);
          await execute("UPDATE users SET direct_count = direct_count + 1 WHERE id = ?", [directReferrer.id]);
          const nid2 = uuidv4(); await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'commission')", [nid2, directReferrer.id, "💰 عمولة جديدة", `ربحت 1000 E-Money كمكافأة عن تسجيل عضو جديد`]);
        }
      }
    }

    const typeLabel = accountType === "student" ? "Student" : "Registration";
    const roleMsg = accountType === "student" ? `ترقيتك إلى Student! العضوية مفعلة لمدة ${days} يوم.` : `تم تفعيل حسابك كـ ${typeLabel}! العضوية مفعلة لمدة ${days} يوم.`;
    const nid = uuidv4(); await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'success')", [nid, req.params.id, "✅ تم تفعيل الحساب والعضوية", roleMsg]);
    await logAdminAction(req, `approve as ${accountType} (membership ${days}d)`, req.params.id, user.full_name, null);
    res.json({ success: true, account_type: accountType, role, membership_expires_at: expiresStr, days });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id/reject-registration", async (req, res) => {
  try {
    const user = await queryOne("SELECT id, full_name, email FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    await execute("UPDATE users SET status = 'rejected', updated_at = datetime('now','localtime') WHERE id = ?", [req.params.id]);
    const nid = uuidv4(); await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'error')", [nid, req.params.id, "❌ تم رفض الحساب", "نأسف، تم رفض طلب تسجيل حسابك"]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upgrade requests
router.post("/upgrade-request", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") return res.status(400).json({ error: "Invalid request body" });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const user = await queryOne("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.account_type === "student") return res.status(400).json({ error: "Already a student account" });
    const existing = await queryOne("SELECT id FROM upgrade_requests WHERE user_id = ? AND status = 'pending'", [userId]);
    if (existing) return res.status(400).json({ error: "لديك طلب ترقية معلق بالفعل" });
    const id = uuidv4();
    await execute("INSERT INTO upgrade_requests (id, user_id, status) VALUES (?, ?, 'pending')", [id, userId]);
    res.json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/upgrade-requests/list", async (req, res) => {
  const requests = await query(`
    SELECT r.*, u.full_name, u.email, u.phone, u.created_at as user_since
    FROM upgrade_requests r
    JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `);
  res.json(requests);
});

router.put("/upgrade-requests/:id/approve", async (req, res) => {
  try {
    const req2 = await queryOne("SELECT * FROM upgrade_requests WHERE id = ?", [req.params.id]);
    if (!req2) return res.status(404).json({ error: "Request not found" });
    await execute("UPDATE upgrade_requests SET status = 'approved', reviewed_at = datetime('now','localtime') WHERE id = ?", [req.params.id]);
    await execute("UPDATE users SET role = 'student', account_type = 'student', updated_at = datetime('now','localtime') WHERE id = ?", [req2.user_id]);
    const nid = uuidv4(); await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'success')", [nid, req2.user_id, "🎓 تم ترقية الحساب", "تم ترقية حسابك إلى Student Account! يمكنك الآن شراء الكورسات"]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/upgrade-requests/:id/reject", async (req, res) => {
  try {
    const req2 = await queryOne("SELECT * FROM upgrade_requests WHERE id = ?", [req.params.id]);
    if (!req2) return res.status(404).json({ error: "Request not found" });
    await execute("UPDATE upgrade_requests SET status = 'rejected', reviewed_at = datetime('now','localtime') WHERE id = ?", [req.params.id]);
    const nid = uuidv4(); await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'error')", [nid, req2.user_id, "❌ تم رفض طلب الترقية", "نأسف، تم رفض طلب ترقية حسابك"]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Direct upgrade: registration → student (free, no admin approval needed)
router.post("/:id/upgrade-account", async (req, res) => {
  try {
    const user = await queryOne("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.account_type === "student") return res.status(400).json({ error: "Already a student account" });
    await execute("UPDATE users SET role = 'student', account_type = 'student', status = 'active', updated_at = datetime('now','localtime') WHERE id = ?", [req.params.id]);
    const nid = uuidv4(); await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'success')", [nid, req.params.id, "🎓 تم ترقية الحساب", "تم ترقية حسابك إلى Student Account! يمكنك الآن شراء الكورسات والمشاركة في نظام الرتب والعمولات والتسويق."]);
    await logAdminAction(req, `self-upgrade to student`, req.params.id, user.full_name, null);
    res.json({ success: true, account_type: "student" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: change account type
router.put("/:id/account-type", async (req, res) => {
  try {
    console.log("[account-type] userId:", req.params.id, "body:", JSON.stringify(req.body), "account_type:", req.body?.account_type);
    const user = await queryOne("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { account_type } = req.body;
    if (!["student","registration"].includes(account_type)) return res.status(400).json({ error: "Invalid account_type" });
    const role = account_type === "student" ? "student" : "registration";
    await execute("UPDATE users SET role = ?, account_type = ?, updated_at = datetime('now','localtime') WHERE id = ?", [role, account_type, req.params.id]);
    const typeLabel = account_type === "student" ? "Student" : "Registration";
    const nid = uuidv4(); await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'info')", [nid, req.params.id, "🔄 تم تغيير نوع الحساب", `تم تغيير نوع حسابك إلى ${typeLabel}`]);
    await logAdminAction(req, `change account_type to ${account_type}`, req.params.id, user.full_name, JSON.stringify({ from: user.account_type, to: account_type }));

    // Pay commission when converting Registration → Student
    if (account_type === "student" && user.account_type === "registration" && user.referred_by && user.referred_by !== "") {
      // Check if commission already paid for this user (prevent double payment)
      const existingCommission = await queryOne("SELECT id FROM commissions WHERE from_user_id = ? AND level = 1", [req.params.id]);
      if (!existingCommission) {
        const referrer = await queryOne("SELECT id, account_type FROM users WHERE id = ?", [user.referred_by]);
        if (referrer && referrer.account_type === "student") {
          const comId = uuidv4();
          await execute("INSERT INTO commissions (id, from_user_id, to_user_id, level, amount) VALUES (?, ?, ?, 1, 1000)", [comId, req.params.id, referrer.id]);
          await execute("UPDATE users SET e_money = e_money + 1000 WHERE id = ?", [referrer.id]);
          await execute("UPDATE users SET direct_count = direct_count + 1 WHERE id = ?", [referrer.id]);
          const nid2 = uuidv4(); await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'commission')", [nid2, referrer.id, "💰 عمولة جديدة", `ربحت 1000 E-Money — تم تحويل عضو من Registration إلى Student`]);
        }
      }
    }

    res.json({ success: true, account_type, role });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Renew membership (sets membership_expires_at based on admin setting)
router.post("/:id/renew-membership", async (req, res) => {
  try {
    const user = await queryOne("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    const durationRow = await queryOne("SELECT value FROM settings WHERE key = 'membership_duration'");
    const days = parseInt(durationRow?.value) || 183;
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    const expiresStr = expires.toISOString().slice(0, 19).replace("T", " ");
    await execute("UPDATE users SET membership_expires_at = ?, blocked = 0, updated_at = datetime('now','localtime') WHERE id = ?", [expiresStr, req.params.id]);
    res.json({ success: true, membership_expires_at: expiresStr, days });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
