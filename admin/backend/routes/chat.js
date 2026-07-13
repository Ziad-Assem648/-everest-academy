import { Router } from "express";
import { query, queryOne } from "../db.js";

const router = Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// ─── Knowledge Base (fast-path: instant replies for common questions) ───
const KB = [
  { k: ["مرحبا", "اهلا", "السلام عليكم", "hello", "hi", "hey", "مساء الخير", "صباح الخير"], r: "أهلاً وسهلاً! 👋 أنا مساعد Everest Academy الذكي. أقدر أساعدك في أي سؤال عن المنصة، الكورسات، التسجيل، الرتب، أو أي حاجة تانية. اسألني! 😊" },
  { k: ["شنو هي ايفرست", "ما هي ايفرست", "ايه هي ايفرست", "ما هو ايفرست", "عن الاكاديمية", "عن المنصة", "ايه الاكاديمية", "شنو الاكاديمية", "what is everest", "about everest"], r: "Everest Academy 🏔️ هي منصة تعليمية أونلاين متخصصة في: Trading, Investment, Digital Marketing, AI, Programming, and Freelancing. عندنا كورسات مجانية ومدفوعة ونظام MLM للمكافآت! 💰" },
  { k: ["كورس", "الكورسات", "courses", "كورسات", "دورة", "دورات"], r: "عندنا كورسات كتير في مجالات مختلفة! 📚\n• Trading & Investment\n• Digital Marketing\n• AI & Programming\n• Freelancing\n\nالكورسات فيها دروس مجانية + محتوى مدفوع. تقدر تتصفحهم من صفحة الكورسات! 🎓" },
  { k: ["تسجيل", "اعضاء", "سجّل", "register", "signup", "انضم"], r: "التسجيل في Everest Academy سهل! 🎯\n1. ادخل صفحة التسجيل\n2. اكتب بياناتك (الاسم، الإيميل، كلمة المرور)\n3. لو عندك كود إحالة حطه\n4. استنى التفعيل من الإدارة\n\nبعد التفعيل تقدر تشتري الكورسات وتبدأ تكسب! 💪" },
  { k: ["ايمoney", "e-money", "امانى", "المحفظة", "wallet", "الرصيد"], r: "E-Money 💰 هي العملة الرقمية في المنصة!\n• بتاخد 1000 E-Money مع كل عضو جديد يسجل بيك\n• بتقدر تستخدمها لشراء الكورسات\n• بتقدر تشحنها بطرق الدفع المتاحة\n\nكل ما فريقك يكبر، أكتر بتكسب! 📈" },
  { k: ["رتبة", "الرتب", "rank", "ranks", "ترقية"], r: "نظام الرتب في Everest 🏅\n⭐ Star → 🌟 Executive → 💎 Executive Star → 🏆 Senior Leader → 🌍 Regional Leader → 🏔️ Everest Elite → 👑 Everest Master → 🔥 Everest Legend → 🕊️ Everest Ambassador\n\nكل رتبة ليها شروط ومكافآت خاصة! 💎" },
  { k: ["دفع", "طريقة دفع", "payment", "fawry", "فودافون كاش", "vodafone", "instapay", "انستاباي"], r: "طرق الدفع المتاحة 💳\n• E-Money (المحفظة الرقمية)\n• Vodafone Cash\n• InstaPay\n\nتقدر تشحن رصيدك بأي طريقة من دول! 🔐" },
  { k: ["عمولة", "العمولة", "commission", "commissions", "MLM", "التسويق", "احالة", "إحالة"], r: "نظام MLM 🔄\n• كل ما تسجل عضو جديد بيكودك بتكسب 1000 E-Money\n• فريقك يكبر = أكتر أرباح\n• نظام المستويات المتعددة بيوصل لأكتر من 5 مستويات\n\nكل ما فريقك أكبر، مكافآتك أكتر! 📊" },
  { k: ["محظور", "blocked", "حظر", "account blocked"], r: "لو حسابك محظور 🚫\n• ممكن يكون بسبب انتهاء العضوية\n• تواصل مع الإدارة عشان تعرف السبب\n• ممكن تفعل الحساب مجدداً بالدفع\n\nكلمنا وهيتم حل المشكلة! 🤝" },
  { k: ["شات", "chatbot", "بوت", "bot", "ذكاء اصطناعي", "ai chat"], r: "أنا شات بوت Everest Academy 🤖\nمساعد ذكي بيشتغل 24/7!\n• أقدر أساعدك في أي سؤال عن المنصة\n• أساعدك في اختيار الكورسات\n• أفهمك نظام الرتب والعمولات\n\nاسأل براحتك! 😊" },
  { k: ["تواصل", "اتصل", "contact", "support", "مساعدة", "help"], r: "تواصل معنا 📞\n• من خلال صفحة Feedback في الموقع\n• أو ابعتلنا رسالة مباشرة\n\nفريق الدعم هيرد عليك في أقرب وقت! ⏰" },
  { k: ["مجان", "مجاني", "free", "بلاش"], r: "فيه دروس مجانية في كل كورس! 🎁\nتقدر تجرب الدروس المجانية قبل ما تشتري الكورس الكامل.\n\nكمان فيه كورسات مجانية بالكامل! ✅" },
];

