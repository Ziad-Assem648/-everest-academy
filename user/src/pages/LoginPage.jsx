import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { api } from "../App";

const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== "undefined" && window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
};

const keyframes = `
@keyframes loginFadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
@keyframes loginSlideLeft { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
@keyframes loginSlideRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
@keyframes loginPulse { 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.3)} 50%{box-shadow:0 0 30px 10px rgba(212,175,55,0.15)} }
@keyframes loginFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
`;

export default function LoginPage() {
  const { t, lang } = useLang();
  const { user: authUser, login } = useAuth();
  const { theme, colors: c } = useTheme();
  const nav = useNavigate();
  const m = useIsMobile();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const passRef = useRef(null);

  // Redirect browser back to landing page instead of previous history
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const onBack = () => nav("/", { replace: true });
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [nav]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailRef.current) { emailRef.current.value = ""; emailRef.current.removeAttribute("readOnly"); }
      if (passRef.current) { passRef.current.value = ""; passRef.current.removeAttribute("readOnly"); }
      setForm({ email: "", password: "" });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      const { user, session_token } = await api("/api/auth/login", { method: "POST", body: JSON.stringify(form) });
      login(user, session_token);
      setForm({ email: "", password: "" });
      // Replace history so user can't go back to login
      window.history.replaceState(null, "", "/home");
      nav("/home", { replace: true });
    } catch (e) {
      setErr(t(e.message || "بيانات الدخول غير صحيحة", e.message || "Invalid login credentials"));
    }
    setLoading(false);
  };

  const gold = "#d4af37";

  // ─── MOBILE LAYOUT ───
  if (m) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, display: "flex", flexDirection: "column" }}>

        {/* Gradient Header */}
        <div style={{
          position: "relative", padding: "60px 24px 40px", textAlign: "center", overflow: "hidden",
          background: "linear-gradient(160deg, #0a0a12 0%, #12101e 40%, #1a1428 70%, #0d0b16 100%)",
          borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
        }}>
          {/* Back button */}
          <Link to="/" style={{
            position: "absolute", top: 16, left: 16, zIndex: 5,
            display: "flex", alignItems: "center", gap: 6, textDecoration: "none",
            color: "rgba(255,255,255,.6)", fontSize: 13, fontWeight: 600,
            padding: "6px 12px", borderRadius: 10,
            background: "rgba(255,255,255,.06)", backdropFilter: "blur(8px)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            {t("العودة", "Back")}
          </Link>

          {/* Orb decorations */}
          <div style={{ position: "absolute", top: "20%", left: "10%", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,.15) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.1) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />

          {/* Logo */}
          <div style={{
            width: 80, height: 80, margin: "0 auto 16px", borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(212,175,55,.2), rgba(212,175,55,.05))",
            border: "2px solid rgba(212,175,55,.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img src="/image/logo3.png" alt="Logo" style={{ height: 44, objectFit: "contain" }} />
          </div>

          <h1 style={{
            fontSize: 22, fontWeight: 900, marginBottom: 6,
            background: "linear-gradient(135deg, #d4af37, #f0d060, #d4af37)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Everest Academy</h1>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, fontWeight: 500 }}>
            {t("مرحباً بك مجدداً", "Welcome Back")}
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          flex: 1, margin: "-20px 16px 24px", padding: "28px 20px",
          background: c.bgCard, borderRadius: 20,
          border: `1px solid ${c.borderLight}`,
          boxShadow: `0 20px 60px ${c.shadow}`,
        }}>

          {/* Error */}
          {err && (
            <div style={{
              background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
              borderRadius: 12, padding: "10px 14px", marginBottom: 16,
              color: c.error || "#ef4444", fontSize: 13, textAlign: "center",
            }}>⚠️ {err}</div>
          )}

          <form onSubmit={submit} autoComplete="off">
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("البريد الإلكتروني / الهاتف", "Email / Phone")}
              </label>
              <input
                type="text" required
                placeholder={t("أدخل بريدك أو رقم الهاتف", "Enter email or phone")}
                ref={emailRef} readOnly autoComplete="off"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 14,
                  background: c.bgInput, border: `2px solid ${c.border}`,
                  color: c.text, fontSize: 15, outline: "none", transition: "0.3s", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = gold}
                onBlur={e => e.target.style.borderColor = c.border}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("كلمة المرور", "Password")}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"} required
                  placeholder="••••••••"
                  ref={passRef} readOnly autoComplete="new-password"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{
                    width: "100%", padding: "14px 48px 14px 16px", borderRadius: 14,
                    background: c.bgInput, border: `2px solid ${c.border}`,
                    color: c.text, fontSize: 15, outline: "none", transition: "0.3s", boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = gold}
                  onBlur={e => e.target.style.borderColor = c.border}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", fontSize: 18,
                    color: c.textMuted, padding: 4,
                  }}
                >{showPass ? "🙈" : "👁"}</button>
              </div>
            </div>

            {/* Show password + forgot */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={showPass} onChange={() => setShowPass(!showPass)}
                  style={{ width: 15, height: 15, accentColor: gold }} />
                <span style={{ fontSize: 12, color: c.textSoft }}>{t("إظهار الباسورد", "Show")}</span>
              </label>
              <a href="#" style={{ fontSize: 12, color: gold, textDecoration: "none", fontWeight: 600 }}>
                {t("نسيت كلمة المرور؟", "Forgot?")}
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", height: 52, borderRadius: 14, border: "none",
                cursor: loading ? "default" : "pointer",
                background: loading ? c.border : `linear-gradient(135deg, ${gold}, ${gold}cc)`,
                color: "#fff", fontSize: 16, fontWeight: 800,
                boxShadow: loading ? "none" : `0 8px 30px rgba(212,175,55,.3)`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? (
                <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
              ) : <>🔑 {t("تسجيل الدخول", "Login")}</>}
            </button>
          </form>

          {/* Register link */}
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <p style={{ fontSize: 14, color: c.textMuted }}>
              {t("ليس لديك حساب؟", "Don't have an account?")}{" "}
              <Link to="/register" style={{ color: gold, textDecoration: "none", fontWeight: 700 }}>
                {t("سجل الآن", "Register")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── DESKTOP / TABLET LAYOUT ───
  return (
    <>
      <style>{keyframes}</style>
      <div style={{
        minHeight: "100vh", display: "flex", direction: lang === "ar" ? "rtl" : "ltr",
        background: c.bg, overflow: "hidden",
      }}>

        {/* Left Panel — Image & Branding */}
        <div style={{
          flex: 1, position: "relative", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", overflow: "hidden",
          background: `linear-gradient(135deg, #0a0a12 0%, #12101e 40%, #1a1428 70%, #0d0b16 100%)`,
        }}>
          {/* Background orbs */}
          <div style={{ position: "absolute", top: "15%", left: "10%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,.12) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "20%", right: "15%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(73,94,233,.1) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "50%", left: "60%", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,.08) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

          {/* Spinning decorative ring */}
          <div style={{
            position: "absolute", width: 400, height: 400, borderRadius: "50%",
            border: "1px dashed rgba(212,175,55,.08)",
            animation: "spin 30s linear infinite",
          }} />
          <div style={{
            position: "absolute", width: 500, height: 500, borderRadius: "50%",
            border: "1px dashed rgba(212,175,255,.05)",
            animation: "spin 45s linear infinite reverse",
          }} />

          {/* Main image */}
          <div style={{
            position: "relative", zIndex: 2, animation: "loginSlideLeft 0.8s ease-out",
          }}>
            <div style={{
              width: 380, height: 380, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(212,175,55,.15), rgba(212,175,55,.03))",
              border: "2px solid rgba(212,175,55,.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "loginPulse 4s ease-in-out infinite",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", inset: -15, borderRadius: "50%",
                border: "1px dashed rgba(212,175,55,.1)",
                animation: "spin 20s linear infinite",
              }} />
              <img
                src="/image/ChatGPT_Image_Jun_15__2026__04_00_05_AM-removebg-preview.png"
                alt="Everest Academy"
                style={{
                  width: 320, height: 320, objectFit: "contain",
                  filter: "drop-shadow(0 20px 50px rgba(212,175,55,.2))",
                  animation: "loginFloat 5s ease-in-out infinite",
                }}
              />
            </div>
          </div>

          {/* Brand text below image */}
          <div style={{
            position: "relative", zIndex: 2, textAlign: "center", marginTop: 36,
            animation: "loginFadeIn 0.8s ease-out 0.3s both",
          }}>
          
          
          </div>

          {/* Floating dots */}
          {[
            { top: "10%", left: "20%", size: 6, delay: "0s", dur: "3s" },
            { top: "30%", right: "25%", size: 4, delay: "1s", dur: "4s" },
            { bottom: "15%", left: "30%", size: 5, delay: "0.5s", dur: "3.5s" },
            { top: "60%", left: "8%", size: 3, delay: "1.5s", dur: "4.5s" },
            { bottom: "30%", right: "10%", size: 4, delay: "2s", dur: "3s" },
          ].map((d, i) => (
            <div key={i} style={{
              position: "absolute", ...d, width: d.size, height: d.size,
              borderRadius: "50%", background: gold, opacity: .3,
              animation: `loginFloat ${d.dur} ease-in-out infinite ${d.delay}`,
              pointerEvents: "none",
            }} />
          ))}
        </div>

        {/* Right Panel — Login Form */}
        <div style={{
          width: "48%", minWidth: 440, maxWidth: 560,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "50px 60px",
          background: c.bg,
          position: "relative",
          animation: "loginSlideRight 0.8s ease-out",
        }}>

          {/* Back link */}
          <div style={{ position: "absolute", top: 30, left: lang === "ar" ? 30 : "auto", right: lang === "ar" ? "auto" : 30 }}>
            <Link to="/" style={{
              display: "flex", alignItems: "center", gap: 8,
              textDecoration: "none", color: c.textMuted, fontSize: 14, fontWeight: 600,
              padding: "8px 16px", borderRadius: 12,
              background: c.bgCard, border: `1px solid ${c.border}`,
              transition: "0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = gold; e.currentTarget.style.color = gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textMuted; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              {t("العودة", "Back")}
            </Link>
          </div>

          {/* Form card */}
          <div style={{ width: "100%", maxWidth: 420 }}>
            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <img src="/image/logo3.png" alt="Logo" style={{ height: 70, marginBottom: 16 }} />
              <h1 style={{
                fontSize: 28, fontWeight: 900, color: c.text, marginBottom: 6,
              }}>{t("مرحباً بك مجدداً", "Welcome Back")}</h1>
              <p style={{ color: c.textMuted, fontSize: 15 }}>
                {t("سجل دخولك للوصول إلى حسابك", "Sign in to access your account")}
              </p>
            </div>

            {/* Error */}
            {err && (
              <div style={{
                background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
                borderRadius: 12, padding: "12px 16px", marginBottom: 20,
                color: c.error || "#ef4444", fontSize: 13, textAlign: "center",
              }}>
                ⚠️ {err}
              </div>
            )}

            {/* Form */}
            <form onSubmit={submit} autoComplete="off">
              {/* Email */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: c.text }}>
                  {t("البريد الإلكتروني / الهاتف", "Email / Phone")}
                </label>
                <input
                  type="text" required
                  placeholder={t("أدخل بريدك الإلكتروني أو رقم الهاتف", "Enter your email or phone")}
                  ref={emailRef} readOnly autoComplete="off"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: "100%", padding: "14px 18px", borderRadius: 14,
                    background: c.bgCard, border: `2px solid ${c.border}`,
                    color: c.text, fontSize: 15, outline: "none", transition: "0.3s",
                  }}
                  onFocus={e => e.target.style.borderColor = gold}
                  onBlur={e => e.target.style.borderColor = c.border}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: c.text }}>
                  {t("كلمة المرور", "Password")}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"} required
                    placeholder="••••••••"
                    ref={passRef} readOnly autoComplete="new-password"
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={{
                      width: "100%", padding: "14px 50px 14px 18px", borderRadius: 14,
                      background: c.bgCard, border: `2px solid ${c.border}`,
                      color: c.text, fontSize: 15, outline: "none", transition: "0.3s",
                    }}
                    onFocus={e => e.target.style.borderColor = gold}
                    onBlur={e => e.target.style.borderColor = c.border}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", fontSize: 18,
                      color: c.textMuted, padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {/* Options row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={showPass} onChange={() => setShowPass(!showPass)}
                    style={{ width: 16, height: 16, accentColor: gold }} />
                  <span style={{ fontSize: 13, color: c.textSoft }}>{t("إظهار الباسورد", "Show Password")}</span>
                </label>
                <a href="#" style={{ fontSize: 13, color: gold, textDecoration: "none", fontWeight: 600 }}>
                  {t("نسيت كلمة المرور؟", "Forgot Password?")}
                </a>
              </div>

              {/* Submit button */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", height: 54, borderRadius: 14, border: "none", cursor: loading ? "default" : "pointer",
                  background: loading ? c.border : `linear-gradient(135deg, ${gold}, ${gold}cc)`,
                  color: "#fff", fontSize: 16, fontWeight: 800,
                  boxShadow: loading ? "none" : `0 8px 30px rgba(212,175,55,.3)`,
                  transition: "all .3s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(212,175,55,.45)"; } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 8px 30px rgba(212,175,55,.3)`; } }}
              >
                {loading ? (
                  <div style={{ width: 22, height: 22, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                ) : (
                  <>
                    🔑 {t("تسجيل الدخول", "Login")}
                  </>
                )}
              </button>
            </form>

            {/* Register link */}
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <p style={{ fontSize: 14, color: c.textMuted }}>
                {t("ليس لديك حساب؟", "Don't have an account?")}{" "}
                <Link to="/register" style={{ color: gold, textDecoration: "none", fontWeight: 700 }}>
                  {t("سجل الآن مجاناً", "Register Now")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
