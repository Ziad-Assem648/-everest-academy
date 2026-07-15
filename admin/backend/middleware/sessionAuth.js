import { queryOne } from "../db.js";

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

  // Validate session against users table
  const user = await queryOne("SELECT id, session_token FROM users WHERE id = ?", [userId]);
  if (user && user.session_token === sessionToken) return next();

  res.status(401).json({ error: "Session expired. تم تسجيل الخروج من جهاز آخر. يرجى تسجيل الدخول مرة أخرى.", session_expired: true });
}
