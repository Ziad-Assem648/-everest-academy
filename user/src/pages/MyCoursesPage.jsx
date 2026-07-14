import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { api } from "../App";
import AppNavbar from "../components/AppNavbar";
import { useTheme } from "../ThemeContext";
import FooterSection from "../components/FooterSection";

const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== "undefined" && window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
};

export default function MyCoursesPage() {
  const { t, dir } = useLang();
  const { user, logout } = useAuth();
  const { colors: c } = useTheme();
  const m = useIsMobile();
  const nav = useNavigate();
  const loc = useLocation();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user) api(`/api/courses/my?userId=${user.id}&status=approved`).then(setCourses).catch(() => {});
  }, [user]);

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    return !q || (c.title || "").toLowerCase().includes(q) || (c.title_ar || "").includes(q);
  });

  return (
    <div className="courses-body" style={{direction: dir, background: c.bg }}>
      <AppNavbar />

      <div style={{maxWidth:1200,margin:m?"80px auto 0":"110px auto 0",padding:m?"0 14px":"0 20px"}}>
        <h1 style={{fontSize:m?22:28,fontWeight:800,marginBottom:6,color:c.text}}>{t("كورساتي", "My Courses")}</h1>
        <p style={{color:c.textMuted,fontSize:m?13:15,marginBottom:m?16:24}}>{courses.length} {t("كورس مشترك فيه", "courses enrolled")}</p>

        <div className="courses-search" style={{marginBottom:24}}>
          <span className="search-icon">🔍</span>
          <input type="text" placeholder={t("ابحث في كورساتك...", "Search your courses...")} value={search} onChange={(e) => setSearch(e.target.value)} style={{background:c.bgCard,color:c.text,border:`1px solid ${c.border}`}} />
        </div>

        {filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:c.textMuted}}>
            <p style={{fontSize:40,marginBottom:16}}>📚</p>
            <p style={{fontSize:18,marginBottom:8}}>{t("لم تشترك في أي كورس بعد", "You haven't enrolled in any course yet")}</p>
            <Link to="/courses" style={{color:"#2563ff",fontWeight:600}}>{t("تصفح الكورسات", "Browse Courses")}</Link>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:m?"1fr":"repeat(auto-fill,minmax(280px,1fr))",gap:m?14:20}}>
            {filtered.map((c) => (
              <div key={c.id} className="luxury-card">
                <div className="card-img">
                  <span className="card-free" style={{background:"#2563ff"}}>{t("مشترك", "Enrolled")}</span>
                  {c.featured_image ? <img src={c.featured_image} alt="" /> : <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#333",fontSize:40}}>📚</div>}
                </div>
                <div className="card-body">
                  <h3 style={{fontSize:16,color:c.text}}>{c.title_ar || c.title}</h3>
                  <p className="card-desc" style={{color:c.textSoft}}>{c.description_ar || c.description || ""}</p>
                  <div className="card-specs">
                    <span style={{color:c.textSoft}}><span style={{marginLeft:3}}>📊</span> {t("التقدم", "Progress")}: {c.progress || 0}%</span>
                  </div>
                  <div style={{width:"100%",height:6,background:"#eee",borderRadius:3,margin:"8px 0"}}>
                    <div style={{width:`${c.progress || 0}%`,height:"100%",background:"#2563ff",borderRadius:3,transition:"0.5s"}}></div>
                  </div>
                  <div className="card-actions">
                    <Link to={`/courses/${c.course_id}`} className="ux-btn ux-btn-primary" style={{width:"100%",textAlign:"center",textDecoration:"none"}}>
                      {t("متابعة", "Continue")}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <FooterSection />
    </div>
  );
}
