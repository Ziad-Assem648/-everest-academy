import { queryOne, execute } from "../db.js";

const publicPaths = ["/auth/login", "/auth/register", "/auth/logout", "/payment-gateways/active", "/admin-auth"];
const chatPublicPaths = ["/chat"];

export default async function sessionAuth(req, res, next) {
  if (publicPaths.some(p => req.path.startsWith(p))) return next();

  if (req.path.startsWith("/chat")) {
    if (req.method === "POST") return next();
  }

  if (req.method === "GET" && (req.path.startsWith("/courses") || req.path.startsWith("/ranks") || req.path.startsWith("/leaders") || req.path.startsWith("/feedbacks") || req.path.startsWith("/proofs") || req.path.startsWith("/dashboard"))) {
    return next();
  }

  const userId = req.headers["x-user-id"];
  const sessionToken = req.headers["x-session-token"];

  if (!userId || !sessionToken) {
    return res.status(401).json({ error: "Unauthorized. يرجى تسجيل الدخول.", session_expired: true });
  }

  // Check if session heartbeat has expired (>30 seconds old = browser closed)
  const session = await queryOne(
    "SELECT id FROM user_sessions WHERE user_id = ? AND (last_heartbeat IS NULL OR last_heartbeat > datetime('now', '-30 seconds'))",
    [userId]
  );
  if (!session) {
    // Session expired — clean it up
    await execute("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
    await execute("UPDATE users SET session_token = NULL WHERE id = ?", [userId]);
    return res.status(401).json({ error: "Session expired. تم تسجيل الخروج. يرجى تسجيل الدخول مرة أخرى.", session_expired: true });
  }

  // Validate session against users table
  const user = await queryOne("SELECT id, session_token FROM users WHERE id = ?", [userId]);
  if (user && user.session_token === sessionToken) return next();

  res.status(401).json({ error: "Session expired. تم تسجيل الخروج من جهاز آخر. يرجى تسجيل الدخول مرة أخرى.", session_expired: true });
}
