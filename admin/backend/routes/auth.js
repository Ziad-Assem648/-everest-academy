import express from "express";
import { query, queryOne, execute } from "../db.js";
import { v4 as uuidv4 } from "uuid";

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
  const user = await queryOne("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  if (user.blocked) return res.status(403).json({ error: "تم حظر حسابك. يرجى التواصل مع الإدارة." });
  if (user.status === 'pending') return res.status(403).json({ error: "حسابك قيد المراجعة. يرجى الانتظار حتى يتم تفعيله من الإدارة." });

  const deviceType = detectDeviceType(req.headers["user-agent"]);
  const session_token = uuidv4() + "-" + Date.now();

  // Check if user already has an active session on the same device type
  const existingSession = await queryOne(
    "SELECT id, device_type FROM user_sessions WHERE user_id = ? AND device_type = ?",
    [user.id, deviceType]
  );

  if (existingSession) {
    // Session exists on same device type — block login
    const deviceLabel = deviceType === "desktop" ? "حاسوب" : "موبايل";
    return res.status(403).json({
      error: `الحساب مفتوح بالفعل على ${deviceLabel} آخر. يرجى تسجيل الخروج من الجهاز الآخر أولاً.`,
      device_blocked: true,
    });
  }

  // Create new session in user_sessions table
  await execute(
    "INSERT INTO user_sessions (id, user_id, session_token, device_type, device_info) VALUES (?, ?, ?, ?, ?)",
    [uuidv4(), user.id, session_token, deviceType, req.headers["user-agent"] || ""]
  );

  // Also keep backward compatibility with users.session_token
  await execute("UPDATE users SET session_token = ? WHERE id = ?", [session_token, user.id]);

  user.session_token = session_token;
  res.json({ user, session_token });
});

router.post("/logout", async (req, res) => {
  try {
    const { user_id, session_token } = req.body;
    if (user_id && session_token) {
      await execute("DELETE FROM user_sessions WHERE user_id = ? AND session_token = ?", [user_id, session_token]);
      await execute("UPDATE users SET session_token = NULL WHERE id = ? AND session_token = ?", [user_id, session_token]);
    }
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

// Cleanup expired/orphan sessions (optional, run on startup)
router.post("/cleanup-sessions", async (req, res) => {
  try {
    // Delete sessions where the user no longer exists
    await execute("DELETE FROM user_sessions WHERE user_id NOT IN (SELECT id FROM users)");
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { full_name, email, phone, address, password, referral_code } = req.body;
    const existing = await queryOne("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const id = await generateUserId();
    const code = "EVR-" + id.slice(0, 6);

    let referredBy = null;
    if (referral_code) {
      const refUser = await queryOne("SELECT id FROM users WHERE referral_code = ?", [referral_code]);
      if (refUser) referredBy = refUser.id;
    }

    await execute(
      "INSERT INTO users (id, full_name, email, phone, address, password, referral_code, referred_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
      [id, full_name, email, phone || null, address || null, password, code, referredBy]
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

    const user = await queryOne("SELECT * FROM users WHERE id = ?", [id]);
    res.json({ user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
