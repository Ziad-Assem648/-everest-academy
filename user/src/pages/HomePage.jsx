import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { api } from "../App";
import AppNavbar from "../components/AppNavbar";
import CustomerServiceFooter from "../components/CustomerServiceFooter";
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
  { icon: "⭐", name: "Star", req: "2 ينضمو من خلال الكود بتاعك", reqEn: "2 joins through your referral code", reward: "دخول المجتمع والتقدير", rewardEn: "Community access & recognition." },
  { icon: "🚀", name: "Executive", req: "5 مبيعات الفريق", reqEn: "5 Team Sales.", reward: "مكافأة 1,500 جنيه", rewardEn: "1,500 EGP Bonus." },
  { icon: "💎", name: "Executive Star", req: "10 مبيعات الفريق", reqEn: "10 Team Sales.", reward: "مكافأة 3,000 جنيه", rewardEn: "3,000 EGP Bonus." },
  { icon: "👑", name: "Team Leader", req: "20 مبيعات الفريق", reqEn: "20 Team Sales.", reward: "مكافأة 5,000 جنيه", rewardEn: "5,000 EGP Bonus." },
  { icon: "🏆", name: "Senior Leader", req: "40 مبيعات الفريق", reqEn: "40 Team Sales.", reward: "مكافأة 8,000 جنيه", rewardEn: "8,000 EGP Bonus." },
  { icon: "🌍", name: "Regional Leader", req: "70 مبيعات الفريق", reqEn: "70 Team Sales.", reward: "مكافأة 12,000 جنيه", rewardEn: "12,000 EGP Bonus." },
  { icon: "⚡", name: "Everest Elite", req: "120 مبيعات الفريق", reqEn: "120 Team Sales.", reward: "مكافأة 18,000 جنيه", rewardEn: "18,000 EGP Bonus." },
  { icon: "🔱", name: "Everest Master", req: "200 مبيعات الفريق", reqEn: "200 Team Sales.", reward: "مكافأة 28,000 جنيه", rewardEn: "28,000 EGP Bonus." },
  { icon: "🔥", name: "Everest Legend", req: "350 مبيعات الفريق", reqEn: "350 Team Sales.", reward: "مكافأة 45,000 جنيه", rewardEn: "45,000 EGP Bonus." },
  { icon: "🌟", name: "Everest Ambassador", req: "600 مبيعات الفريق", reqEn: "600 Team Sales.", reward: "مكافأة 75,000 جنيه", rewardEn: "75,000 EGP Bonus." },
];

