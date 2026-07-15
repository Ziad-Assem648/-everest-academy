import { queryOne } from "../db.js";

const publicPaths = ["/auth/login", "/auth/register", "/payment-gateways/active", "/admin-auth"];
const chatPublicPaths = ["/chat"];

export default async function sessionAuth(req, res, next) {
  // Since this middleware is mounted at /api, req.path is relative to /api
  // e.g. a request to /api/auth/login gives req.path = /auth/login

  // Fully public paths — no auth needed at all
  if (publicPaths.some(p => req.path.startsWith(p))) return next();

  // Chat endpoint: POST is public (chatbot), but keys-status and test-groq require auth
  if (req.path.startsWith("/chat")) {
    if (req.method === "POST") return next();
    // GET /chat/keys-status, /chat/test-groq etc require auth — fall through
  }

  // Browse-only: GET requests to courses/ranks/leaders/feedbacks/proofs/dashboard are public (for landing page display)
  if (req.method === "GET" && (req.path.startsWith("/courses") || req.path.startsWith("/ranks") || req.path.startsWith("/leaders") || req.path.startsWith("/feedbacks") || req.path.startsWith("/proofs") || req.path.startsWith("/dashboard"))) {
    return next();
  }

  const userId = req.headers["x-user-id"];
  const sessionToken = req.headers["x-session-token"];

  // No credentials at all → reject (except the public paths above)
  if (!userId || !sessionToken) {
    return res.status(401).json({ error: "Unauthorized. يرجى تسجيل الدخول.", session_expired: true });
  }

  // Validate session against DB
  const user = await queryOne("SELECT id, session_token FROM users WHERE id = ?", [userId]);
  if (user && user.session_token === sessionToken) return next();

  res.status(401).json({ error: "Session expired. تم تسجيل الخروج من جهاز آخر. يرجى تسجيل الدخول مرة أخرى.", session_expired: true });
}
