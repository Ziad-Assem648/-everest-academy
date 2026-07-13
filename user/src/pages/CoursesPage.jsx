import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { api } from "../App";
import AppNavbar from "../components/AppNavbar";

const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== "undefined" && window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
};

export default function CoursesPage() {
  const { t, dir } = useLang();
  const { user, logout } = useAuth();
  const m = useIsMobile();
  const nav = useNavigate();
  const loc = useLocation();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sidebar, setSidebar] = useState(false);
  const [modal, setModal] = useState(null);

  useEffect(() => { api("/api/courses?status=published").then(setCourses); }, []);

  const cats = [
    { id: "all", label: t("كل العلوم", "All Subjects") },
    { id: "trading", label: t("التداول والاستثمار", "Trading & Investment") },
    { id: "marketing", label: t("التسويق والمبيعات", "Marketing & Sales") },
    { id: "dev", label: t("تطوير البرمجيات", "Software Development") },
    { id: "ai", label: t("الذكاء الاصطناعي", "Artificial Intelligence") },
    { id: "freelance", label: t("العمل الحر الرقمي", "Digital Freelancing") },
  ];

  const sections = [
    { type: "trading", title: t("مسار التداول الفاخر", "Luxury Trading Path") },
    { type: "marketing", title: t("التسويق الرقمي الحديث", "Modern Digital Marketing") },
    { type: "dev", title: t("علوم البرمجة والويب", "Programming & Web Sciences") },
    { type: "ai", title: t("هندسة الذكاء الاصطناعي", "AI Engineering") },
    { type: "freelance", title: t("العمل الحر وإطلاق المشاريع", "Freelancing & Launching Projects") },
  ];

  const getCategoryCourses = (type) => courses.filter((c) => {
    const cat = c.category || "";
    const matchCat = type === "all" || cat === type || (c.category_ar || "").includes(type);
    const q = search.toLowerCase();
    const matchSearch = !q || (c.title || "").toLowerCase().includes(q) || (c.title_ar || "").includes(q) || (c.description || "").toLowerCase().includes(q);
    const matchFilter = filter === "all" || type === filter || (filter !== "all" && cat === filter);
    return matchCat && matchSearch && (filter === "all" ? true : matchFilter);
  });

  return (
    <div className="courses-body" style={{direction: dir }}>
      <AppNavbar />

      {/* Search & Filters */}
      <div style={{maxWidth:1200,margin:m?"16px auto 0":"25px auto 0",padding:m?"0 14px":"0 20px"}}>
        <div className="courses-search">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder={t("ابحث عن مسارك التعليمي الفاخر هنا..", "Search your luxury learning path here..")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="courses-filters" style={{marginTop:12}}>
          {cats.map((c) => (
            <button key={c.id} className={`filter-chip ${filter === c.id ? "active" : ""}`} onClick={() => setFilter(c.id)}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="courses-main">
        {filter === "all" ? (
          <section className="course-section">
            <div className="row-scroll">
              {courses.filter(c => {
                if (!search) return true;
                const q = search.toLowerCase();
                return (c.title || "").toLowerCase().includes(q) || (c.title_ar || "").includes(q);
              }).map((c) => (
                <div key={c.id} className="luxury-card">
                  <div className="card-img">
                    {c.featured_image ? <img src={c.featured_image} alt="" /> : <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#333",fontSize:40}}>📚</div>}
                  </div>
                  <div className="card-body">
                    <h3 onClick={() => setModal(c)}>{c.title_ar || c.title}</h3>
                    <p className="card-desc">{c.description_ar || c.description || ""}</p>
                    <div className="card-specs">
                      <span><span style={{marginLeft:3}}>🎬</span> {c.lesson_count || 0} {t("دروس", "Lessons")}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8,flexWrap:"wrap",gap:6}}>
                      <span style={{fontWeight:800,fontSize:15,color:"#d4af37"}}>{Number(c.price).toLocaleString()} E-Money</span>
                      {c.price_egp > 0 && <span style={{fontWeight:700,fontSize:13,color:"#d4af37",opacity:.7}}>{Number(c.price_egp).toLocaleString()} {t("ج.م", "EGP")}</span>}
                      {c.avg_rating > 0 && <span style={{fontSize:12,color:"#f59e0b",fontWeight:600}}>⭐ {c.avg_rating} <span style={{color:"#9a95b0",fontWeight:400}}>({c.review_count})</span></span>}
                    </div>
                    <div className="card-actions">
                      <button className="ux-btn ux-btn-outline" onClick={() => setModal(c)}>{t("معاينة", "Preview")}</button>
                      <Link to={`/courses/${c.id}`} className="ux-btn ux-btn-primary">{t("امتلك", "Own It")}</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          sections.filter(sec => sec.type === filter).map((sec) => {
            const secCourses = getCategoryCourses(sec.type);
            if (secCourses.length === 0) return null;
            return (
              <section key={sec.type} className="course-section">
                <div className="cat-header">
                  <h2>{sec.title}</h2>
                  <div className="cat-line"></div>
                </div>
                <div className="row-scroll">
                  {secCourses.map((c) => (
                    <div key={c.id} className="luxury-card">
                      <div className="card-img">
                        {c.featured_image ? <img src={c.featured_image} alt="" /> : <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#333",fontSize:40}}>📚</div>}
                      </div>
                      <div className="card-body">
                        <h3 onClick={() => setModal(c)}>{c.title_ar || c.title}</h3>
                        <p className="card-desc">{c.description_ar || c.description || ""}</p>
                        <div className="card-specs">
                          <span><span style={{marginLeft:3}}>🎬</span> {c.lesson_count || 0} {t("دروس", "Lessons")}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8,flexWrap:"wrap",gap:6}}>
                          <span style={{fontWeight:800,fontSize:15,color:"#d4af37"}}>{Number(c.price).toLocaleString()} E-Money</span>
                          {c.price_egp > 0 && <span style={{fontWeight:700,fontSize:13,color:"#d4af37",opacity:.7}}>{Number(c.price_egp).toLocaleString()} {t("ج.م", "EGP")}</span>}
                          {c.avg_rating > 0 && <span style={{fontSize:12,color:"#f59e0b",fontWeight:600}}>⭐ {c.avg_rating} <span style={{color:"#9a95b0",fontWeight:400}}>({c.review_count})</span></span>}
                        </div>
                        <div className="card-actions">
                          <button className="ux-btn ux-btn-outline" onClick={() => setModal(c)}>{t("معاينة", "Preview")}</button>
                          <Link to={`/courses/${c.id}`} className="ux-btn ux-btn-primary">{t("امتلك", "Own It")}</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* Modal */}
      <div className={`modal-mask ${modal ? "open" : ""}`} onClick={(e) => { if (e.target.classList.contains("modal-mask")) setModal(null); }}>
        {modal && (
          <div className="modal-window">
            <div className="modal-cover">
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
              {modal.featured_image ? <img src={modal.featured_image} alt="" /> : <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontSize:60}}>📚</div>}
            </div>
            <div className="modal-body">
              <h2>{modal.title_ar || modal.title}</h2>
              <p className="modal-text">{modal.description_ar || modal.description}</p>
              <div className="modal-perks">
                <div className="modal-perk"><span>🛡️</span> {t("الجلستين الأولى مجانية تماماً بالمنصة", "First 2 sessions completely free on the platform")}</div>
                <div className="modal-perk"><span>🏆</span> {t("شهادة مهنية معتمدة فور إتمام المسار", "Professional certificate upon path completion")}</div>
              </div>
              <Link to={`/courses/${modal.id}`} className="ux-btn ux-btn-primary" style={{textDecoration:"none",display:"inline-flex",padding:"12px 24px",borderRadius:12}}>
                {t("ابدأ المسار الآن", "Start the Path Now")}
              </Link>
            </div>
          </div>
        )}
      </div>

    
 
    </div>
  );
}
