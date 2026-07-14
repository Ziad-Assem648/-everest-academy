import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import LanguageToggle from "../components/LanguageToggle";
import { api } from "../App";
import AppNavbar from "../components/AppNavbar";
import { useTheme } from "../ThemeContext";

function getLevelCounts(tree, maxLevel = 99) {
  const counts = {};
  const walk = (nodes, depth) => {
    if (depth > maxLevel) return;
    if (!nodes) return;
    counts[depth] = (counts[depth] || 0) + nodes.length;
    nodes.forEach(n => walk(n.children, depth + 1));
  };
  walk(tree, 1);
  return counts;
}

export default function ProfilePage() {
  const { user, login:authLogin, logout } = useAuth();
  const { t, lang, dir, toggle: toggleLang } = useLang();
  const { theme, toggle, colors: c } = useTheme();
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [rankProgress, setRankProgress] = useState(null);
  const [levelCounts, setLevelCounts] = useState({});
  const [uploading, setUploading] = useState(false);
  const [csWhatsapp, setCsWhatsapp] = useState("");
  const [csEmail, setCsEmail] = useState("");
  const [dbRanks, setDbRanks] = useState([]);

  useEffect(() => {
    if (!user) return;
    api(`/api/users/${user.id}`).then(setProfile).catch(() => setProfile(user));
  }, [user]);

  useEffect(() => {
    if (!profile?.id) return;
    api(`/api/ranks/progress/${profile.id}`).then(setRankProgress).catch(() => {});
    api(`/api/mlm/tree?userId=${profile.id}`).then(tree => {
      setLevelCounts(getLevelCounts(tree));
    }).catch(() => {});
    api("/api/ranks").then((d) => Array.isArray(d) ? setDbRanks(d) : null).catch(() => {});
  }, [profile?.id]);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      setCsWhatsapp(d.customer_service_whatsapp || "");
      setCsEmail(d.customer_service_email || "");
    }).catch(() => {});
  }, []);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const max = 500;
            let w = img.width, h = img.height;
            if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
            canvas.width = w; canvas.height = h;
            canvas.getContext("2d").drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.6));
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
      const updated = await api(`/api/users/${user.id}`, { method: "PUT", body: JSON.stringify({ avatar: dataUrl }) });
      setProfile(updated);
      authLogin(updated);
    } catch (e) { alert(t("خطأ: ", "Error: ") + (e.message || t("فشل تغيير الصورة", "Failed to change image"))); }
    setUploading(false);
  };

  const copyCode = () => {
    if (profile?.referral_code) { navigator.clipboard.writeText(profile.referral_code); alert(t("تم نسخ كود الإحالة ✅", "Referral code copied ✅")); }
  };

  const p = profile || user || {};
  const rp = rankProgress || {};
  const progressPct = rp.progress || 0;
  const currentRankName = rp.currentRank || p.rank || "Star";
  const nextRankName = rp.nextRank || "—";
  const eMoney = p.e_money || 0;
  const teamSales = rp.totalTeamSales || p.total_team_sales || p.direct_count || 0;

  const [now, setNow] = useState(Date.now());
  const gold = "#d4af37";
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(id); }, []);

  const membershipExpires = p.membership_expires_at ? new Date(p.membership_expires_at.replace(" ", "T") + "Z") : null;
  const membershipCreated = p.created_at ? new Date(p.created_at.replace(" ", "T") + "Z") : null;
  const expiresMs = membershipExpires ? membershipExpires.getTime() : null;
  const createdMs = membershipCreated ? membershipCreated.getTime() : null;
  let remainingDays = 183;
  let membershipPct = 100;
  let isExpired = false;
  if (expiresMs && createdMs) {
    const diffMs = expiresMs - now;
    remainingDays = Math.max(0, Math.ceil(diffMs / 86400000));
    isExpired = remainingDays <= 0;
    const totalMs = expiresMs - createdMs;
    membershipPct = totalMs > 0 ? Math.max(0, Math.min(100, (diffMs / totalMs) * 100)) : 100;
  }
  const showRenewButton = expiresMs !== null && remainingDays <= 5;

  const renewMembership = async () => {
    try {
      const res = await api(`/api/users/${p.id}/renew-membership`, { method: "POST" });
      if (res.success) {
        const updated = await api(`/api/users/${p.id}`);
        setProfile(updated);
        authLogin(updated);
        alert(t("تم تجديد العضوية بنجاح! ✅", "Membership renewed successfully! ✅"));
      }
    } catch (e) { alert(t("خطأ: ", "Error: ") + (e.message || t("فشل التجديد", "Renew failed"))); }
  };

  return (
    <div style={{direction: dir, background: c.bg }}>
      <AppNavbar />

      <div className="dash-container" style={{marginTop:30}}>
        {/* Membership Card */}
        <section className="membership-card">
          <div className="membership-content">
            <div>
              <span className="membership-label"> {isExpired ? t("العضوية منتهية", "Membership Expired") : t("العضوية نشطة", "Membership Active")} </span>
              <h2 id="countdown">{isExpired ? t("منتهية", "Expired") : `${remainingDays} ${t("يوم متبقي", "Days Remaining")}`}</h2>
              {showRenewButton && remainingDays > 0 && (
                <p style={{fontSize:13,color:"#d4af37",marginTop:8}}>⚠️ {t(`باقي ${remainingDays} أيام على انتهاء العضوية.`, `${remainingDays} days until membership expires.`)}</p>
              )}
              {isExpired && (
                <p style={{fontSize:13,color:"#ef4444",marginTop:8}}>🚫 {t("العضوية منتهية. تواصل مع خدمة العملاء لتجديد العضوية.", "Membership expired. Contact customer service to renew.")}</p>
              )}
            </div>
            {isExpired && csWhatsapp && (
              <a href={`https://wa.me/${csWhatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:14,background:"linear-gradient(135deg,#25d366,#128c7e)",color:"#fff",fontWeight:700,fontSize:14,textDecoration:"none",transition:".3s",boxShadow:"0 4px 15px rgba(37,211,102,.3)"}}
                onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform="none"}>
                💬 {t("تواصل مع خدمة العملاء", "Contact Customer Service")} <span style={{opacity:.85,fontSize:12}}>({csWhatsapp})</span>
              </a>
            )}
            {isExpired && !csWhatsapp && csEmail && (
              <a href={`mailto:${csEmail}`}
                style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:14,background:"linear-gradient(135deg,#d4af37,#b38728)",color:"#fff",fontWeight:700,fontSize:14,textDecoration:"none",transition:".3s",boxShadow:"0 4px 15px rgba(212,175,55,.3)"}}
                onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform="none"}>
                📧 {t("تواصل مع خدمة العملاء", "Contact Customer Service")}
              </a>
            )}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{width: membershipPct + "%"}}></div>
          </div>
        </section>

        {/* Profile Card (avatar, info, stats) */}
        <div className="profile-card" style={{marginTop:10}}>
          <div className="profile-avatar" style={{textAlign:"center"}}>
            <div style={{width:160,height:160,borderRadius:"50%",background:"#eee",border:"4px solid #d4af37",display:"flex",alignItems:"center",justifyContent:"center",fontSize:60,fontWeight:700,color:c.textMuted,overflow:"hidden",margin:"0 auto"}}>
              {p?.avatar && p.avatar.trim() ? <img src={p.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <span style={{fontSize:56,fontWeight:800,color:"#d4af37",lineHeight:1}}>{(p?.full_name || "U")[0].toUpperCase()}</span>}
            </div>
            <label style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:12,padding:"8px 18px",background:c.bgInput,border:`1px solid ${c.borderLight}`,borderRadius:20,fontSize:13,fontWeight:600,color:c.text,cursor:"pointer",transition:".25s"}}>
              📸 {uploading ? t("جاري الرفع...", "Uploading...") : t("تغيير الصورة", "Change Photo")}
              <input type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto} disabled={uploading} />
            </label>
          </div>

          <div className="profile-info">
            <div className="profile-top">
              <div>
                <h2>{p.full_name || "—"}</h2>
                <p style={{color:c.textMuted,fontSize:13,marginTop:2}}>{p.email}</p>
                <span className="student-id">ID: {(p.id || "").slice(0,8) || "—"}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
                <button onClick={() => { toggleLang(); }}
                  style={{
                    padding:"6px 16px", borderRadius:999,
                    background: c.bgInput, border:`1px solid ${c.borderLight}`,
                    color: c.text, fontSize:13, fontWeight:600, cursor:"pointer",
                    display:"flex", alignItems:"center", gap:6, transition:"0.25s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#d4af37"; e.currentTarget.style.background = "rgba(212,175,55,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderLight; e.currentTarget.style.background = c.bgInput; }}>
                  <span style={{fontSize:14}}>{lang === "ar" ? "🇺🇸" : "🇸🇦"}</span>
                  {lang === "ar" ? "English" : "العربية"}
                </button>
                <span style={{
                  padding:"6px 16px", borderRadius:999,
                  background: c.bgInput, border:`1px solid ${c.borderLight}`,
                  color: gold, fontSize:13, fontWeight:600
                }}>
                  {p?.account_type === "student" ? `🎓 ${t("طالب", "Student")}` : p?.account_type === "registration_sponsor" ? `🤝 ${t("تسجيل (راعي)", "Reg. (Sponsor)")}` : `📝 ${t("تسجيل", "Registration")}`}
                </span>
                <button onClick={() => { logout(); nav("/login"); }}
                  style={{
                    padding:"7px 18px", borderRadius:10, fontSize:13, fontWeight:600,
                    cursor:"pointer", transition:"0.25s", display:"flex", alignItems:"center", gap:6,
                    background: c.bgInput, border:`1px solid ${c.borderLight}`, color: c.text
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = c.borderLight; e.currentTarget.style.color = c.text; e.currentTarget.style.background = c.bgInput; }}>
                  🚪 {t("تسجيل الخروج", "Logout")}
                </button>
              </div>
            </div>

            <div className="profile-stats-grid">
              <div className="stat-box"><span>📞 {t("الهاتف", "Phone")}</span><strong>{p.phone || "—"}</strong></div>
              <div className="stat-box"><span>🏅 {t("الرتبة", "Rank")}</span><strong>{currentRankName}</strong></div>
              <div className="stat-box"><span>💰 E-Money</span><strong>{eMoney.toLocaleString()}</strong></div>
              <div className="stat-box"><span>👥 {t("المباشرون", "Directs")}</span><strong>{p.direct_count || 0}</strong></div>
              <div className="stat-box"><span>📊 {t("مبيعات الفريق", "Team Sales")}</span><strong>{teamSales}</strong></div>
              <div className="stat-box"><span>📅 {t("تاريخ الانضمام", "Joined")}</span><strong>{(p.created_at || "").slice(0,10) || "—"}</strong></div>
            </div>

            {/* Account Type & Upgrade */}
            {p.account_type && p.account_type !== "student" && (
              <div style={{marginBottom:16,padding:"14px 18px",borderRadius:14,background:c.goldLight,border:`1px solid ${c.borderLight}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                <div>
                  <span style={{fontSize:14,fontWeight:700,color:c.text}}>
                    {p.account_type === "registration_sponsor" ? "🤝 Registration (Sponsor)" : "👤 Registration"}
                  </span>
                  <p style={{fontSize:12,color:c.textMuted,margin:"4px 0 0"}}>
                    {t("قم بالترقية للحصول على جميع مميزات المنصة", "Upgrade to get all platform features")}
                  </p>
                </div>
                <button onClick={async () => {
                  if (!confirm(t("هل تريد الترقية إلى Student Account؟", "Upgrade to Student Account?"))) return;
                  try {
                    await fetch(`/api/users/${p.id}/upgrade-account`, { method: "POST", headers: {"Content-Type":"application/json"} });
                    window.location.reload();
                  } catch (e) { alert(e.message); }
                }} style={{padding:"10px 22px",borderRadius:12,background:"linear-gradient(135deg,#d4af37,#b8922a)",color:"#0a0a1a",border:"none",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                  ⬆️ {t("ترقية إلى Student", "Upgrade to Student")}
                </button>
              </div>
            )}
            {p.account_type && p.account_type === "student" && (
              <div style={{marginBottom:16,padding:"10px 16px",borderRadius:10,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14}}>🎓</span>
                <span style={{fontSize:13,fontWeight:600,color:"#22c55e"}}>{t("حساب Student — تشارك في العمولات والرتب", "Student Account — participates in commissions & ranks")}</span>
              </div>
            )}

            <div className="referral-box">
              <span>🔗 {t("كود الإحالة", "Referral Code")}</span>
              <div className="referral-copy">
                <input type="text" readOnly value={p.referral_code || "—"} />
                <button onClick={copyCode}>{t("نسخ", "Copy")}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome + Rank Overview */}
        <section className="dash-overview">
          <div className="welcome-card">
            <h2>{p.full_name || "—"}</h2>
            <p>{t("استمر في بناء شبكتك وأكمل كورساتك لفتح الرتبة التالية.", "Continue building your network, complete your courses and unlock the next rank.")}</p>
            <div className="overview-stats">
              <div className="mini-stat">
                <h3>{eMoney.toLocaleString()}</h3>
                <span>E-Money</span>
              </div>
              <div className="mini-stat">
                <h3>{currentRankName}</h3>
                <span>{t("الرتبة الحالية", "Current Rank")}</span>
              </div>
              <div className="mini-stat" style={{cursor:"pointer"}} onClick={() => nav("/affiliate")}>
                <h3 style={{color:"#d4af37"}}>🔗</h3>
                <span>{t("شبكة الإحالة", "Referral Network")}</span>
              </div>
            </div>
          </div>

          <div className="rank-card">
            <div className="rl">{t("الرتبة الحالية", "Current Rank")}</div>
            <h3>{(() => { const rk = dbRanks.find(r => r.name === currentRankName); return rk?.image ? <img src={rk.image} alt="" style={{width:32,height:32,borderRadius:8,verticalAlign:"middle",marginRight:8,objectFit:"cover"}} /> : null; })()} {currentRankName}</h3>
            <p>{t("استمر في تنمية فريقك لفتح الرتبة التالية.", "Keep growing your team to unlock the next rank.")}</p>
            <div className="next-rank">
              <span>{t("الرتبة التالية", "Next Rank")}</span>
              <strong>{nextRankName}</strong>
            </div>
          </div>
        </section>

        {/* Rank Progress */}
        <section className="dash-section">
          <div className="rank-progress-card">
            <div className="rank-top">
              <div>
                <span className="rl">{t("الرتبة الحالية", "Current Rank")}</span>
                <h2>{(() => { const rk = dbRanks.find(r => r.name === currentRankName); return rk?.image ? <img src={rk.image} alt="" style={{width:36,height:36,borderRadius:10,verticalAlign:"middle",marginRight:8,objectFit:"cover"}} /> : null; })()} {currentRankName}</h2>
              </div>
              <div className="next-rank-box">
                <span>{t("الرتبة التالية", "Next Rank")}</span>
                <strong>{nextRankName}</strong>
              </div>
            </div>
            <div className="rank-progress-info">
              <div className="progress-header">
                <span>{t("التقدم", "Progress")}</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div className="rank-pbar">
                <div className="rank-pfill" style={{width: Math.min(progressPct, 100) + "%"}}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Service Contact */}
        {(csWhatsapp || csEmail) && (
          <section className="dash-section">
            <div className="rank-progress-card">
              <h3 style={{marginBottom:16}}>📞 {t("تواصل مع خدمة العملاء", "Contact Customer Service")}</h3>
              <p style={{fontSize:13,color:c.textMuted,marginBottom:16}}>{t("في حالة وجود أي مشكلة، تواصل معنا", "If you have any issue, contact us")}</p>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                {csWhatsapp && (
                  <a href={`https://wa.me/${csWhatsapp.replace(/[^0-9+]/g, "")}`} target="_blank" rel="noopener noreferrer"
                    style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 20px",borderRadius:12,background:"linear-gradient(135deg,#dcf8c6,#d4edda)",border:"1px solid #b8e6b0",color:"#155724",textDecoration:"none",fontWeight:600,fontSize:14}}>
                    📱 WhatsApp: {csWhatsapp}
                  </a>
                )}
                {csEmail && (
                  <a href={`mailto:${csEmail}`}
                    style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 20px",borderRadius:12,background:c.bgInput,border:`1px solid ${c.border}`,color:c.text,textDecoration:"none",fontWeight:600,fontSize:14}}>
                    📧 {csEmail}
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

       
      </div>

      <footer className="dash-footer">
        <p>© 2026 Everest Academy. All Rights Reserved.</p>
        <div className="footer-links">
          <a href="#">{t("الدعم", "Support")}</a>
          <a href="#">{t("الخصوصية", "Privacy")}</a>
          <a href="#">{t("الشروط", "Terms")}</a>
        </div>
      </footer>
    </div>
  );
}
