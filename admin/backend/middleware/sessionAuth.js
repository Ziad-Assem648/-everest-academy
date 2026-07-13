import { queryOne } from "../db.js";

export default async function sessionAuth(req, res, next) {
  // Since this middleware is mounted at /api, req.path is relative to /api
  // e.g. a request to /api/auth/login gives req.path = /auth/login
  const publicPaths = ["/auth/login", "/auth/register", "/chat", "/payment-gateways/active", "/upload", "/admin-auth", "/settings"];
  if (publicPaths.some(p => req.path.startsWith(p))) return next();
  if (req.path.startsWith("/courses") || req.path.startsWith("/ranks") || req.path.startsWith("/leaders")) {
    if (req.method === "GET") return next();
  }

  const userId = req.headers["x-user-id"];
  const sessionToken = req.headers["x-session-token"];

  // If no session headers sent, allow request through (for admin frontend without auth)
  if (!userId && !sessionToken) return next();

  if (userId && sessionToken) {
    const user = await queryOne("SELECT id, session_token FROM users WHERE id = ?", [userId]);
    if (user && user.session_token === sessionToken) return next();
  }

  res.status(401).json({ error: "Session expired. تم تسجيل الخروج من جهاز آخر. يرجى تسجيل الدخول مرة أخرى.", session_expired: true });
}
