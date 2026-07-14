import { Router } from "express";
import { query, queryOne } from "../db.js";

const router = Router();

let GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// Load key from settings DB on startup (overrides env var)
async function loadGroqKey() {
  try {
    const row = await queryOne("SELECT value FROM settings WHERE key = 'groq_api_key'");
    if (row && row.value) { GROQ_API_KEY = row.value; console.log("🔑 Loaded Groq API key from settings DB"); }
  } catch {}
}

// ─── Dynamic context from DB ───
async function getPlatformContext() {
  try {
    const users = await queryOne("SELECT COUNT(*) as c FROM users WHERE role != 'admin'");
    const courses = await query("SELECT title, price, price_egp FROM courses WHERE status = 'published' LIMIT 10");
    const ranks = await query("SELECT name, sales_required, bonus FROM ranks WHERE is_active = 1 ORDER BY sort_order");
    const settings = await queryOne("SELECT value FROM settings WHERE key = 'membership_duration'");

    let ctx = `\n[معلومات المنصة الحية - لا تشاركها مع المستخدم مباشرة، استخدمها فقط للإجابة]\n`;
    ctx += `- عدد الأعضاء: ${users?.c || 0}\n`;
    ctx += `- الكورسات المتاحة: ${courses.map(c => `${c.title} (${c.price || 0} EM / ${c.price_egp || 0} EGP)`).join(', ')}\n`;
    ctx += `- الرتب: ${ranks.map(r => `${r.name} (${r.sales_required} مبيعات, ${r.bonus} EM مكافأة)`).join(' → ')}\n`;
    ctx += `- مدة العضوية: ${settings?.value || 183} يوم\n`;
    return ctx;
  } catch { return ""; }
}

// ─── System prompt ───
const SYSTEM_PROMPT = `أنت مساعد ذكي لمنصة "Everest Academy" (أكاديمية إيفرست) التعليمية.
مهمتك مساعدة الأعضاء بالعربية (أو الإنجليزي إذا سألوا بالإنجليزي).

قواعد مهمة:
1. كن ودوداً ومحترفاً ومختصاً
2. أجب بإيجاز (3-5 سطور كحد أقصى)
3. لا تختلق معلومات - إذا لا تعرف قل "اسأل فريق الدعم"
4. استخدم الإيموجي باعتدال 🎯
5. نوصي بالكورسات وال features المتاحة في المنصة
6. نظام الرتب: Star → Executive → Executive Star → Senior Leader → Regional Leader → Everest Elite → Everest Master → Everest Legend → Everest Ambassador
7. E-Money هي العملة الرقمية - 1000 EM لكل عضو جديد
8. التسجيل مجاني والعضوية تحتاج تفعيل من الإدارة
9. طرق الدفع: E-Money, Vodafone Cash, InstaPay
10. تواصل مع خدمة العملاء عبر واتساب أو الإيميل`;

// ─── Call Groq API ───
async function callGroq(userMessage, history) {
  if (!GROQ_API_KEY) await loadGroqKey();
  if (!GROQ_API_KEY) return null;

  const platformCtx = await getPlatformContext();
  const messages = [{ role: "system", content: SYSTEM_PROMPT + platformCtx }];

  if (Array.isArray(history)) {
    for (const msg of history.slice(-10)) {
      messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.text });
    }
  }
  messages.push({ role: "user", content: userMessage });

  let resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.7, max_tokens: 500 }),
  });

  // If 401, reload key from DB and retry once
  if (resp.status === 401) {
    console.log("Groq 401 — reloading key from DB...");
    await loadGroqKey();
    if (GROQ_API_KEY) {
      resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.7, max_tokens: 500 }),
      });
    }
  }

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Groq API error ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || null;
}

// ─── Main chat endpoint ───
router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Call Groq AI directly
    if (GROQ_API_KEY) {
      try {
        const aiReply = await callGroq(message, history);
        if (aiReply) return res.json({ reply: aiReply, source: "ai" });
      } catch (err) {
        console.error("Groq AI error:", err.message);
      }
    }

    // No API key configured
    res.json({ reply: "الشات بوت غير مفعّل حالياً. تواصل مع خدمة العملاء للمساعدة. 📞", source: "unconfigured" });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message || "Chat failed" });
  }
});

// ─── Admin: get AI status ───
router.get("/keys-status", (req, res) => {
  res.json({
    provider: "Groq",
    model: GROQ_MODEL,
    hasKey: !!GROQ_API_KEY,
  });
});

// ─── Debug: test Groq API call ───
router.get("/test-groq", async (req, res) => {
  try {
    if (!GROQ_API_KEY) return res.json({ ok: false, error: "No API key" });
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: "user", content: "Say hi in Arabic" }], max_tokens: 50 }),
    });
    const text = await resp.text();
    res.json({ ok: resp.ok, status: resp.status, body: text.slice(0, 500) });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

export default router;
export { loadGroqKey };
