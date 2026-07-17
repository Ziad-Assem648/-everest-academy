import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { initDb, execute, query, queryOne } from "./db.js";
import { pool as geminiPool } from "./geminiKeys.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN === "*" ? true : process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["http://localhost:4000","http://localhost:3000"],
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(join(__dirname, "uploads")));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: { error: "Too many requests. يرجى المحاولة لاحقاً." } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: "Too many login attempts. يرجى المحاولة بعد 15 دقيقة." } });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { error: "Too many uploads." } });

// Serve built frontends if dist folders exist
// Admin frontend at /admin
const adminDist = join(__dirname, "../frontend/dist");
if (fs.existsSync(adminDist)) {
  app.use("/admin", express.static(adminDist, { maxAge: 0, etag: false, lastModified: false }));
  const serveAdmin = (req, res) => {
    const indexPath = join(adminDist, "index.html");
    let html = fs.readFileSync(indexPath, "utf8");
    const buildVersion = Date.now().toString(36);
    html = html.replace('src="./assets/', `src="./assets/?v=${buildVersion}&f=`);
    html = html.replace('href="./assets/', `href="./assets/?v=${buildVersion}&f=`);
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  };
  app.get("/admin", serveAdmin);
  app.get("/admin/*", serveAdmin);
  console.log("✅ Serving admin frontend from", adminDist);
}
// User frontend at root
const userDist = join(__dirname, "../../user/dist");
const userPublic = join(__dirname, "../../user/public");
if (fs.existsSync(userDist)) {
  app.use("/assets", express.static(join(userDist, "assets"), { maxAge: 0, etag: false, lastModified: false }));
  app.use(express.static(userDist, { maxAge: 0, etag: false, lastModified: false, index: false }));
  const buildVersion = Date.now().toString(36);
  const serveUser = (req, res) => {
    const indexPath = join(userDist, "index.html");
    let html = fs.readFileSync(indexPath, "utf8");
    html = html.replace('src="/assets/', `src="/assets/?v=${buildVersion}&f=`);
    html = html.replace('href="/assets/', `href="/assets/?v=${buildVersion}&f=`);
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  };
  app.get("/", serveUser);
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path.startsWith("/admin")) return next();
    if (req.path.startsWith("/assets/")) {
      const fParam = req.query.f;
      if (fParam) {
        const filePath = join(userDist, "assets", fParam);
        if (fs.existsSync(filePath)) {
          return res.sendFile(filePath);
        }
      }
    }
    serveUser(req, res);
  });
  console.log("✅ Serving user frontend from", userDist);
}
// Serve public assets (images, videos) as fallback
if (fs.existsSync(userPublic)) {
  app.use(express.static(userPublic));
  console.log("✅ Serving public assets from", userPublic);
}

import sessionAuth, { adminAuth } from "./middleware/sessionAuth.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import coursesRoutes from "./routes/courses.js";
import walletsRoutes from "./routes/wallets.js";
import mlmRoutes from "./routes/mlm.js";
import ranksRoutes from "./routes/ranks.js";
import leadersRoutes from "./routes/leaders.js";
import notificationsRoutes from "./routes/notifications.js";
import dashboardRoutes from "./routes/dashboard.js";
import uploadRoutes from "./routes/upload.js";
import paymentGatewayRoutes from "./routes/payment_gateways.js";
import chatRoutes from "./routes/chat.js";
import { loadGroqKey } from "./routes/chat.js";
import feedbacksRoutes from "./routes/feedbacks.js";
import proofsRoutes from "./routes/proofs.js";
import adminLogsRoutes from "./routes/admin_logs.js";
import settingsRoutes from "./routes/settings.js";
import adminAuthRoutes, { seedAdmins } from "./routes/admin_auth.js";

