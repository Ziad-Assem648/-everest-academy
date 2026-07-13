import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { api } from "../App";
import AppNavbar from "../components/AppNavbar";
import CustomerServiceFooter from "../components/CustomerServiceFooter";

const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== "undefined" && window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
};

const img = (name) => `/images/${name}`;

const makeStyles = (c, m) => ({
  hero: { width:"95%",maxWidth:1500,margin:"0 auto",background:c.heroBg,borderRadius:0,padding:m?"24px 16px":"55px 60px",display:"flex",flexDirection:m?"column":"row",alignItems:"center",justifyContent:"space-between",gap:m?20:40,overflow:"hidden",position:"relative" },
  heroContent: { flex:1,maxWidth:m?"100%":700,textAlign:m?"center":"start" },
  heroBadge: { display:"inline-flex",alignItems:"center",gap:10,padding:"10px 18px",border:`1px solid ${c.borderLight}`,borderRadius:999,background:c.goldLight,color:c.blue,fontSize:m?11:13,fontWeight:600,marginBottom:m?12:22 },
  heroH1: { fontSize:m?24:38,lineHeight:1.15,letterSpacing:"-0.5px",marginBottom:m?12:20,color:c.blue },
  heroH1Span: { color:c.blue },
  heroP: { fontSize:m?14:17,lineHeight:1.8,maxWidth:m?"100%":520,marginBottom:m?20:32,color:c.heroText },
  heroButtons: { display:"flex",gap:10,flexWrap:"wrap",justifyContent:m?"center":"flex-start" },
  btnPrimary: { height:m?44:52,padding:m?"0 18px":"0 24px",borderRadius:14,background:c.blue,color:"#fff",textDecoration:"none",display:"flex",alignItems:"center",gap:10,fontSize:m?13:15,fontWeight:600,transition:"0.35s",border:"none",cursor:"pointer" },
  heroImage: { flex:1,display:m?"none":"flex",justifyContent:"flex-end" },
  heroImg: { width:"100%",maxWidth:700,display:"block",borderRadius:30,objectFit:"contain",filter:"drop-shadow(0 30px 60px rgba(0,0,0,0.45))" },
  leadersSection: { padding:m?"50px 16px":"90px 5%",background:c.sectionBg,color:c.text },
  sectionTitle: { textAlign:"center",marginBottom:m?24:50 },
  sectionTitleSpan: { color:c.textMuted,fontSize:"0.75rem",letterSpacing:3 },
  sectionTitleH2: { fontSize:m?"1.6rem":"clamp(2rem,4vw,3.5rem)",margin:"10px 0" },
  sectionTitleP: { color:c.textMuted,maxWidth:500,margin:"auto",fontSize:m?13:"inherit" },
  leadersSlider: { display:"flex",gap:m?10:18,overflowX:"auto",scrollbarWidth:"none",padding:"20px 0" },
  leaderCard: { flex:m?"0 0 160px":"0 0 240px",scrollSnapAlign:"start",background:c.sectionAltBg,border:`1px solid ${c.border}`,borderRadius:m?18:28,padding:m?14:20,textAlign:"center",position:"relative",transition:"0.3s ease" },
  leaderImg: { width:m?80:120,height:m?80:120,objectFit:"cover",borderRadius:"30%",marginTop:m?8:15,marginBottom:m?8:15,background:"#333" },
  leaderName: { fontSize:m?"0.8rem":"0.95rem",fontWeight:600,marginBottom:m?6:12 },
  rank: { display:"inline-flex",alignItems:"center",justifyContent:"center",padding:m?"6px 10px":"8px 14px",borderRadius:999,fontSize:m?"0.62rem":"0.72rem",fontWeight:600 },
  courses: { padding:m?"50px 16px":"100px 5%",background:c.bg,overflow:"hidden" },
  coursesHeader: { maxWidth:m?"100%":650,margin:m?"0 auto 24px":"0 auto 50px",textAlign:"center" },
  coursesHeaderSpan: { fontSize:"0.75rem",letterSpacing:3,color:c.textMuted,display:"block",marginBottom:m?6:12 },
  coursesHeaderH2: { fontSize:m?"1.6rem":"clamp(2.2rem,5vw,4rem)",color:c.text,lineHeight:1.1,marginBottom:m?8:15 },
  coursesHeaderH2Span: { position:"relative",color:c.gold,display:"inline" },
  coursesHeaderP: { color:c.textSoft,lineHeight:1.8,maxWidth:550,fontSize:m?13:"inherit" },
  coursesGrid: { display:"flex",gap:m?10:20,overflowX:"auto",padding:"10px 0",scrollbarWidth:"none",scrollSnapType:"x mandatory" },
  courseCard: { minWidth:m?220:280,maxWidth:m?220:280,flexShrink:0,scrollSnapAlign:"start",background:c.bgCard,borderRadius:m?18:26,padding:m?12:16,boxShadow:c.shadow,transition:"0.35s ease",overflow:"hidden" },
  courseImage: { width:"100%",height:m?120:160,objectFit:"cover",borderRadius:m?12:18,background:"#eee",display:"block" },
  courseCardH3: { marginTop:m?8:15,fontSize:m?"0.9rem":"1.1rem",color:c.text },
  courseCardP: { marginTop:m?6:10,color:c.textSoft,fontSize:m?"0.78rem":"0.88rem",lineHeight:1.7 },
  courseFooter: { marginTop:m?12:18,paddingTop:m?12:18,borderTop:`1px solid ${c.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" },
  priceH4: { fontSize:m?"1rem":"1.3rem",color:c.text,marginTop:3 },
  courseBtn: { textDecoration:"none",background:c.text,color:c.bgCard,padding:m?"8px 10px":"10px 14px",borderRadius:12,fontSize:m?"0.75rem":"0.85rem",transition:"0.3s",display:"inline-flex",alignItems:"center",gap:6 },
});

const ranks = [
  { icon: "⭐", name: "Star", req: "Join and activate your account.", reward: "Community access & recognition." },
  { icon: "🚀", name: "Executive", req: "5 Team Sales.", reward: "1,500 EGP Bonus." },
  { icon: "💎", name: "Executive Star", req: "10 Team Sales.", reward: "3,000 EGP Bonus." },
  { icon: "🏆", name: "Senior Leader", req: "40 Team Sales.", reward: "8,000 EGP Bonus." },
  { icon: "🌍", name: "Regional Leader", req: "70 Team Sales.", reward: "12,000 EGP Bonus." },
  { icon: "⚡", name: "Everest Elite", req: "120 Team Sales.", reward: "18,000 EGP Bonus." },
  { icon: "🔱", name: "Everest Master", req: "200 Team Sales.", reward: "28,000 EGP Bonus." },
  { icon: "🔥", name: "Everest Legend", req: "350 Team Sales.", reward: "45,000 EGP Bonus." },
  { icon: "🌟", name: "Everest Ambassador", req: "600 Team Sales.", reward: "75,000 EGP Bonus." },
];

const rankClassMap = {
  "Everest Ambassador":"ambassador","Everest Legend":"legend","Everest Master":"master",
  "Everest Elite":"elite","Regional Leader":"regional","Senior Leader":"senior",
  "Executive Star":"elite","Executive":"senior"
};

const rankColors = {
  ambassador: { color:"#ffd700", bg:"rgba(255,215,0,0.08)", border:"1px solid rgba(255,215,0,0.18)" },
  legend: { color:"#ff5b5b", bg:"rgba(255,91,91,0.08)", border:"1px solid rgba(255,91,91,0.18)" },
  master: { color:"#20d4c2", bg:"rgba(32,212,194,0.08)", border:"1px solid rgba(32,212,194,0.18)" },
  elite: { color:"#a855f7", bg:"rgba(168,85,247,0.08)", border:"1px solid rgba(168,85,247,0.18)" },
  regional: { color:"#22c55e", bg:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.18)" },
  senior: { color:"#fb923c", bg:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.18)" },
};

export default function HomePage() {
  const { user, logout } = useAuth();
  const { t, lang, toggle: toggleLang, dir } = useLang();
  const { colors: c } = useTheme();
  const m = useIsMobile();
  const s = makeStyles(c, m);
  const nav = useNavigate();
  const loc = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSidebar, setChatSidebar] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [dbRanks, setDbRanks] = useState([]);
  const [conversations, setConversations] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ea_chats")) || []; } catch { return []; }
  });
  const [activeConvId, setActiveConvId] = useState(null);
  const chatRef = useRef(null);

  const activeConv = conversations.find(c => c.id === activeConvId) || null;
  const chatMsgs = activeConv?.messages || [];

  const saveConvs = (convs) => {
    setConversations(convs);
    localStorage.setItem("ea_chats", JSON.stringify(convs));
  };

  const newChat = () => {
    setChatSidebar(false);
    const id = Date.now().toString();
    const conv = { id, title: t("محادثة جديدة", "New chat"), messages: [], createdAt: id };
    saveConvs([conv, ...conversations]);
    setActiveConvId(id);
  };

  const deleteChat = (e, id) => {
    e.stopPropagation();
    const convs = conversations.filter(c => c.id !== id);
    saveConvs(convs);
    if (activeConvId === id) setActiveConvId(convs.length > 0 ? convs[0].id : null);
  };

  const sendChat = async (preMsg) => {
    const raw = preMsg || chatInput;
    if (!raw.trim() || chatLoading) return;
    const msg = raw.trim();
    setChatInput("");
    let convs = [...conversations];
    let conv = convs.find(c => c.id === activeConvId);
    if (!conv) {
      const id = Date.now().toString();
      conv = { id, title: msg.slice(0, 30), messages: [], createdAt: id };
      convs.unshift(conv);
      setActiveConvId(id);
    }
    if (conv.title === t("محادثة جديدة", "New chat")) conv.title = msg.slice(0, 30);
    conv.messages.push({ role: "user", text: msg });
    saveConvs(convs);
    setChatLoading(true);
    try {
      const history = conv.messages.slice(0, -1).map(m => ({ role: m.role === "user" ? "user" : "model", text: m.text }));
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history })
      });
      const data = await res.json();
      convs = JSON.parse(localStorage.getItem("ea_chats")) || [];
      conv = convs.find(c => c.id === activeConvId);
      if (conv) {
        conv.messages.push({ role: "bot", text: data.reply || data.error || t("عذراً، حدث خطأ. حاول مرة أخرى.", "Sorry, an error occurred. Try again.") });
        saveConvs(convs);
      }
    } catch {
      convs = JSON.parse(localStorage.getItem("ea_chats")) || [];
      conv = convs.find(c => c.id === activeConvId);
      if (conv) {
        conv.messages.push({ role: "bot", text: t("عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.", "Sorry, a connection error occurred. Try again.") });
        saveConvs(convs);
      }
    }
    setChatLoading(false);
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMsgs]);
  const [openRank, setOpenRank] = useState(0);
  const [courses, setCourses] = useState([]);
  const [modal, setModal] = useState(null);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    api("/api/courses?status=published").then(setCourses).catch(() => {});
    api("/api/leaders?top=1").then(setLeaders).catch(() => {});
    api("/api/ranks").then((d) => Array.isArray(d) ? setDbRanks(d) : null).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); nav("/login"); };

  return (
      <div style={{background:c.bg,minHeight:"100vh",direction:dir}}>
      <AppNavbar />

      {/* Hero */}
      <section style={{...s.hero,marginBottom:25}}>
        <div style={{position:"absolute",top:m?12:20,right:m?12:20,zIndex:2}}>
          <button onClick={toggleLang} style={{display:"flex",alignItems:"center",gap:6,padding:m?"6px 12px":"8px 16px",borderRadius:10,background:c.goldLight,border:`1px solid ${c.borderLight}`,cursor:"pointer",fontSize:m?12:13,fontWeight:700,color:c.blue,transition:"0.3s",fontFamily:"inherit"}}>
            <span style={{fontSize:m?13:14}}>{lang === "ar" ? "🇺🇸" : "🇸🇦"}</span> {lang === "ar" ? "EN" : "عربي"}
          </button>
        </div>
        <div style={s.heroContent}>
          <span style={s.heroBadge}>{t("👋 مرحباً بعودتك","👋 Welcome Back")}{user ? `, ${user.full_name?.split(" ")[0]}` : ""}</span>
          <h1 style={s.heroH1}>{t("اكمل","Continue Your")} <br />{t("رحلتك إلى","Journey To The")} <br /><span style={s.heroH1Span}>{t("الرتبة التالية","Next Rank")}</span></h1>
          <p style={s.heroP}>{t("أكمل المهام، افتح رتباً جديدة، تعلم من كورسات احترافية وكن واحداً من قادة أكاديمية إيفرست.","Complete missions, unlock new ranks, learn from premium courses and become one of Everest Academy leaders.")}</p>
          <div style={s.heroButtons}>
            <Link to="/courses" style={s.btnPrimary}>{t("مواصلة التعلم","Continue Learning")} <i className="fa-solid fa-arrow-right"></i></Link>
          </div>
        </div>
        <div style={s.heroImage}>
            <img src={img("Screenshot_2026-06-28_145125-removebg-preview.png")} alt="Hero" style={s.heroImg} />
        </div>
      </section>

      {/* Leaders */}
      <section style={s.leadersSection}>
        <div style={s.sectionTitle}>
          <span style={s.sectionTitleSpan}>{t("أفضل المنجزين","TOP ACHIEVERS")}</span>
          <h2 style={s.sectionTitleH2}>{t("قادتنا","Our Leaders")}</h2>
          <p style={s.sectionTitleP}>{t("نكرم الأعضاء الذين حققوا إنجازات استثنائية.","Recognizing members who achieved exceptional milestones.")}</p>
        </div>
        <div style={s.leadersSlider}>
          {leaders.length === 0 ? (
            <p style={{color:"#7c7c86",textAlign:"center",width:"100%",padding:40}}>{t("لا يوجد قادة بعد","No leaders yet")}</p>
          ) : leaders.map((l, i) => (
            <div key={l.id || i} style={s.leaderCard}>
              <img src={l.avatar || img("ahmed.png")} alt="" style={s.leaderImg} />
              <h3 style={s.leaderName}>{l.name}</h3>
              <div style={{...s.rank,...rankColors[rankClassMap[l.rank] || "senior"]}}>{l.rank}</div>
            </div>
          ))}
        </div>
      </section>



      {/* Courses */}
      <section style={s.courses}>
        <div style={s.coursesHeader}>
          <span style={s.coursesHeaderSpan}>{t("كورسات مميزة","PREMIUM COURSES")}</span>
          <h2 style={s.coursesHeaderH2}>{t("ابن مستقبلك بـ","Build Your Future With")} <span style={s.coursesHeaderH2Span}>{t("المهارات الرقمية","Digital Skills")}</span></h2>
          <p style={s.coursesHeaderP}>{t("تعلم المهارات الأكثر ربحية عبر الإنترنت ببرامج تدريبية عملية عالية الجودة.","Learn the most profitable online skills with practical, premium-quality training programs.")}</p>
        </div>
        <div style={s.coursesGrid}>
          {courses.length === 0 ? (
            <p style={{color:c.textMuted,padding:20,fontSize:15}}>{t("لا توجد كورسات متاحة بعد.","No courses available yet.")}</p>
          ) : courses.map((course) => (
            <div key={course.id} style={s.courseCard}>
              <img src={course.featured_image || img("trading.png")} alt="" style={s.courseImage} onError={(e) => { e.target.src = img("trading.png"); }} />
              <h3 style={s.courseCardH3}>{course.title_ar || course.title}</h3>
              <p style={s.courseCardP}>{(course.description_ar || course.description || "").slice(0,80)}...</p>
              <div style={s.courseFooter}>
                <div>
                  <div style={{color:"#ffb800",fontSize:"0.85rem"}}>{course.avg_rating > 0 ? `⭐ ${course.avg_rating} (${course.review_count})` : "⭐⭐⭐⭐⭐"}</div>
                  <div style={{fontSize:"0.9rem",color:c.text,marginTop:3,fontWeight:700}}>{course.price} E-Money{course.price_egp > 0 ? ` / ${course.price_egp} ${t("ج.م","EGP")}` : ""}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <button onClick={() => setModal(course)} style={{flex:1,textAlign:"center",padding:m?"8px 6px":"10px 8px",borderRadius:12,fontSize:m?"0.72rem":"0.82rem",background:"transparent",color:c.text,border:`1px solid ${c.borderLight}`,cursor:"pointer",fontWeight:600,transition:"0.3s"}}>{t("معاينة","Preview")}</button>
                <Link to={`/courses/${course.id}`} style={{...s.courseBtn,flex:1,justifyContent:"center"}}>{t("اشترك ←","Enroll →")}</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rank Guide */}
      <section style={{ padding:"80px 5%",background:c.bg }}>
        <div style={{ maxWidth:1200,margin:"auto" }}>
          <div style={{ textAlign:"center",marginBottom:50 }}>
            <span style={{ display:"block",fontSize:"0.75rem",letterSpacing:3,color:c.textMuted,marginBottom:10 }}>{t("دليل الرتب","RANK GUIDE")}</span>
            <h2 style={{ fontSize:"clamp(1.8rem,4vw,3rem)",lineHeight:1.1,color:c.text,marginBottom:12 }}>{t("كيف تصل إلى","How To Reach")} <span style={{ position:"relative",color:c.text }}>{t("رتبتك التالية","Your Next Rank")}</span></h2>
            <p style={{ color:c.textSoft,lineHeight:1.7,maxWidth:600,margin:"auto" }}>{t("تعرف على متطلبات ومكافآت كل رتبة في إيفرست.","Learn the requirements and rewards for every Everest rank.")}</p>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:20 }}>
            {ranks.map((r, i) => {
              const dbRank = dbRanks.find(dr => dr.name === r.name);
              const imgSrc = dbRank?.image || `/RanksImages/${r.name}.jpeg`;
              const key = rankClassMap[r.name] || "senior";
              const colors = rankColors[key] || { color:"#fb923c", bg:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.18)" };
              return (
                <div key={i} style={{ background:c.bgCard,borderRadius:20,overflow:"hidden",boxShadow:c.shadow,transition:"0.35s",cursor:"default",border:`1px solid ${c.borderLight}` }}
                  onMouseEnter={e => e.currentTarget.style.transform="translateY(-6px)"}
                  onMouseLeave={e => e.currentTarget.style.transform="none"}>
                  <div style={{ width:"100%",background:`linear-gradient(135deg,${colors.bg},${c.bgCard})`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <img src={imgSrc} alt={r.name} style={{ width:"100%",display:"block" }}
                      onError={e => { e.target.style.display = "none" }} />
                  </div>
                  <div style={{ padding:"16px 20px 18px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                      <span style={{ fontSize:22 }}>{r.icon}</span>
                      <h3 style={{ fontSize:15,fontWeight:800,color:c.text,margin:0 }}>{r.name}</h3>
                    </div>
                    <p style={{ fontSize:13,color:c.textMuted,lineHeight:1.7,margin:0 }}>
                      <strong style={{ color:colors.color }}>{t("المتطلبات:","Requirement:")}</strong> {r.req}
                    </p>
                    <p style={{ fontSize:13,color:c.textMuted,lineHeight:1.7,margin:"4px 0 0" }}>
                      <strong style={{ color:colors.color }}>{t("المكافأة:","Reward:")}</strong> {r.reward}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="landing-page" style={{paddingTop:0,minHeight:"auto"}}>
      <footer className="footer">
        <div className="footer-middle" style={{direction:"ltr",display:"flex",justifyContent:"space-between",alignItems:"center",padding:m?"16px 20px":"18px 40px",borderBottom:"1px solid #eee"}}>
          <div className="social" style={{display:"flex",gap:16,justifyContent:"center",alignItems:"center"}}>
            <a href="#" style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#0088cc,#005f8f)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",textDecoration:"none",fontSize:20,transition:"transform .2s,box-shadow .2s",boxShadow:"0 4px 15px rgba(0,136,204,.4)"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px) scale(1.1)";e.currentTarget.style.boxShadow="0 8px 25px rgba(0,136,204,.6)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 15px rgba(0,136,204,.4)";}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
            <a href="#" style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#E1306C,#F77737,#FCAF45)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",textDecoration:"none",fontSize:20,transition:"transform .2s,box-shadow .2s",boxShadow:"0 4px 15px rgba(225,48,108,.4)"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px) scale(1.1)";e.currentTarget.style.boxShadow="0 8px 25px rgba(225,48,108,.6)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 15px rgba(225,48,108,.4)";}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="#fff" stroke="none"/></svg>
            </a>
            <a href="#" style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#010101,#333)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",textDecoration:"none",fontSize:20,transition:"transform .2s,box-shadow .2s",boxShadow:"0 4px 15px rgba(0,0,0,.4)"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px) scale(1.1)";e.currentTarget.style.boxShadow="0 8px 25px rgba(0,0,0,.6)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 15px rgba(0,0,0,.4)";}}>
              <svg width="20" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.89c.3 0 .59.04.86.12V9.01a6.28 6.28 0 00-.86-.06 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.86a8.21 8.21 0 004.86 1.56V6.97a4.84 4.84 0 01-1.1-.28z"/></svg>
            </a>
          </div>
          <div className="brand">
            <h3>E</h3>
            <span>{t("© 1999 - 2026 Everest Academy", "© 1999 - 2026 Everest Academy")}</span>
          </div>
        </div>
        <div className="footer-bottom" style={{textAlign:"center",display:"block",padding:"20px"}}>
          <CustomerServiceFooter />
        </div>
      </footer>

      {/* Disclaimer */}
      <section className="disclaimer">
        <div className="disclaimer-grid">
          <p><strong>{t("تداول بمسؤولية:", "Trade Responsibly:")}</strong> {t("تداول الأدوات المالية يحمل درجة عالية من المخاطرة...", "Trading financial instruments carry a high level...")}</p>
          <p>{t("Everest Academy هي علامة تجارية مسجلة تستخدم بموجب...", "Everest Academy is a registered trademark utilised under...")}</p>
          <p>{t("Everest Academy لا تقدم خدمات للمقيمين في...", "Everest Academy doesn't offer services to residents...")}</p>
        </div>
      </section>
      </div>

      {/* AI Chat */}
      <div className="ai-trigger" onClick={() => { setChatOpen(!chatOpen); if (!chatOpen) { if (!activeConvId && conversations.length > 0) setActiveConvId(conversations[0].id); if (conversations.length === 0) newChat(); } }}>
        <div className="ai-ring"></div>
        <div className="ai-core"><span>AI</span></div>
      </div>
      <div className={`ai-window ${chatOpen ? "open" : ""}`}>
        <div className="ai-header">
          <button className="ai-menu-btn" onClick={() => setChatSidebar(!chatSidebar)}>☰</button>
          <div className="ai-header-info">
            <div style={{textAlign:"center",flex:1}}>
              <h5>{activeConv?.title || t("مساعد إيفرست الذكي","Everest AI Assistant")}</h5>
              <span>{t("متصل الآن","Online now")}</span>
            </div>
          </div>
          <button className="ai-new-chat-btn" onClick={newChat}>+</button>
          <button className="ai-close" onClick={() => setChatOpen(false)}>
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        <div style={{display:"flex",flex:1,overflow:"hidden"}}>
          {chatSidebar && (
            <div className="ai-sidebar">
              <div className="ai-sidebar-header">
                {t("المحادثات","Conversations")}
              </div>
              {conversations.map(c => (
                <div key={c.id} className={`ai-sidebar-item ${c.id === activeConvId ? "active" : ""}`} onClick={() => { setActiveConvId(c.id); setChatSidebar(false); }}>
                  <span className="ai-sidebar-title">{c.title}</span>
                  <button className="ai-sidebar-del" onClick={(e) => deleteChat(e, c.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div style={{flex:1,display:"flex",flexDirection:"column"}}>
            <div className="ai-body" ref={chatRef}>
              {chatMsgs.length === 0 && (
                <div className="ai-welcome">
                  <div className="ai-welcome-avatar">🏔️</div>
                  <h4>{t("مرحباً بك!","Welcome!")}</h4>
                  <p>{t("أنا مساعد إيفرست الذكي. اسألني عن أي شيء!","I'm the Everest AI assistant. Ask me anything!")}</p>
                  <div className="ai-welcome-chips">
                    <div className="ai-welcome-chip" onClick={() => sendChat("ايه هي ايفرست؟")}>{t("ما هي إيفرست؟","What is Everest?")}</div>
                    <div className="ai-welcome-chip" onClick={() => sendChat("الكورسات")}>{t("الكورسات","Courses")}</div>
                    <div className="ai-welcome-chip" onClick={() => sendChat("نظام الرتب")}>{t("نظام الرتب","Ranks")}</div>
                    <div className="ai-welcome-chip" onClick={() => sendChat("طرق الدفع")}>{t("طرق الدفع","Payment")}</div>
                  </div>
                </div>
              )}
              {chatMsgs.map((m, i) => (
                <div key={i} className={`ai-bubble ${m.role === "user" ? "user" : "bot"}`}>{m.text}</div>
              ))}
              {chatLoading && <div className="ai-typing"><span></span><span></span><span></span></div>}
            </div>
            <div className="ai-footer">
              <div className="ai-input-wrap">
                <input type="text" placeholder={t("اكتب سؤالك هنا...","Type your question here...")} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
                <button className="ai-send" onClick={sendChat}>
                  <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <div onClick={() => setModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e => e.stopPropagation()} style={{background:c.bgCard,border:`1px solid ${c.borderLight}`,borderRadius:24,maxWidth:560,width:"100%",maxHeight:"85vh",overflow:"auto",position:"relative"}}>
            <button onClick={() => setModal(null)} style={{position:"absolute",top:16,left:16,background:c.bgInput,border:`1px solid ${c.borderLight}`,borderRadius:"50%",width:36,height:36,cursor:"pointer",fontSize:16,zIndex:2,color:c.text}}>✕</button>
            {modal.featured_image ? <img src={modal.featured_image} alt="" style={{width:"100%",height:220,objectFit:"cover",borderRadius:"24px 24px 0 0"}} /> : <div style={{width:"100%",height:220,background:"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"24px 24px 0 0",fontSize:64}}>🎓</div>}
            <div style={{padding:"24px"}}>
              <h2 style={{fontSize:"1.4rem",fontWeight:800,color:c.text,marginBottom:10}}>{modal.title_ar || modal.title}</h2>
              <p style={{fontSize:14,color:c.textMuted,lineHeight:1.8,marginBottom:16}}>{modal.description_ar || modal.description}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:20}}>
                <span style={{padding:"5px 14px",background:c.bgInput,borderRadius:999,fontSize:12,fontWeight:600,color:c.textMuted}}>
                  {modal.difficulty === "beginner" ? t("مبتدئ","Beginner") : modal.difficulty === "intermediate" ? t("متوسط","Intermediate") : t("متقدم","Advanced")}
                </span>
                {modal.review_count > 0 && <span style={{padding:"5px 14px",background:"rgba(245,158,11,.08)",borderRadius:999,fontSize:12,fontWeight:600,color:"#f59e0b"}}>⭐ {modal.avg_rating} ({modal.review_count})</span>}
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:20}}>
                {modal.price > 0 && <span style={{fontWeight:800,fontSize:16,color:"#d4af37"}}>{modal.price} E-Money</span>}
                {modal.price_egp > 0 && <span style={{fontWeight:700,fontSize:15,color:"#d4af37",opacity:.7}}>{modal.price_egp} {t("ج.م","EGP")}</span>}
              </div>
              <Link to={`/courses/${modal.id}`} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"14px 32px",background:"linear-gradient(135deg,#d4af37,#b8922a)",color:"#0a0a1a",fontWeight:800,fontSize:15,borderRadius:14,textDecoration:"none",transition:"0.3s"}}>
                {t("اشترك الآن","Enroll Now")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
