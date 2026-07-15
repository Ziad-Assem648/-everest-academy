import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

const rankIcons = ["⭐", "🚀", "💎", "🏆", "🌍", "⚡", "🔱", "🔥", "🌟", "👑"];

const rankKeyframes = `
@keyframes rkFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(5deg)} }
@keyframes rkFloat2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-15px) rotate(-4deg)} }
@keyframes rkPulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.8;transform:scale(1.05)} }
@keyframes rkSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes rkSpinReverse { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
@keyframes rkOrbit { from{transform:rotate(0deg) translateX(140px) rotate(0deg)} to{transform:rotate(360deg) translateX(140px) rotate(-360deg)} }
@keyframes rkSlideUp { from{opacity:0;transform:translateY(50px)} to{opacity:1;transform:translateY(0)} }
@keyframes rkGradientFlow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes rkRotate3d { from{transform:perspective(800px) rotateY(-20deg) rotateX(10deg)} to{transform:perspective(800px) rotateY(20deg) rotateX(-10deg)} }
@keyframes rkProgressGlow { 0%,100%{box-shadow:0 0 8px rgba(212,175,55,.4)} 50%{box-shadow:0 0 25px rgba(212,175,55,.8)} }
`;

const salesReq = (r) => r.sales_required !== undefined ? r.sales_required : r.min_direct;
const bonusVal = (r) => r.bonus !== undefined ? r.bonus : r.weekly_bonus;

