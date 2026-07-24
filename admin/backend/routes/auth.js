import express from "express";
import { query, queryOne, execute } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { sendOTPEmail } from "../utils/email.js";

const router = express.Router();

function detectDeviceType(ua) {
  if (!ua) return "desktop";
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone/i.test(ua);
  return mobile ? "mobile" : "desktop";
}

async function generateUserId() {
  for (let attempt = 0; attempt < 100; attempt++) {
    const id = String(Math.floor(1000000000 + Math.random() * 9000000000));
    const existing = await queryOne("SELECT id FROM users WHERE id = ?", [id]);
    if (!existing) return id;
  }
  throw new Error("Could not generate unique user ID");
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await queryOne("SELECT * FROM users WHERE email = ?", [email]);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const valid = await bcrypt.compare(password, user.password || "");
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  if (user.blocked) return res.status(403).json({ error: "تم حظر حسابك. يرجى التواصل مع الإدارة." });
  if (user.status === 'pending') return res.status(403).json({ error: "حسابك قيد المراجعة. يرجى الانتظار حتى يتم تفعيله من الإدارة." });

  const deviceType = detectDeviceType(req.headers["user-agent"]);
  const session_token = uuidv4() + "-" + Date.now();

  // Single Active Device: check if user already has ANY active session
  const existingSessions = await query("SELECT id, device_type, device_info, last_heartbeat FROM user_sessions WHERE user_id = ?", [user.id]);

  // Filter stale sessions in JS (heartbeat older than 15 seconds = browser closed)
  const now = Date.now();
  const HEARTBEAT_TIMEOUT = 15 * 1000; // 15 seconds
  const activeSessions = existingSessions.filter(s => {
    if (!s.last_heartbeat) return false; // old session without heartbeat = stale
    const lastHb = new Date(s.last_heartbeat).getTime();
    return (now - lastHb) < HEARTBEAT_TIMEOUT;
  });

  if (activeSessions.length > 0) {
    // Another device is already logged in — reject
    return res.status(403).json({
      success: false,
      code: "DEVICE_ALREADY_ACTIVE",
      message: "This account is already logged in on another device. Please log out from that device first.",
      message_ar: "هذا الحساب مسجل الدخول على جهاز آخر. يرجى تسجيل الخروج من ذلك الجهاز أولاً."
    });
  }

  // Clean up ALL stale sessions (heartbeat expired — user closed browser)
  await execute("DELETE FROM user_sessions WHERE user_id = ?", [user.id]);

  // No active session — create new session
  const nowHb = new Date().toISOString();
  await execute(
    "INSERT INTO user_sessions (id, user_id, session_token, device_type, device_info, last_heartbeat) VALUES (?, ?, ?, ?, ?, ?)",
    [uuidv4(), user.id, session_token, deviceType, req.headers["user-agent"] || "", nowHb]
  );

  // Also keep backward compatibility with users.session_token
  await execute("UPDATE users SET session_token = ? WHERE id = ?", [session_token, user.id]);

  user.session_token = session_token;
  delete user.password;
  res.json({ user, session_token });
});

