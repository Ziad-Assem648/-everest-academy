import { Link } from "react-router-dom";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";

export default function PaymentPage() {
  const { t } = useLang();
  const { colors: c } = useTheme();
  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      background: c.bg,
      display: "flex", justifyContent: "center", alignItems: "center",
      minHeight: "100vh", margin: 0, padding: 20
    }}>
      <div style={{
        background: c.bgCard, width: "100%", maxWidth: 450,
        padding: 32, borderRadius: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
      }}>
        <Link to="/courses" style={{ display: "block", marginBottom: 20, textDecoration: "none", color: c.textSoft, fontSize: 14 }}>
          {t("رجوع←","Back←")}
        </Link>
        <h2 style={{ fontSize: 20, marginBottom: 24, color: "#68066d", textAlign: "center" }}>
          {t("اختر وسيلة الدفع","Choose Payment Method")}
        </h2>

        <Link to="/payment/card" className="method-btn" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "18px 20px", marginBottom: 12,
          border: `1.5px solid ${c.border}`, borderRadius: 14, background: c.bgCard,
          cursor: "pointer", transition: "all 0.2s", textDecoration: "none",
          color: c.text, boxSizing: "border-box"
        }}>
          <span style={{ fontWeight: 500, fontSize: 15 }}>{t("البطاقات البنكية","Bank Cards")}</span>
          <span style={{ fontSize: 20 }}>💳</span>
        </Link>

        <Link to="/payment/instapay" className="method-btn" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "18px 20px", marginBottom: 12,
          border: `1.5px solid ${c.border}`, borderRadius: 14, background: c.bgCard,
          cursor: "pointer", transition: "all 0.2s", textDecoration: "none",
          color: c.text, boxSizing: "border-box"
        }}>
          <span style={{ fontWeight: 500, fontSize: 15 }}>{t("إنستا باي","InstaPay")}</span>
          <span style={{ fontSize: 20 }}>📱</span>
        </Link>

        <Link to="/payment/vodafone" className="method-btn" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "18px 20px", marginBottom: 12,
          border: `1.5px solid ${c.border}`, borderRadius: 14, background: c.bgCard,
          cursor: "pointer", transition: "all 0.2s", textDecoration: "none",
          color: c.text, boxSizing: "border-box"
        }}>
          <span style={{ fontWeight: 500, fontSize: 15 }}>{t("فودافون كاش","Vodafone Cash")}</span>
          <span style={{ fontSize: 20 }}>🔴</span>
        </Link>
      </div>
    </div>
  );
}
