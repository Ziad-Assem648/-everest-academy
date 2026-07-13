import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { api } from "../App";
import { useTheme } from "../ThemeContext";
import CustomerServiceFooter from "../components/CustomerServiceFooter";

function getStyles(c) { return {
  hero: {
    position: "relative", minHeight: "100vh", overflow: "hidden"
  },
  heroVideo: {
    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover"
  },
  heroOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.75) 100%)",
    zIndex: 1
  },
  heroContent: {
    position: "relative", zIndex: 2, minHeight: "100vh",
    display: "flex", flexDirection: "column", justifyContent: "center",
    maxWidth: 700, padding: "0 8%"
  },
  heroSpan: {
    color: "#fff", letterSpacing: 4, fontSize: "0.8rem", fontWeight: 600, marginBottom: 20
  },
  heroH1: {
    color: "#fff", fontSize: "clamp(3rem, 7vw, 6.5rem)", lineHeight: 0.95,
    marginBottom: 25, fontWeight: 700
  },
  heroP: {
    color: "rgba(255,255,255,0.85)", fontSize: "1.05rem", lineHeight: 1.9, maxWidth: 550, marginBottom: 35
  },
  section: {
    padding: "80px 5%", background: c.bgSoft
  },
  header: {
    textAlign: "center", marginBottom: 60
  },
  headerSpan: {
    fontSize: "0.8rem", letterSpacing: "3px", color: "#888"
  },
  headerH2: {
    marginTop: 15, fontSize: "clamp(2rem, 4vw, 4rem)", color: c.text
  },
  grid: {
    maxWidth: 1200, margin: "auto", display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr", gap: 30
  },
  reviewsSide: {
    display: "flex", flexDirection: "column", gap: 20
  },
  reviewCard: {
    background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 24,
    padding: 24, transition: "0.3s", cursor: "default"
  },
  reviewUser: {
    display: "flex", alignItems: "center", gap: 14, marginBottom: 15
  },
  avatar: {
    width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0
  },
  avatarFallback: {
    width: 52, height: 52, borderRadius: "50%",
    background: "linear-gradient(135deg,#b38728,#e2c275)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, color: "#05030a", fontSize: 18, flexShrink: 0
  },
  userName: { margin: 0, color: c.text, fontSize: "1rem", fontWeight: 600 },
  userRole: { color: c.textMuted, fontSize: "0.85rem" },
  stars: { color: "#f4b400", marginBottom: 14, fontSize: "0.95rem" },
  reviewText: { color: c.textSoft, lineHeight: 1.8, margin: 0, fontSize: "0.95rem" },
  date: { color: "#aaa", fontSize: "0.75rem", marginTop: 8 },
  formCard: {
    background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 28,
    padding: 32, height: "fit-content"
  },
  formSpan: { fontSize: "0.8rem", letterSpacing: "2px", color: c.textMuted },
  formH3: { margin: "15px 0 25px", color: c.text, fontSize: "2rem", fontWeight: 700 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  input: {
    border: `1px solid ${c.border}`, borderRadius: 16, padding: 15,
    fontSize: "0.95rem", outline: "none", background: c.bgCard,
    color: c.text, fontFamily: "inherit"
  },
  textarea: {
    border: `1px solid ${c.border}`, borderRadius: 16, padding: 15,
    fontSize: "0.95rem", outline: "none", minHeight: 140,
    resize: "vertical", background: c.bgCard, color: c.text, fontFamily: "inherit"
  },
  submitBtn: {
    border: "none", background: "#111", color: "#fff", padding: 15,
    borderRadius: 16, fontWeight: 700, cursor: "pointer",
    transition: "0.3s", fontSize: "0.95rem"
  },
  pagination: { display: "flex", justifyContent: "center", gap: 8, marginTop: 24 },
  pageBtn: (active) => ({
    padding: "8px 16px", borderRadius: 12,
      border: active ? "none" : `1px solid ${c.border}`,
      cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
      background: active ? c.text : c.bgCard,
      color: active ? c.bg : c.text, transition: "0.2s"
  }),
  emptyMsg: { color: "#888", textAlign: "center", padding: 40, fontSize: "0.95rem" },
  errMsg: { color: "#e74c3c", fontSize: "0.85rem", margin: 0 },
  starBtn: (isActive) => ({
    background: "none", border: "none", fontSize: 24,
    cursor: "pointer", color: isActive ? "#f4b400" : "#ddd",
    padding: "2px 2px", transition: "0.15s"
  }),
  proofsSection: { padding: "80px 5%", background: c.bgCard },
  proofsSlider: {
    display: "flex", gap: 20, overflowX: "auto",
    padding: "0 0 20px", scrollBehavior: "smooth"
  },
  proofImg: {
    flex: "0 0 320px", height: 450, objectFit: "cover",
    borderRadius: 24, cursor: "pointer", transition: "0.4s"
  },
  statsSection: { padding: "80px 5%", background: c.bgSoft, textAlign: "center" },
  statsGrid: { maxWidth: 1200, margin: "auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 },
  statH3: {
    fontSize: "clamp(3rem, 6vw, 5rem)", fontWeight: 700, color: "#c79a3b",
    lineHeight: 1, marginBottom: 12
  },
  statP: { color: "#777", fontSize: "1rem" },
  footerTop: {
    background: "#000", color: "#fff", textAlign: "center", padding: "14px 10px", fontSize: 14
  },
  footerMid: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "18px 40px", borderBottom: `1px solid ${c.border}`, background: c.bgCard
  },
  footerBottom: {
    textAlign: "center", padding: "18px 20px", fontSize: 13, color: c.text, background: c.bgCard
  },
  disclaimerSection: {
    background: "#000", padding: "50px 5%"
  },
  disclaimerGrid: {
    maxWidth: 1400, margin: "auto", display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)", gap: 60
  },
  disclaimerP: {
    color: "#a9a9a9", fontSize: 15, lineHeight: 1.8
  }
}; }

