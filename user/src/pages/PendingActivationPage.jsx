import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import PublicNavbar from "../components/PublicNavbar";
import { api } from "../App";
import { formatWhatsAppLink } from "../whatsapp";

export default function PendingActivationPage() {
  const { t, lang } = useLang();
  const { colors: c } = useTheme();
  const nav = useNavigate();
  const location = useLocation();
  const userEmail = location.state?.email || "";
  const [csWhatsapp, setCsWhatsapp] = useState("");
  const [csEmail, setCsEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    api("/api/customer-service")
      .then((d) => {
        setCsWhatsapp(d.customer_service_whatsapp || "");
        setCsEmail(d.customer_service_email || "");
      })
      .catch(() => {});
  }, []);

  const gold = "#6E3BF2";

  const handleResend = async () => {
    if (!userEmail) return;
    setResending(true);
    setResendMsg("");
    try {
      await api("/api/auth/resend-email-otp", { method: "POST", body: JSON.stringify({ email: userEmail }) });
      setResendMsg(t("تم إرسال رمز التحقق إلى بريدك", "Verification code sent to your email"));
    } catch (e) {
      setResendMsg(e.message || t("حدث خطأ", "Error"));
    }
    setResending(false);
  };

  const handleVerifyOtp = async () => {
    if (!userEmail || !otp) return;
    setVerifying(true);
    setResendMsg("");
    try {
      await api("/api/auth/verify-email-otp", { method: "POST", body: JSON.stringify({ email: userEmail, otp }) });
      setVerified(true);
    } catch (e) {
      setResendMsg(e.message || t("رمز التحقق غير صحيح", "Invalid verification code"));
    }
    setVerifying(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: c.bg }}>
      <PublicNavbar />

      <div style={{ maxWidth: 580, margin: "120px auto 80px", padding: "0 20px" }}>

        {/* Icon */}
        <div style={{ width: 120, height: 120, margin: "0 auto 30px", borderRadius: "50%", background: c.bgCard, border: `2px solid ${gold}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 56 }}>📧</span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 28, fontWeight: 900, color: c.text, textAlign: "center", marginBottom: 8 }}>
          {t("تم إنشاء حسابك بنجاح!", "Account Created Successfully!")}
        </h1>

        {/* Steps */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "20px 0" }}>
          {[
            { icon: "✓", label: t("تم التسجيل", "Registered"), done: true },
            { icon: "📧", label: t("تأكيد البريد", "Verify Email"), active: true },
            { icon: "⏳", label: t("بانتظار التفعيل", "Pending"), active: true },
            { icon: "🎓", label: t("ابدأ التعلم", "Start Learning"), done: false },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: s.done ? "linear-gradient(135deg,#25d366,#128c7e)" : s.active ? `linear-gradient(135deg,${gold},${gold}dd)` : c.bgSoft,
                color: s.done || s.active ? "#fff" : c.textMuted,
              }}>{s.icon}</div>
              <span style={{ fontSize: 12, color: s.active ? gold : c.textMuted, fontWeight: s.active ? 700 : 400 }}>{s.label}</span>
              {i < 3 && <div style={{ width: 30, height: 2, background: s.done ? "#25d366" : c.border, margin: "0 4px", borderRadius: 2 }} />}
            </div>
          ))}
        </div>

        {/* Verification OTP Card (before verify) */}
        {!verified ? (
        <div style={{ background: c.bgCard, border: `1px solid ${c.borderLight}`, borderRadius: 20, padding: "28px 24px", marginBottom: 20 }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <p style={{ fontSize: 15, color: c.textSoft, lineHeight: 1.9, margin: 0 }}>
              {t(
                "تم إنشاء حسابك بنجاح! لقد أرسلنا رمز تأكيد إلى بريدك الإلكتروني. أدخل الرمز أدناه لتفعيل حسابك.",
                "Your account has been created successfully! We've sent a verification code to your email. Enter the code below to verify your account."
              )}
            </p>
          </div>

          {userEmail && (
            <p style={{ fontSize: 13, color: c.textMuted, textAlign: "center", margin: "0 0 16px" }}>
              📧 {t("أرسلنا الرمز إلى", "We sent the code to")} <strong style={{ color: gold }}>{userEmail}</strong>
            </p>
          )}

          {resendMsg && (
            <div style={{
              background: resendMsg.includes("sent") || resendMsg.includes("أرسل") ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)",
              border: `1px solid ${resendMsg.includes("sent") || resendMsg.includes("أرسل") ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.2)"}`,
              borderRadius: 12, padding: "10px 14px", marginBottom: 16,
              color: resendMsg.includes("sent") || resendMsg.includes("أرسل") ? "#22c55e" : "#ef4444",
              fontSize: 13, textAlign: "center",
            }}>{resendMsg}</div>
          )}

          {/* OTP Input */}
          <div style={{ marginBottom: 16 }}>
            <input type="text" inputMode="numeric" maxLength={6} placeholder={t("أدخل رمز التحقق", "Enter verification code")}
              value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 14, border: `2px solid ${c.border}`,
                background: c.bgInput, color: c.text, fontSize: 22, fontWeight: 700, textAlign: "center",
                letterSpacing: 10, outline: "none", boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = gold}
              onBlur={e => e.target.style.borderColor = c.border} />
          </div>

          <button onClick={handleVerifyOtp} disabled={verifying || otp.length !== 6}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 14, border: "none",
              cursor: verifying || otp.length !== 6 ? "default" : "pointer",
              background: verifying || otp.length !== 6 ? c.border : `linear-gradient(135deg, ${gold}, ${gold}cc)`,
              color: "#fff", fontWeight: 800, fontSize: 15, marginBottom: 12,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            {verifying ? (
              <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            ) : (
              <>✓ {t("تأكيد البريد الإلكتروني", "Verify Email")}</>
            )}
          </button>

          <button onClick={handleResend} disabled={resending}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 14, border: `1px solid ${c.border}`,
              cursor: resending ? "default" : "pointer",
              background: "transparent", color: c.text, fontWeight: 600, fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            {resending ? (
              <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.2)", borderTopColor: c.text, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            ) : (
              <>🔄 {t("إعادة إرسال الرمز", "Resend Code")}</>
            )}
          </button>
        </div>
        ) : (
        /* Verified Success Card */
        <div style={{ background: c.bgCard, border: `1px solid #22c55e40`, borderRadius: 20, padding: "28px 24px", marginBottom: 20, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, margin: "0 auto 16px", borderRadius: "50%", background: "rgba(34,197,94,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 36 }}>✓</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#22c55e", marginBottom: 8 }}>
            {t("تم تأكيد البريد الإلكتروني!", "Email Verified!")}
          </h2>
          <p style={{ fontSize: 14, color: c.textSoft, lineHeight: 1.8, margin: "0 0 20px" }}>
            {t(
              "تم تأكيد بريدك الإلكتروني بنجاح! لإتمام تفعيل حسابك والوصول إلى الكورسات، يرجى التواصل مع خدمة العملاء لدفع الرسوم.",
              "Your email has been verified successfully! To activate your account and access your courses, please contact customer service to pay the fees."
            )}
          </p>
        </div>
        )}

        {/* After verification: Customer Service + Login Button */}
        {verified && (
        <>
        {/* Customer Service Card */}
        {(csWhatsapp || csEmail) && (
          <div style={{
            background: c.bgCard, border: `1px solid ${c.borderLight}`,
            borderRadius: 20, padding: "28px 24px", marginBottom: 24,
          }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: c.text, marginBottom: 4 }}>
                {t("تواصل مع خدمة العملاء", "Contact Customer Service")}
              </h3>
              <p style={{ fontSize: 13, color: c.textMuted }}>
                {t("تواصل معنا لدفع الرسوم وسيتم تفعيل الكورسات وحسابك فوراً", "Contact us to pay the fees and your courses and account will be activated")}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {csWhatsapp && (
                <a href={formatWhatsAppLink(csWhatsapp)} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14, background: "linear-gradient(135deg, #25d366, #128c7e)", textDecoration: "none", color: "#fff", fontWeight: 600, fontSize: 15 }}>
                  <span style={{ fontSize: 22 }}>📱</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>WhatsApp</div>
                    <div style={{ fontSize: 13, opacity: .85 }}>{csWhatsapp}</div>
                  </div>
                  <span>→</span>
                </a>
              )}
              {csEmail && (
                <a href={`mailto:${csEmail}`}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14, background: c.bgSoft, border: `1px solid ${c.border}`, textDecoration: "none", color: c.text, fontWeight: 600, fontSize: 15 }}>
                  <span style={{ fontSize: 22 }}>📧</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>Email</div>
                    <div style={{ fontSize: 13, color: c.textSoft }}>{csEmail}</div>
                  </div>
                  <span>→</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <div style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 16, padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>🔐</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 4 }}>{t("رمز تحقق", "Verification Code")}</div>
            <div style={{ fontSize: 11, color: c.textMuted }}>{t("ينتهي صلاحيته بعد 10 دقائق", "Expires after 10 minutes")}</div>
          </div>
          <div style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 16, padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>🛡️</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 4 }}>{t("حساب آمن", "Secure Account")}</div>
            <div style={{ fontSize: 11, color: c.textMuted }}>{t("بياناتك محمية بالكامل", "Your data is fully protected")}</div>
          </div>
        </div>

        {/* Login Button */}
        <div style={{ textAlign: "center" }}>
          <Link to="/login" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "14px 36px", borderRadius: 14,
            background: `linear-gradient(135deg, ${gold}, ${gold}cc)`,
            color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none",
          }}>
            🔑 {t("الذهاب لتسجيل الدخول", "Go to Login")}
          </Link>
        </div>
        </>
        )}

      </div>
    </div>
  );
}
