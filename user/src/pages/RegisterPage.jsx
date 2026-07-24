import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { api, uploadApi, BACKEND_URL } from "../App";

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
@keyframes regFadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
@keyframes regSlideLeft { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
@keyframes regSlideRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
@keyframes regPulse { 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.3)} 50%{box-shadow:0 0 30px 10px rgba(212,175,55,0.15)} }
@keyframes regFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
`;

const gold = "#d4af37";

const inputStyle = (c) => ({
  width: "100%", padding: "13px 16px", borderRadius: 12,
  background: c.bgCard, border: `2px solid ${c.border}`,
  color: c.text, fontSize: 14, outline: "none", transition: "0.3s",
});

const GOVERNORATES = [
  "القاهرة","الجيزة","الإسكندرية","القليوبية","الدقهلية","الشرقية","الغربية","المنوفية","البحيرة","كفر الشيخ",
  "دمياط","بورسعيد","السويس","الإسماعيلية","شمال سيناء","جنوب سيناء","بني سويف","الفيوم","المنيا","أسيوط",
  "سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح"
];

export default function RegisterPage() {
  const { t, lang } = useLang();
  const { user: authUser, login } = useAuth();
  const { colors: c } = useTheme();
  const nav = useNavigate();
  const m = useIsMobile();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirm: "", address: "", referral_code: "", hasReferral: "no", governorate: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const inputRefs = useRef([]);
  const [idCardFront, setIdCardFront] = useState(null);
  const [idCardBack, setIdCardBack] = useState(null);
  const [idCardFrontFile, setIdCardFrontFile] = useState(null);
  const [idCardBackFile, setIdCardBackFile] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(null);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpWarning, setOtpWarning] = useState("");

  // Redirect browser back to landing page instead of previous history
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const onBack = () => nav("/", { replace: true });
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [nav]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current.forEach(el => { if (el) { el.value = ""; el.removeAttribute("readOnly"); } });
      setForm({ full_name: "", email: "", phone: "", password: "", confirm: "", address: "", referral_code: "", hasReferral: "no", governorate: "" });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setLoading(true);

    // Egyptian phone validation: 010/011/012/015 + 8 digits
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(form.phone)) {
      setErr(t("رقم الهاتف غير صحيح. يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقم.", "Invalid phone number. Must start with 010/011/012/015 and be 11 digits."));
      setLoading(false); return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setErr(t("البريد الإلكتروني غير صحيح.", "Invalid email address."));
      setLoading(false); return;
    }

    // Strong password: min 8 chars, uppercase, lowercase, number, special char
    if (form.password.length < 8) {
      setErr(t("كلمة المرور يجب أن تكون 8 أحرف على الأقل.", "Password must be at least 8 characters."));
      setLoading(false); return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setErr(t("كلمة المرور يجب أن تحتوي على حرف كبير (A-Z).", "Password must contain an uppercase letter (A-Z)."));
      setLoading(false); return;
    }
    if (!/[a-z]/.test(form.password)) {
      setErr(t("كلمة المرور يجب أن تحتوي على حرف صغير (a-z).", "Password must contain a lowercase letter (a-z)."));
      setLoading(false); return;
    }
    if (!/[0-9]/.test(form.password)) {
      setErr(t("كلمة المرور يجب أن تحتوي على رقم.", "Password must contain a number."));
      setLoading(false); return;
    }
    if (!/[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\\/~`]/.test(form.password)) {
      setErr(t("كلمة المرور يجب أن تحتوي على رمز خاص (!@#$%^&*...).", "Password must contain a special character (!@#$%^&*...)."));
      setLoading(false); return;
    }

    if (form.password !== form.confirm) { setErr(t("كلمات المرور غير متطابقة!", "Passwords do not match!")); setLoading(false); return; }
    if (!idCardFront || !idCardBack) { setErr(t("يجب رفع صورة البطاقة الأمامية والخلفية", "Please upload both front and back ID card images")); setLoading(false); return; }
    try {
      const pubUpload = async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${BACKEND_URL}/api/public-upload`, { method: "POST", body: fd });
        if (!res.ok) throw new Error("Image upload failed");
        const data = await res.json();
        return `${BACKEND_URL}${data.url}`;
      };
      const [frontUrl, backUrl] = await Promise.all([
        idCardFrontFile ? pubUpload(idCardFrontFile) : Promise.resolve(idCardFront),
        idCardBackFile ? pubUpload(idCardBackFile) : Promise.resolve(idCardBack)
      ]);
      const body = { full_name: form.full_name, email: form.email, phone: form.phone, password: form.password, referral_code: form.hasReferral === "yes" ? form.referral_code : "", governorate: form.governorate, id_card_front: frontUrl, id_card_back: backUrl };
      await api("/api/auth/register", { method: "POST", body: JSON.stringify(body) });
      nav("/pending-activation", { replace: true });
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const onFocus = (e) => e.target.style.borderColor = gold;
  const onBlur = (e) => e.target.style.borderColor = c.border;

  const handleImageUpload = async (file, setter, fileSetter) => {
    if (!file) return;
    const localPreview = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
    if (localPreview) setter(localPreview);
    if (fileSetter) fileSetter(file);
  };

  const verifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) { setErr(t("أدخل الكود المكون من 6 أرقام", "Enter the 6-digit code")); return; }
    setLoading(true); setErr("");
    try {
      await api("/api/auth/verify-email-otp", { method: "POST", body: JSON.stringify({ email: registeredEmail, otp: otpCode }) });
      nav("/pending-activation", { replace: true });
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const resendOtp = async () => {
    try {
      await api("/api/auth/resend-email-otp", { method: "POST", body: JSON.stringify({ email: registeredEmail }) });
      setOtpWarning(""); setErr(""); alert(t("تم إرسال كود جديد على إيميلك", "New code sent to your email"));
    } catch (e) { setErr(e.message); }
  };

  if (otpStep) {
    const otpInputStyle = { width: "100%", padding: "14px", borderRadius: 12, background: c.bgInput || c.bgCard, border: `2px solid ${c.border}`, color: c.text, fontSize: 22, textAlign: "center", letterSpacing: 12, fontWeight: 700, outline: "none", direction: "ltr" };
    if (m) {
      return (
        <div style={{ minHeight: "100vh", background: c.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 400, background: c.bgCard, borderRadius: 20, border: `1px solid ${c.borderLight}`, padding: "32px 24px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, rgba(212,175,55,.2), rgba(212,175,55,.05))", border: "2px solid rgba(212,175,55,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>📧</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: c.text, marginBottom: 6 }}>{t("تحقق من بريدك", "Verify Your Email")}</h2>
            <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>{t("أرسلنا كود تحقق إلى", "We sent a code to")} <strong style={{ color: gold }}>{registeredEmail}</strong></p>
            {err && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, color: "#ef4444", fontSize: 12 }}>{err}</div>}
            {otpWarning && <div style={{ background: "rgba(234,179,8,.08)", border: "1px solid rgba(234,179,8,.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, color: "#ca8a04", fontSize: 12 }}>{otpWarning}</div>}
            <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" style={otpInputStyle} />
            <button onClick={verifyOtp} disabled={loading} style={{ width: "100%", height: 50, borderRadius: 14, border: "none", marginTop: 16, background: loading ? c.border : `linear-gradient(135deg, ${gold}, ${gold}cc)`, color: "#fff", fontSize: 15, fontWeight: 800, cursor: loading ? "default" : "pointer" }}>
              {loading ? <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} /> : t("تحقق", "Verify")}
            </button>
            <p style={{ fontSize: 12, color: c.textMuted, marginTop: 14 }}>{t("لم تلتقط الكод؟", "Didn't receive the code?")} <button onClick={resendOtp} style={{ background: "none", border: "none", color: gold, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>{t("إعادة إرسال", "Resend")}</button></p>
          </div>
        </div>
      );
    }
    return (
      <div style={{ minHeight: "100vh", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 440, background: c.bgCard, borderRadius: 20, border: `1px solid ${c.borderLight}`, padding: "40px 36px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(212,175,55,.2), rgba(212,175,55,.05))", border: "2px solid rgba(212,175,55,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 32 }}>📧</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: c.text, marginBottom: 6 }}>{t("تحقق من بريدك", "Verify Your Email")}</h2>
          <p style={{ fontSize: 14, color: c.textMuted, marginBottom: 24 }}>{t("أرسلنا كود تحقق إلى", "We sent a code to")} <strong style={{ color: gold }}>{registeredEmail}</strong></p>
          {err && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, color: "#ef4444", fontSize: 13 }}>{err}</div>}
          {otpWarning && <div style={{ background: "rgba(234,179,8,.08)", border: "1px solid rgba(234,179,8,.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, color: "#ca8a04", fontSize: 13 }}>{otpWarning}</div>}
          <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" style={otpInputStyle} />
          <button onClick={verifyOtp} disabled={loading} style={{ width: "100%", height: 52, borderRadius: 14, border: "none", marginTop: 18, background: loading ? c.border : `linear-gradient(135deg, ${gold}, ${gold}cc)`, color: "#fff", fontSize: 15, fontWeight: 800, cursor: loading ? "default" : "pointer" }}>
            {loading ? <div style={{ width: 22, height: 22, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} /> : t("تحقق", "Verify")}
          </button>
          <p style={{ fontSize: 13, color: c.textMuted, marginTop: 16 }}>{t("لم تلتقط الكود؟", "Didn't receive the code?")} <button onClick={resendOtp} style={{ background: "none", border: "none", color: gold, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>{t("إعادة إرسال", "Resend")}</button></p>
        </div>
      </div>
    );
  }

  // ─── MOBILE LAYOUT ───
  if (m) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, display: "flex", flexDirection: "column" }}>

        {/* Gradient Header */}
        <div style={{
          position: "relative", padding: "56px 24px 36px", textAlign: "center", overflow: "hidden",
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

          {/* Orbs */}
          <div style={{ position: "absolute", top: "20%", left: "10%", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,.15) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,.1) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />

          {/* Logo */}
          <div style={{
            width: 72, height: 72, margin: "0 auto 14px", borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(212,175,55,.2), rgba(212,175,55,.05))",
            border: "2px solid rgba(212,175,55,.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img src="/image/logo3.png" alt="Logo" style={{ height: 40, objectFit: "contain" }} />
          </div>

          <h1 style={{
            fontSize: 20, fontWeight: 900, marginBottom: 4,
            background: "linear-gradient(135deg, #d4af37, #f0d060, #d4af37)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>{t("إنشاء حساب جديد", "Create Account")}</h1>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 500 }}>
            {t("انضم الآن إلى أقوى منصة تدريبية", "Join the strongest training platform")}
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          flex: 1, margin: "-18px 14px 24px", padding: "24px 18px",
          background: c.bgCard, borderRadius: 20,
          border: `1px solid ${c.borderLight}`,
          boxShadow: `0 20px 60px ${c.shadow}`,
        }}>

          {/* Error */}
          {err && (
            <div style={{
              background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
              borderRadius: 12, padding: "10px 14px", marginBottom: 14,
              color: c.error || "#ef4444", fontSize: 12, textAlign: "center",
            }}>⚠️ {err}</div>
          )}

          <form onSubmit={submit} autoComplete="off">
            {/* Full Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("الاسم بالكامل", "Full Name")}
              </label>
              <input type="text" required placeholder={t("أدخل اسمك", "Enter name")}
                ref={el => inputRefs.current[0] = el} readOnly autoComplete="off"
                value={form.full_name} onChange={(e) => setField("full_name", e.target.value)}
                style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: c.bgInput, border: `2px solid ${c.border}`, color: c.text, fontSize: 14, outline: "none", transition: "0.3s", boxSizing: "border-box" }}
                onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("رقم الهاتف", "Phone")}
              </label>
              <input type="tel" required placeholder="01xxxxxxxxx"
                ref={el => inputRefs.current[1] = el} readOnly autoComplete="off"
                value={form.phone} onChange={(e) => setField("phone", e.target.value)}
                style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: c.bgInput, border: `2px solid ${c.border}`, color: c.text, fontSize: 14, outline: "none", transition: "0.3s", boxSizing: "border-box" }}
                onFocus={onFocus} onBlur={onBlur} />
              <p style={{ fontSize: 10, color: c.textMuted, marginTop: 4 }}>{t("010 / 011 / 012 / 015 — 11 رقم", "010 / 011 / 012 / 015 — 11 digits")}</p>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("البريد الإلكتروني", "Email")}
              </label>
              <input type="email" required placeholder="mail@example.com"
                ref={el => inputRefs.current[2] = el} readOnly autoComplete="off"
                value={form.email} onChange={(e) => setField("email", e.target.value)}
                style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: c.bgInput, border: `2px solid ${c.border}`, color: c.text, fontSize: 14, outline: "none", transition: "0.3s", boxSizing: "border-box" }}
                onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("كلمة المرور", "Password")}
              </label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} required placeholder="••••••••"
                  ref={el => inputRefs.current[3] = el} readOnly autoComplete="new-password"
                  value={form.password} onChange={(e) => setField("password", e.target.value)}
                  style={{ width: "100%", padding: "13px 44px 13px 14px", borderRadius: 12, background: c.bgInput, border: `2px solid ${c.border}`, color: c.text, fontSize: 14, outline: "none", transition: "0.3s", boxSizing: "border-box" }}
                  onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: c.textMuted, padding: 4 }}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("تأكيد كلمة المرور", "Confirm Password")}
              </label>
              <input type={showPass ? "text" : "password"} required placeholder="••••••••"
                ref={el => inputRefs.current[4] = el} readOnly autoComplete="new-password"
                value={form.confirm} onChange={(e) => setField("confirm", e.target.value)}
                style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: c.bgInput, border: `2px solid ${c.border}`, color: c.text, fontSize: 14, outline: "none", transition: "0.3s", boxSizing: "border-box" }}
                onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Password strength */}
            {form.password.length > 0 && (
              <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 10, background: c.bgInput, border: `1px solid ${c.border}` }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 10 }}>
                  {[
                    { ok: form.password.length >= 8, label: t("8 أحرف+", "8+ chars") },
                    { ok: /[A-Z]/.test(form.password), label: t("كبير", "UP") },
                    { ok: /[a-z]/.test(form.password), label: t("صغير", "lo") },
                    { ok: /[0-9]/.test(form.password), label: t("رقم", "#") },
                    { ok: /[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\\/~`]/.test(form.password), label: t("رمز", "!@") },
                  ].map((r, i) => (
                    <span key={i} style={{ padding: "2px 7px", borderRadius: 5, fontWeight: 600, background: r.ok ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.08)", color: r.ok ? "#22c55e" : "#ef4444", border: `1px solid ${r.ok ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.15)"}` }}>
                      {r.ok ? "✓" : "✗"} {r.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Governorate */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("المحافظة", "Governorate")}
              </label>
              <select required value={form.governorate} onChange={(e) => setField("governorate", e.target.value)}
                style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: c.bgInput, border: `2px solid ${c.border}`, color: c.text, fontSize: 14, outline: "none", transition: "0.3s", boxSizing: "border-box" }}
                onFocus={onFocus} onBlur={onBlur}>
                <option value="">{t("اختر المحافظة", "Select Governorate")}</option>
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* ID Card Front */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("صورة البطاقة (أمامي)", "ID Card (Front)")}
              </label>
              {idCardFront ? (
                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `2px solid #22c55e` }}>
                  <img src={idCardFront} alt="ID Front" style={{ width: "100%", maxHeight: 160, objectFit: "contain", background: "#000", display: "block" }} />
                  <button type="button" onClick={() => setIdCardFront(null)} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(239,68,68,.9)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              ) : (
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, background: c.bgInput, border: `2px dashed ${c.border}`, color: c.textMuted, fontSize: 13, cursor: "pointer", transition: "0.3s" }}>
                  <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(e.target.files[0], setIdCardFront, setIdCardFrontFile)} />
                  {uploadingImg === setIdCardFront ? "⏳" : "📷 " + t("اضغط لرفع الصورة", "Tap to upload")}
                </label>
              )}
            </div>

            {/* ID Card Back */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("صورة البطاقة (خلفي)", "ID Card (Back)")}
              </label>
              {idCardBack ? (
                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `2px solid #22c55e` }}>
                  <img src={idCardBack} alt="ID Back" style={{ width: "100%", maxHeight: 160, objectFit: "contain", background: "#000", display: "block" }} />
                  <button type="button" onClick={() => setIdCardBack(null)} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(239,68,68,.9)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              ) : (
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, background: c.bgInput, border: `2px dashed ${c.border}`, color: c.textMuted, fontSize: 13, cursor: "pointer", transition: "0.3s" }}>
                  <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(e.target.files[0], setIdCardBack, setIdCardBackFile)} />
                    {uploadingImg === setIdCardBack ? "⏳" : "📷 " + t("اضغط لرفع الصورة", "Tap to upload")}
                </label>
              )}
            </div>

            {/* Referral */}
            <div style={{
              background: c.bgInput, border: `1px solid ${c.border}`, borderRadius: 14,
              padding: "14px", marginBottom: 18,
            }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>
                {t("هل لديك كود إحالة؟", "Referral code?")}
              </span>
              <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: c.text }}>
                  <input type="radio" name="ref" value="yes" checked={form.hasReferral === "yes"} onChange={() => setField("hasReferral", "yes")} style={{ accentColor: gold }} />
                  {t("نعم", "Yes")}
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: c.text }}>
                  <input type="radio" name="ref" value="no" checked={form.hasReferral === "no"} onChange={() => setField("hasReferral", "no")} style={{ accentColor: gold }} />
                  {t("لا", "No")}
                </label>
              </div>
              <div style={{
                maxHeight: form.hasReferral === "yes" ? 52 : 0, overflow: "hidden",
                transition: "all .3s ease", opacity: form.hasReferral === "yes" ? 1 : 0,
              }}>
                <input type="text" placeholder={t("أدخل كود الإحالة", "Enter referral code")}
                  value={form.referral_code} onChange={(e) => setField("referral_code", e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: c.bgCard, border: `2px solid ${c.border}`, color: c.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: "100%", height: 52, borderRadius: 14, border: "none",
                cursor: loading ? "default" : "pointer",
                background: loading ? c.border : `linear-gradient(135deg, ${gold}, ${gold}cc)`,
                color: "#fff", fontSize: 15, fontWeight: 800,
                boxShadow: loading ? "none" : `0 8px 30px rgba(212,175,55,.3)`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              {loading ? (
                <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
              ) : <>🚀 {t("إنشاء حساب", "Create Account")}</>}
            </button>
          </form>

          {/* Login link */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <p style={{ fontSize: 13, color: c.textMuted }}>
              {t("لديك حساب بالفعل؟", "Already have an account?")}{" "}
              <Link to="/login" style={{ color: gold, textDecoration: "none", fontWeight: 700 }}>
                {t("تسجيل الدخول", "Login")}
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
          <div style={{ position: "absolute", top: "10%", left: "15%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,.12) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "25%", right: "10%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,.08) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "55%", left: "55%", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,.08) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

          {/* Spinning rings */}
          <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", border: "1px dashed rgba(212,175,55,.08)", animation: "spin 30s linear infinite" }} />
          <div style={{ position: "absolute", width: 480, height: 480, borderRadius: "50%", border: "1px dashed rgba(34,197,94,.06)", animation: "spin 40s linear infinite reverse" }} />

          {/* Main image */}
          <div style={{ position: "relative", zIndex: 2, animation: "regSlideLeft 0.8s ease-out" }}>
            <div style={{
              width: 350, height: 350, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(212,175,55,.15), rgba(212,175,55,.03))",
              border: "2px solid rgba(212,175,55,.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "regPulse 4s ease-in-out infinite",
              position: "relative",
            }}>
              <div style={{ position: "absolute", inset: -15, borderRadius: "50%", border: "1px dashed rgba(212,175,55,.1)", animation: "spin 20s linear infinite" }} />
              <img
                src="/image/ChatGPT_Image_Jun_15__2026__04_00_05_AM-removebg-preview.png"
                alt="Everest Academy"
                style={{
                  width: 290, height: 290, objectFit: "contain",
                  filter: "drop-shadow(0 20px 50px rgba(212,175,55,.2))",
                  animation: "regFloat 5s ease-in-out infinite",
                }}
              />
            </div>
          </div>

          {/* Brand text */}
          <div style={{ position: "relative", zIndex: 2, textAlign: "center", marginTop: 32, animation: "regFadeIn 0.8s ease-out 0.3s both" }}>
          
          </div>

          {/* Floating dots */}
          {[
            { top: "12%", left: "22%", size: 5, delay: "0s", dur: "3s" },
            { top: "35%", right: "20%", size: 4, delay: "1s", dur: "4s" },
            { bottom: "18%", left: "28%", size: 6, delay: "0.5s", dur: "3.5s" },
            { top: "65%", left: "10%", size: 3, delay: "1.5s", dur: "4.5s" },
          ].map((d, i) => (
            <div key={i} style={{
              position: "absolute", ...d, width: d.size, height: d.size,
              borderRadius: "50%", background: gold, opacity: .25,
              animation: `regFloat ${d.dur} ease-in-out infinite ${d.delay}`,
              pointerEvents: "none",
            }} />
          ))}
        </div>

        {/* Right Panel — Register Form */}
        <div style={{
          flex: "0 0 52%", minWidth: 480, maxWidth: 640,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "40px 50px",
          background: c.bg, overflowY: "auto",
          animation: "regSlideRight 0.8s ease-out",
        }}>

          {/* Back link */}
          <div style={{ position: "absolute", top: 30, left: lang === "ar" ? 30 : "auto", right: lang === "ar" ? "auto" : 30, zIndex: 10 }}>
            <Link to="/" style={{
              display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
              color: c.textMuted, fontSize: 14, fontWeight: 600,
              padding: "8px 16px", borderRadius: 12, background: c.bgCard, border: `1px solid ${c.border}`, transition: "0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = gold; e.currentTarget.style.color = gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textMuted; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              {t("العودة", "Back")}
            </Link>
          </div>

          <div style={{ width: "100%", maxWidth: 480 }}>
            {/* Logo & Title */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <img src="/image/logo3.png" alt="Logo" style={{ height: 60, marginBottom: 12 }} />
              <h1 style={{ fontSize: 24, fontWeight: 900, color: c.text, marginBottom: 4 }}>
                {t("إنشاء حساب جديد", "Create Account")}
              </h1>
              <p style={{ color: c.textMuted, fontSize: 14 }}>
                {t("سجل الآن للانضمام إلى أقوى منصة تدريبية", "Register to join the strongest training platform")}
              </p>
            </div>

            {/* Error */}
            {err && (
              <div style={{
                background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
                borderRadius: 12, padding: "10px 14px", marginBottom: 16,
                color: c.error || "#ef4444", fontSize: 13, textAlign: "center",
              }}>⚠️ {err}</div>
            )}

            {/* Form */}
            <form onSubmit={submit} autoComplete="off">
              {/* Row 1: Name + Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                    {t("الاسم بالكامل", "Full Name")}
                  </label>
                  <input type="text" required placeholder={t("أدخل اسمك", "Enter name")} ref={el => inputRefs.current[0] = el} readOnly autoComplete="off" value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} style={inputStyle(c)} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                    {t("رقم الهاتف", "Phone")}
                  </label>
                  <input type="tel" required placeholder="01xxxxxxxxx" ref={el => inputRefs.current[1] = el} readOnly autoComplete="off" value={form.phone} onChange={(e) => setField("phone", e.target.value)} style={inputStyle(c)} onFocus={onFocus} onBlur={onBlur} />
                  <p style={{fontSize:10,color:c.textMuted,marginTop:4}}>{t("010 / 011 / 012 / 015 — 11 رقم", "010 / 011 / 012 / 015 — 11 digits")}</p>
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                  {t("البريد الإلكتروني", "Email")}
                </label>
                <input type="email" required placeholder="mail@example.com" ref={el => inputRefs.current[2] = el} readOnly autoComplete="off" value={form.email} onChange={(e) => setField("email", e.target.value)} style={inputStyle(c)} onFocus={onFocus} onBlur={onBlur} />
              </div>

              {/* Row 2: Password + Confirm */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 10 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                    {t("كلمة المرور", "Password")}
                  </label>
                  <input type={showPass ? "text" : "password"} required placeholder="••••••••" ref={el => inputRefs.current[3] = el} readOnly autoComplete="new-password" value={form.password} onChange={(e) => setField("password", e.target.value)} style={inputStyle(c)} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                    {t("تأكيد كلمة المرور", "Confirm")}
                  </label>
                  <input type={showPass ? "text" : "password"} required placeholder="••••••••" ref={el => inputRefs.current[4] = el} readOnly autoComplete="new-password" value={form.confirm} onChange={(e) => setField("confirm", e.target.value)} style={inputStyle(c)} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              {/* Password strength indicator */}
              {form.password.length > 0 && (
                <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: c.bgCard, border: `1px solid ${c.border}` }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11 }}>
                    {[
                      { ok: form.password.length >= 8, label: t("8 أحرف+", "8+ chars") },
                      { ok: /[A-Z]/.test(form.password), label: t("حرف كبير", "Uppercase") },
                      { ok: /[a-z]/.test(form.password), label: t("حرف صغير", "Lowercase") },
                      { ok: /[0-9]/.test(form.password), label: t("رقم", "Number") },
                      { ok: /[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\\/~`]/.test(form.password), label: t("رمز خاص", "Special") },
                    ].map((r, i) => (
                      <span key={i} style={{ padding: "3px 8px", borderRadius: 6, fontWeight: 600, background: r.ok ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.08)", color: r.ok ? "#22c55e" : "#ef4444", border: `1px solid ${r.ok ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.15)"}` }}>
                        {r.ok ? "✓" : "✗"} {r.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Show password */}
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 14 }}>
                <input type="checkbox" checked={showPass} onChange={() => setShowPass(!showPass)} style={{ width: 15, height: 15, accentColor: gold }} />
                <span style={{ fontSize: 12, color: c.textSoft }}>{t("إظهار كلمة المرور", "Show Password")}</span>
              </label>

              {/* Governorate */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                  {t("المحافظة", "Governorate")}
                </label>
                <select required value={form.governorate} onChange={(e) => setField("governorate", e.target.value)} style={{ ...inputStyle(c), cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">{t("اختر المحافظة", "Select Governorate")}</option>
                  {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* ID Card Front */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                  {t("صورة البطاقة (أمامي)", "ID Card (Front)")}
                </label>
                {idCardFront ? (
                  <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `2px solid #22c55e` }}>
                    <img src={idCardFront} alt="ID Front" style={{ width: "100%", maxHeight: 180, objectFit: "contain", background: "#000", display: "block" }} />
                    <button type="button" onClick={() => setIdCardFront(null)} style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%", background: "rgba(239,68,68,.9)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                ) : (
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 12, background: c.bgInput, border: `2px dashed ${c.border}`, color: c.textMuted, fontSize: 13, cursor: "pointer", transition: "0.3s" }}>
                    <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(e.target.files[0], setIdCardFront, setIdCardFrontFile)} />
                    {uploadingImg === setIdCardFront ? "⏳" : "📷 " + t("اضغط لرفع الصورة", "Click to upload")}
                  </label>
                )}
              </div>

              {/* ID Card Back */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                  {t("صورة البطاقة (خلفي)", "ID Card (Back)")}
                </label>
                {idCardBack ? (
                  <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `2px solid #22c55e` }}>
                    <img src={idCardBack} alt="ID Back" style={{ width: "100%", maxHeight: 180, objectFit: "contain", background: "#000", display: "block" }} />
                    <button type="button" onClick={() => setIdCardBack(null)} style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%", background: "rgba(239,68,68,.9)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                ) : (
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 12, background: c.bgInput, border: `2px dashed ${c.border}`, color: c.textMuted, fontSize: 13, cursor: "pointer", transition: "0.3s" }}>
                  <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(e.target.files[0], setIdCardBack, setIdCardBackFile)} />
                    {uploadingImg === setIdCardBack ? "⏳" : "📷 " + t("اضغط لرفع الصورة", "Click to upload")}
                  </label>
                )}
              </div>

              {/* Referral */}
              <div style={{
                background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 14,
                padding: "14px 16px", marginBottom: 20,
              }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>
                  {t("هل لديك كود إحالة؟", "Do you have a referral code?")}
                </span>
                <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: c.text }}>
                    <input type="radio" name="ref" value="yes" checked={form.hasReferral === "yes"} onChange={() => setField("hasReferral", "yes")} style={{ accentColor: gold }} />
                    {t("نعم", "Yes")}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: c.text }}>
                    <input type="radio" name="ref" value="no" checked={form.hasReferral === "no"} onChange={() => setField("hasReferral", "no")} style={{ accentColor: gold }} />
                    {t("لا", "No")}
                  </label>
                </div>
                <div style={{
                  maxHeight: form.hasReferral === "yes" ? 60 : 0, overflow: "hidden",
                  transition: "all .3s ease", opacity: form.hasReferral === "yes" ? 1 : 0,
                }}>
                  <input type="text" placeholder={t("أدخل كود الإحالة", "Enter referral code")} value={form.referral_code} onChange={(e) => setField("referral_code", e.target.value)} style={{ ...inputStyle(c), marginBottom: 0 }} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", height: 52, borderRadius: 14, border: "none",
                  cursor: loading ? "default" : "pointer",
                  background: loading ? c.border : `linear-gradient(135deg, ${gold}, ${gold}cc)`,
                  color: "#fff", fontSize: 15, fontWeight: 800,
                  boxShadow: loading ? "none" : `0 8px 30px rgba(212,175,55,.3)`,
                  transition: "all .3s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(212,175,55,.45)"; } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 8px 30px rgba(212,175,55,.3)`; } }}
              >
                {loading ? (
                  <div style={{ width: 22, height: 22, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                ) : <>🚀 {t("إنشاء حساب", "Create Account")}</>}
              </button>
            </form>

            {/* Login link */}
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <p style={{ fontSize: 14, color: c.textMuted }}>
                {t("لديك حساب بالفعل؟", "Already have an account?")}{" "}
                <Link to="/login" style={{ color: gold, textDecoration: "none", fontWeight: 700 }}>
                  {t("تسجيل الدخول", "Login")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