router.post("/logout", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const sessionToken = req.headers["x-session-token"];
    if (!userId || !sessionToken) return res.status(401).json({ error: "Unauthorized" });
    const user = await queryOne("SELECT id, session_token FROM users WHERE id = ?", [userId]);
    if (!user || user.session_token !== sessionToken) return res.status(401).json({ error: "Session invalid" });
    await execute("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
    await execute("UPDATE users SET session_token = NULL WHERE id = ?", [userId]);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

// Cleanup expired/orphan sessions (optional, run on startup)
router.post("/cleanup-sessions", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const sessionToken = req.headers["x-session-token"];
    if (!userId || !sessionToken) return res.status(401).json({ error: "Unauthorized" });
    const user = await queryOne("SELECT id, session_token, role FROM users WHERE id = ?", [userId]);
    if (!user || user.session_token !== sessionToken) return res.status(401).json({ error: "Session invalid" });
    if (user.role !== "admin" && user.role !== "manager") return res.status(403).json({ error: "Admin access required" });
    await execute("DELETE FROM user_sessions WHERE user_id NOT IN (SELECT id FROM users)");
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

// Heartbeat: keeps session alive while browser tab is open
router.post("/heartbeat", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.json({ success: false });
    const now = new Date().toISOString();

    // Check if user's session_token was changed by another login
    const user = await queryOne("SELECT id, session_token FROM users WHERE id = ?", [user_id]);
    const sessionToken = req.headers["x-session-token"];
    if (sessionToken && user && user.session_token !== sessionToken) {
      return res.json({ success: false, logout: true });
    }

    await execute("UPDATE user_sessions SET last_heartbeat = ? WHERE user_id = ?", [now, user_id]);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { full_name, email, phone, address, password, referral_code, governorate, id_card_front, id_card_back } = req.body;
    const existing = await queryOne("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) return res.status(400).json({ error: "Email already exists" });
    if (phone) {
      const existingPhone = await queryOne("SELECT id FROM users WHERE phone = ?", [phone]);
      if (existingPhone) return res.status(400).json({ error: "Phone number is already registered to another account", error_ar: "رقم الهاتف مسجل بالفعل في حساب آخر" });
    }

    const id = await generateUserId();
    const code = "EVR-" + id.slice(0, 6);

    let referredBy = null;
    if (referral_code) {
      const refUser = await queryOne("SELECT id FROM users WHERE referral_code = ?", [referral_code]);
      if (refUser) referredBy = refUser.id;
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const hashedPassword = await bcrypt.hash(password, 10);
    await execute(
      "INSERT INTO users (id, full_name, email, phone, address, password, referral_code, referred_by, status, role, account_type, rank, governorate, id_card_front, id_card_back, email_otp, email_otp_expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'registration', 'registration', '', ?, ?, ?, ?, ?)",
      [id, full_name, email, phone || null, address || null, hashedPassword, code, referredBy, governorate || null, id_card_front || null, id_card_back || null, otp, expires]
    );

    // Populate closure table (for tree visibility — commissions handled on admin approval)
    await execute("INSERT INTO user_closure (ancestor, descendant, depth) VALUES (?, ?, 0)", [id, id]);
    if (referredBy) {
      const ancestors = await query(
        "SELECT ancestor, depth FROM user_closure WHERE descendant = ? AND ancestor != descendant",
        [referredBy]
      );
      for (const a of ancestors) {
        await execute("INSERT INTO user_closure (ancestor, descendant, depth) VALUES (?, ?, ?)",
          [a.ancestor, id, a.depth + 1]);
      }
      await execute("INSERT INTO user_closure (ancestor, descendant, depth) VALUES (?, ?, 1)",
        [referredBy, id]);
    }

    // Send OTP to email
    try {
      await sendOTPEmail(email, otp, "Everest Academy — Email Verification Code");
    } catch (emailErr) {
      console.error("Registration email send failed:", emailErr.message);
    }

    const user = await queryOne("SELECT id, full_name, email, phone, address, referral_code, referred_by, status, rank, e_money, account_type, created_at FROM users WHERE id = ?", [id]);
    res.json({ user, otp_sent: true });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify email OTP (registration verification)
router.post("/verify-email-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });
    const user = await queryOne("SELECT id, email_otp, email_otp_expires FROM users WHERE email = ?", [email]);
    if (!user) return res.status(404).json({ error: "No account found with this email" });
    if (user.email_otp !== otp) return res.status(400).json({ error: "Invalid OTP code" });
    if (new Date(user.email_otp_expires) < new Date()) {
      return res.status(400).json({ error: "OTP code has expired. Please register again." });
    }
    await execute("UPDATE users SET email_verified = 1, email_otp = NULL, email_otp_expires = NULL WHERE email = ?", [email]);
    res.json({ success: true, message: "Email verified" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Resend email OTP
router.post("/resend-email-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const user = await queryOne("SELECT id, email_otp_expires FROM users WHERE email = ?", [email]);
    if (!user) return res.status(404).json({ error: "No account found with this email" });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await execute("UPDATE users SET email_otp = ?, email_otp_expires = ? WHERE email = ?", [otp, expires, email]);
    try {
      await sendOTPEmail(email, otp, "Everest Academy — Email Verification Code");
    } catch (emailErr) {
      console.error("Resend OTP email failed:", emailErr.message);
      return res.status(500).json({ error: "Failed to send verification email" });
    }
    res.json({ success: true, message: "OTP resent to your email" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Forgot Password: send OTP to email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const user = await queryOne("SELECT id, full_name, email FROM users WHERE email = ?", [email]);
    if (!user) return res.status(404).json({ error: "No account found with this email" });
    if (user.blocked) return res.status(403).json({ error: "Account is blocked" });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await execute("DELETE FROM password_resets WHERE user_id = ?", [user.id]);
    await execute("INSERT INTO password_resets (id, user_id, otp, expires_at, created_at) VALUES (?, ?, ?, ?, datetime('now','localtime'))",
      [uuidv4(), user.id, otp, expires]);
    try {
      await sendOTPEmail(email, otp);
    } catch (emailErr) {
      console.error("Email send failed:", emailErr.message);
      return res.status(500).json({ error: "Failed to send verification email. Please try again." });
    }
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Verify OTP (step 2 of forgot password)
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });
    const user = await queryOne("SELECT id FROM users WHERE email = ?", [email]);
    if (!user) return res.status(404).json({ error: "No account found with this email" });
    const reset = await queryOne("SELECT * FROM password_resets WHERE user_id = ? AND otp = ? ORDER BY created_at DESC LIMIT 1", [user.id, otp]);
    if (!reset) return res.status(400).json({ error: "Invalid OTP code" });
    if (new Date(reset.expires_at) < new Date()) {
      await execute("DELETE FROM password_resets WHERE user_id = ?", [user.id]);
      return res.status(400).json({ error: "OTP code has expired. Please request a new one." });
    }
    res.json({ success: true, message: "OTP verified" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reset Password: set new password (after OTP verified)
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    if (!email || !otp || !new_password) return res.status(400).json({ error: "All fields are required" });
    if (new_password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const user = await queryOne("SELECT id FROM users WHERE email = ?", [email]);
    if (!user) return res.status(404).json({ error: "No account found with this email" });
    const reset = await queryOne("SELECT * FROM password_resets WHERE user_id = ? AND otp = ? ORDER BY created_at DESC LIMIT 1", [user.id, otp]);
    if (!reset) return res.status(400).json({ error: "Invalid OTP code" });
    if (new Date(reset.expires_at) < new Date()) {
      await execute("DELETE FROM password_resets WHERE user_id = ?", [user.id]);
      return res.status(400).json({ error: "OTP code has expired. Please request a new one." });
    }
    const hashed = await bcrypt.hash(new_password, 10);
    await execute("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id]);
    await execute("DELETE FROM password_resets WHERE user_id = ?", [user.id]);
    res.json({ success: true, message: "Password reset successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