function findKBReply(msg) {
  const lower = msg.toLowerCase().trim();
  for (const entry of KB) {
    if (entry.k.some(k => lower.includes(k))) return entry.r;
  }
  return null;
}

// ─── Dynamic context from DB ───
async function getPlatformContext() {
  try {
    const users = await queryOne("SELECT COUNT(*) as c FROM users WHERE role != 'admin'");
    const courses = await query("SELECT title, price, price_egp FROM courses WHERE published = 1 LIMIT 10");
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
  if (!GROQ_API_KEY) return null;

  const platformCtx = await getPlatformContext();
  const messages = [{ role: "system", content: SYSTEM_PROMPT + platformCtx }];

  if (Array.isArray(history)) {
    for (const msg of history.slice(-10)) {
      messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.text });
    }
  }
  messages.push({ role: "user", content: userMessage });

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.7, max_tokens: 500 }),
  });

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

    // Fast-path: check KB first (instant, no API call)
    const kbReply = findKBReply(message);
    if (kbReply) return res.json({ reply: kbReply, source: "kb" });

    // Dynamic DB queries for specific patterns
    const lower = message.toLowerCase().trim();

    if (/\d+/.test(lower) && (lower.includes("مستوى") || lower.includes("level"))) {
      const level = lower.match(/\d+/)[0];
      return res.json({ reply: `المستوى ${level} في نظام MLM 🔄\nكل مستوى بياخد عمولة أقل من اللي تحته. التوزيع بيحصل تلقائياً مع كل تسجيل جديد!`, source: "db" });
    }

    if (lower.includes("كورس") && (lower.includes("كم") || lower.includes("سعر") || lower.includes("price"))) {
      try {
        const courses = await query("SELECT title, price, price_egp FROM courses WHERE published = 1 LIMIT 5");
        if (courses.length > 0) {
          const list = courses.map(c => `• ${c.title}: ${c.price || 0} EM / ${c.price_egp || 0} EGP`).join("\n");
          return res.json({ reply: `أسعار الكورسات 📚\n${list}\n\nتقدر تشوف التفاصيل في صفحة الكورسات! 💰`, source: "db" });
        }
      } catch {}
    }

    if (lower.includes("كم عدد") || lower.includes("how many") || lower.includes("احصائيات") || lower.includes("stats")) {
      try {
        const users = await queryOne("SELECT COUNT(*) as c FROM users WHERE role != 'admin'");
        const courses = await queryOne("SELECT COUNT(*) as c FROM courses WHERE published = 1");
        return res.json({ reply: `إحصائيات المنصة 📊\n• ${users?.c || 0} عضو مسجل\n• ${courses?.c || 0} كورس متاح\n\nEverest Academy في استمرار! 🚀`, source: "db" });
      } catch {}
    }

    // AI fallback: call Groq
    if (GROQ_API_KEY) {
      try {
        const aiReply = await callGroq(message, history);
        if (aiReply) return res.json({ reply: aiReply, source: "ai" });
      } catch (err) {
        console.error("Groq AI error:", err.message);
      }
    }

    // Last resort: generic KB fallback
    const smartFallback = [
      "سؤال ممتاز! 💡 للأسف مش لاقي معلومات محددة عن ده.\n\nتقدر تسأل عن:\n• الكورسات والأسعار 📚\n• التسجيل والتفعيل 🎯\n• نظام الرتب 🏅\n• E-Money والمحفظة 💰\n• طرق الدفع 💳\n• نظام العمولات 🔄",
      "مافيش حد عندي معلومات كافية عن السؤال ده 🤔\n\nجرّب اسأل عن: كورسات، تسجيل، رتب، أموال، أو دفع!",
    ];
    res.json({ reply: smartFallback[Math.floor(Math.random() * smartFallback.length)], source: "fallback" });
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

export default router;
