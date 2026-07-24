import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { api, uploadApi } from "../App";
import AppNavbar from "../components/AppNavbar";

const GOVERNORATES = [
  "القاهرة","الجيزة","الإسكندرية","القليوبية","الدقهلية","الشرقية","الغربية","المنوفية","البحيرة","كفر الشيخ",
  "دمياط","بورسعيد","السويس","الإسماعيلية","شمال سيناء","جنوب سيناء","بني سويف","الفيوم","المنيا","أسيوط",
  "سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح"
];

const COST = 5500;

const gold = "#d4af37";

export default function CreateAccountPage() {
  const { user, login: authLogin } = useAuth();
  const { t, lang } = useLang();
  const { colors: c } = useTheme();
  const nav = useNavigate();
  const m = window.innerWidth <= 768;

  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirm: "", governorate: "" });
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [idCardFront, setIdCardFront] = useState(null);
  const [idCardBack, setIdCardBack] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(null);
  const [createdUsers, setCreatedUsers] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    api(`/api/users/${user.id}`).then(setProfile).catch(() => setProfile(user));
    api(`/api/users/created-by-me/${user.id}`).then(setCreatedUsers).catch(() => {});
  }, [user]);

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const onFocus = (e) => e.target.style.borderColor = gold;
  const onBlur = (e) => e.target.style.borderColor = c.border;

  const handleImageUpload = async (file, setter) => {
    if (!file) return;
    setUploadingImg(setter);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadApi(fd);
      setter(result.url);
    } catch (e) { setErr(t("فشل رفع الصورة", "Image upload failed")); }
    setUploadingImg(null);
  };

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setSuccess(""); setLoading(true);

    const balance = profile?.e_money || 0;
    if (balance < COST) {
      setErr(t(`رصيدك غير كافٍ. المطلوب: ${COST} E-Money، المتاح: ${Math.floor(balance)}`, `Insufficient balance. Required: ${COST} E-Money, Available: ${Math.floor(balance)}`));
      setLoading(false); return;
    }

    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(form.phone)) {
      setErr(t("رقم الهاتف غير صحيح. يجب أن يبدأ بـ 010/011/012/015 و11 رقم.", "Invalid phone. Must be 010/011/012/015 and 11 digits."));
      setLoading(false); return;
    }
    if (form.password.length < 8) { setErr(t("كلمة المرور يجب أن تكون 8 أحرف على الأقل.", "Password must be at least 8 characters.")); setLoading(false); return; }
    if (!/[A-Z]/.test(form.password)) { setErr(t("كلمة المرور يجب أن تحتوي على حرف كبير.", "Password must contain an uppercase letter.")); setLoading(false); return; }
    if (!/[a-z]/.test(form.password)) { setErr(t("كلمة المرور يجب أن تحتوي على حرف صغير.", "Password must contain a lowercase letter.")); setLoading(false); return; }
    if (!/[0-9]/.test(form.password)) { setErr(t("كلمة المرور يجب أن تحتوي على رقم.", "Password must contain a number.")); setLoading(false); return; }
    if (!/[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\\/~`]/.test(form.password)) { setErr(t("كلمة المرور يجب أن تحتوي على رمز خاص.", "Password must contain a special character.")); setLoading(false); return; }
    if (form.password !== form.confirm) { setErr(t("كلمات المرور غير متطابقة!", "Passwords do not match!")); setLoading(false); return; }
    if (!form.governorate) { setErr(t("اختر المحافظة", "Select a governorate")); setLoading(false); return; }

    try {
      const res = await api("/api/users/create-for-others", {
        method: "POST",
        body: JSON.stringify({
          full_name: form.full_name, email: form.email, phone: form.phone,
          password: form.password, governorate: form.governorate,
          id_card_front: idCardFront, id_card_back: idCardBack,
        }),
      });
      setSuccess(t(`تم إنشاء الحساب بنجاح! تم خصم ${COST} E-Money`, `Account created! ${COST} E-Money deducted`));
      setForm({ full_name: "", email: "", phone: "", password: "", confirm: "", governorate: "" });
      setIdCardFront(null); setIdCardBack(null);
      setProfile(p => ({ ...p, e_money: res.creator_balance }));
      setCreatedUsers(prev => [res.user, ...prev]);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const inputS = { width: "100%", padding: m ? "13px 14px" : "13px 16px", borderRadius: 12, background: c.bgInput, border: `2px solid ${c.border}`, color: c.text, fontSize: 14, outline: "none", transition: "0.3s", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: c.bg }}>
      <AppNavbar />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: m ? "16px 14px 80px" : "24px 24px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: m ? 20 : 24, fontWeight: 900, color: c.text, marginBottom: 4 }}>
            {t("إنشاء حساب لشخص آخر", "Create Account for Another User")}
          </h1>
          <p style={{ fontSize: 13, color: c.textMuted }}>
            {t(`سيتم خصم ${COST} E-Money من رصيدك`, `${COST} E-Money will be deducted from your balance`)}
          </p>
          {profile && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, padding: "8px 16px", borderRadius: 10, background: (profile.e_money || 0) >= COST ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)", border: `1px solid ${(profile.e_money || 0) >= COST ? "rgba(34,197,94,.25)" : "rgba(239,68,68,.2)"}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: (profile.e_money || 0) >= COST ? "#22c55e" : "#ef4444" }}>
                {t("رصيدك:", "Your balance:")} {Math.floor(profile.e_money || 0)} E-Money
              </span>
            </div>
          )}
        </div>

        {/* Error / Success */}
        {err && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, color: "#ef4444", fontSize: 13, textAlign: "center" }}>⚠️ {err}</div>}
        {success && <div style={{ background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, color: "#22c55e", fontSize: 13, textAlign: "center" }}>✅ {success}</div>}

        {/* Form Card */}
        <div style={{ background: c.bgCard, border: `1px solid ${c.borderLight}`, borderRadius: 16, padding: m ? "20px 16px" : "28px 24px", marginBottom: 24 }}>
          <form onSubmit={submit} autoComplete="off">
            {/* Full Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>{t("الاسم بالكامل", "Full Name")}</label>
              <input type="text" required placeholder={t("أدخل اسم الشخص", "Enter person's name")} value={form.full_name} onChange={e => setField("full_name", e.target.value)} style={inputS} onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Phone + Email row */}
            <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>{t("رقم الهاتف", "Phone")}</label>
                <input type="tel" required placeholder="01xxxxxxxxx" value={form.phone} onChange={e => setField("phone", e.target.value)} style={inputS} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>{t("البريد الإلكتروني", "Email")}</label>
                <input type="email" required placeholder="mail@example.com" value={form.email} onChange={e => setField("email", e.target.value)} style={inputS} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            {/* Password row */}
            <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>{t("كلمة المرور", "Password")}</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} required placeholder="••••••••" value={form.password} onChange={e => setField("password", e.target.value)} style={{ ...inputS, paddingRight: 44 }} onFocus={onFocus} onBlur={onBlur} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: c.textMuted }}>{showPass ? "🙈" : "👁"}</button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>{t("تأكيد كلمة المرور", "Confirm Password")}</label>
                <input type={showPass ? "text" : "password"} required placeholder="••••••••" value={form.confirm} onChange={e => setField("confirm", e.target.value)} style={inputS} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            {/* Password strength */}
            {form.password.length > 0 && (
              <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 10, background: c.bgInput, border: `1px solid ${c.border}` }}>
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
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>{t("المحافظة", "Governorate")}</label>
              <select required value={form.governorate} onChange={e => setField("governorate", e.target.value)} style={{ ...inputS, cursor: "pointer" }} onFocus={onFocus} onBlur={onBlur}>
                <option value="">{t("اختر المحافظة", "Select Governorate")}</option>
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* ID Card Front */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>{t("صورة البطاقة (أمامي)", "ID Card (Front)")}</label>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 12, background: c.bgInput, border: `2px dashed ${idCardFront ? "#22c55e" : c.border}`, color: idCardFront ? "#22c55e" : c.textMuted, fontSize: 13, cursor: "pointer", transition: "0.3s" }}>
                <input type="file" accept="image/*" hidden onChange={e => handleImageUpload(e.target.files[0], setIdCardFront)} />
                {uploadingImg === setIdCardFront ? "⏳" : idCardFront ? "✅ " + t("تم الرفع", "Uploaded") : "📷 " + t("اضغط لرفع الصورة", "Click to upload")}
              </label>
            </div>

            {/* ID Card Back */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 700, color: c.text }}>{t("صورة البطاقة (خلفي)", "ID Card (Back)")}</label>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 12, background: c.bgInput, border: `2px dashed ${idCardBack ? "#22c55e" : c.border}`, color: idCardBack ? "#22c55e" : c.textMuted, fontSize: 13, cursor: "pointer", transition: "0.3s" }}>
                <input type="file" accept="image/*" hidden onChange={e => handleImageUpload(e.target.files[0], setIdCardBack)} />
                {uploadingImg === setIdCardBack ? "⏳" : idCardBack ? "✅ " + t("تم الرفع", "Uploaded") : "📷 " + t("اضغط لرفع الصورة", "Click to upload")}
              </label>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: "100%", height: 52, borderRadius: 14, border: "none",
              cursor: loading ? "default" : "pointer",
              background: loading ? c.border : `linear-gradient(135deg, ${gold}, ${gold}cc)`,
              color: "#fff", fontSize: 15, fontWeight: 800,
              boxShadow: loading ? "none" : `0 8px 30px rgba(212,175,55,.3)`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              {loading ? <div style={{ width: 22, height: 22, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                : `👤 ${t(`إنشاء حساب (${COST} E-Money)`, `Create Account (${COST} E-Money)`)}`}
            </button>
          </form>
        </div>

        {/* Created Users List */}
        {createdUsers.length > 0 && (
          <div style={{ background: c.bgCard, border: `1px solid ${c.borderLight}`, borderRadius: 16, padding: m ? "16px" : "24px" }}>
            <h3 style={{ fontSize: m ? 15 : 17, fontWeight: 700, color: "#e2c275", marginBottom: 14 }}>{t("الحسابات التي أنشأتها", "Accounts You Created")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {createdUsers.map((u, i) => (
                <div key={u.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: c.bgInput, border: `1px solid ${c.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#d4af37,#b38728)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {(u.full_name || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: c.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.full_name}</p>
                    <p style={{ fontSize: 11, color: c.textMuted, margin: 0 }}>{u.email}</p>
                  </div>
                  <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, fontWeight: 600, background: u.status === "active" ? "rgba(34,197,94,.12)" : u.status === "pending" ? "rgba(255,191,0,.12)" : "rgba(239,68,68,.08)", color: u.status === "active" ? "#22c55e" : u.status === "pending" ? "#ffbf00" : "#ef4444" }}>
                    {u.status === "active" ? t("مفعّل", "Active") : u.status === "pending" ? t("قيد المراجعة", "Pending") : u.status === "rejected" ? t("مرفوض", "Rejected") : u.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
