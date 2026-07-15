import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import PublicNavbar from "../components/PublicNavbar";
import FooterSection from "../components/FooterSection";

const api = (path, opts = {}) =>
  fetch(path, { headers: { "Content-Type": "application/json" }, ...opts }).then((r) => r.json());

export default function FreeCoursesPage() {
  const { t, dir } = useLang();
  const { theme } = useTheme();
  const [lessons, setLessons] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [popupLesson, setPopupLesson] = useState(null);

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

  const filteredLessons = lessons.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (l.title || "").toLowerCase().includes(q) || (l.title_ar || "").includes(q) || (l.course_title || "").toLowerCase().includes(q) || (l.course_title_ar || "").includes(q);
    return matchSearch;
  });

  const groupedByCourse = {};
  filteredLessons.forEach((l) => {
    if (!groupedByCourse[l.course_id]) groupedByCourse[l.course_id] = [];
    groupedByCourse[l.course_id].push(l);
  });

  const cats = [
    { id: "all", emoji: "\uD83C\uDF10", label: t("الكل", "All") },
    { id: "trading", emoji: "\uD83D\uDCC8", label: t("التداول", "Trading") },
    { id: "marketing", emoji: "\uD83D\uDCA1", label: t("التسويق", "Marketing") },
    { id: "dev", emoji: "\uD83D\uDCBB", label: t("البرمجة", "Programming") },
    { id: "ai", emoji: "\uD83E\uDD16", label: t("الذكاء الاصطناعي", "AI") },
    { id: "freelance", emoji: "\uD83D\uDC4D", label: t("العمل الحر", "Freelancing") },
  ];

  const categories = [
    { id: "trading", type: "trading" },
    { id: "marketing", type: "marketing" },
    { id: "dev", type: "dev" },
    { id: "ai", type: "ai" },
    { id: "freelance", type: "freelance" },
  ];

  const getDiffLabel = (d) => {
    if (d === "beginner") return t("مبتدئ", "Beginner");
    if (d === "intermediate") return t("متوسط", "Intermediate");
    return t("متقدم", "Advanced");
  };
  const getDiffColor = (d) => {
    if (d === "beginner") return "#22c55e";
    if (d === "intermediate") return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div style={{ background: theme === "dark" ? "#1a1a2e" : "#fafafa", minHeight: "100vh", fontFamily: "'Cairo', sans-serif", direction: dir }}>
      <style>{`
        .fcp-hero{min-height:40vh;display:flex;align-items:center;justify-content:center;padding:140px 20px 80px;background:radial-gradient(circle at top right,rgba(212,175,55,.18),transparent 35%),radial-gradient(circle at bottom left,rgba(212,175,55,.1),transparent 35%),#fafafa}
        .fcp-hero-inner{width:min(100%,900px);text-align:center}
        .fcp-hero-badge{display:inline-block;padding:8px 16px;border-radius:999px;background:#fff;border:1px solid rgba(212,175,55,.25);color:#b8860b;font-size:.85rem;font-weight:700;margin-bottom:24px}
        .fcp-hero h1{font-size:clamp(2.5rem,7vw,5.5rem);line-height:1;color:#111;margin:0 0 24px;font-weight:800}
        .fcp-hero p{max-width:650px;margin:auto;color:#666;line-height:1.8;font-size:1.05rem}
        .fcp-search-box{margin-top:40px;background:#fff;border-radius:999px;padding:10px;display:flex;gap:10px;box-shadow:0 15px 40px rgba(0,0,0,.06);max-width:700px;margin-inline:auto}
        .fcp-search-box input{flex:1;border:none;outline:none;padding:16px 20px;font-size:1rem;background:transparent;font-family:'Cairo',sans-serif}
        .fcp-search-box button{border:none;background:#111;color:#fff;padding:0 28px;border-radius:999px;cursor:pointer;font-weight:700;font-family:'Cairo',sans-serif;transition:.3s}
        .fcp-search-box button:hover{transform:translateY(-2px)}
        .fcp-categories{padding:40px 10px;background:#fff}
        .fcp-cats-wrap{max-width:1100px;margin:auto;display:flex;flex-wrap:wrap;justify-content:center;gap:16px}
        .fcp-cat-btn{border:none;padding:16px 26px;border-radius:999px;background:#e1dada;color:#111;font-weight:700;cursor:pointer;transition:.3s;font-size:.95rem;font-family:'Cairo',sans-serif}
        .fcp-cat-btn:hover{transform:translateY(-4px);background:#111;color:#fff}
        .fcp-cat-btn.active{background:#d4af37;color:#111}
        .fcp-trending{padding:100px 20px;background:#faf8f3}
        .fcp-section-heading{text-align:center;margin-bottom:50px}
        .fcp-section-heading span{color:#c7a44c;font-weight:700;letter-spacing:1px;font-size:.9rem}
        .fcp-section-heading h2{margin-top:10px;font-size:clamp(2rem,4vw,3rem);color:#111}
        .fcp-cards-row{max-width:1300px;margin:auto;display:flex;gap:22px;overflow-x:auto;scroll-behavior:smooth;padding-bottom:10px;scrollbar-width:none}
        .fcp-cards-row::-webkit-scrollbar{display:none}
        .fcp-trend-card{min-width:250px;max-width:250px;background:#fff;border-radius:26px;overflow:hidden;position:relative;flex-shrink:0;box-shadow:0 12px 30px rgba(0,0,0,.05);transition:.35s}
        .fcp-trend-card:hover{transform:translateY(-8px)}
        .fcp-trend-card img{width:100%;height:180px;object-fit:cover}
        .fcp-free-tag{position:absolute;top:14px;right:14px;background:#059669;color:#fff;padding:6px 12px;border-radius:999px;font-size:.75rem;font-weight:700}
        .fcp-trend-info{padding:18px}
        .fcp-trend-info h3{color:#111;margin:0 0 10px;font-size:1rem;font-weight:700}
        .fcp-trend-info p{color:#777;font-size:.9rem;line-height:1.6;height:45px;margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
        .fcp-course-meta{display:flex;justify-content:space-between;margin-top:15px;font-size:.85rem;color:#555}
        .fcp-card-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:20px}
        .fcp-price-text{color:#c7a44c;font-weight:800;font-size:1rem}
        .fcp-card-actions{display:flex;gap:10px;margin-top:18px}
        .fcp-preview-btn{flex:1;height:42px;border:none;border-radius:12px;background:#f5f5f5;color:#111;cursor:pointer;font-weight:700;font-family:'Cairo',sans-serif;transition:.2s}
        .fcp-preview-btn:hover{background:#ececec}
        .fcp-buy-btn{flex:1;height:42px;border:none;border-radius:12px;background:linear-gradient(135deg,#d4af37,#f5d76e);color:#111;cursor:pointer;font-weight:800;font-family:'Cairo',sans-serif;transition:.3s;text-decoration:none;display:flex;align-items:center;justify-content:center}
        .fcp-buy-btn:hover{transform:translateY(-2px)}
        .fcp-premium-section{max-width:1300px;margin:70px auto;padding:70px;border-radius:40px;background:linear-gradient(135deg,#0f0f0f,#1c1c1c);color:#fff;display:flex;justify-content:space-between;align-items:center;gap:60px;overflow:hidden;position:relative}
        .fcp-premium-section::before{content:'';position:absolute;width:500px;height:500px;background:#d4af37;opacity:.07;border-radius:50%;top:-250px;right:-150px}
        .fcp-premium-label{color:#d4af37;font-weight:700;letter-spacing:2px;font-size:.85rem}
        .fcp-premium-content h2{margin:18px 0;font-size:clamp(2rem,5vw,3.5rem);line-height:1.2}
        .fcp-premium-content p{max-width:600px;color:#d0d0d0;line-height:1.8}
        .fcp-premium-features{margin-top:35px;display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
        .fcp-feature{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);padding:14px 18px;border-radius:16px;font-size:.9rem}
        .fcp-premium-card{min-width:320px;background:rgba(255,255,255,.05);backdrop-filter:blur(18px);border:1px solid rgba(212,175,55,.2);border-radius:30px;padding:40px;text-align:center}
        .fcp-premium-card span{color:#d4af37;font-weight:700;font-size:.85rem}
        .fcp-premium-card h3{margin:15px 0;font-size:3rem;color:#fff}
        .fcp-premium-card>p{color:#cfcfcf;margin-bottom:30px}
        .fcp-start-btn{width:100%;height:58px;display:flex;align-items:center;justify-content:center;border-radius:18px;background:#d4af37;color:#111;text-decoration:none;font-weight:800;transition:.3s;border:none;cursor:pointer;font-family:'Cairo',sans-serif;font-size:1rem}
        .fcp-start-btn:hover{transform:translateY(-3px)}
        .fcp-emp{text-align:center;padding:80px 20px;color:#999}
        .fcp-emp h3{color:#666;margin:0 0 8px}
        .fcp-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(10px);z-index:3000;display:flex;justify-content:center;align-items:center;opacity:0;pointer-events:none;transition:.3s;padding:15px}
        .fcp-modal-overlay.open{opacity:1;pointer-events:auto}
        .fcp-modal-box{width:min(900px,92%);max-height:85vh;overflow:auto;background:#fff;border-radius:32px;transform:translateY(20px);transition:.3s}
        .fcp-modal-overlay.open .fcp-modal-box{transform:translateY(0)}
        .fcp-modal-header{display:flex;justify-content:space-between;align-items:center;padding:24px 28px;border-bottom:1px solid #f0f0f0}
        .fcp-modal-header h3{font-size:1.5rem;color:#111;margin:0}
        .fcp-modal-close{width:44px;height:44px;border:none;border-radius:50%;background:#f4f4f4;cursor:pointer;font-size:1.2rem;display:flex;align-items:center;justify-content:center}
        .fcp-modal-body{padding:28px}
        .fcp-modal-img{width:100%;height:220px;object-fit:cover;border-radius:20px}
        .fcp-modal-title{font-size:1.5rem;color:#111;margin:20px 0 10px}
        .fcp-modal-desc{color:#777;line-height:1.8;margin-bottom:20px}
        .fcp-modal-perks{display:flex;flex-direction:column;gap:10px;margin-bottom:24px}
        .fcp-modal-perk{display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:16px;background:#fafafa;font-size:.9rem;color:#444}
        .fcp-modal-perk i{color:#d4af37}
        .fcp-modal-start{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:18px;background:#d4af37;color:#111;text-decoration:none;font-weight:800;transition:.3s;border:none;cursor:pointer;font-family:'Cairo',sans-serif}
        .fcp-modal-start:hover{transform:translateY(-2px)}
        @media(max-width:768px){
          .fcp-hero{padding:120px 20px 60px;min-height:auto}
          .fcp-hero h1{font-size:2.4rem}
          .fcp-search-box{flex-direction:column;border-radius:28px}
          .fcp-search-box button{height:52px}
          .fcp-categories{padding:30px 10px}
          .fcp-cats-wrap{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;scrollbar-width:none;-webkit-overflow-scrolling:touch}
          .fcp-cats-wrap::-webkit-scrollbar{display:none}
          .fcp-cat-btn{white-space:nowrap;flex-shrink:0}
          .fcp-trending{padding:60px 16px}
          .fcp-cards-row{gap:16px;padding:0 0 10px}
          .fcp-trend-card{min-width:240px;max-width:240px}
          .fcp-premium-section{flex-direction:column;padding:40px 24px;text-align:center;margin:40px 16px}
          .fcp-premium-features{grid-template-columns:1fr}
          .fcp-premium-card{width:100%;min-width:auto}
          .fcp-modal-overlay{align-items:flex-end;padding:0}
          .fcp-modal-box{width:100%;max-height:90vh;border-radius:20px 20px 0 0}
        }
        @media(min-width:769px) and (max-width:1024px){.fcp-premium-features{grid-template-columns:1fr}}
        .fcp-card-img-wrap{position:relative;overflow:hidden}
        .fcp-card-img-wrap img{transition:transform .5s}
        .fcp-trend-card:hover .fcp-card-img-wrap img{transform:scale(1.05)}
        [data-theme="dark"] .fcp-hero{background:radial-gradient(circle at top right,rgba(212,175,55,.12),transparent 35%),radial-gradient(circle at bottom left,rgba(212,175,55,.08),transparent 35%),#1a1a2e}
        [data-theme="dark"] .fcp-hero-badge{background:#2a2a3e;color:#d4af37;border-color:rgba(212,175,55,.3)}
        [data-theme="dark"] .fcp-hero h1{color:#f0f0f0}
        [data-theme="dark"] .fcp-hero p{color:#aaa}
        [data-theme="dark"] .fcp-search-box{background:#2a2a3e;box-shadow:0 15px 40px rgba(0,0,0,.3)}
        [data-theme="dark"] .fcp-search-box input{color:#f0f0f0}
        [data-theme="dark"] .fcp-search-box button{background:#d4af37;color:#111}
        [data-theme="dark"] .fcp-categories{background:#1a1a2e}
        [data-theme="dark"] .fcp-cat-btn{background:#2a2a3e;color:#ccc}
        [data-theme="dark"] .fcp-cat-btn:hover{background:#d4af37;color:#111}
        [data-theme="dark"] .fcp-trending{background:#16213e}
        [data-theme="dark"] .fcp-section-heading h2{color:#f0f0f0}
        [data-theme="dark"] .fcp-trend-card{background:#1e1e2f;box-shadow:0 12px 30px rgba(0,0,0,.3)}
        [data-theme="dark"] .fcp-trend-info h3{color:#f0f0f0}
        [data-theme="dark"] .fcp-trend-info p{color:#aaa}
        [data-theme="dark"] .fcp-course-meta{color:#aaa}
        [data-theme="dark"] .fcp-preview-btn{background:#2a2a3e;color:#f0f0f0}
        [data-theme="dark"] .fcp-preview-btn:hover{background:#3a3a4e}
        [data-theme="dark"] .fcp-emp h3{color:#aaa}
        [data-theme="dark"] .fcp-modal-overlay{background:rgba(0,0,0,.7)}
        [data-theme="dark"] .fcp-modal-box{background:#1e1e2f}
        [data-theme="dark"] .fcp-modal-header{border-bottom-color:#333}
        [data-theme="dark"] .fcp-modal-header h3{color:#f0f0f0}
        [data-theme="dark"] .fcp-modal-close{background:#2a2a3e;color:#f0f0f0}
        [data-theme="dark"] .fcp-modal-title{color:#f0f0f0}
        [data-theme="dark"] .fcp-modal-desc{color:#aaa}
        [data-theme="dark"] .fcp-modal-perk{background:#2a2a3e;color:#ccc}
      `}</style>

      <PublicNavbar active="courses" />

      {/* ===== HERO ===== */}
      <section className="fcp-hero">
        <div className="fcp-hero-inner">
          <span className="fcp-hero-badge">{t("كورسات خارجية للعرض", "EXTERNAL COURSES FOR PREVIEW")}</span>
          <h1>{t("جرّب مجاناً قبل ما تشتري", "Try Before You Buy")}</h1>
          <p>{t("استكشف دروساً مجانية من كورسات مدفوعة — تعرّف على المحتوى والأسلوب قبل الاشتراك.", "Explore free lessons from paid courses — experience the content and style before subscribing.")}</p>
          <div className="fcp-search-box">
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
      <section className="fcp-categories">
        <div className="fcp-cats-wrap">
          {cats.map((cat) => (
            <button
              key={cat.id}
              className={`fcp-cat-btn ${filter === cat.id ? "active" : ""}`}
              onClick={() => setFilter(filter === cat.id ? "all" : cat.id)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ===== FREE LESSONS TRENDING ===== */}
      <section className="fcp-trending" id="lessons">
        <div className="fcp-section-heading">
          <span>{t("دروس مجانية", "FREE LESSONS")}</span>
          <h2>{t("جرّب قبل ما تشتري", "Preview Before You Buy")}</h2>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="fcp-emp">
            <div style={{fontSize:48,marginBottom:16}}>📚</div>
            <h3>{t("لا توجد دروس مجانية متاحة", "No Free Lessons Available")}</h3>
            <p>{t("جرّب كلمات بحث مختلفة أو عدّ لاحقاً", "Try different search terms or check back later")}</p>
          </div>
        ) : (
          <div className="fcp-cards-row">
            {filteredLessons.map((lesson) => {
              const course = coursesMap[lesson.course_id] || {};
              return (
                <div key={lesson.id} className="fcp-trend-card">
                  <div className="fcp-free-tag">🔓 {t("مجاني", "Free")}</div>
                  <div className="fcp-card-img-wrap">
                    {course.image ? (
                      <img src={course.image} alt={lesson.title_ar || lesson.title} />
                    ) : (
                      <div style={{width:"100%",height:180,background:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,color:"#ddd"}}>📚</div>
                    )}
                  </div>
                  <div className="fcp-trend-info">
                    <h3 style={{cursor:"pointer"}} onClick={() => setPopupLesson({ ...lesson, courseTitle: course.title_ar || course.title, courseDesc: course.description_ar || course.description, courseImage: course.image, coursePrice: course.price, courseDifficulty: course.difficulty })}>
                      {lesson.title_ar || lesson.title}
                    </h3>
                    <p>{course.description_ar || course.description || ""}</p>
                    <div className="fcp-course-meta">
                      <span style={{display:"flex",alignItems:"center",gap:5}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:getDiffColor(course.difficulty),display:"inline-block"}}></span>
                        {getDiffLabel(course.difficulty)}
                      </span>
                      <span>{course.freeCount} {t("مجانية", "Free")}</span>
                    </div>
                    <div className="fcp-card-bottom">
                      <span className="fcp-price-text">{Number(course.price).toLocaleString()} E-Money</span>
                    </div>
                    <div className="fcp-card-actions">
                      <button className="fcp-preview-btn" onClick={() => setPopupLesson({ ...lesson, courseTitle: course.title_ar || course.title, courseDesc: course.description_ar || course.description, courseImage: course.image, coursePrice: course.price, courseDifficulty: course.difficulty })}>
                        {t("معاينة", "Preview")}
                      </button>
                      <Link to={`/courses/${lesson.course_id}`} className="fcp-buy-btn">
                        {t("اشتري الآن", "Buy Now")}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== WHY EVEREST ===== */}
      <section className="fcp-premium-section">
        <div className="fcp-premium-content">
          <span className="fcp-premium-label">{t("لماذا إيفرست؟", "WHY EVEREST?")}</span>
          <h2>{t("أكثر من مجرد تعلم", "More Than Just Learning")}</h2>
          <p>{t("نقدم تجربة تعليمية متكاملة مصممة لمساعدة الطلاب على النمو والحفاظ على حماسهم وتحقيق نتائج حقيقية من خلال محتوى عملي ودعم مستمر.", "We provide a complete learning experience designed to help students grow, stay motivated and achieve real results through practical content and continuous support.")}</p>
          <div className="fcp-premium-features">
            <div className="fcp-feature">{t("🎯 مسار تعليمي شخصي", "Personalized Learning Journey")}</div>
            <div className="fcp-feature">{t("🚀 حماس مستمر", "Continuous Motivation")}</div>
            <div className="fcp-feature">{t("📚 محتوى محدث", "Updated Content")}</div>
            <div className="fcp-feature">{t("💎 نظام E-Money مرن", "Flexible E-Money System")}</div>
            <div className="fcp-feature">{t("🤝 دعم الطلاب", "Student Support")}</div>
            <div className="fcp-feature">{t("🌟 مكافآت الإحالة", "Mone")}</div>
          </div>
        </div>
        <div className="fcp-premium-card">
          <span>{t("مجتمعنا", "OUR COMMUNITY")}</span>
          <h3>{uniqueCourses.length * 30}+</h3>
          <p>{t("جلسة تعليمية فاخرة", "Premium Learning Sessions")}</p>
          <button className="fcp-start-btn" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>{t("ابدأ التعلم", "Start Learning")}</button>
        </div>
      </section>

      {/* ===== LESSON PREVIEW MODAL ===== */}
      <div className={`fcp-modal-overlay ${popupLesson ? "open" : ""}`} onClick={(e) => { if (e.target.classList.contains("fcp-modal-overlay")) setPopupLesson(null); }}>
        {popupLesson && (
          <div className="fcp-modal-box">
            <div className="fcp-modal-header">
              <h3>{popupLesson.title_ar || popupLesson.title}</h3>
              <button className="fcp-modal-close" onClick={() => setPopupLesson(null)}>✕</button>
            </div>
            <div className="fcp-modal-body">
              {popupLesson.courseImage ? (
                <img src={popupLesson.courseImage} alt="" className="fcp-modal-img" />
              ) : (
                <div style={{width:"100%",height:220,background:"#f0f0f0",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:50}}>📚</div>
              )}
              <h3 className="fcp-modal-title">{popupLesson.title_ar || popupLesson.title}</h3>
              <p className="fcp-modal-desc">
                <strong>{popupLesson.courseTitle}</strong> — {popupLesson.courseDesc}
              </p>
              <div className="fcp-modal-perks">
                <div className="fcp-modal-perk">
                  <i className="fa-solid fa-shield-halved"></i>
                  {t("هذا درس مجاني — اشترِ الكورس للمشاهدة الكاملة", "This is a free lesson — buy the course for full access")}
                </div>
                <div className="fcp-modal-perk">
                  <i className="fa-solid fa-trophy"></i>
                  {t("شهادة مهنية معتمدة فور إتمام المسار", "Professional certificate upon path completion")}
                </div>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <Link to={`/free-courses/${popupLesson.course_id}?lesson=${popupLesson.id}`} className="fcp-modal-start" onClick={() => setPopupLesson(null)}>
                  {t("شاهد الدرس الآن", "Watch Lesson Now")}
                </Link>
                
              </div>
            </div>
          </div>
        )}
      </div>

      <FooterSection />
    </div>
  );
}
