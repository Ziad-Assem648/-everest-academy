import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { useLang } from "../LangContext";

export default function VodafoneCashPage() {
  const { colors: c } = useTheme();
  const { t } = useLang();
  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      background: c.bg,
      display: "flex", justifyContent: "center", alignItems: "center",
      minHeight: "100vh", margin: 0, padding: 20
    }}>
      <div className="container" style={{
        background: c.bgCard, width: "90%", maxWidth: 500,
        padding: 40, borderRadius: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.06)"
      }}>
        <Link to="/payment" style={{ display: "block", marginBottom: 20, textDecoration: "none", color: c.textSoft, fontSize: 14 }}>
          {t("← العودة لوسائل الدفع", "← Back to Payment Methods")}
        </Link>
        <div style={{ textAlign: "center" }}>
          <div className="header" style={{ fontWeight: 600, color: "#a855f7", marginBottom: 30, borderBottom: "2px solid #a855f7", display: "inline-block" }}>
            Vodafone Cash
          </div>
        </div>

        <div className="vf-card" style={{
          background: "linear-gradient(135deg, #fecfef 0%, #a934fd 99%, #fd91db 100%)",
          width: "100%", height: 160, borderRadius: 16, padding: 20,
          color: "white", boxSizing: "border-box",
          display: "flex", flexDirection: "column", justifyContent: "center",
          marginBottom: 30
        }}>
          <div style={{ fontSize: 14, opacity: 0.9 }}>{t("رقم المحفظة المخصص", "Assigned Wallet Number")}</div>
          <div style={{ fontSize: 24, fontWeight: 600, marginTop: 5 }}>010xxxxxxxx</div>
        </div>

        <div className="form-section">
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, color: c.textSoft, marginBottom: 8 }}>{t("رقم الهاتف المحول منه", "Sender Phone Number")}</label>
            <input type="text" placeholder="010xxxxxxxx" style={{ width: "100%", padding: 14, border: `1px solid ${c.border}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, color: c.textSoft, marginBottom: 8 }}>{t("كود العملية (أو سكرين شوت)", "Transaction Code (or Screenshot)")}</label>
            <input type="text" placeholder={t("أدخل كود التحويل", "Enter transfer code")} style={{ width: "100%", padding: 14, border: `1px solid ${c.border}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ margin: "20px 0", fontSize: 18, fontWeight: 600 }}>{t("المبلغ: 1500 ج.م", "Amount: 1500 EGP")}</div>
          <button className="pay-btn" style={{
            background: "#a855f7", color: "white", border: "none",
            width: "100%", padding: 16, borderRadius: 10,
            cursor: "pointer", fontWeight: 600, marginTop: 10
          }}>{t("إتمام الدفع", "Complete Payment")}</button>
        </div>
      </div>
    </div>
  );
}
