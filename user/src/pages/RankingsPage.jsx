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
@keyframes rkFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}
@keyframes rkPulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.8;transform:scale(1.05)}}
@keyframes rkGradientFlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes rkProgressGlow{0%,100%{box-shadow:0 0 8px rgba(212,175,55,.3)}50%{box-shadow:0 0 20px rgba(212,175,55,.6)}}
@keyframes rkSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes rkShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
`;

const salesReq = (r) => r.sales_required !== undefined ? r.sales_required : r.min_direct;
const bonusVal = (r) => r.bonus !== undefined ? r.bonus : r.weekly_bonus;

const cardStyle = (c, extra) => ({
  background: c.bgCard, border: `1px solid ${c.borderLight}`, borderRadius: 20,
  padding: 24, boxShadow: "0 5px 30px rgba(0,0,0,.04)", ...extra
});

const statCard = (c, active) => ({
  background: active ? "rgba(212,175,55,.06)" : c.bgSoft,
  border: `1px solid ${active ? "rgba(212,175,55,.2)" : c.borderLight}`,
  borderRadius: 16, padding: 18, flex: "1 1 140px", minWidth: 140
});

const miniLabel = { fontSize: 12, color: "#9a9aae", marginBottom: 4, fontWeight: 500 };
const miniVal = (c) => ({ fontSize: 24, fontWeight: 900, color: c.text });
const miniSub = { fontSize: 11, color: "#9a9aae", marginTop: 4 };

export default function RankingsPage() {
  const { t, dir } = useLang();
  const { user } = useAuth();
  const { colors: c } = useTheme();
  const m = useIsMobile();
  const [progress, setProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [tab, setTab] = useState("ranks");
  const [historyDetail, setHistoryDetail] = useState(null);

  const gold = "#d4af37";

  useEffect(() => {
    if (!user?.id) return;
    api("/api/ranks/update", { method: "POST" }).then(() => {
      api(`/api/mlm/rank-progress/${user.id}`).then(setProgress).catch(() => {});
    }).catch(() => {
      api(`/api/mlm/rank-progress/${user.id}`).then(setProgress).catch(() => {});
    });
    api("/api/ranks/leaderboard").then(setLeaderboard).catch(() => {});
    api("/api/ranks").then((d) => Array.isArray(d) ? setRanks(d) : setRanks([])).catch(() => {});
    api(`/api/mlm/weekly-history/${user.id}`).then(setWeeklyHistory).catch(() => {});
  }, [user?.id]);

  const currentRankName = progress?.currentRank || user?.rank || null;
  const userRankIndex = currentRankName ? ranks.findIndex(r => r.name === currentRankName) : -1;
  const nextRankName = progress?.nextRank;
  const nextRankData = ranks.find(r => r.name === nextRankName);
  const teamCount = progress?.qualifiedDirects ?? 0;
  const progressPct = progress?.progressToNext ?? 0;
  const nextSalesReq = nextRankData ? (salesReq(nextRankData) || 40) : 40;

  const totalDirectSales = progress?.totalDirectSales ?? 0;
  const studentDirectSales = progress?.studentDirectSales ?? 0;
  const registrationDirectSales = progress?.registrationDirectSales ?? 0;
  const qualifiedDirectSales = progress?.qualifiedDirectSales ?? 0;
  const meetsMinDirects = progress?.meetsMinDirects ?? false;

  const qualifiedTeam = progress?.qualifiedTeamCount ?? 0;
  const studentMembers = progress?.studentMembers ?? 0;
  const registrationMembers = progress?.registrationMembers ?? 0;
  const higherRankExcluded = progress?.higherRankExcluded ?? 0;
  const inactiveExcluded = progress?.inactiveExcluded ?? 0;

  const rankData = progress?.currentRankData;
  const weeklyCommission = rankData ? bonusVal(rankData) : 0;

  const statusColors = {
    paid: "#22c55e", not_eligible: "#ef4444", no_bonus: "#f59e0b", no_change: "#9a9aae",
    promoted: "#22c55e", demoted: "#ef4444"
  };

  return (
    <div style={{ direction: dir, background: c.bg, minHeight: "100vh" }}>
      <AppNavbar />
      <style>{rankKeyframes + `
        .rk-hero{position:relative;min-height:70vh;display:flex;align-items:center;overflow:hidden}
        .rk-hero-bg{position:absolute;inset:0;background:linear-gradient(135deg,#0a0a1a 0%,#1a0a2e 25%,#0a1628 50%,#15102a 75%,#0f0f13 100%)}
        .rk-hero-bg::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 30%,rgba(212,175,55,.12) 0%,transparent 50%);animation:rkPulse 6s ease-in-out infinite}
        .rk-orb{position:absolute;border-radius:50%;filter:blur(70px);animation:rkFloat 8s ease-in-out infinite}
        .rk-orb-1{width:350px;height:350px;background:rgba(212,175,55,.1);top:-80px;right:-50px}
        .rk-orb-2{width:280px;height:280px;background:rgba(139,92,246,.08);bottom:-60px;left:-40px;animation-delay:2s}
        .rk-hero-inner{position:relative;z-index:2;width:95%;max-width:1200px;margin:0 auto;padding:40px 20px;display:flex;align-items:center;justify-content:space-between;gap:40px}
        .rk-hero-left{flex:1;max-width:600px;animation:rkSlideUp .8s ease-out}
        .rk-hero-left h1{font-size:clamp(1.8rem,4vw,3rem);font-weight:900;line-height:1.15;margin-bottom:12px;color:#fff}
        .rk-hero-left h1 span{background:linear-gradient(135deg,#d4af37,#f0d78c,#d4af37);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:rkGradientFlow 3s ease infinite}
        .rk-hero-left p{font-size:.9rem;color:#9a9aae;line-height:1.7;margin-bottom:24px}
        .rk-progress-wrap{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:18px 22px;backdrop-filter:blur(10px)}
        .rk-progress-bar{height:8px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;margin:10px 0}
        .rk-progress-fill{height:100%;background:linear-gradient(90deg,#d4af37,#f0d78c);border-radius:99px;transition:width .8s cubic-bezier(.4,0,.2,1);animation:rkProgressGlow 2s ease-in-out infinite}
        .rk-trophy-center{display:flex;align-items:center;justify-content:center;flex-direction:column}
        .rk-trophy-emoji{font-size:80px;filter:drop-shadow(0 10px 30px rgba(212,175,55,.3));animation:rkFloat 5s ease-in-out infinite}
        .rk-section{animation:rkSlideUp .6s ease-out both}
        .rk-tab-bar{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
        .rk-tab-btn{padding:10px 22px;border-radius:14px;border:none;cursor:pointer;font-weight:700;font-size:13px;transition:.3s}
        .rk-history-row{border-bottom:1px solid ${c.borderLight};padding:14px 0;display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:8px;align-items:center}
        .rk-history-row:last-child{border-bottom:none}
        .rk-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
        @media(max-width:900px){.rk-hero-inner{flex-direction:column;text-align:center;padding:30px 16px}.rk-hero-left h1{font-size:1.8rem}.rk-history-row{grid-template-columns:1fr 1fr}.rk-history-header{display:none}}
        @media(max-width:600px){.rk-stat-grid{flex-direction:column}}
      `}</style>

      {/* Hero */}
      <section className="rk-hero">
        <div className="rk-hero-bg">
          <div className="rk-orb rk-orb-1"></div>
          <div className="rk-orb rk-orb-2"></div>
        </div>
        <div className="rk-hero-inner">
          <div className="rk-hero-left">
            <h1>
              {t("ترتيبك:", "Your Rank:")}{" "}
              <span>{currentRankName ? (userRankIndex >= 0 ? `${rankIcons[userRankIndex]} ${currentRankName}` : `⭐ ${currentRankName}`) : t("لا يوجد رتبة بعد", "No rank yet")}</span>
            </h1>
            <p>{t("أكمل المهام، وافتح ترتبات جديدة، وكن أحد قادة أكاديمية إيفرست.", "Complete missions, unlock new ranks, and become one of Everest Academy leaders.")}</p>

            <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap", justifyContent: m ? "center" : "flex-start" }}>
              <div style={statCard(c, true)}>
                <div style={miniLabel}>💰 {t("عمولة أسبوعية", "Weekly Commission")}</div>
                <div style={miniVal(c)}>{(weeklyCommission || 0).toLocaleString()} <span style={{ fontSize: 14, color: "#9a9aae" }}>EM</span></div>
              </div>
              <div style={statCard(c)}>
                <div style={miniLabel}>🎯 {t("مبيعات الفريق", "Team Sales")}</div>
                <div style={miniVal(c)}>{teamCount}</div>
              </div>
              <div style={statCard(c)}>
                <div style={miniLabel}>👥 {t("المبيعات المباشرة", "Direct Sales")}</div>
                <div style={miniVal(c)}>{totalDirectSales}</div>
              </div>
            </div>

            {nextRankName && (
              <div className="rk-progress-wrap">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#ccc" }}>
                    {t("الترتيب التالي:", "Next:")} <strong style={{ color: "#d4af37" }}>{nextRankName}</strong>
                    {" · "}{t("المكافأة:", "Bonus:")} <strong style={{ color: "#d4af37" }}>{bonusVal(nextRankData)?.toLocaleString()} EM</strong>
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#d4af37" }}>{progressPct}%</span>
                </div>
                <div className="rk-progress-bar">
                  <div className="rk-progress-fill" style={{ width: `${Math.min(100, progressPct)}%` }}></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9a9aae", marginTop: 4 }}>
                  <span>{teamCount} / {nextSalesReq} {t("أعضاء الفريق المؤهلين", "Qualified Members")}</span>
                  <span>{Math.max(0, nextSalesReq - teamCount)} {t("متبقي", "Remaining")}</span>
                </div>
              </div>
            )}
            {!nextRankName && userRankIndex >= 0 && (
              <div className="rk-progress-wrap">
                <p style={{ fontSize: 13, color: "#22c55e", fontWeight: 700 }}>✅ {t("لقد وصلت لأعلى رتبة!", "You reached the highest rank!")}</p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", animation: "rkSlideUp .8s ease-out .2s both" }}>
            <div style={{ position: "relative", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", inset: -15, border: "1.5px dashed rgba(212,175,55,.15)", borderRadius: "50%" }}></div>
              <div className="rk-trophy-center">
                {ranks[userRankIndex]?.image ? (
                  <img src={ranks[userRankIndex].image} alt={currentRankName} style={{ width: 80, height: 80, borderRadius: 16, objectFit: "cover", filter: "drop-shadow(0 8px 20px rgba(212,175,55,.3))" }} />
                ) : (
                  <span className="rk-trophy-emoji">🏆</span>
                )}
                <span style={{ fontSize: 14, color: "#d4af37", fontWeight: 700, marginTop: 8, letterSpacing: 1 }}>{progress?.currentRank || "Star"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 20px 60px" }}>
        {/* Tab Bar */}
        <div className="rk-tab-bar" style={{ marginBottom: 28 }}>
          {[
            { key: "ranks", icon: "📊", label: t("جميع الترتبات", "All Ranks") },
            { key: "activity", icon: "📈", label: t("النشاط الأسبوعي", "Weekly Activity") },
            { key: "network", icon: "🌐", label: t("الشبكة المؤهلة", "Qualified Network") },
            { key: "history", icon: "📜", label: t("السجل الأسبوعي", "Weekly History") },
            { key: "leaderboard", icon: "🏆", label: t("لوحة المتصدرين", "Leaderboard") },
          ].map(tb => (
            <button key={tb.key} className="rk-tab-btn" onClick={() => setTab(tb.key)}
              style={{ background: tab === tb.key ? "rgba(212,175,55,.12)" : c.bgCard, color: tab === tb.key ? gold : c.textSoft, border: tab === tb.key ? `1px solid rgba(212,175,55,.3)` : `1px solid ${c.borderLight}` }}>
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {/* TAB: All Ranks */}
        {tab === "ranks" && (
          <div className="rk-section" style={{ display: "grid", gap: 10 }}>
            {ranks.map((r, i) => {
              const isCurrent = i === userRankIndex;
              const isUnlocked = userRankIndex >= 0 && i < userRankIndex;
              const isNext = nextRankName && r.name === nextRankName;
              return (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: isCurrent ? "rgba(212,175,55,.08)" : c.bgCard,
                  border: isCurrent ? `2px solid ${gold}` : `1px solid ${c.borderLight}`,
                  borderRadius: 16, padding: "14px 18px", transition: ".3s"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {r.image ? (
                      <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                        <img src={r.image} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ) : (
                      <span style={{ fontSize: 32 }}>{rankIcons[i] || "🏅"}</span>
                    )}
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: c.text }}>{r.name}</h3>
                      <p style={{ fontSize: 12, color: c.textMuted, marginTop: 3 }}>
                        🎯 {salesReq(r)}+ {t("أعضاء فريقك", "Team Members")}
                        {bonusVal(r) > 0 && ` · 🎁 ${bonusVal(r).toLocaleString()} EM / ${t("أسبوعياً", "week")}`}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {isCurrent && <span className="rk-badge" style={{ background: "rgba(212,175,55,.15)", color: gold }}>▼ {t("الحالي", "CURRENT")}</span>}
                    {isNext && <span className="rk-badge" style={{ background: "rgba(212,175,55,.15)", color: gold }}>▶ {t("التالي", "NEXT")}</span>}
                    {isUnlocked && !isCurrent && <span className="rk-badge" style={{ background: "rgba(34,197,94,.12)", color: "#22c55e" }}>✓ {t("مفتوح", "Unlocked")}</span>}
                    {!isCurrent && !isNext && !isUnlocked && <span style={{ fontSize: 11, color: c.textMuted }}>🔒 {t("مقفل", "Locked")}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: Weekly Activity */}
        {tab === "activity" && (
          <div className="rk-section" style={{ display: "grid", gap: 20 }}>
            {/* Direct Sales */}
            <div style={cardStyle(c)}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18, color: c.text }}>📊 {t("المبيعات المباشرة", "Direct Sales")}</h3>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }} className="rk-stat-grid">
                <div style={statCard(c)}>
                  <div style={miniLabel}>{t("إجمالي المبيعات المباشرة", "Total Direct Sales")}</div>
                  <div style={miniVal(c)}>{totalDirectSales}</div>
                  <div style={miniSub}>{t("جميع الأعضاء whom سجلوا بـ رمزك", "All members registered with your code")}</div>
                </div>
                <div style={statCard(c)}>
                  <div style={miniLabel}>🎓 {t("مبيعات طلاب", "Student Sales")}</div>
                  <div style={{ ...miniVal(c), color: "#22c55e" }}>{studentDirectSales}</div>
                  <div style={miniSub}>{t("يولّدون عمولة", "Generate commission")}</div>
                </div>
                <div style={statCard(c)}>
                  <div style={miniLabel}>📋 {t("مبيعات تسجيل", "Registration Sales")}</div>
                  <div style={{ ...miniVal(c), color: "#f59e0b" }}>{registrationDirectSales}</div>
                  <div style={miniSub}>{t("لا يولّدون عمولة", "No commission")}</div>
                </div>
                <div style={statCard(c, meetsMinDirects)}>
                  <div style={miniLabel}>{t("المبيعات المؤهلة", "Qualified Sales")}</div>
                  <div style={{ ...miniVal(c), color: meetsMinDirects ? "#22c55e" : "#ef4444" }}>{qualifiedDirectSales}</div>
                  <div style={miniSub}>{meetsMinDirects ? `✅ ${t("مؤهل للأسبوعية", "Eligible for weekly")}` : `❌ ${t("أقل من 2", "Minimum 2 required")}`}</div>
                </div>
              </div>
            </div>

            {/* Eligibility Summary */}
            <div style={cardStyle(c)}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18, color: c.text }}>🎯 {t("ملخص الأهلية", "Eligibility Summary")}</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { label: t("الرتبة", "Rank"), value: currentRankName || t("لا يوجد", "None"), icon: "🏅", color: c.text },
                  { label: t("عمولة أسبوعية", "Weekly Commission"), value: `${(weeklyCommission || 0).toLocaleString()} EM`, icon: "💰", color: "#d4af37" },
                  { label: t("مكافأة الرتبة", "Rank Bonus"), value: `${(rankData?.bonus || 0).toLocaleString()} EM`, icon: "🎁", color: "#22c55e" },
                  { label: t("الرتبة التالية", "Next Rank"), value: nextRankName || t("أعلى رتبة", "Highest Rank"), icon: "➡️", color: c.text },
                  { label: t("الأعضاء المؤهلين", "Qualified Members"), value: `${qualifiedTeam} / ${nextSalesReq || "∞"}`, icon: "👥", color: qualifiedTeam >= (nextSalesReq || 0) ? "#22c55e" : c.text },
                  { label: t("الحد الأدنى المبيعات", "Min Direct Sales"), value: `${t("المطلوب:", "Required:")} 2`, icon: "📏", color: meetsMinDirects ? "#22c55e" : "#ef4444" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: c.bgSoft, borderRadius: 12 }}>
                    <span style={{ fontSize: 13, color: c.textMuted }}>{item.icon} {item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Qualified Network */}
        {tab === "network" && (
          <div className="rk-section" style={{ display: "grid", gap: 20 }}>
            <div style={cardStyle(c)}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18, color: c.text }}>🌐 {t("الشبكة المؤهلة", "Qualified Network")}</h3>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }} className="rk-stat-grid">
                <div style={statCard(c)}>
                  <div style={miniLabel}>{t("أعضاء الفريق المؤهلين", "Qualified Team")}</div>
                  <div style={miniVal(c)}>{qualifiedTeam}</div>
                  <div style={miniSub}>{t("مستخدمين يحسبون للترقية", "Users counting for promotion")}</div>
                </div>
                <div style={statCard(c)}>
                  <div style={miniLabel}>🎓 {t("أعضاء طلاب", "Student Members")}</div>
                  <div style={{ ...miniVal(c), color: "#22c55e" }}>{studentMembers}</div>
                  <div style={miniSub}>{t("يولّدون عمولة", "Generate commission")}</div>
                </div>
                <div style={statCard(c)}>
                  <div style={miniLabel}>📋 {t("أعضاء تسجيل", "Registration Members")}</div>
                  <div style={{ ...miniVal(c), color: "#f59e0b" }}>{registrationMembers}</div>
                  <div style={miniSub}>{t("حسبون للترتبة لا للعمولة", "Count for rank, not commission")}</div>
                </div>
              </div>
            </div>

            <div style={cardStyle(c)}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18, color: c.text }}>🚫 {t("الأعضاء المستبعدون", "Excluded Members")}</h3>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }} className="rk-stat-grid">
                <div style={statCard(c)}>
                  <div style={miniLabel}>{t("مستبعدون بسبب رتبة أعلى", "Excluded Higher Rank")}</div>
                  <div style={{ ...miniVal(c), color: higherRankExcluded > 0 ? "#ef4444" : "#22c55e" }}>{higherRankExcluded}</div>
                  <div style={miniSub}>{t("أعضاء بترتبة أعلى لا يحسبون", "Members with higher rank don't count")}</div>
                </div>
                <div style={statCard(c)}>
                  <div style={miniLabel}>{t("مستبعدون بسبب عدم نشاط", "Excluded Inactive")}</div>
                  <div style={{ ...miniVal(c), color: inactiveExcluded > 0 ? "#ef4444" : "#22c55e" }}>{inactiveExcluded}</div>
                  <div style={miniSub}>{t("حسابات pending/rejected/suspended", "Pending/Rejected/Suspended accounts")}</div>
                </div>
              </div>
            </div>

            <div style={{ ...cardStyle(c), background: "rgba(212,175,55,.04)", border: "1px solid rgba(212,175,55,.15)" }}>
              <h4 style={{ margin: 0, fontSize: 14, color: "#d4af37" }}>📝 {t("قواعد الشبكة المؤهلة", "Qualified Network Rules")}</h4>
              <ul style={{ fontSize: 12, color: c.textMuted, margin: "8px 0 0 16px", lineHeight: 1.8 }}>
                <li>{t("الأعضاء النشطون فقط (status = active)", "Only active members (status = active)")}</li>
                <li>{t("رتبة العضو ≤ رتبتك الحالية", "Member's rank ≤ your current rank")}</li>
                <li>{t("كلتا الحسابين (طالب + تسجيل) تُحسب", "Both Student and Registration accounts count")}</li>
                <li>{t("الأعضاء بترتبة أعلى منك مستبعدون", "Members with higher rank than you are excluded")}</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB: Weekly History */}
        {tab === "history" && (
          <div className="rk-section" style={cardStyle(c)}>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, color: c.text }}>📜 {t("السجل الأسبوعي", "Weekly History")}</h3>
            {weeklyHistory.length === 0 ? (
              <p style={{ color: c.textMuted, textAlign: "center", padding: 30 }}>{t("لا يوجد سجل بعد. سيتم التسجيل عند الحساب الأسبوعي.", "No history yet. Records will be created during weekly processing.")}</p>
            ) : (
              <div>
                {/* Header */}
                <div className="rk-history-row rk-history-header" style={{ fontWeight: 700, fontSize: 12, color: c.textMuted, borderBottom: `2px solid ${c.borderLight}` }}>
                  <span>{t("الأسبوع", "Week")}</span>
                  <span>{t("الرتبة", "Rank")}</span>
                  <span>{t("المبيعات", "Sales")}</span>
                  <span>{t("العمولة", "Commission")}</span>
                  <span>{t("الحالة", "Status")}</span>
                </div>
                {weeklyHistory.map((wh) => {
                  const detail = wh.details ? JSON.parse(wh.details) : null;
                  return (
                    <div key={wh.id}>
                      <div className="rk-history-row" style={{ cursor: "pointer", borderRadius: 10, transition: ".2s" }}
                        onClick={() => setHistoryDetail(historyDetail === wh.id ? null : wh.id)}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{wh.week_start} → {wh.week_end}</div>
                          <div style={{ fontSize: 11, color: c.textMuted }}>{wh.calculation_date}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: c.textMuted }}>{wh.previous_rank || "None"} → {wh.current_rank || "None"}</div>
                          {wh.promotion_status === 'promoted' && <span className="rk-badge" style={{ background: "rgba(34,197,94,.12)", color: "#22c55e", marginTop: 4 }}>🎉 {t("ترقية", "Promoted")}</span>}
                        </div>
                        <div style={{ fontSize: 13, color: c.text }}>
                          <div>S:{wh.student_direct_sales} R:{wh.registration_direct_sales}</div>
                          <div style={{ fontSize: 11, color: c.textMuted }}>{t("مؤهل:", "Qualified:")} {wh.qualified_direct_sales}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: wh.weekly_commission > 0 ? "#22c55e" : c.textMuted }}>
                          {wh.weekly_commission > 0 ? `${wh.weekly_commission.toLocaleString()} EM` : "—"}
                        </div>
                        <div>
                          <span className="rk-badge" style={{
                            background: `${statusColors[wh.commission_status] || c.textMuted}22`,
                            color: statusColors[wh.commission_status] || c.textMuted
                          }}>
                            {wh.commission_status === 'paid' ? '✅ ' + t("مدفوع", "Paid") :
                             wh.commission_status === 'not_eligible' ? '❌ ' + t("غير مؤهل", "Not Eligible") :
                             wh.commission_status === 'no_bonus' ? '⚠️ ' + t("بلا مكافأة", "No Bonus") :
                             wh.commission_status}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      {historyDetail === wh.id && (
                        <div style={{ background: c.bgSoft, borderRadius: 14, padding: 18, marginBottom: 10 }}>
                          {wh.failure_reason && (
                            <div style={{ padding: "8px 14px", background: "rgba(239,68,68,.08)", borderRadius: 10, marginBottom: 12, fontSize: 13, color: "#ef4444" }}>
                              ❌ {t("سبب:", "Reason:")} {wh.failure_reason}
                            </div>
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
                            {[
                              [t("مبيعات مباشرة", "Direct Sales"), wh.total_direct_sales],
                              [t("طلاب", "Students"), wh.student_direct_sales],
                              [t("تسجيل", "Registration"), wh.registration_direct_sales],
                              [t("مؤهلة", "Qualified"), wh.qualified_direct_sales],
                              [t("فريق مؤهل", "Qualified Team"), wh.qualified_team_count],
                              [t("شبكة مؤهلة", "Qualified Network"), wh.qualified_network_count],
                              [t("أعضاء طلاب", "Student Members"), wh.student_members],
                              [t("أعضاء تسجيل", "Registration Members"), wh.registration_members],
                              [t("مستبعدون (رتبة أعلى)", "Excluded (Higher Rank)"), wh.higher_rank_excluded],
                              [t("مستبعدون (غير نشط)", "Excluded (Inactive)"), wh.inactive_excluded],
                            ].map(([label, val], i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: c.bgCard, borderRadius: 8, fontSize: 12 }}>
                                <span style={{ color: c.textMuted }}>{label}</span>
                                <span style={{ fontWeight: 700, color: c.text }}>{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: Leaderboard */}
        {tab === "leaderboard" && (
          <div className="rk-section" style={cardStyle(c)}>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, color: c.text }}>🏆 {t("أبرز المتميزين", "Top Achievers")}</h3>
            {leaderboard.length === 0 ? (
              <p style={{ color: c.textMuted, textAlign: "center", padding: 30 }}>{t("لا يوجد أعضاء بعد", "No members yet")}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {leaderboard.map((u, i) => {
                  const rk = ranks.find(rr => rr.name === u.rank);
                  return (
                    <div key={u.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: i < 3 ? "rgba(212,175,55,.06)" : c.bgSoft,
                      border: `1px solid ${c.borderLight}`, borderRadius: 14, padding: "12px 16px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: i < 3 ? gold : c.textMuted, width: 30 }}>#{u.position}</span>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: c.bgInput, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          {u.avatar?.trim() ? <img src={u.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 18, fontWeight: 800, color: gold }}>{(u.full_name || "U")[0].toUpperCase()}</span>}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: c.text, margin: 0 }}>
                            {u.full_name}
                            {u.id === user?.id && <span style={{ fontSize: 11, color: gold, marginLeft: 6 }}>({t("أنت", "You")})</span>}
                            {u.account_type === 'registration' && <span style={{ fontSize: 10, color: "#f59e0b", marginLeft: 6, padding: "1px 6px", background: "rgba(245,158,11,.1)", borderRadius: 8 }}>REG</span>}
                          </p>
                          <p style={{ fontSize: 12, color: c.textMuted, margin: "2px 0 0" }}>
                            {rk?.image ? <img src={rk.image} alt={u.rank} style={{ width: 16, height: 16, borderRadius: 3, verticalAlign: "middle", marginRight: 4, objectFit: "cover" }} /> : null}
                            {u.rank} · {u.total_team_sales || 0} {t("مبيعات الفريق", "Team Sales")}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontWeight: 700, color: gold, margin: 0 }}>{u.e_money} EM</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <FooterSection />
    </div>
  );
}
