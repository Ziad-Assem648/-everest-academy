import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { api, uploadApi, BACKEND_URL } from "../App";
import { ALL_COUNTRIES, COUNTRY_CODE_MAP } from "../countryData.js";

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
@keyframes regPulse { 0%,100%{box-shadow:0 0 0 0 rgba(110,59,242,0.3)} 50%{box-shadow:0 0 30px 10px rgba(110,59,242,0.15)} }
@keyframes regFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
`;

const gold = "#6E3BF2";

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

const ARAB_COUNTRIES = ALL_COUNTRIES;

export default function RegisterPage() {
  const { t, lang } = useLang();
  const { user: authUser, login } = useAuth();
  const { colors: c } = useTheme();
  const nav = useNavigate();
  const m = useIsMobile();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirm: "", address: "", referral_code: "", hasReferral: "no", governorate: "", country: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const inputRefs = useRef([]);
  const [idCard, setIdCard] = useState(null);
  const [countryCode, setCountryCode] = useState("+20");
  const [countrySearch, setCountrySearch] = useState("");
  const [uploadingImg, setUploadingImg] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Redirect browser back to landing page instead of previous history
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const onBack = () => nav("/", { replace: true });
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [nav]);

  useEffect(() => {
    const stored = localStorage.getItem("everest_referral_code") || "";
    const timer = setTimeout(() => {
      inputRefs.current.forEach(el => { if (el) { el.value = ""; el.removeAttribute("readOnly"); } });
      setForm({ full_name: "", email: "", phone: "", password: "", confirm: "", address: "", referral_code: stored, hasReferral: stored ? "yes" : "no", governorate: "" });
      if (stored) localStorage.removeItem("everest_referral_code");
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setLoading(true);

    if (!form.phone.trim()) {
      setErr(t("يرجى إدخال رقم الهاتف", "Please enter a phone number"));
      setLoading(false); return;
    }
    const cleanedPhone = form.phone.replace(/\D/g, "");
    const codeInfo = COUNTRY_CODE_MAP[countryCode];
    if (codeInfo && !codeInfo.regex.test(cleanedPhone)) {
      setErr(t(`رقم الهاتف غير صحيح لـ ${codeInfo.name}. ${codeInfo.hint}`, `Invalid phone number for ${codeInfo.name}. ${codeInfo.hint}`));
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

    if (!idCard) { setErr(t("يرجى رفع صورة البطاقة أو الباسبور", "Please upload your ID or passport image")); setLoading(false); return; }
    try {
      const fullPhone = countryCode + form.phone;
      const body = { full_name: form.full_name, email: form.email, phone: fullPhone, password: form.password, referral_code: form.hasReferral === "yes" ? form.referral_code : "", governorate: form.governorate, country: form.country, id_card: idCard };
      await api("/api/auth/register", { method: "POST", body: JSON.stringify(body) });
      setRegisteredEmail(form.email);
      nav("/pending-activation", { replace: true, state: { email: form.email } });
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const onFocus = (e) => e.target.style.borderColor = gold;
  const onBlur = (e) => e.target.style.borderColor = c.border;

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const max = 800;
          let w = img.width, h = img.height;
          if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.7);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const resendVerification = async () => {
    try {
      await api("/api/auth/resend-email-otp", { method: "POST", body: JSON.stringify({ email: registeredEmail }) });
      setErr(""); alert(t("تم إرسال رمز التحقق إلى بريدك الإلكتروني", "Verification code sent to your email"));
    } catch (e) { setErr(e.message); }
  };

  const handleImageUpload = async (file, setter) => {
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setter(localPreview);
    try {
      const blob = await compressImage(file);
      const fd = new FormData();
      fd.append("file", blob, "photo.jpg");
      const uploadUrl = window.location.origin.includes("localhost") ? `${BACKEND_URL}/api/public-upload` : '/upload.php';
      const res = await fetch(uploadUrl, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setter(data.url.startsWith("http") ? data.url : `${BACKEND_URL}${data.url}`);
    } catch (e) { console.error("Upload failed:", e); }
  };

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
          <div style={{ position: "absolute", top: "20%", left: "10%", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,59,242,.15) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,.1) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />

          {/* Logo */}
          <div style={{
            width: 72, height: 72, margin: "0 auto 14px", borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(110,59,242,.2), rgba(110,59,242,.05))",
            border: "2px solid rgba(110,59,242,.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img src="/image/logo3.png" alt="Logo" style={{ height: 40, objectFit: "contain" }} />
          </div>

          <h1 style={{
            fontSize: 20, fontWeight: 900, marginBottom: 4,
            background: "linear-gradient(135deg, #6E3BF2, #B88BFF, #6E3BF2)",
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
                {t(" الاسم كما هو مُدوَّن في البطاقة", "Name as shown on your ID")}
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
              <div style={{ display: "flex", gap: 8 }}>
                <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                  style={{ width: 120, padding: "13px 10px", borderRadius: 12, background: c.bgInput, border: `2px solid ${c.border}`, color: c.text, fontSize: 12, outline: "none", transition: "0.3s", flexShrink: 0 }}>
                  {Object.entries(COUNTRY_CODE_MAP).map(([code, data]) => (
                    <option key={code} value={code}>{code} ({data.name})</option>
                  ))}
                </select>
                <input type="tel" required placeholder="xxxxxxxxxxx"
                  ref={el => inputRefs.current[1] = el} readOnly autoComplete="off"
                  value={form.phone} onChange={(e) => setField("phone", e.target.value)}
                  style={{ flex: 1, padding: "13px 14px", borderRadius: 12, background: c.bgInput, border: `2px solid ${c.border}`, color: c.text, fontSize: 14, outline: "none", transition: "0.3s", boxSizing: "border-box" }}
                  onFocus={onFocus} onBlur={onBlur} />
              </div>
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

            {/* Country (searchable) */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("الدولة", "Country")}
              </label>
              <input type="text" list="countries" value={form.country} onChange={(e) => setField("country", e.target.value)}
                placeholder={t("ابحث عن الدولة...", "Search country...")}
                style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: c.bgInput, border: `2px solid ${c.border}`, color: c.text, fontSize: 14, outline: "none", transition: "0.3s", boxSizing: "border-box" }}
                onFocus={onFocus} onBlur={onBlur} />
              <datalist id="countries">
                {ALL_COUNTRIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            {/* Governorate (Egypt only) */}
            {form.country === "مصر" && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("المحافظة", "Governorate")}
              </label>
              <select required value={form.governorate} onChange={(e) => setField("governorate", e.target.value)}
                style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: c.bgInput, border: `2px solid ${c.border}`, color: c.text, fontSize: 14, outline: "none", transition: "0.3s", boxSizing: "border-box", cursor: "pointer" }}
                onFocus={onFocus} onBlur={onBlur}>
                <option value="">{t("اختر المحافظة", "Select Governorate")}</option>
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            )}

            {/* ID Card / Passport */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>
                {t("صورة البطاقة أو الباسبور", "ID Card or Passport")}
              </label>
              {idCard ? (
                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `2px solid #22c55e` }}>
                  <img src={idCard} alt="ID" style={{ width: "100%", maxHeight: 160, objectFit: "contain", background: "#000", display: "block" }} />
                  <button type="button" onClick={() => setIdCard(null)} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(239,68,68,.9)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              ) : (
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, background: c.bgInput, border: `2px dashed ${c.border}`, color: c.textMuted, fontSize: 13, cursor: "pointer", transition: "0.3s" }}>
                  <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(e.target.files[0], setIdCard)} />
                  {uploadingImg === setIdCard ? "⏳" : "📷 " + t("اضغط لرفع الصورة", "Tap to upload")}
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
                boxShadow: loading ? "none" : `0 8px 30px rgba(110,59,242,.3)`,
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
          <div style={{ position: "absolute", top: "10%", left: "15%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,59,242,.12) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "25%", right: "10%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,.08) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "55%", left: "55%", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,.08) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

          {/* Spinning rings */}
          <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", border: "1px dashed rgba(110,59,242,.08)", animation: "spin 30s linear infinite" }} />
          <div style={{ position: "absolute", width: 480, height: 480, borderRadius: "50%", border: "1px dashed rgba(34,197,94,.06)", animation: "spin 40s linear infinite reverse" }} />

          {/* Main image */}
          <div style={{ position: "relative", zIndex: 2, animation: "regSlideLeft 0.8s ease-out" }}>
            <div style={{
              width: 350, height: 350, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(110,59,242,.15), rgba(110,59,242,.03))",
              border: "2px solid rgba(110,59,242,.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "regPulse 4s ease-in-out infinite",
              position: "relative",
            }}>
              <div style={{ position: "absolute", inset: -15, borderRadius: "50%", border: "1px dashed rgba(110,59,242,.1)", animation: "spin 20s linear infinite" }} />
              <img
                src="/image/ChatGPT_Image_Jun_15__2026__04_00_05_AM-removebg-preview.png"
                alt="Everest Academy"
                style={{
                  width: 290, height: 290, objectFit: "contain",
                  filter: "drop-shadow(0 20px 50px rgba(110,59,242,.2))",
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
                    {t(" الاسم كما هو مُدوَّن في البطاقة", "Name as shown on your ID")}
                  </label>
                  <input type="text" required placeholder={t("أدخل اسمك", "Enter name")} ref={el => inputRefs.current[0] = el} readOnly autoComplete="off" value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} style={inputStyle(c)} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                    {t("رقم الهاتف", "Phone")}
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                      style={{ ...inputStyle(c), width: 100, flexShrink: 0, padding: "10px 6px", fontSize: 11 }}>
                      {Object.entries(COUNTRY_CODE_MAP).map(([code, data]) => (
                        <option key={code} value={code}>{code} ({data.name})</option>
                      ))}
                    </select>
                    <input type="tel" required placeholder="xxxxxxxxxxx" ref={el => inputRefs.current[1] = el} readOnly autoComplete="off" value={form.phone} onChange={(e) => setField("phone", e.target.value)} style={{ ...inputStyle(c), flex: 1 }} onFocus={onFocus} onBlur={onBlur} />
                  </div>
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

              {/* Country (searchable) */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                  {t("الدولة", "Country")}
                </label>
                <input type="text" list="countries2" value={form.country} onChange={(e) => setField("country", e.target.value)}
                  placeholder={t("ابحث عن الدولة...", "Search country...")}
                  style={{ ...inputStyle(c) }} onFocus={onFocus} onBlur={onBlur} />
                <datalist id="countries2">
                  {ALL_COUNTRIES.map(co => <option key={co} value={co} />)}
                </datalist>
              </div>

              {/* Governorate (Egypt only) */}
              {form.country === "مصر" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                  {t("المحافظة", "Governorate")}
                </label>
                <select required value={form.governorate} onChange={(e) => setField("governorate", e.target.value)} style={{ ...inputStyle(c), cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">{t("اختر المحافظة", "Select Governorate")}</option>
                  {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              )}

              {/* ID Card / Passport */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                  {t("صورة البطاقة أو الباسبور", "ID Card or Passport")}
                </label>
                {idCard ? (
                  <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `2px solid #22c55e` }}>
                    <img src={idCard} alt="ID" style={{ width: "100%", maxHeight: 180, objectFit: "contain", background: "#000", display: "block" }} />
                    <button type="button" onClick={() => setIdCard(null)} style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%", background: "rgba(239,68,68,.9)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                ) : (
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 12, background: c.bgInput, border: `2px dashed ${c.border}`, color: c.textMuted, fontSize: 13, cursor: "pointer", transition: "0.3s" }}>
                    <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(e.target.files[0], setIdCard)} />
                    {uploadingImg === setIdCard ? "⏳" : "📷 " + t("اضغط لرفع الصورة", "Click to upload")}
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
                  boxShadow: loading ? "none" : `0 8px 30px rgba(110,59,242,.3)`,
                  transition: "all .3s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(110,59,242,.45)"; } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 8px 30px rgba(110,59,242,.3)`; } }}
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
