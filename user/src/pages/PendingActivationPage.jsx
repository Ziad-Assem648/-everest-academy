import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import PublicNavbar from "../components/PublicNavbar";
import { api } from "../App";
import { formatWhatsAppLink } from "../whatsapp";

export default function PendingActivationPage() {
  const { t, lang } = useLang();
  const { colors: c } = useTheme();
  const [csWhatsapp, setCsWhatsapp] = useState("");
  const [csEmail, setCsEmail] = useState("");

  useEffect(() => {
    api("/api/customer-service")
      .then((d) => {
        setCsWhatsapp(d.customer_service_whatsapp || "");
        setCsEmail(d.customer_service_email || "");
      })
      .catch(() => {});
  }, []);

  const gold = "#d4af37";

  return (
    <div style={{ minHeight: "100vh", background: c.bg }}>
      <PublicNavbar />

      <div style={{ maxWidth: 580, margin: "120px auto 80px", padding: "0 20px" }}>

        {/* Icon */}
        <div style={{ width: 120, height: 120, margin: "0 auto 30px", borderRadius: "50%", background: c.bgCard, border: `2px solid ${gold}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 56 }}>⏳</span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 28, fontWeight: 900, color: c.text, textAlign: "center", marginBottom: 8 }}>
          {t("حسابك في انتظار التفعيل", "Your Account is Pending Activation")}
        </h1>

        {/* Steps */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "20px 0" }}>
          {[
            { icon: "✓", label: t("تم التسجيل", "Registered"), done: true },
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
              {i < 2 && <div style={{ width: 30, height: 2, background: s.done ? "#25d366" : c.border, margin: "0 4px", borderRadius: 2 }} />}
            </div>
          ))}
        </div>

        {/* Description */}
        <p style={{ fontSize: 15, color: c.textSoft, lineHeight: 1.9, textAlign: "center", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          {t(
            "تم تسجيل حسابك بنجاح! فريقنا سيقوم بمراجعة حسابك وتفعيله في أقرب وقت. يمكنك التواصل مع خدمة العملاء لتسريع عملية التفعيل.",
            "Your account has been registered successfully! Our team will review and activate your account shortly. You can contact customer service to speed up the process."
          )}
        </p>

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
                {t("فريقنا جاهز لمساعدتك وتفعيل حسابك فوراً", "Our team is ready to help you and activate your account")}
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
            <div style={{ fontSize: 26, marginBottom: 6 }}>⚡</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 4 }}>{t("تفعيل سريع", "Quick Activation")}</div>
            <div style={{ fontSize: 11, color: c.textMuted }}>{t("عادةً خلال 24 ساعة", "Usually within 24 hours")}</div>
          </div>
          <div style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 16, padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>🛡️</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 4 }}>{t("حساب آمن", "Secure Account")}</div>
            <div style={{ fontSize: 11, color: c.textMuted }}>{t("بياناتك محمية بالكامل", "Your data is fully protected")}</div>
          </div>
        </div>

        {/* Notification info */}
        <div style={{ background: `${gold}10`, border: `1px solid ${gold}25`, borderRadius: 14, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🔔</span>
          <p style={{ fontSize: 13, color: c.textSoft, lineHeight: 1.7, margin: 0 }}>
            {t("ستتلقى إشعاراً فور تفعيل حسابك من الإدارة. يمكنك أيضاً تسجيل الدخول للتأكد.", "You'll receive a notification once your account is activated. You can also check by logging in.")}
          </p>
        </div>

        {/* Login Button */}
        <div style={{ textAlign: "center" }}>
          <Link to="/login" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "14px 36px", borderRadius: 14,
            background: `linear-gradient(135deg, ${gold}, ${gold}cc)`,
            color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none",
          }}>
            🔑 {t("الذهاب للتسجيل دخول", "Go to Login")}
          </Link>
        </div>

      </div>
    </div>
  );
}
