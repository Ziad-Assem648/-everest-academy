import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import PublicNavbar from "../components/PublicNavbar";
import CustomerServiceFooter from "../components/CustomerServiceFooter";

const api = (path, opts = {}) =>
  fetch(path, { headers: { "Content-Type": "application/json" }, ...opts }).then((r) => r.json());

const keyframes = `
@keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
@keyframes pulse { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
@keyframes gradientFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(212,175,55,0.3); } 50% { box-shadow: 0 0 40px rgba(212,175,55,0.6); } }
@keyframes rotate3d { from { transform: perspective(1000px) rotateY(-15deg) rotateX(5deg); } to { transform: perspective(1000px) rotateY(15deg) rotateX(-5deg); } }
@keyframes orbit { from { transform: rotate(0deg) translateX(120px) rotate(0deg); } to { transform: rotate(360deg) translateX(120px) rotate(-360deg); } }
@keyframes fadeInScale { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
`;

function CountUp({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let c = 0; const speed = Math.max(1, target / 60);
    const anim = () => { c += speed; if (c < target) { setCount(Math.floor(c)); requestAnimationFrame(anim); } else setCount(target); };
    anim();
  }, [target]);
  return <>{count.toLocaleString()}{suffix}</>;
}

export default function FreeCoursesPage() {
  const { t } = useLang();
  const { colors: c } = useTheme();
  const [lessons, setLessons] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});

  useEffect(() => {
    api("/api/courses/free-lessons").then((data) => {
      setLessons(data || []);
      const map = {};
      (data || []).forEach((l) => {
        if (!map[l.course_id]) {
          map[l.course_id] = {
            id: l.course_id,
            title: l.course_title,
            title_ar: l.course_title_ar,
            description: l.course_description,
            description_ar: l.course_description_ar,
            image: l.course_image,
            difficulty: l.difficulty,
            price: l.price,
            freeCount: 0,
          };
        }
        map[l.course_id].freeCount++;
      });
      setCoursesMap(map);
    }).catch(() => {});
  }, []);

  const uniqueCourses = Object.values(coursesMap);
  const m = typeof window !== "undefined" && window.innerWidth <= 768;

  return (
    <div style={{ background: c.bg, minHeight: "100vh", overflow: "hidden" }}>
      <style>{keyframes + `
        .fc-hero { position: relative; min-height: ${m ? "60vh" : "100vh"}; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .fc-hero-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 30%, #0a1628 60%, #0f0f13 100%); }
        .fc-hero-bg::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 30% 40%, rgba(212,175,55,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(139,92,246,0.1) 0%, transparent 50%); animation: pulse 6s ease-in-out infinite; }
        .fc-orb { position: absolute; border-radius: 50%; filter: blur(60px); animation: float 8s ease-in-out infinite; }
        .fc-orb-1 { width: 400px; height: 400px; background: rgba(212,175,55,0.08); top: -100px; right: -100px; animation-delay: 0s; }
        .fc-orb-2 { width: 300px; height: 300px; background: rgba(139,92,246,0.08); bottom: -50px; left: -50px; animation-delay: 2s; }
        .fc-orb-3 { width: 200px; height: 200px; background: rgba(59,130,246,0.06); top: 30%; left: 20%; animation-delay: 4s; }
        .fc-grid-lines { position: absolute; inset: 0; background-image: linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px); background-size: 60px 60px; }
        .fc-hero-content { position: relative; z-index: 2; text-align: center; padding: ${m ? "120px 20px 40px" : "140px 20px 80px"}; max-width: 900px; margin: 0 auto; animation: slideUp 1s ease-out; }
        .fc-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.3); border-radius: 999px; color: #d4af37; font-size: 0.85rem; font-weight: 600; margin-bottom: 24px; animation: glow 3s ease-in-out infinite; }
        .fc-badge-dot { width: 8px; height: 8px; background: #d4af37; border-radius: 50%; animation: pulse 2s infinite; }
        .fc-hero h1 { font-size: clamp(2rem, 5vw, 4rem); font-weight: 900; line-height: 1.1; margin-bottom: 20px; background: linear-gradient(135deg, #ffffff 0%, #d4af37 50%, #f0d78c 100%); background-size: 200% 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: gradientFlow 4s ease infinite; }
        .fc-hero p { font-size: 1.1rem; color: #9a9aae; max-width: 600px; margin: 0 auto 40px; line-height: 1.8; }
        .fc-hero-cta { display: inline-flex; align-items: center; gap: 10px; padding: 16px 36px; background: linear-gradient(135deg, #d4af37, #b8922a); color: #0a0a1a; font-size: 1rem; font-weight: 800; border-radius: 999px; text-decoration: none; transition: all 0.3s; box-shadow: 0 8px 30px rgba(212,175,55,0.3); }
        .fc-hero-cta:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 12px 40px rgba(212,175,55,0.5); }
        .fc-3d-shapes { position: absolute; inset: 0; pointer-events: none; }
        .fc-3d-cube { position: absolute; width: 60px; height: 60px; border: 2px solid rgba(212,175,55,0.15); border-radius: 12px; animation: rotate3d 12s linear infinite; }
        .fc-3d-cube:nth-child(1) { top: 15%; right: 10%; }
        .fc-3d-cube:nth-child(2) { bottom: 20%; left: 8%; width: 40px; height: 40px; animation-delay: 3s; animation-duration: 15s; border-color: rgba(139,92,246,0.15); }
        .fc-orbit-ring { position: absolute; width: 250px; height: 250px; border: 1px dashed rgba(212,175,55,0.1); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); }
        .fc-orbit-dot { position: absolute; width: 12px; height: 12px; background: #d4af37; border-radius: 50%; box-shadow: 0 0 15px rgba(212,175,55,0.5); animation: orbit 10s linear infinite; top: 50%; left: 50%; margin: -6px; }
        .fc-stats { display: flex; justify-content: center; gap: 60px; padding: 40px 20px; position: relative; z-index: 2; animation: slideUp 1s ease-out 0.2s both; }
        .fc-stat { text-align: center; }
        .fc-stat-num { font-size: 2.5rem; font-weight: 900; color: #d4af37; line-height: 1; }
        .fc-stat-label { font-size: 0.85rem; color: #9a9aae; margin-top: 8px; font-weight: 500; }
        .fc-courses-section { position: relative; padding: 60px 5%; max-width: 1300px; margin: 0 auto; }
        .fc-section-header { text-align: center; margin-bottom: 50px; animation: slideUp 0.8s ease-out; }
        .fc-section-header h2 { font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 900; color: ${c.text}; margin-bottom: 12px; }
        .fc-section-header p { color: ${c.textMuted}; font-size: 1rem; max-width: 550px; margin: 0 auto; }
        .fc-course-group { margin-bottom: 50px; animation: slideUp 0.6s ease-out; }
        .fc-course-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding: 16px 20px; background: ${c.bgCard}; border: 1px solid ${c.borderLight}; border-radius: 16px; }
        .fc-course-header img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; }
        .fc-course-header-no-img { width: 64px; height: 64px; border-radius: 12px; background: linear-gradient(135deg, #1a1a2e, #16213e); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0; }
        .fc-course-info { flex: 1; }
        .fc-course-info h3 { font-size: 1.1rem; font-weight: 800; color: ${c.text}; margin: 0 0 4px 0; }
        .fc-course-info p { font-size: 0.8rem; color: ${c.textMuted}; margin: 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .fc-course-buy { padding: 10px 22px; background: linear-gradient(135deg, #d4af37, #b8922a); color: #0a0a1a; font-weight: 800; font-size: 0.85rem; border-radius: 999px; text-decoration: none; transition: all 0.3s; white-space: nowrap; }
        .fc-course-buy:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(212,175,55,0.4); }
        .fc-lessons-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .fc-lesson-card { position: relative; border-radius: 20px; overflow: hidden; background: ${c.bgCard}; border: 1px solid ${c.borderLight}; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; text-decoration: none; display: block; }
        .fc-lesson-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(212,175,55,0.2); border-color: rgba(212,175,55,0.3); }
        .fc-lesson-top { padding: 20px 24px 12px; }
        .fc-lesson-tag { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; background: linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.05)); border: 1px solid rgba(212,175,55,0.2); border-radius: 999px; font-size: 0.7rem; font-weight: 700; color: #d4af37; margin-bottom: 12px; }
        .fc-lesson-title { font-size: 1.1rem; font-weight: 800; color: ${c.text}; margin-bottom: 6px; line-height: 1.4; }
        .fc-lesson-course { font-size: 0.8rem; color: ${c.textMuted}; display: flex; align-items: center; gap: 6px; }
        .fc-lesson-course-dot { width: 5px; height: 5px; background: #d4af37; border-radius: 50%; flex-shrink: 0; }
        .fc-lesson-bottom { padding: 14px 24px; border-top: 1px solid ${c.borderLight}; display: flex; align-items: center; justify-content: space-between; }
        .fc-lesson-difficulty { font-size: 0.75rem; color: ${c.textMuted}; display: flex; align-items: center; gap: 5px; }
        .fc-lesson-diff-dot { width: 6px; height: 6px; border-radius: 50%; }
        .fc-lesson-watch { font-size: 0.8rem; color: #d4af37; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .fc-lesson-watch svg { transition: transform 0.3s; }
        .fc-lesson-card:hover .fc-lesson-watch svg { transform: translateX(4px); }
        .fc-empty { text-align: center; padding: 80px 20px; }
        .fc-empty-icon { font-size: 4rem; margin-bottom: 16px; animation: float 3s ease-in-out infinite; }
        .fc-empty h3 { color: ${c.text}; font-size: 1.5rem; margin-bottom: 8px; }
        .fc-empty p { color: ${c.textMuted}; font-size: 0.95rem; }
        .fc-wave-divider { width: 100%; overflow: hidden; line-height: 0; margin-top: -2px; }
        .fc-wave-divider svg { display: block; width: 100%; height: 60px; }
        @media (max-width: 768px) {
          .fc-stats { gap: 24px; flex-wrap: wrap; }
          .fc-stat-num { font-size: 1.8rem; }
          .fc-lessons-grid { grid-template-columns: 1fr; }
          .fc-orbit-ring, .fc-3d-cube { display: none; }
          .fc-course-header { flex-direction: column; text-align: center; }
          .fc-course-header img, .fc-course-header-no-img { margin: 0 auto; }
          .fc-course-buy { margin: 0 auto; }
        }
      `}</style>

      <PublicNavbar active="courses" />

      {/* Hero Section */}
      <div className="fc-hero">
        <div className="fc-hero-bg">
          <div className="fc-grid-lines"></div>
          <div className="fc-orb fc-orb-1"></div>
          <div className="fc-orb fc-orb-2"></div>
          <div className="fc-orb fc-orb-3"></div>
        </div>
        <div className="fc-3d-shapes">
          <div className="fc-3d-cube"></div>
          <div className="fc-3d-cube"></div>
          <div className="fc-orbit-ring">
            <div className="fc-orbit-dot"></div>
          </div>
        </div>
        <div className="fc-hero-content">
          <div className="fc-badge">
            <span className="fc-badge-dot"></span>
            {t("دروس مجانية — جرّب قبل ما تشترى", "FREE PREVIEW — TRY BEFORE YOU BUY")}
          </div>
          <h1>{t("جرّب مجاناً قبل ما تشتري", "Try Free Lessons Before You Buy")}</h1>
          <p>{t("اكتشف دروس مجانية من كورسات مدفوعة — تعرّف على المحتوى والأسلوب قبل الاشتراك. كل درس مجاني يوضح الكورس اللي ينتمي له.", "Discover free preview lessons from paid courses — experience the content and style before subscribing. Each free lesson shows its parent course.")}</p>
          <a href="#lessons" className="fc-hero-cta">
            {t("تصفح الدروس المجانية", "Browse Free Lessons")}
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="fc-stats">
        <div className="fc-stat">
          <div className="fc-stat-num"><CountUp target={lessons.length || 0} /></div>
          <div className="fc-stat-label">{t("درس مجاني", "Free Lessons")}</div>
        </div>
        <div className="fc-stat">
          <div className="fc-stat-num"><CountUp target={uniqueCourses.length || 0} /></div>
          <div className="fc-stat-label">{t("كورس متاح", "Available Courses")}</div>
        </div>
        <div className="fc-stat">
          <div className="fc-stat-num"><CountUp target={500} suffix="+" /></div>
          <div className="fc-stat-label">{t("طالب مسجل", "Enrolled Students")}</div>
        </div>
        <div className="fc-stat">
          <div className="fc-stat-num"><CountUp target={24} suffix="/7" /></div>
          <div className="fc-stat-label">{t("دعم متواصل", "24/7 Support")}</div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="fc-wave-divider">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none">
          <path d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,60 L0,60 Z" fill={c.bg} />
        </svg>
      </div>

      {/* Free Lessons Section */}
      <div className="fc-courses-section" id="lessons">
        <div className="fc-section-header">
          <h2>{t("الدروس المجانية", "Free Preview Lessons")}</h2>
          <p>{t("دروس مجانية من كورسات مدفوعة — اشترِ الكورس للمشاهدة الكاملة", "Free lessons from paid courses — buy the course for full access")}</p>
        </div>

        {uniqueCourses.length === 0 ? (
          <div className="fc-empty">
            <div className="fc-empty-icon">📚</div>
            <h3>{t("قريباً...", "Coming Soon...")}</h3>
            <p>{t("لا توجد دروس مجانية متاحة حالياً — تابعونا للتحديثات", "No free lessons available yet — stay tuned for updates")}</p>
          </div>
        ) : (
          uniqueCourses.map((course) => (
            <div key={course.id} className="fc-course-group">
              <div className="fc-course-header">
                {course.image ? (
                  <img src={course.image} alt={course.title_ar || course.title} />
                ) : (
                  <div className="fc-course-header-no-img">🎓</div>
                )}
                <div className="fc-course-info">
                  <h3>{course.title_ar || course.title}</h3>
                  <p>{course.description_ar || course.description}</p>
                </div>
                <Link to={`/courses/${course.id}`} className="fc-course-buy">
                  {t(`اشترِ الكورس — ${course.price} E-Money`, `Buy Course — ${course.price} E-Money`)}{course.price_egp > 0 ? t(` / ${course.price_egp} ج.م`, ` / ${course.price_egp} EGP`) : ""}
                </Link>
              </div>

              <div className="fc-lessons-grid">
                {lessons.filter((l) => l.course_id === course.id).map((lesson, idx) => (
                  <Link key={lesson.id} to={`/courses/${lesson.course_id}`} className="fc-lesson-card"
                    style={{ animation: `slideUp 0.5s ease-out ${idx * 0.08}s both` }}>
                    <div className="fc-lesson-top">
                      <div className="fc-lesson-tag">
                        ▶ {t("درس مجاني", "FREE LESSON")}
                      </div>
                      <div className="fc-lesson-title">{lesson.title_ar || lesson.title}</div>
                      <div className="fc-lesson-course">
                        <span className="fc-lesson-course-dot"></span>
                        {course.title_ar || course.title}
                      </div>
                    </div>
                    <div className="fc-lesson-bottom">
                      <div className="fc-lesson-difficulty">
                        <span className="fc-lesson-diff-dot" style={{
                          background: course.difficulty === "beginner" ? "#22c55e" : course.difficulty === "intermediate" ? "#f59e0b" : "#ef4444"
                        }}></span>
                        {course.difficulty === "beginner" ? t("مبتدئ", "Beginner") : course.difficulty === "intermediate" ? t("متوسط", "Intermediate") : t("متقدم", "Advanced")}
                      </div>
                      <div className="fc-lesson-watch">
                        {t("اشاهد الآن", "Watch Now")}
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CTA Section */}
      <div style={{ padding: "60px 5%", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(212,175,55,0.05), rgba(139,92,246,0.03))" }}></div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 900, color: c.text, marginBottom: 16 }}>
            {t("أعجبك المحتوى؟", "Liked the Content?")}
          </h2>
          <p style={{ color: c.textMuted, fontSize: "1rem", marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
            {t("اشترك في الكورس الكامل واستمتع بجميع الدروس والاختبارات", "Subscribe to the full course and enjoy all lessons & quizzes")}
          </p>
          <Link to="/register" style={{
            display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 40px",
            background: "linear-gradient(135deg, #d4af37, #b8922a)", color: "#0a0a1a",
            fontSize: "1rem", fontWeight: 800, borderRadius: 999, textDecoration: "none",
            boxShadow: "0 8px 30px rgba(212,175,55,0.3)", transition: "all 0.3s"
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(212,175,55,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(212,175,55,0.3)"; }}>
            {t("إنشاء حساب", "Create Account")}
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>

      <footer style={{ background: c.bgCard, color: c.text, padding: "30px 5%", borderTop: `1px solid ${c.borderLight}` }}>
        <div style={{ maxWidth: 1300, margin: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", borderBottom: `1px solid ${c.borderLight}`, flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ fontSize: 32, color: "#d4af37", margin: 0 }}>E</h3>
              <span style={{ color: c.textMuted, fontSize: 14 }}>© 1999 - 2026 Everest Academy</span>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "18px 0" }}>
            <CustomerServiceFooter />
          </div>
        </div>
      </footer>

      <section style={{ background: c.bgCard, padding: "40px 5%", borderTop: `1px solid ${c.borderLight}` }}>
        <div style={{ maxWidth: 1300, margin: "auto", display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3,1fr)", gap: 40 }}>
          <p style={{ color: c.textMuted, fontSize: 15, lineHeight: 1.8 }}><strong style={{ color: c.text }}>{t("تداول بمسؤولية:", "Trade Responsibly:")}</strong> {t("تداول الأدوات المالية يحمل درجة عالية من المخاطرة...", "Trading financial instruments carry a high level...")}</p>
          <p style={{ color: c.textMuted, fontSize: 15, lineHeight: 1.8 }}>{t("Everest Academy هي علامة تجارية مسجلة تستخدم بموجب...", "Everest Academy is a registered trademark utilised under...")}</p>
          <p style={{ color: c.textMuted, fontSize: 15, lineHeight: 1.8 }}>{t("Everest Academy لا تقدم خدمات للمقيمين في...", "Everest Academy doesn't offer services to residents...")}</p>
        </div>
      </section>
    </div>
  );
}