const starRating = [1,2,3,4,5];

function Counter({ target, suffix }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let c = 0; const speed = Math.max(1, target / 80);
    const anim = () => {
      c += speed;
      if (c < target) { setCount(Math.floor(c)); requestAnimationFrame(anim); }
      else setCount(target);
    };
    anim();
  }, [target]);
  return <>{count.toLocaleString()}{suffix}</>;
}

export default function FeedbackPage() {
  const { t, dir } = useLang();
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [proofs, setProofs] = useState([]);
  const [modalImg, setModalImg] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const { colors: c } = useTheme();
  const styles = getStyles(c);

  useEffect(() => {
    api(`/api/feedbacks?page=${page}&limit=50`).then(data => {
      setFeedbacks(data.feedbacks); setPages(data.pages);
    }).catch(() => {});
    api("/api/proofs").then(setProofs).catch(() => {});
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [page]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { setErr(t("سجل دخول أولاً", "Login first")); return; }
    if (!message.trim()) { setErr(t("اكتب رأيك", "Write your feedback")); return; }
    setSending(true); setErr("");
    try {
      const fb = await api("/api/feedbacks", {
        method: "POST", body: JSON.stringify({ userId: user.id, message, rating })
      });
      setFeedbacks([fb, ...feedbacks]); setMessage(""); setRating(5);
    } catch (e) { setErr(e.message); }
    setSending(false);
  };

  return (
    <div style={{direction: dir, background: c.bg }}>
      {/* Hero */}
      <section style={styles.hero}>
        <video autoPlay muted loop playsInline style={styles.heroVideo}>
          <source src="/video/IMG_1492.mp4" type="video/mp4" />
        </video>
        <div style={styles.heroOverlay} />
        <div className="feedback-hero-content" style={styles.heroContent}>
          <span style={styles.heroSpan}>{t("قصص نجاح", "SUCCESS STORIES")}</span>
          <h1 style={styles.heroH1}>{t("قصص حقيقية.", "Real Stories.")}<br />{t("نتائج حقيقية.", "Real Results.")}</h1>
          <p style={styles.heroP}>{t("اكتشف كيف ساعدت أكاديمية إيفرست الأعضاء على تعلم مهارات جديدة وبناء شبكات أقوى وفتح فرص جديدة للنمو.", "Discover how Everest Academy has helped members learn new skills, build stronger networks and unlock new opportunities for growth.")}</p>
        </div>
      </section>

      {/* Feedback Section */}
      <section style={styles.section}>
        <div style={styles.header}>
          <span style={styles.headerSpan}>{t("ملاحظات المجتمع", "COMMUNITY FEEDBACK")}</span>
          <h2 style={styles.headerH2}>{t("موثوق من آلاف الأعضاء", "Trusted By Thousands Of Members")}</h2>
        </div>
        <div className="feedback-page-grid" style={styles.grid}>
          <div style={styles.reviewsSide}>
            {feedbacks.length === 0 && (
              <p style={styles.emptyMsg}>{t("لا توجد تقييمات بعد. كن أول من يقيم!", "No feedbacks yet. Be the first to review!")}</p>
            )}
            {feedbacks.map((fb) => (
              <div key={fb.id} style={styles.reviewCard}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={styles.reviewUser}>
                  {fb.avatar ? (
                    <img src={fb.avatar} alt="" style={styles.avatar} />
                  ) : (
                    <div style={styles.avatarFallback}>{(fb.full_name || "?")[0]}</div>
                  )}
                  <div>
                    <h4 style={styles.userName}>{fb.full_name || t("مستخدم", "User")}</h4>
                    <span style={styles.userRole}>{t("طالب", "Student")}</span>
                  </div>
                </div>
                <div style={styles.stars}>{"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}</div>
                <p style={styles.reviewText}>{fb.message}</p>
                <p style={styles.date}>{fb.created_at?.slice(0,10)}</p>
              </div>
            ))}
            {pages > 1 && (
              <div style={styles.pagination}>
                {Array.from({length:pages},(_,i)=>i+1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={styles.pageBtn(p === page)}>{p}</button>
                ))}
              </div>
            )}
          </div>
          <div className="feedback-page-form" style={styles.formCard}>
            <span style={styles.formSpan}>{t("شارك تجربتك", "SHARE YOUR EXPERIENCE")}</span>
            <h3 style={styles.formH3}>{t("اترك تقييم", "Leave A Review")}</h3>
            <form onSubmit={submit} style={styles.form}>
              <input style={styles.input} disabled value={user?.full_name || ""} placeholder={t("اسمك", "Your Name")} />
              <textarea style={styles.textarea} value={message} onChange={e => setMessage(e.target.value)} placeholder={t("اكتب رأيك...", "Write your feedback...")} />
              <div style={{display:"flex",gap:2,marginBottom:4}}>
                {starRating.map(s => (
                  <button key={s} type="button" onClick={() => setRating(s)} style={styles.starBtn(s <= rating)}>★</button>
                ))}
              </div>
              {err && <p style={styles.errMsg}>{err}</p>}
              <button type="submit" disabled={sending} style={{...styles.submitBtn, opacity: sending ? 0.6 : 1}}>
                {sending ? t("جاري الإرسال...", "Sending...") : t("إرسال التقييم", "Submit Review")}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Success Proofs */}
      {proofs.length > 0 && (
        <section style={styles.proofsSection}>
          <div style={styles.header}>
            <span style={styles.headerSpan}>{t("إثباتات النجاح", "SUCCESS PROOFS")}</span>
            <h2 style={styles.headerH2}>{t("إنجازات المجتمع", "Community Achievements")}</h2>
            <p style={{color:c.textSoft,maxWidth:650,margin:"15px auto 0",lineHeight:1.8,fontSize:"0.95rem"}}>
              {t("صور حقيقية يشاركها أعضاؤنا لعرض إنجازاتهم ونموهم.", "Real screenshots shared by our members showcasing their achievements and growth.")}
            </p>
          </div>
          <div style={{...styles.proofsSlider, scrollbarWidth:"thin", scrollbarColor:"#ddd transparent"}}>
            {proofs.map(p => (
              <img key={p.id} src={p.image} alt={p.caption || ""}
                className="feedback-proof-img" style={styles.proofImg}
                onClick={() => setModalImg(p.image)}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-8px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; }} />
            ))}
          </div>
        </section>
      )}

      {/* Image Modal */}
      {modalImg && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",justifyContent:"center",alignItems:"center",zIndex:99999,padding:20}}
          onClick={() => setModalImg(null)}>
          <img src={modalImg} style={{maxWidth:"90%",maxHeight:"90vh",borderRadius:20}} />
        </div>
      )}

      {/* Stats */}
      <section style={styles.statsSection}>
        <div className="feedback-stats-header" style={{marginBottom:70}}>
          <span style={{...styles.headerSpan, color:"#b88a2f",fontWeight:600}}>{t("مجتمعنا", "OUR COMMUNITY")}</span>
          <h2 style={{...styles.headerH2, fontSize:50,fontWeight:600,marginTop:15}}>{t("ننمو معاً ونحقق المزيد", "Growing Together, Achieving More")}</h2>
        </div>
        <div className="feedback-stats-grid" style={styles.statsGrid}>
          {[
            { target: 500000, label: t("عضو نشط", "Active Members") },
            { target: 4, label: t("كورس احترافي", "Premium Courses") },
            { target: 10, label: t("مستوى رتبة", "Rank Levels") },
            { target: 95, label: t("نسبة رضا", "Satisfaction Rate"), suffix: "%" }
          ].map((s, i) => (
            <div key={i} style={{position:"relative"}}>
              {i < 3 && <div style={{position:"absolute",right:"-10px",top:"50%",transform:"translateY(-50%)",width:1,height:70,background:"rgba(184,138,47,0.25)"}} />}
              <h3 style={styles.statH3}><Counter target={s.target} suffix={s.suffix || ""} /></h3>
              <p style={styles.statP}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div style={styles.footerTop}>
        {t("تحتاج مساعدة؟ زر قسم", "Need Help? Visit our")} <a href="#" style={{color:"#fff"}}>{t("المساعدة", "Help Section")}</a>
      </div>
      <div className="feedback-footer-mid" style={styles.footerMid}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <h3 style={{fontSize:20}}>F</h3>
          <span style={{fontSize:13,color:c.text}}>© 1999 - 2026 Everest Academy</span>
        </div>
        <div style={{display:"flex",gap:18}}>
          {["f","in","▶","✈","𝕏","◎"].map((s,i) => (
            <a key={i} href="#" style={{textDecoration:"none",color:"#495ee9",fontSize:25}}>{s}</a>
          ))}
        </div>
      </div>
      <div style={styles.footerBottom}>
        <CustomerServiceFooter />
      </div>

      {/* Disclaimer */}
      <section style={styles.disclaimerSection}>
        <div className="feedback-disclaimer-grid" style={styles.disclaimerGrid}>
          <p style={styles.disclaimerP}><strong style={{color:"#fff"}}>{t("تداول بمسؤولية:", "Trade Responsibly:")}</strong> {t("تداول الأدوات المالية ينطوي على مستوى عالٍ من المخاطرة.", "Trading financial instruments carry a high level of risk.")}</p>
          <p style={styles.disclaimerP}>{t("Everest Academy هي علامة تجارية مسجلة تستخدم بموجب...", "Everest Academy is a registered trademark utilised under...")}</p>
          <p style={styles.disclaimerP}>{t("Everest Academy لا تقدم خدمات للمقيمين في...", "Everest Academy doesn't offer services to residents...")}</p>
        </div>
      </section>
    </div>
  );
}