const rankClassMap = {
  "Everest Ambassador":"ambassador","Everest Legend":"legend","Everest Master":"master",
  "Everest Elite":"elite","Regional Leader":"regional","Senior Leader":"senior",
  "Executive Star":"elite","Executive":"senior","Team Leader":"senior"
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
  const { t, lang, dir } = useLang();
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
    api("/api/leaders").then(setLeaders).catch(() => {});
    api("/api/ranks").then((d) => Array.isArray(d) ? setDbRanks(d) : null).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); nav("/login"); };

  return (
      <div style={{background:c.bg,minHeight:"100vh",direction:dir}}>
      <AppNavbar />

      {/* Hero */}
      <section style={{...s.hero,marginBottom:25}}>
        <div style={s.heroContent}>
          <span style={s.heroBadge}>{t("👋 مرحباً بعودتك","👋 Welcome Back")}{user ? `, ${user.full_name?.split(" ")[0]}` : ""}</span>
          <h1 style={s.heroH1}>{t("اكمل","Continue Your")} <br />{t("رحلتك إلى","Journey To The")} <br /><span style={s.heroH1Span}>{t("الرتبة التالية","Next Rank")}</span></h1>
          <p style={s.heroP}>{t("أكمل المهام، افتح رتباً جديدة، تعلم من كورسات احترافية وكن واحداً من قادة أكاديمية إيفرست.","Complete missions, unlock new ranks, learn from premium courses and become one of Everest Academy leaders.")}</p>
          <div style={s.heroButtons}>
            <Link to="/courses" style={s.btnPrimary}>{t("مواصلة التعلم","Continue Learning")} <i className="fa-solid fa-arrow-right"></i></Link>
          </div>
        </div>
        <div style={s.heroImage}>
            <img src="/images/Screenshot_2026-06-28_145125-removebg-preview.png" alt="Hero" style={s.heroImg} />
        </div>
      </section>

      {/* Leaders */}
      <section style={{ position:"relative",overflow:"hidden",padding:m?"60px 16px 50px":"100px 5% 80px",background: c.sectionBg === "#0d0d14" || c.sectionBg === "#0b0b0f" ? "linear-gradient(180deg,#06060f 0%,#0c0c1d 40%,#111128 70%,#0a0a18 100%)" : "linear-gradient(180deg,#f8f6f0 0%,#f0ece2 40%,#e8e2d6 70%,#f5f1ea 100%)",color:c.text }}>
        {/* BG decorations */}
        <div style={{ position:"absolute",top:"-120px",right:"-80px",width:400,height:400,borderRadius:"50%",background: c.sectionBg === "#0d0d14" || c.sectionBg === "#0b0b0f" ? "radial-gradient(circle,rgba(212,175,55,.08) 0%,transparent 70%)" : "radial-gradient(circle,rgba(212,175,55,.12) 0%,transparent 70%)",filter:"blur(40px)",pointerEvents:"none" }}></div>
        <div style={{ position:"absolute",bottom:"-100px",left:"-60px",width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,.06) 0%,transparent 70%)",filter:"blur(40px)",pointerEvents:"none" }}></div>
        <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,175,55,.03) 0%,transparent 60%)",filter:"blur(60px)",pointerEvents:"none" }}></div>

        {/* Theme-dependent colors */}
        {(() => {
          const isDark = c.sectionBg === "#0d0d14" || c.sectionBg === "#0b0b0f";
          const hc = isDark ? "#fff" : "#1a1a2e";
          const hcSoft = isDark ? "#e0e0e0" : "#333";
          const hcMuted = isDark ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.45)";
          const hcardBg = isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.04)";
          const hcardBorder = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.08)";
          const hcardHoverBg = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.07)";
          const hcardHoverBorder = isDark ? "rgba(212,175,55,.15)" : "rgba(212,175,55,.25)";
          const havatarBorder = isDark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)";
          const hnumBg = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
          const hnumBorder = isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.12)";
          const hnumColor = isDark ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.5)";
          const podiumBg = isDark ? "#1a1a2e" : "#e8e2d6";
          const podiumSilver = isDark ? "rgba(192,192,192,.12)" : "rgba(150,150,150,.1)";
          const podiumSilverBorder = isDark ? "rgba(192,192,192,.1)" : "rgba(150,150,150,.12)";
          const podiumBronze = isDark ? "rgba(205,127,50,.1)" : "rgba(160,82,45,.08)";
          const podiumBronzeBorder = isDark ? "rgba(205,127,50,.1)" : "rgba(160,82,45,.1)";
          const podiumGold = isDark ? "rgba(212,175,55,.15)" : "rgba(212,175,55,.1)";
          const podiumGoldBorder = isDark ? "rgba(212,175,55,.15)" : "rgba(212,175,55,.2)";
          const rankBadgeBg = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)";
          const rankBadgeColor = isDark ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.5)";
          const silverText = isDark ? "#c0c0c0" : "#888";
          const bronzeText = isDark ? "#cd7f32" : "#a0522d";
          return (<>
            <div style={{ position:"relative",zIndex:2,maxWidth:1100,margin:"auto" }}>
              {/* Header */}
              <div style={{ textAlign:"center",marginBottom:m?36:56 }}>
                <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"8px 20px",borderRadius:999,background:"rgba(212,175,55,.06)",border:"1px solid rgba(212,175,55,.15)",marginBottom:m?14:20 }}>
                  <span style={{ fontSize:m?12:14,letterSpacing:3,color:"#d4af37",fontWeight:700 }}>{t("أفضل المنجزين","TOP ACHIEVERS")}</span>
                </div>
                <h2 style={{ fontSize:m?"1.7rem":"clamp(2rem,4.5vw,3.5rem)",fontWeight:900,margin:"0 0 12px",lineHeight:1.15 }}>
                  <span style={{ color:hc }}>{t("قادتنا","Our")}</span>{" "}
                  <span style={{ background:"linear-gradient(135deg,#d4af37,#f5d98a,#d4af37)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>{t("المتميزون","Leaders")}</span>
                </h2>
                <p style={{ color:hcMuted,fontSize:m?13:16,maxWidth:480,margin:"auto",lineHeight:1.7 }}>{t("نكرم الأعضاء الذين حققوا إنجازات استثنائية وقادوا فرقهم نحو النجاح.","Recognizing members who achieved exceptional milestones and led their teams to success.")}</p>
              </div>

              {leaders.length === 0 ? (
                <p style={{ color:hcMuted,textAlign:"center",padding:50,fontSize:15 }}>{t("لا يوجد قادة بعد","No leaders yet")}</p>
              ) : (
                <>
                  {/* Top 3 Podium */}
                  {leaders.length >= 1 && (
                    <div style={{ display:"flex",justifyContent:"center",alignItems:"flex-end",gap:m?10:20,marginBottom:m?36:50,paddingTop:m?10:20 }}>
                      {/* 2nd place (left) */}
                      {leaders[1] && (
                        <div style={{ flex:"0 0 auto",textAlign:"center",order:m?1:0,animation:"leaderFloat 3s ease-in-out infinite",animationDelay:"0.5s" }}>
                          <div style={{ position:"relative",width:m?90:130,height:m?90:130,margin:"0 auto 10px" }}>
                            <div style={{ position:"absolute",inset:-4,borderRadius:"50%",background:"linear-gradient(135deg,#c0c0c0,#8a8a8a,#c0c0c0)",padding:3 }}>
                              <div style={{ width:"100%",height:"100%",borderRadius:"50%",overflow:"hidden",background:podiumBg,display:"flex",alignItems:"center",justifyContent:"center" }}>
                                {leaders[1].avatar?.trim() ? (
                                  <img src={leaders[1].avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                                ) : (
                                  <span style={{ fontSize:m?28:42,fontWeight:900,color:silverText }}>{(leaders[1].name||"U")[0]}</span>
                                )}
                              </div>
                            </div>
                            <div style={{ position:"absolute",bottom:-8,left:"50%",transform:"translateX(-50%)",width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#c0c0c0,#999)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:podiumBg,border:`2px solid ${c.sectionBg}` }}>2</div>
                          </div>
                          <h4 style={{ fontSize:m?12:14,fontWeight:700,color:hcSoft,margin:"12px 0 4px",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{leaders[1].name}</h4>
                          <span style={{ fontSize:10,color:silverText,letterSpacing:1 }}>{leaders[1].icon || "🏆"} {leaders[1].rank}</span>
                          <div style={{ width:m?80:110,height:m?40:60,margin:"8px auto 0",borderRadius:"10px 10px 0 0",background:podiumSilver,border:`1px solid ${podiumSilverBorder}`,borderBottom:"none" }}></div>
                        </div>
                      )}

                      {/* 1st place (center) */}
                      <div style={{ flex:"0 0 auto",textAlign:"center",order:m?0:-1,animation:"leaderFloat 3s ease-in-out infinite",animationDelay:"0s",marginTop:m?0:-20 }}>
                        <div style={{ fontSize:m?24:36,marginBottom:-6,filter:"drop-shadow(0 4px 12px rgba(212,175,55,.4))" }}>👑</div>
                        <div style={{ position:"relative",width:m?110:160,height:m?110:160,margin:"0 auto 12px" }}>
                          <div style={{ position:"absolute",inset:-6,borderRadius:"50%",background:"linear-gradient(135deg,#d4af37,#f5d98a,#d4af37,#b8922a)",padding:4,animation:"leaderGlow 2s ease-in-out infinite" }}>
                            <div style={{ width:"100%",height:"100%",borderRadius:"50%",overflow:"hidden",background:podiumBg,display:"flex",alignItems:"center",justifyContent:"center" }}>
                              {leaders[0].avatar?.trim() ? (
                                <img src={leaders[0].avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                              ) : (
                                <span style={{ fontSize:m?36:52,fontWeight:900,color:"#d4af37" }}>{(leaders[0].name||"U")[0]}</span>
                              )}
                            </div>
                          </div>
                          <div style={{ position:"absolute",bottom:-6,left:"50%",transform:"translateX(-50%)",width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#d4af37,#f5d98a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#0a0a18",border:"3px solid #0c0c1d",boxShadow:"0 0 16px rgba(212,175,55,.4)" }}>1</div>
                        </div>
                        <h4 style={{ fontSize:m?14:17,fontWeight:800,color:hc,margin:"14px 0 4px",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{leaders[0].name}</h4>
                        <span style={{ fontSize:m?11:13,color:"#d4af37",fontWeight:700,letterSpacing:1 }}>{leaders[0].icon || "🏆"} {leaders[0].rank}</span>
                        <div style={{ width:m?100:130,height:m?60:85,margin:"10px auto 0",borderRadius:"12px 12px 0 0",background:podiumGold,border:`1px solid ${podiumGoldBorder}`,borderBottom:"none" }}></div>
                      </div>

                      {/* 3rd place (right) */}
                      {leaders[2] && (
                        <div style={{ flex:"0 0 auto",textAlign:"center",order:m?2:2,animation:"leaderFloat 3s ease-in-out infinite",animationDelay:"1s" }}>
                          <div style={{ position:"relative",width:m?80:120,height:m?80:120,margin:"0 auto 10px" }}>
                            <div style={{ position:"absolute",inset:-3,borderRadius:"50%",background:"linear-gradient(135deg,#cd7f32,#a0522d,#cd7f32)",padding:3 }}>
                              <div style={{ width:"100%",height:"100%",borderRadius:"50%",overflow:"hidden",background:podiumBg,display:"flex",alignItems:"center",justifyContent:"center" }}>
                                {leaders[2].avatar?.trim() ? (
                                  <img src={leaders[2].avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                                ) : (
                                  <span style={{ fontSize:m?24:38,fontWeight:900,color:bronzeText }}>{(leaders[2].name||"U")[0]}</span>
                                )}
                              </div>
                            </div>
                            <div style={{ position:"absolute",bottom:-6,left:"50%",transform:"translateX(-50%)",width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#cd7f32,#a0522d)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:podiumBg,border:`2px solid ${c.sectionBg}` }}>3</div>
                          </div>
                          <h4 style={{ fontSize:m?11:13,fontWeight:700,color:hcSoft,margin:"10px 0 4px",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{leaders[2].name}</h4>
                          <span style={{ fontSize:10,color:bronzeText,letterSpacing:1 }}>{leaders[2].icon || "🏆"} {leaders[2].rank}</span>
                          <div style={{ width:m?70:100,height:m?28:45,margin:"6px auto 0",borderRadius:"10px 10px 0 0",background:podiumBronze,border:`1px solid ${podiumBronzeBorder}`,borderBottom:"none" }}></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Remaining leaders (4+) */}
                  {leaders.length > 3 && (
                    <div style={{ display:"flex",gap:m?10:16,overflowX:"auto",scrollbarWidth:"none",padding:"10px 4px 20px",scrollSnapType:"x mandatory",justifyContent:leaders.length <= 5 ? "center" : "flex-start" }}>
                      {leaders.slice(3).map((l, idx) => (
                        <div key={l.id || idx} style={{ flex:"0 0 auto",scrollSnapAlign:"start",width:m?130:170,padding:m?12:18,textAlign:"center",borderRadius:20,background:hcardBg,border:`1px solid ${hcardBorder}`,backdropFilter:"blur(8px)",transition:"0.3s",cursor:"default" }}
                          onMouseEnter={e => { e.currentTarget.style.background=hcardHoverBg; e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.border=`1px solid ${hcardHoverBorder}`; }}
                          onMouseLeave={e => { e.currentTarget.style.background=hcardBg; e.currentTarget.style.transform="none"; e.currentTarget.style.border=`1px solid ${hcardBorder}`; }}>
                          <div style={{ position:"relative",width:m?52:68,height:m?52:68,margin:"0 auto 10px" }}>
                            <div style={{ width:"100%",height:"100%",borderRadius:"50%",overflow:"hidden",border:`2px solid ${havatarBorder}`,background:podiumBg,display:"flex",alignItems:"center",justifyContent:"center" }}>
                              {l.avatar?.trim() ? (
                                <img src={l.avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                              ) : (
                                <span style={{ fontSize:m?20:28,fontWeight:800,color:hnumColor }}>{(l.name||"U")[0]}</span>
                              )}
                            </div>
                            <div style={{ position:"absolute",top:-2,right:-2,width:22,height:22,borderRadius:"50%",background:hnumBg,border:`1px solid ${hnumBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:hnumColor }}>#{idx+4}</div>
                          </div>
                          <h4 style={{ fontSize:m?11:13,fontWeight:600,color:hcSoft,margin:"0 0 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{l.name}</h4>
                          <span style={{ display:"inline-block",padding:"3px 10px",borderRadius:999,fontSize:m?9:10,fontWeight:600,background:rankBadgeBg,color:rankBadgeColor }}>{l.icon || "🏆"} {l.rank}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>);
        })()}

        <style>{`
          @keyframes leaderFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
          @keyframes leaderGlow{0%,100%{box-shadow:0 0 20px rgba(212,175,55,.3)}50%{box-shadow:0 0 40px rgba(212,175,55,.6),0 0 80px rgba(212,175,55,.2)}}
        `}</style>
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
              <img src={course.featured_image || "/images/trading.png"} alt="" style={s.courseImage} onError={(e) => { e.target.src = "/images/trading.png"; }} />
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
          <div style={{ display:"grid",gridTemplateColumns:m?"1fr":"repeat(auto-fill,minmax(320px,1fr))",gap:20, ...(m ? {display:"flex",overflowX:"auto",scrollSnapType:"x mandatory",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none",paddingBottom:8} : {}) }}>
            {ranks.map((r, i) => {
              const dbRank = dbRanks.find(dr => dr.name === r.name);
              const imgSrc = dbRank?.image || `/RanksImages/${r.name}.jpeg`;
              const key = rankClassMap[r.name] || "senior";
              const colors = rankColors[key] || { color:"#fb923c", bg:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.18)" };
              return (
                <div key={i} style={{ background:c.bgCard,borderRadius:20,overflow:"hidden",boxShadow:c.shadow,transition:"0.35s",cursor:"default",border:`1px solid ${c.borderLight}`,flex:"0 0 280px",scrollSnapAlign:"start",...(m ? {} : {}) }}
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
                      <strong style={{ color:colors.color }}>{t("المتطلبات:","Requirement:")}</strong> {lang === "ar" ? r.req : r.reqEn}
                    </p>
                    <p style={{ fontSize:13,color:c.textMuted,lineHeight:1.7,margin:"4px 0 0" }}>
                      <strong style={{ color:colors.color }}>{t("المكافأة:","Reward:")}</strong> {lang === "ar" ? r.reward : r.rewardEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <FooterSection />

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
                <label style={{flexShrink:0,width:42,height:42,borderRadius:14,background:"rgba(212,175,55,.08)",border:"1px solid rgba(212,175,55,.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .3s"}}>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const b64 = reader.result.split(",")[1];
                      setChatInput(prev => prev ? prev : `[${t("مرفق","Attachment")}: ${file.name}]`);
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }} />
                  <svg viewBox="0 0 24 24" style={{width:20,height:20,fill:"none",stroke:"#d4af37","strokeWidth":2,"strokeLinecap":"round","strokeLinejoin":"round"}}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                </label>
                <input type="text" placeholder={t("اكتب سؤالك هنا...","Type your question here...")} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
                <button className="ai-send" onClick={() => sendChat()}>
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