app.use("/api", sessionAuth, apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin-auth", authLimiter, adminAuthRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/wallets", adminAuth, walletsRoutes);
app.use("/api/mlm", mlmRoutes);
app.use("/api/ranks", ranksRoutes);
app.use("/api/leaders", leadersRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/dashboard", adminAuth, dashboardRoutes);
app.use("/api/upload", adminAuth, uploadLimiter, uploadRoutes);
app.use("/api/payment-gateways", paymentGatewayRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/feedbacks", feedbacksRoutes);
app.use("/api/proofs", proofsRoutes);
app.use("/api/admin-logs", adminAuth, adminLogsRoutes);
app.use("/api/settings", adminAuth, settingsRoutes);

// Public customer service settings (no auth needed)
app.get("/api/customer-service", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM settings WHERE key IN ('customer_service_whatsapp', 'customer_service_email')");
    const obj = {};
    for (const r of rows) obj[r.key] = r.value;
    res.json(obj);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Membership expiry checker — runs every hour
function startMembershipExpiryCheck() {
  const check = async () => {
    try {
      // Block expired users
      const expired = await query("SELECT id, full_name FROM users WHERE membership_expires_at IS NOT NULL AND membership_expires_at <= datetime('now','localtime') AND blocked = 0");
      for (const u of expired) {
        await execute("UPDATE users SET blocked = 1, updated_at = datetime('now','localtime') WHERE id = ?", [u.id]);
        const nid = uuidv4();
        await execute(
          "INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'warning')",
          [nid, u.id, "🚫 تم حظر حسابك", "انتهت مدة عضويتك. تواصل مع خدمة العملاء لتجديد العضوية."]
        );
        console.log(`🚫 Membership expired — blocked user: ${u.full_name} (${u.id})`);
      }

      // Warn users expiring in 5 days
      const expiring = await query(
        "SELECT id, full_name FROM users WHERE membership_expires_at IS NOT NULL AND blocked = 0 AND membership_expires_at > datetime('now','localtime') AND membership_expires_at <= datetime('now','localtime','+5 days')"
      );
      for (const u of expiring) {
        // Check if already warned today to avoid duplicate spam
        const existing = await query(
          "SELECT id FROM notifications WHERE user_id = ? AND title = '⚠️ العضوية ستنتهي قريباً' AND created_at >= datetime('now','localtime','-1 day')",
          [u.id]
        );
        if (existing.length === 0) {
          const nid = uuidv4();
          await execute(
            "INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'warning')",
            [nid, u.id, "⚠️ العضوية ستنتهي قريباً", "ستنتهي عضويتك خلال 5 أيام أو أقل. تواصل مع خدمة العملاء لتجديد العضوية لعدم انقطاع الخدمات."]
          );
          console.log(`⚠️ Warned user: ${u.full_name} (${u.id}) — membership expiring soon`);
        }
      }
    } catch (e) { console.error("Membership check error:", e.message); }
  };
  check(); // Run immediately on start
  setInterval(check, 3600000); // every hour
  console.log("🕐 Membership expiry checker started (every 1h)");
}

// Weekly commission scheduler — runs every Sunday at 23:55
function startWeeklyCommissionScheduler() {
  async function runWeeklyCommission() {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - daysToMonday - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      const weekStart = lastMonday.toISOString().slice(0, 10);
      const weekEnd = lastSunday.toISOString().slice(0, 10);

      const existing = await queryOne("SELECT id FROM weekly_commissions WHERE week_start = ? LIMIT 1", [weekStart]);
      if (existing) {
        console.log(`⏰ [AUTO-COMMISSION] Week ${weekStart} - ${weekEnd} already processed, skipping`);
        return;
      }

      const users = await query(
        "SELECT id, full_name, rank, direct_count, e_money, account_type FROM users WHERE role IN ('student','registration') AND status = 'active'"
      );
      const allRanks = await query("SELECT * FROM ranks ORDER BY sort_order ASC");
      const rankMap = {};
      allRanks.forEach(r => { rankMap[r.name] = r; });

      function sReq(r) { return r.sales_required || 0; }
      function bVal(r) { return r.bonus || 0; }

      let totalAwarded = 0;
      for (const user of users) {
        const userRank = rankMap[user.rank];
        const directs = await query("SELECT u.id, u.account_type, u.status FROM users u WHERE u.referred_by = ?", [user.id]);
        const activeDirects = directs.filter(d => d.status === 'active');
        const totalDirectSales = activeDirects.length;
        const studentDirectSales = activeDirects.filter(d => d.account_type === 'student').length;
        const registrationDirectSales = activeDirects.filter(d => d.account_type === 'registration').length;
        const qualifiedDirectSales = totalDirectSales;

        if (qualifiedDirectSales < 2) {
          const whId = uuidv4();
          await execute(`INSERT INTO weekly_history (id, user_id, week_start, week_end, calculation_date, previous_rank, current_rank, total_direct_sales, student_direct_sales, registration_direct_sales, qualified_direct_sales, qualified_team_count, qualified_network_count, weekly_commission, commission_status, promotion_status, failure_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [whId, user.id, weekStart, weekEnd, now.toISOString().slice(0,19).replace("T"," "), user.rank, user.rank, totalDirectSales, studentDirectSales, registrationDirectSales, qualifiedDirectSales, 0, 0, 0, 'not_eligible', 'no_change', `Less than 2 qualified direct sales (${qualifiedDirectSales})`]);
          continue;
        }

        const allTeamMembers = await query(
          "SELECT u.id, u.rank, u.status, u.account_type FROM user_closure c JOIN users u ON u.id = c.descendant WHERE c.ancestor = ? AND c.descendant != ? AND u.account_type IN ('student','registration')",
          [user.id, user.id]
        );
        let qualifiedTeamCount = 0;
        let studentMembers = 0;
        let registrationMembers = 0;
        let higherRankExcluded = 0;
        let inactiveExcluded = 0;
        for (const member of allTeamMembers) {
          if (member.status !== 'active') { inactiveExcluded++; continue; }
          const memberRankData = rankMap[member.rank];
          if (!memberRankData) { qualifiedTeamCount++; if (member.account_type === 'student') studentMembers++; else registrationMembers++; continue; }
          if (userRank && memberRankData.sort_order > userRank.sort_order) { higherRankExcluded++; continue; }
          qualifiedTeamCount++;
          if (member.account_type === 'student') studentMembers++; else registrationMembers++;
        }
        const qualifiedNetworkCount = allTeamMembers.filter(m => m.status === 'active').length;

        const previousRank = user.rank;
        let promotionStatus = 'no_change';
        let newRank = user.rank;
        if (userRank) {
          const rankIdx = allRanks.findIndex(r => r.name === user.rank);
          for (let i = (rankIdx >= 0 ? rankIdx + 1 : 0); i < allRanks.length; i++) {
            const next = allRanks[i];
            if (qualifiedTeamCount >= sReq(next)) {
              newRank = next.name;
              const bonusPaid = await queryOne("SELECT id FROM rank_bonuses WHERE user_id = ? AND rank_name = ?", [user.id, next.name]);
              const bonusAmount = bVal(next);
              if (bonusAmount > 0 && !bonusPaid) {
                await execute("INSERT INTO rank_bonuses (id, user_id, rank_name, amount) VALUES (?, ?, ?, ?)", [uuidv4(), user.id, next.name, bonusAmount]);
                await execute("UPDATE users SET e_money = e_money + ? WHERE id = ?", [bonusAmount, user.id]);
                await execute("INSERT INTO wallet_transactions (id, user_id, amount, type, description, status) VALUES (?, ?, ?, 'credit', ?, 'completed')", [uuidv4(), user.id, bonusAmount, `🎉 Rank up bonus - ${next.name}`]);
              }
              await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'success')", [uuidv4(), user.id, "🎉 Rank Up!", `You reached ${next.name} rank! Bonus: ${bonusAmount || 0} EM`]);
            } else { break; }
          }
        } else {
          for (const next of allRanks) {
            if (qualifiedTeamCount >= sReq(next)) { newRank = next.name; } else { break; }
          }
        }
        if (newRank !== previousRank) {
          promotionStatus = 'promoted';
          const progress = allRanks.findIndex(r => r.name === newRank);
          const nextAfter = allRanks[progress + 1];
          const progressPct = nextAfter ? Math.min(100, Math.round((qualifiedTeamCount / sReq(nextAfter)) * 100)) : 100;
          await execute("UPDATE users SET rank = ?, rank_progress = ?, updated_at = datetime('now','localtime') WHERE id = ?", [newRank, progressPct, user.id]);
        }

        const finalRank = rankMap[newRank];
        let weeklyCommission = 0;
        let commissionStatus = 'not_eligible';
        let failureReason = null;
        if (!finalRank) { failureReason = 'No rank assigned'; }
        else {
          const bonus = bVal(finalRank) || 0;
          if (bonus > 0) {
            weeklyCommission = bonus;
            commissionStatus = 'paid';
            await execute("UPDATE users SET e_money = e_money + ? WHERE id = ?", [bonus, user.id]);
            await execute("INSERT INTO weekly_commissions (id, user_id, rank_name, amount, week_start, week_end, status) VALUES (?, ?, ?, ?, ?, ?, 'paid')", [uuidv4(), user.id, finalRank.name, bonus, weekStart, weekEnd]);
            await execute("INSERT INTO wallet_transactions (id, user_id, amount, type, description, status) VALUES (?, ?, ?, 'credit', ?, 'completed')", [uuidv4(), user.id, bonus, `العمولة الأسبوعية - رتبة ${finalRank.name} (${weekStart})`]);
            await execute("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'commission')", [uuidv4(), user.id, "🏆 عمولة أسبوعية", `ربحت ${bonus} E-Money كعمولة أسبوعية عن رتبة ${finalRank.name}`]);
            totalAwarded++;
          } else { failureReason = `Rank ${finalRank.name} has no weekly bonus`; }
        }

        const whId = uuidv4();
        const details = JSON.stringify({ totalDirectSales, studentDirectSales, registrationDirectSales, qualifiedTeamCount, studentMembers, registrationMembers, higherRankExcluded, inactiveExcluded, qualifiedNetworkCount });
        await execute(`INSERT INTO weekly_history (id, user_id, week_start, week_end, calculation_date, previous_rank, current_rank, total_direct_sales, student_direct_sales, registration_direct_sales, qualified_direct_sales, qualified_team_count, qualified_network_count, student_members, registration_members, higher_rank_excluded, inactive_excluded, weekly_commission, commission_status, promotion_status, failure_reason, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [whId, user.id, weekStart, weekEnd, now.toISOString().slice(0,19).replace("T"," "), previousRank, newRank, totalDirectSales, studentDirectSales, registrationDirectSales, qualifiedDirectSales, qualifiedTeamCount, qualifiedNetworkCount, studentMembers, registrationMembers, higherRankExcluded, inactiveExcluded, weeklyCommission, commissionStatus, promotionStatus, failureReason, details]);

        console.log(`[AUTO-COMMISSION] User: ${user.full_name} (${user.id}) | ${previousRank||'None'} → ${newRank||'None'} | Directs: ${totalDirectSales} | Team: ${qualifiedTeamCount} | Commission: ${weeklyCommission} EM (${commissionStatus})`);
      }

      console.log(`🏆 [AUTO-COMMISSION] Week ${weekStart} - ${weekEnd} done: ${totalAwarded} users awarded out of ${users.length}`);
    } catch (e) { console.error("Auto weekly commission error:", e.message); }
  }

  // Run every Sunday at 23:55 (just before end of week)
  cron.schedule("55 23 * * 0", () => {
    console.log("⏰ [CRON] Sunday 23:55 — triggering weekly commission...");
    runWeeklyCommission();
  }, { timezone: "Africa/Cairo" });

  console.log("⏰ Weekly commission auto-scheduler started (Sunday 23:55 Cairo time)");
}

// Initialize database then start server
initDb().then(async () => {
  await seedAdmins();
  console.log("✅ Admin accounts seeded");
  // Load Gemini API keys (env first, then settings DB override)
  geminiPool.load(process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "");
  try {
    const rows = await query("SELECT value FROM settings WHERE key = 'gemini_api_keys'");
    if (rows.length > 0 && rows[0].value) {
      geminiPool.load(rows[0].value);
      console.log("🔑 Loaded Gemini keys from settings DB");
    }
  } catch {}
  // Load Groq API key from settings DB (insert env default if not set)
  try {
    const existing = await query("SELECT value FROM settings WHERE key = 'groq_api_key'");
    if (existing.length === 0 || !existing[0].value) {
      const defaultKey = process.env.GROQ_API_KEY || "";
      if (defaultKey) {
        await execute("INSERT INTO settings (key, value) VALUES ('groq_api_key', ?)", [defaultKey]);
        console.log("🔑 Default Groq API key inserted into settings DB");
      }
    }
  } catch {}
  await loadGroqKey();
  // Clean up orphaned sessions
  try { await execute("DELETE FROM user_sessions WHERE user_id NOT IN (SELECT id FROM users)"); } catch(e) {}
  app.listen(PORT, () => {
    console.log(`✅ Everest Admin Backend running on http://localhost:${PORT}`);
  });
  startMembershipExpiryCheck();
  startWeeklyCommissionScheduler();
}).catch(err => {
  console.error("Failed to initialize database:", err);
});

