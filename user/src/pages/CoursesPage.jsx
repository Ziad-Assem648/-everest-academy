import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { api } from "../App";
import AppNavbar from "../components/AppNavbar";
import FooterSection from "../components/FooterSection";

export default function CoursesPage() {
  const { t, dir } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [popupCourse, setPopupCourse] = useState(null);
  const [catPopup, setCatPopup] = useState(null);

  useEffect(() => { api("/api/courses?status=published").then(setCourses); }, []);

  const cats = [
    { id: "all", emoji: "\uD83C\uDF10", label: t("الكل", "All") },
    { id: "trading", emoji: "\uD83D\uDCC8", label: t("التداول", "Trading") },
    { id: "marketing", emoji: "\uD83D\uDCA1", label: t("التسويق", "Marketing") },
    { id: "dev", emoji: "\uD83D\uDCBB", label: t("البرمجة", "Programming") },
    { id: "ai", emoji: "\uD83E\uDD16", label: t("الذكاء الاصطناعي", "AI") },
    { id: "freelance", emoji: "\uD83D\uDC4D", label: t("العمل الحر", "Freelancing") },
  ];

  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (c.title || "").toLowerCase().includes(q) || (c.title_ar || "").includes(q) || (c.description || "").toLowerCase().includes(q) || (c.description_ar || "").toLowerCase().includes(q);
    const matchFilter = filter === "all" || (c.category || "") === filter;
    return matchSearch && matchFilter;
  });

  const catCourses = filter !== "all" ? filteredCourses : [];

  return (
    <div style={{ background: theme === "dark" ? "#1a1a2e" : "#fafafa", minHeight: "100vh", fontFamily: "'Cairo', sans-serif", direction: dir }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        .cp-hero{min-height:40vh;display:flex;align-items:center;justify-content:center;padding:140px 20px 80px;background:radial-gradient(circle at top right,rgba(212,175,55,.18),transparent 35%),radial-gradient(circle at bottom left,rgba(212,175,55,.1),transparent 35%),#fafafa}
        .cp-hero-inner{width:min(100%,900px);text-align:center}
        .cp-hero-badge{display:inline-block;padding:8px 16px;border-radius:999px;background:#fff;border:1px solid rgba(212,175,55,.25);color:#b8860b;font-size:.85rem;font-weight:700;margin-bottom:24px}
        .cp-hero h1{font-size:clamp(2.5rem,7vw,5.5rem);line-height:1;color:#111;margin:0 0 24px;font-weight:800}
        .cp-hero p{max-width:650px;margin:auto;color:#666;line-height:1.8;font-size:1.05rem}
        .cp-search-box{margin-top:40px;background:#fff;border-radius:999px;padding:10px;display:flex;gap:10px;box-shadow:0 15px 40px rgba(0,0,0,.06);max-width:700px;margin-inline:auto}
        .cp-search-box input{flex:1;border:none;outline:none;padding:16px 20px;font-size:1rem;background:transparent;font-family:'Cairo',sans-serif}
        .cp-search-box button{border:none;background:#111;color:#fff;padding:0 28px;border-radius:999px;cursor:pointer;font-weight:700;font-family:'Cairo',sans-serif;transition:.3s}
        .cp-search-box button:hover{transform:translateY(-2px)}
        .cp-categories{padding:40px 10px;background:#fff}
        .cp-cats-wrap{max-width:1100px;margin:auto;display:flex;flex-wrap:wrap;justify-content:center;gap:16px}
        .cp-cat-btn{border:none;padding:16px 26px;border-radius:999px;background:#e1dada;color:#111;font-weight:700;cursor:pointer;transition:.3s;font-size:.95rem;font-family:'Cairo',sans-serif}
        .cp-cat-btn:hover{transform:translateY(-4px);background:#111;color:#fff}
        .cp-cat-btn.active{background:#d4af37;color:#111}
        .cp-trending{padding:100px 20px;background:#faf8f3}
        .cp-section-heading{text-align:center;margin-bottom:50px}
        .cp-section-heading span{color:#c7a44c;font-weight:700;letter-spacing:1px;font-size:.9rem}
        .cp-section-heading h2{margin-top:10px;font-size:clamp(2rem,4vw,3rem);color:#111}
        .cp-cards-row{max-width:1300px;margin:auto;display:flex;gap:22px;overflow-x:auto;scroll-behavior:smooth;padding-bottom:10px;scrollbar-width:none}
        .cp-cards-row::-webkit-scrollbar{display:none}
        .cp-trend-card{min-width:250px;max-width:250px;background:#fff;border-radius:26px;overflow:hidden;position:relative;flex-shrink:0;box-shadow:0 12px 30px rgba(0,0,0,.05);transition:.35s}
        .cp-trend-card:hover{transform:translateY(-8px)}
        .cp-trend-card img{width:100%;height:180px;object-fit:cover}
        .cp-premium-tag{position:absolute;top:14px;right:14px;background:#111;color:#fff;padding:6px 12px;border-radius:999px;font-size:.75rem;font-weight:700}
        .cp-free-tag{position:absolute;top:14px;right:14px;background:#059669;color:#fff;padding:6px 12px;border-radius:999px;font-size:.75rem;font-weight:700}
        .cp-trend-info{padding:18px}
        .cp-trend-info h3{color:#111;margin:0 0 10px;font-size:1rem;font-weight:700}
        .cp-trend-info p{color:#777;font-size:.9rem;line-height:1.6;height:45px;margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
        .cp-course-meta{display:flex;justify-content:space-between;margin-top:15px;font-size:.85rem;color:#555}
        .cp-card-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:20px}
        .cp-price-text{color:#c7a44c;font-weight:800;font-size:1rem}
        .cp-card-actions{display:flex;gap:10px;margin-top:18px}
        .cp-preview-btn{flex:1;height:42px;border:none;border-radius:12px;background:#f5f5f5;color:#111;cursor:pointer;font-weight:700;font-family:'Cairo',sans-serif;transition:.2s}
        .cp-preview-btn:hover{background:#ececec}
        .cp-buy-btn{flex:1;height:42px;border:none;border-radius:12px;background:linear-gradient(135deg,#d4af37,#f5d76e);color:#111;cursor:pointer;font-weight:800;font-family:'Cairo',sans-serif;transition:.3s;text-decoration:none;display:flex;align-items:center;justify-content:center}
        .cp-buy-btn:hover{transform:translateY(-2px)}
        .cp-premium-section{max-width:1300px;margin:70px auto;padding:70px;border-radius:40px;background:linear-gradient(135deg,#0f0f0f,#1c1c1c);color:#fff;display:flex;justify-content:space-between;align-items:center;gap:60px;overflow:hidden;position:relative}
        .cp-premium-section::before{content:'';position:absolute;width:500px;height:500px;background:#d4af37;opacity:.07;border-radius:50%;top:-250px;right:-150px}
        .cp-premium-label{color:#d4af37;font-weight:700;letter-spacing:2px;font-size:.85rem}
        .cp-premium-content h2{margin:18px 0;font-size:clamp(2rem,5vw,3.5rem);line-height:1.2}
        .cp-premium-content p{max-width:600px;color:#d0d0d0;line-height:1.8}
        .cp-premium-features{margin-top:35px;display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
        .cp-feature{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);padding:14px 18px;border-radius:16px;font-size:.9rem}
        .cp-premium-card{min-width:320px;background:rgba(255,255,255,.05);backdrop-filter:blur(18px);border:1px solid rgba(212,175,55,.2);border-radius:30px;padding:40px;text-align:center}
        .cp-premium-card span{color:#d4af37;font-weight:700;font-size:.85rem}
        .cp-premium-card h3{margin:15px 0;font-size:3rem;color:#fff}
        .cp-premium-card>p{color:#cfcfcf;margin-bottom:30px}
        .cp-start-btn{width:100%;height:58px;display:flex;align-items:center;justify-content:center;border-radius:18px;background:#d4af37;color:#111;text-decoration:none;font-weight:800;transition:.3s;border:none;cursor:pointer;font-family:'Cairo',sans-serif;font-size:1rem}
        .cp-start-btn:hover{transform:translateY(-3px)}
        .cp-emp{text-align:center;padding:80px 20px;color:#999}
        .cp-emp i{font-size:48px;color:#ddd;margin-bottom:16px}
        .cp-emp h3{color:#666;margin:0 0 8px}
        .cp-grid{max-width:1300px;margin:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:22px;padding:0 20px}
        .cp-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(10px);z-index:3000;display:flex;justify-content:center;align-items:center;opacity:0;pointer-events:none;transition:.3s;padding:15px}
        .cp-modal-overlay.open{opacity:1;pointer-events:auto}
        .cp-modal-box{width:min(900px,92%);max-height:85vh;overflow:auto;background:#fff;border-radius:32px;transform:translateY(20px);transition:.3s}
        .cp-modal-overlay.open .cp-modal-box{transform:translateY(0)}
        .cp-modal-header{display:flex;justify-content:space-between;align-items:center;padding:24px 28px;border-bottom:1px solid #f0f0f0}
        .cp-modal-header h3{font-size:1.5rem;color:#111;margin:0}
        .cp-modal-close{width:44px;height:44px;border:none;border-radius:50%;background:#f4f4f4;cursor:pointer;font-size:1.2rem;display:flex;align-items:center;justify-content:center}
        .cp-modal-body{padding:28px}
        .cp-modal-img{width:100%;height:220px;object-fit:cover;border-radius:20px}
        .cp-modal-title{font-size:1.5rem;color:#111;margin:20px 0 10px}
        .cp-modal-desc{color:#777;line-height:1.8;margin-bottom:20px}
        .cp-modal-perks{display:flex;flex-direction:column;gap:10px;margin-bottom:24px}
        .cp-modal-perk{display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:16px;background:#fafafa;font-size:.9rem;color:#444}
        .cp-modal-perk i{color:#d4af37}
        .cp-modal-start{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:18px;background:#d4af37;color:#111;text-decoration:none;font-weight:800;transition:.3s;border:none;cursor:pointer;font-family:'Cairo',sans-serif}
        .cp-modal-start:hover{transform:translateY(-2px)}
        @media(max-width:768px){
          .cp-hero{padding:120px 20px 60px;min-height:auto}
          .cp-hero h1{font-size:2.4rem}
          .cp-search-box{flex-direction:column;border-radius:28px}
          .cp-search-box button{height:52px}
          .cp-categories{padding:30px 10px}
          .cp-cats-wrap{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;scrollbar-width:none;-webkit-overflow-scrolling:touch}
          .cp-cats-wrap::-webkit-scrollbar{display:none}
          .cp-cat-btn{white-space:nowrap;flex-shrink:0}
          .cp-trending{padding:60px 16px}
          .cp-cards-row{gap:16px;padding:0 0 10px}
          .cp-trend-card{min-width:240px;max-width:240px}
          .cp-premium-section{flex-direction:column;padding:40px 24px;text-align:center;margin:40px 16px}
          .cp-premium-features{grid-template-columns:1fr}
          .cp-premium-card{width:100%;min-width:auto}
          .cp-grid{grid-template-columns:1fr;padding:0 16px}
          .cp-modal-overlay{align-items:flex-end;padding:0}
          .cp-modal-box{width:100%;max-height:90vh;border-radius:20px 20px 0 0}
        }
        @media(min-width:769px) and (max-width:1024px){
          .cp-grid{grid-template-columns:repeat(2,1fr)}
        }
        .cp-card-img-wrap{position:relative;overflow:hidden}
        .cp-card-img-wrap img{transition:transform .5s}
        .cp-trend-card:hover .cp-card-img-wrap img{transform:scale(1.05)}
        [data-theme="dark"] .cp-hero{background:radial-gradient(circle at top right,rgba(212,175,55,.12),transparent 35%),radial-gradient(circle at bottom left,rgba(212,175,55,.08),transparent 35%),#1a1a2e}
        [data-theme="dark"] .cp-hero-badge{background:#2a2a3e;color:#d4af37;border-color:rgba(212,175,55,.3)}
        [data-theme="dark"] .cp-hero h1{color:#f0f0f0}
        [data-theme="dark"] .cp-hero p{color:#aaa}
        [data-theme="dark"] .cp-search-box{background:#2a2a3e;box-shadow:0 15px 40px rgba(0,0,0,.3)}
        [data-theme="dark"] .cp-search-box input{color:#f0f0f0}
        [data-theme="dark"] .cp-search-box button{background:#d4af37;color:#111}
        [data-theme="dark"] .cp-categories{background:#1a1a2e}
        [data-theme="dark"] .cp-cat-btn{background:#2a2a3e;color:#ccc}
        [data-theme="dark"] .cp-cat-btn:hover{background:#d4af37;color:#111}
        [data-theme="dark"] .cp-trending{background:#16213e}
        [data-theme="dark"] .cp-section-heading h2{color:#f0f0f0}
        [data-theme="dark"] .cp-trend-card{background:#1e1e2f;box-shadow:0 12px 30px rgba(0,0,0,.3)}
        [data-theme="dark"] .cp-trend-info h3{color:#f0f0f0}
        [data-theme="dark"] .cp-trend-info p{color:#aaa}
        [data-theme="dark"] .cp-course-meta{color:#aaa}
        [data-theme="dark"] .cp-preview-btn{background:#2a2a3e;color:#f0f0f0}
        [data-theme="dark"] .cp-preview-btn:hover{background:#3a3a4e}
        [data-theme="dark"] .cp-emp h3{color:#aaa}
        [data-theme="dark"] .cp-emp i{color:#555}
        [data-theme="dark"] .cp-modal-overlay{background:rgba(0,0,0,.7)}
        [data-theme="dark"] .cp-modal-box{background:#1e1e2f}
        [data-theme="dark"] .cp-modal-header{border-bottom-color:#333}
        [data-theme="dark"] .cp-modal-header h3{color:#f0f0f0}
        [data-theme="dark"] .cp-modal-close{background:#2a2a3e;color:#f0f0f0}
        [data-theme="dark"] .cp-modal-title{color:#f0f0f0}
        [data-theme="dark"] .cp-modal-desc{color:#aaa}
        [data-theme="dark"] .cp-modal-perk{background:#2a2a3e;color:#ccc}
      `}</style>

      <AppNavbar />

      {/* ===== HERO ===== */}
      <section className="cp-hero">
        <div className="cp-hero-inner">
          <span className="cp-hero-badge">{t("مكتبة إيفرست المحتوى", "EVEREST CONTENT LIBRARY")}</span>
        
          <p>{t("استكشف دروساً تعليمية فاخرة، واكتشف مهارات جديدة، وابدأ دروسك الأولى مجاناً.", "Explore premium learning sessions, discover new skills, and start your first lessons for free.")}</p>
          <div className="cp-search-box">
            <input
              type="text"
              placeholder={t("ابحث عن أي موضوع...", "Search for any topic...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button>{t("بحث", "Search")}</button>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="cp-categories">
        <div className="cp-cats-wrap">
          {cats.map((cat) => (
            <button
              key={cat.id}
              className={`cp-cat-btn ${filter === cat.id ? "active" : ""}`}
              onClick={() => setFilter(filter === cat.id ? "all" : cat.id)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ===== TRENDING / ALL COURSES ===== */}
      <section className="cp-trending" id="content-section">
        <div className="cp-section-heading">
          <span>{t("الأكثر رواجاً", "Trending Now")}</span>
          <h2>{filter === "all" ? t("المحتوى الأكثر شعبية", "Most Popular Content") : cats.find(c => c.id === filter)?.label || t("النتائج", "Results")}</h2>
        </div>

        {filter === "all" ? (
          <>
            {filteredCourses.length > 0 ? (
              <div className="cp-cards-row">
                {filteredCourses.map((c) => (
                  <div key={c.id} className="cp-trend-card">
                    {c.free_lessons > 0 || c.price === 0 || c.price === "0" ? (
                      <div className="cp-free-tag">🔓 {c.free_lessons || 2} {t("مجانية", "Free")}</div>
                    ) : (
                      <div className="cp-premium-tag">{t("بريميوم", "Premium")}</div>
                    )}
                    <div className="cp-card-img-wrap">
                      {c.featured_image ? (
                        <img src={c.featured_image} alt={c.title_ar || c.title} />
                      ) : (
                        <div style={{width:"100%",height:180,background:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,color:"#ddd"}}>📚</div>
                      )}
                    </div>
                    <div className="cp-trend-info">
                      <h3 style={{cursor:"pointer"}} onClick={() => setPopupCourse(c)}>{c.title_ar || c.title}</h3>
                      <p>{c.description_ar || c.description || ""}</p>
                      <div className="cp-course-meta">
                        <span>🔓 {c.free_lessons || 2} {t("مجانية", "Free")}</span>
                        <span>{c.lesson_count || 0} {t("درس", "Sessions")}</span>
                      </div>
                      <div className="cp-card-bottom">
                        <span className="cp-price-text">{Number(c.price).toLocaleString()} E-Money</span>
                        {c.price_egp > 0 && <span style={{fontSize:".8rem",color:"#999",fontWeight:600}}>{Number(c.price_egp).toLocaleString()} {t("ج.م", "EGP")}</span>}
                      </div>
                      <div className="cp-card-actions">
                        <button className="cp-preview-btn" onClick={() => setPopupCourse(c)}>{t("معاينة", "Preview")}</button>
                        <Link to={`/courses/${c.id}`} className="cp-buy-btn">{user?.account_type === "student" ? t("مشاهدة", "Watch") : t("اشتري الآن", "Buy Now")}</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cp-emp">
                <div style={{fontSize:48,marginBottom:16}}>🔍</div>
                <h3>{t("لا توجد نتائج", "No Results Found")}</h3>
                <p>{t("جرب كلمات بحث مختلفة", "Try different search terms")}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {catCourses.length > 0 ? (
              <div className="cp-cards-row">
                {catCourses.map((c) => (
                  <div key={c.id} className="cp-trend-card">
                    {c.free_lessons > 0 || c.price === 0 || c.price === "0" ? (
                      <div className="cp-free-tag">🔓 {c.free_lessons || 2} {t("مجانية", "Free")}</div>
                    ) : (
                      <div className="cp-premium-tag">{t("بريميوم", "Premium")}</div>
                    )}
                    <div className="cp-card-img-wrap">
                      {c.featured_image ? (
                        <img src={c.featured_image} alt={c.title_ar || c.title} />
                      ) : (
                        <div style={{width:"100%",height:180,background:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,color:"#ddd"}}>📚</div>
                      )}
                    </div>
                    <div className="cp-trend-info">
                      <h3 style={{cursor:"pointer"}} onClick={() => setPopupCourse(c)}>{c.title_ar || c.title}</h3>
                      <p>{c.description_ar || c.description || ""}</p>
                      <div className="cp-course-meta">
                        <span>🔓 {c.free_lessons || 2} {t("مجانية", "Free")}</span>
                        <span>{c.lesson_count || 0} {t("درس", "Sessions")}</span>
                      </div>
                      <div className="cp-card-bottom">
                        <span className="cp-price-text">{Number(c.price).toLocaleString()} E-Money</span>
                        {c.price_egp > 0 && <span style={{fontSize:".8rem",color:"#999",fontWeight:600}}>{Number(c.price_egp).toLocaleString()} {t("ج.م", "EGP")}</span>}
                      </div>
                      <div className="cp-card-actions">
                        <button className="cp-preview-btn" onClick={() => setPopupCourse(c)}>{t("معاينة", "Preview")}</button>
                        <Link to={`/courses/${c.id}`} className="cp-buy-btn">{user?.account_type === "student" ? t("مشاهدة", "Watch") : t("اشتري الآن", "Buy Now")}</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cp-emp">
                <div style={{fontSize:48,marginBottom:16}}>📚</div>
                <h3>{t("لا توجد كورسات في هذا التخصص", "No courses in this specialization")}</h3>
                <p>{t("جرّب تخصص آخر", "Try another specialization")}</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* ===== PREMIUM MEMBERSHIP / WHY EVEREST ===== */}
      <section className="cp-premium-section">
        <div className="cp-premium-content">
          <span className="cp-premium-label">{t("لماذا إيفرست؟", "WHY EVEREST?")}</span>
          <h2>{t("أكثر من مجرد تعلم", "More Than Just Learning")}</h2>
          <p>{t("نقدم تجربة تعليمية متكاملة مصممة لمساعدة الطلاب على النمو والحفاظ على حماسهم وتحقيق نتائج حقيقية من خلال محتوى عملي ودعم مستمر.", "We provide a complete learning experience designed to help students grow, stay motivated and achieve real results through practical content and continuous support.")}</p>
          <div className="cp-premium-features">
            <div className="cp-feature">{t("🎯 مسار تعليمي شخصي", "Personalized Learning Journey")}</div>
            <div className="cp-feature">{t("🚀 حماس مستمر", "Continuous Motivation")}</div>
            <div className="cp-feature">{t("📚 محتوى محدث", "Updated Content")}</div>
            <div className="cp-feature">{t("💎 نظام E-Money مرن", "Flexible E-Money System")}</div>
            <div className="cp-feature">{t("🤝 دعم الطلاب", "Student Support")}</div>
            <div className="fcp-feature">{t("🌟 استرداد أموال الإحالة خلال 48 ساعة ", "Money Referral Refund in 48 hours")}</div>
          </div>
        </div>
        <div className="cp-premium-card">
          <span>{t("مجتمعنا", "OUR COMMUNITY")}</span>
          <h3>{courses.length * 30}+</h3>
          <p>{t("جلسة تعليمية فاخرة", "Premium Learning Sessions")}</p>
          <button className="cp-start-btn" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>{t("ابدأ التعلم", "Start Learning")}</button>
        </div>
      </section>

      {/* ===== PREVIEW MODAL ===== */}
      <div className={`cp-modal-overlay ${popupCourse ? "open" : ""}`} onClick={(e) => { if (e.target.classList.contains("cp-modal-overlay")) setPopupCourse(null); }}>
        {popupCourse && (
          <div className="cp-modal-box">
            <div className="cp-modal-header">
              <h3>{popupCourse.title_ar || popupCourse.title}</h3>
              <button className="cp-modal-close" onClick={() => setPopupCourse(null)}>✕</button>
            </div>
            <div className="cp-modal-body">
              {popupCourse.featured_image ? (
                <img src={popupCourse.featured_image} alt="" className="cp-modal-img" />
              ) : (
                <div style={{width:"100%",height:220,background:"#f0f0f0",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:50}}>📚</div>
              )}
              <h3 className="cp-modal-title">{popupCourse.title_ar || popupCourse.title}</h3>
              <p className="cp-modal-desc">{popupCourse.description_ar || popupCourse.description}</p>
              <div className="cp-modal-perks">
                <div className="cp-modal-perk">
                  <i className="fa-solid fa-shield-halved"></i>
                  {t("الجلستين الأولى مجانية تماماً بالمنصة", "First 2 sessions completely free on the platform")}
                </div>
                <div className="cp-modal-perk">
                  <i className="fa-solid fa-trophy"></i>
                  {t("شهادة مهنية معتمدة فور إتمام المسار", "Professional certificate upon path completion")}
                </div>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <Link to={`/courses/${popupCourse.id}`} className="cp-modal-start" onClick={() => setPopupCourse(null)}>
                  {t("ابدأ المسار الآن", "Start the Path Now")}
                </Link>
                <button className="cp-preview-btn" style={{width:"auto",padding:"0 24px",height:48}} onClick={() => setPopupCourse(null)}>
                  {t("إغلاق", "Close")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <FooterSection />
    </div>
  );
}