export default function RankingsPage() {
  const { t, dir } = useLang();
  const { user } = useAuth();
  const { colors: c } = useTheme();
  const m = useIsMobile();
  const [progress, setProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [tab, setTab] = useState("ranks");

  useEffect(() => {
    if (!user?.id) return;
    api("/api/ranks/update", { method: "POST" }).then(() => {
      api(`/api/ranks/progress/${user.id}`).then(setProgress).catch(() => {});
    }).catch(() => {
      api(`/api/ranks/progress/${user.id}`).then(setProgress).catch(() => {});
    });
    api("/api/ranks/leaderboard").then(setLeaderboard).catch(() => {});
    api("/api/ranks").then((d) => Array.isArray(d) ? setRanks(d) : setRanks([])).catch(() => {});
  }, [user?.id]);

  const currentRankName = progress?.currentRank || user?.rank || null;
  const userRankIndex = currentRankName ? ranks.findIndex(r => r.name === currentRankName) : -1;
  const nextRankName = progress?.nextRank;
  const nextRankData = ranks.find(r => r.name === nextRankName);
  const userSales = progress?.totalTeamSales ?? 0;
  const progressPct = progress?.progress ?? 0;
  const nextSalesReq = nextRankData ? (salesReq(nextRankData) || 40) : 40;

  const gold = "#d4af37";

  return (
    <div style={{direction: dir, background: c.bg, minHeight:"100vh" }}>
      <AppNavbar />

      <style>{rankKeyframes + `
        .rk-hero{position:relative;min-height:92vh;display:flex;align-items:center;overflow:hidden;margin-top:0}
        .rk-hero-bg{position:absolute;inset:0;background:linear-gradient(135deg,#0a0a1a 0%,#1a0a2e 25%,#0a1628 50%,#15102a 75%,#0f0f13 100%)}
        .rk-hero-bg::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 30%,rgba(212,175,55,.12) 0%,transparent 50%),radial-gradient(circle at 70% 70%,rgba(139,92,246,.08) 0%,transparent 50%);animation:rkPulse 6s ease-in-out infinite}
        .rk-hero-bg::after{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(212,175,55,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,.02) 1px,transparent 1px);background-size:50px 50px}
        .rk-orb{position:absolute;border-radius:50%;filter:blur(70px);animation:rkFloat 8s ease-in-out infinite}
        .rk-orb-1{width:350px;height:350px;background:rgba(212,175,55,.1);top:-80px;right:-50px}
        .rk-orb-2{width:280px;height:280px;background:rgba(139,92,246,.08);bottom:-60px;left:-40px;animation-delay:2s}
        .rk-orb-3{width:180px;height:180px;background:rgba(59,130,246,.06);top:40%;left:15%;animation-delay:4s}
        .rk-hero-inner{position:relative;z-index:2;width:95%;max-width:1300px;margin:0 auto;padding:40px;display:flex;align-items:center;justify-content:space-between;gap:50px}
        .rk-hero-left{flex:1;max-width:650px;animation:rkSlideUp 1s ease-out}
        .rk-hero-left h1{font-size:clamp(2.2rem,5vw,3.8rem);font-weight:900;line-height:1.1;margin-bottom:16px;color:#fff}
        .rk-hero-left h1 span{background:linear-gradient(135deg,#d4af37 0%,#f0d78c 50%,#d4af37 100%);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:rkGradientFlow 3s ease infinite}
        .rk-hero-left p{font-size:1rem;color:#9a9aae;line-height:1.8;margin-bottom:28px;max-width:480px}
        .rk-hero-btns{display:flex;gap:14px;margin-bottom:30px}
        .rk-hero-btn-primary{height:50px;padding:0 28px;border-radius:14px;background:linear-gradient(135deg,#d4af37,#b8922a);color:#0a0a1a;text-decoration:none;display:flex;align-items:center;gap:10px;font-size:14px;font-weight:700;border:none;cursor:pointer;transition:.3s;box-shadow:0 8px 25px rgba(212,175,55,.3)}
        .rk-hero-btn-primary:hover{transform:translateY(-3px);box-shadow:0 12px 35px rgba(212,175,55,.5)}
        .rk-hero-right{flex:1;display:flex;justify-content:center;align-items:center;position:relative;animation:rkSlideUp 1s ease-out .2s both}
        .rk-trophy-wrap{position:relative;width:280px;height:280px}
        .rk-trophy-ring{position:absolute;inset:-20px;border:1.5px dashed rgba(212,175,55,.15);border-radius:50%;animation:rkSpin 20s linear infinite}
        .rk-trophy-ring2{position:absolute;inset:-50px;border:1px dashed rgba(139,92,246,.1);border-radius:50%;animation:rkSpinReverse 30s linear infinite}
        .rk-orbit-dot{position:absolute;width:10px;height:10px;background:#d4af37;border-radius:50%;box-shadow:0 0 12px rgba(212,175,55,.6);animation:rkOrbit 10s linear infinite;top:50%;left:50%;margin:-5px}
        .rk-orbit-dot2{position:absolute;width:7px;height:7px;background:#a855f7;border-radius:50%;box-shadow:0 0 10px rgba(168,85,247,.5);animation:rkOrbit 14s linear infinite reverse;top:50%;left:50%;margin:-3.5px}
        .rk-trophy-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;animation:rkRotate3d 10s ease-in-out infinite}
        .rk-trophy-emoji{font-size:90px;filter:drop-shadow(0 15px 40px rgba(212,175,55,.3));animation:rkFloat2 5s ease-in-out infinite}
        .rk-trophy-label{font-size:.75rem;color:#d4af37;font-weight:700;letter-spacing:3px;margin-top:8px;text-transform:uppercase}
        .rk-3d-cube{position:absolute;border:1.5px solid rgba(212,175,55,.12);border-radius:10px;animation:rkRotate3d 12s linear infinite;pointer-events:none}
        .rk-3d-cube:nth-child(1){width:50px;height:50px;top:10%;right:5%;animation-delay:0s}
        .rk-3d-cube:nth-child(2){width:35px;height:35px;bottom:15%;left:8%;animation-delay:3s;animation-duration:15s;border-color:rgba(139,92,246,.12)}
        .rk-3d-cube:nth-child(3){width:25px;height:25px;top:20%;left:5%;animation-delay:6s;animation-duration:18s;border-color:rgba(59,130,246,.1)}
        .rk-stat-row{display:flex;gap:16px;margin-top:5px}
        .rk-stat-pill{display:flex;align-items:center;gap:8px;padding:10px 18px;background:${c.bgCard};border:1px solid ${c.border};border-radius:14px;backdrop-filter:blur(10px)}
        .rk-stat-pill-icon{font-size:1.1rem}
        .rk-stat-pill-val{font-size:1rem;font-weight:800;color:#d4af37}
        .rk-stat-pill-label{font-size:.7rem;color:#9a9aae;font-weight:500}
        .rk-progress-wrap{margin-top:22px;background:${c.bgCard};border:1px solid ${c.border};border-radius:18px;padding:18px 22px;max-width:420px;backdrop-filter:blur(10px)}
        .rk-progress-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
        .rk-progress-label{font-size:.75rem;color:#9a9aae}
        .rk-progress-label strong{color:${c.text}}
        .rk-progress-pct{font-size:1.3rem;font-weight:900;color:#d4af37}
        .rk-progress-bar{height:8px;background:${c.bgCard};border-radius:99px;overflow:hidden;margin-bottom:6px}
        .rk-progress-fill{height:100%;background:linear-gradient(90deg,#d4af37,#f0d78c);border-radius:99px;transition:width .8s cubic-bezier(.4,0,.2,1);animation:rkProgressGlow 2s ease-in-out infinite}
        .rk-progress-bottom{display:flex;justify-content:space-between;font-size:.7rem;color:#9a9aae}
        .rk-wave{position:relative;width:100%;overflow:hidden;line-height:0;margin-top:-2px}
        .rk-wave svg{display:block;width:100%;height:50px}
        @media(max-width:900px){.rk-hero-inner{flex-direction:column;text-align:center;padding:30px 20px}.rk-hero-left h1{font-size:2rem}.rk-hero-btns{justify-content:center}.rk-stat-row{justify-content:center;flex-wrap:wrap}.rk-progress-wrap{max-width:100%}.rk-trophy-wrap{width:200px;height:200px}.rk-trophy-emoji{font-size:60px}.rk-3d-cube{display:none}}
      `}</style>

      {/* Hero */}
      <section className="rk-hero">
        <div className="rk-hero-bg">
          <div className="rk-orb rk-orb-1"></div>
          <div className="rk-orb rk-orb-2"></div>
          <div className="rk-orb rk-orb-3"></div>
        </div>
        <div className="rk-hero-inner">
          <div className="rk-hero-left">
            <h1>
              {t("ترتيبك:", "Your Rank:")}{" "}
              <span>{currentRankName ? (userRankIndex >= 0 ? `${rankIcons[userRankIndex]} ${currentRankName}` : `⭐ ${currentRankName}`) : t("لا يوجد رتبة بعد", "No rank yet")}</span>
            </h1>
            <p>{t("أكمل المهام، وافتح ترتبات جديدة، وكن أحد قادة أكاديمية إيفرست.", "Complete missions, unlock new ranks, and become one of Everest Academy leaders.")}</p>
            <div className="rk-hero-btns">
              <Link to="/profile" className="rk-hero-btn-primary">
                {t("حسابي", "My Profile")} <span>→</span>
              </Link>
            </div>

            <div className="rk-stat-row">
              <div className="rk-stat-pill">
                <span className="rk-stat-pill-icon">👥</span>
                <div>
                  <div className="rk-stat-pill-val">{userSales}</div>
                  <div className="rk-stat-pill-label">{t("مبيعات الفريق", "Team Sales")}</div>
                </div>
              </div>
              <div className="rk-stat-pill">
                <span className="rk-stat-pill-icon">💰</span>
                <div>
                  <div className="rk-stat-pill-val">{user?.e_money || 0}</div>
                  <div className="rk-stat-pill-label">EM {t("الرصيد", "Balance")}</div>
                </div>
              </div>
              <div className="rk-stat-pill">
                <span className="rk-stat-pill-icon">{rankIcons[userRankIndex] || "⭐"}</span>
                <div>
                  <div className="rk-stat-pill-val">#{userRankIndex >= 0 ? userRankIndex + 1 : "?"}</div>
                  <div className="rk-stat-pill-label">{t("الترتيب", "Rank")}</div>
                </div>
              </div>
            </div>

            {nextRankName && nextRankData && (
              <div className="rk-progress-wrap">
                <div className="rk-progress-top">
                  <div className="rk-progress-label">
                    {t("الترتيب التالي:", "Next:")} <strong>{nextRankName}</strong>
                    {" · "}
                    {t("المكافأة:", "Bonus:")} <strong style={{color:"#d4af37"}}>{bonusVal(nextRankData)?.toLocaleString()} EM</strong>
                  </div>
                  <div className="rk-progress-pct">{progressPct}%</div>
                </div>
                <div className="rk-progress-bar">
                  <div className="rk-progress-fill" style={{width:`${Math.min(100, progressPct)}%`}}></div>
                </div>
                <div className="rk-progress-bottom">
                  <span>{userSales} / {nextSalesReq} {t("مبيعات الفريق", "Team Sales")}</span>
                  <span>{nextSalesReq - userSales} {t("متبقي", "Remaining")}</span>
                </div>
              </div>
            )}

            {!nextRankName && userRankIndex >= 0 && (
              <div className="rk-progress-wrap">
                <p style={{fontSize:13,color:"#22c55e",fontWeight:700}}>✅ {t("لقد وصلت لأعلى رتبة!", "You reached the highest rank!")}</p>
                <p style={{fontSize:12,color:"#9a9aae",marginTop:6}}>
                  {t("مبيعات الفريق:", "Team Sales:")} {userSales} · {t("الرصيد:", "Balance:")} {user?.e_money || 0} EM
                </p>
              </div>
            )}

            {!user && (
              <div className="rk-progress-wrap">
                <p style={{fontSize:13,color:"#9a9aae"}}>{t("سجّل الدخول لرؤية تقدم رتبتك", "Log in to see your rank progress")}</p>
              </div>
            )}
          </div>

          <div className="rk-hero-right">
            <div className="rk-3d-cube"></div>
            <div className="rk-3d-cube"></div>
            <div className="rk-3d-cube"></div>
            <div className="rk-trophy-wrap">
              <div className="rk-trophy-ring"></div>
              <div className="rk-trophy-ring2"></div>
              <div className="rk-orbit-dot"></div>
              <div className="rk-orbit-dot2"></div>
              <div className="rk-trophy-center">
                <span className="rk-trophy-emoji">🏆</span>
                <span className="rk-trophy-label">{progress?.currentRank || "Star"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wave Divider */}
      <div className="rk-wave">
        <svg viewBox="0 0 1200 50" preserveAspectRatio="none">
          <path d="M0,25 C200,50 400,0 600,25 C800,50 1000,0 1200,25 L1200,50 L0,50 Z" fill={c.bg} />
        </svg>
      </div>

      <div className="dash-container" style={{marginTop:30,maxWidth:1100,margin:"30px auto",padding:"0 20px"}}>
        <div style={{display:"flex",gap:10,marginBottom:25,justifyContent:"center"}}>
          {["ranks","leaderboard"].map((tb) => (
            <button key={tb} onClick={() => setTab(tb)}
              style={{padding:"10px 28px",borderRadius:14,border: tab===tb ? `1px solid ${c.borderLight}` : "none",cursor:"pointer",fontWeight:700,fontSize:14,background:tab===tb?c.bgCard:c.bgInput,color:tab===tb?gold:c.textSoft,transition:".3s"}}
            >{tb === "ranks" ? `📊 ${t("جميع الترتبات", "All Ranks")}` : `🏆 ${t("لوحة المتصدرين", "Leaderboard")}`}</button>
          ))}
        </div>

        {tab === "ranks" && (
          <div style={{display:"grid",gap:12}}>
            {ranks.map((r, i) => {
              const isCurrent = i === userRankIndex;
              const nextIdx = progress?.nextRank ? ranks.findIndex(rr => rr.name === progress.nextRank) : userRankIndex + 1;
              const isNext = i === nextIdx;
              const isUnlocked = i < userRankIndex;
              return (
                <div key={r.id} style={{
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                  background:isCurrent ? "rgba(212,175,55,.08)" : c.bgCard,
                  border:isCurrent ? `2px solid ${gold}` : `1px solid ${c.borderLight}`,
                  borderRadius:16,padding:"16px 20px",transition:".3s"
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    {r.image ? (
                      <div style={{width:52,height:52,borderRadius:14,overflow:"hidden",flexShrink:0}}>
                        <img src={r.image} alt={r.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                      </div>
                    ) : (
                      <span style={{fontSize:36}}>{rankIcons[i] || "🏅"}</span>
                    )}
                    <div>
                      <h3 style={{fontSize:16,fontWeight:700,margin:0,color:c.text}}>{r.name}</h3>
                      <p style={{fontSize:13,color:c.textMuted,marginTop:4}}>
                        {i === 0 && `🎯 ${salesReq(r)}+ ${t("أعضاء فريقك", "Team Members")}`}
                        {i > 0 && salesReq(r) > 0 && `🎯 ${salesReq(r)}+ ${t("مبيعات الفريق", "Team Sales")}`}
                        {bonusVal(r) > 0 && ` · 🎁 ${bonusVal(r).toLocaleString()} EM`}
                      </p>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    {isCurrent && <span style={{fontSize:12,fontWeight:700,color:gold}}>▼ {t("الحالي", "CURRENT")}</span>}
                    {isNext && <span style={{fontSize:12,fontWeight:700,color:gold}}>▶ {t("التالي", "NEXT")}</span>}
                    {!isCurrent && !isNext && isUnlocked && <span style={{fontSize:12,fontWeight:600,color:"#22c55e"}}>✓ {t("مفتوح", "Unlocked")}</span>}
                    {!isCurrent && !isNext && !isUnlocked && <span style={{fontSize:12,color:c.textMuted}}>🔒 {t("مقفل", "Locked")}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "leaderboard" && (
          <div style={{background:c.bgCard,borderRadius:20,padding:24,border:`1px solid ${c.borderLight}`,boxShadow:"0 5px 30px rgba(0,0,0,.04)"}}>
            <h3 style={{marginBottom:20,fontSize:20,color:c.text}}>🏆 {t("أبرز المتميزين", "Top Achievers")}</h3>
            {leaderboard.length === 0 ? (
              <p style={{color:c.textMuted,textAlign:"center",padding:30}}>{t("لا يوجد أعضاء بعد", "No members yet")}</p>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {leaderboard.map((u, i) => (
                  <div key={u.id} style={{
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    background:i < 3 ? "rgba(212,175,55,.06)" : c.bgSoft,
                    border:`1px solid ${c.borderLight}`, borderRadius:14,padding:"12px 16px"
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <span style={{fontSize:18,fontWeight:800,color:i < 3 ? gold : c.textMuted,width:30}}>#{u.position}</span>
                      <div style={{width:40,height:40,borderRadius:"50%",background:c.bgInput,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,overflow:"hidden"}}>
                        {u.avatar && u.avatar.trim() ? <img src={u.avatar} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <span style={{fontSize:18,fontWeight:800,color:gold,lineHeight:1}}>{(u.full_name || "U")[0].toUpperCase()}</span>}
                      </div>
                      <div>
                        <p style={{fontWeight:600,color:c.text}}>{u.full_name}{u.id === user?.id && <span style={{fontSize:11,color:gold,marginRight:6}}>({t("أنت", "You")})</span>}</p>
                        <p style={{fontSize:12,color:c.textMuted}}>
                          {(() => { const rk = ranks.find(rr => rr.name === u.rank); return rk?.image ? <img src={rk.image} alt={u.rank} style={{width:18,height:18,borderRadius:4,verticalAlign:"middle",marginRight:4,objectFit:"cover"}} /> : null; })()}
                          {u.rank} · {u.total_team_sales || 0} {t("مبيعات الفريق", "Team Sales")}
                        </p>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <p style={{fontWeight:700,color:gold}}>{u.e_money} EM</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <FooterSection />
    </div>
  );
}