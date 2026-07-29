import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { api } from "../App";
import { formatWhatsAppLink } from "../whatsapp";

export default function MembershipExpiredOverlay() {
  const { user } = useAuth();
  const { t, dir } = useLang();
  const { theme } = useTheme();
  const [csData, setCsData] = useState(null);

  useEffect(() => {
    api("/api/customer-service").then(setCsData).catch(() => {});
  }, []);

  if (!user) return null;

  const isExpired = user.blocked || (user.membership_expires_at && new Date(user.membership_expires_at) < new Date());
  if (!isExpired) return null;

  const bg = theme === "dark" ? "rgba(0,0,0,.92)" : "rgba(0,0,0,.85)";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      direction: dir, fontFamily: "'Cairo', sans-serif",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)"
    }}>
      <style>{`
        @keyframes memFadeIn { from { opacity: 0; transform: translateY(30px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes memPulse { 0%,100%{ transform: scale(1); } 50%{ transform: scale(1.08); } }
        .mem-card { animation: memFadeIn .5s ease-out; }
        .mem-icon { animation: memPulse 2s ease-in-out infinite; }
        .mem-btn { transition: all .3s ease; }
        .mem-btn:hover { transform: translateY(-3px) !important; }
        .mem-btn:active { transform: translateY(0) !important; }
      `}</style>

      <div className="mem-card" style={{
        background: theme === "dark" ? "#1a1a2e" : "#ffffff",
        borderRadius: 28, padding: "44px 36px", maxWidth: 420, width: "90%",
        textAlign: "center", border: "1px solid rgba(239,68,68,.2)",
        boxShadow: "0 25px 80px rgba(0,0,0,.5), 0 0 40px rgba(239,68,68,.1)",
        position: "relative"
      }}>

        <div className="mem-icon" style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", fontSize: 36
        }}>
          🚫
        </div>

        <h2 style={{
          margin: "0 0 8px", fontSize: "1.4rem", fontWeight: 900,
          color: theme === "dark" ? "#fff" : "#111"
        }}>
          {t("تم انتهاء العضوية", "Membership Expired")}
        </h2>

        <p style={{
          margin: "0 0 24px", fontSize: ".9rem",
          color: theme === "dark" ? "#aaa" : "#666", lineHeight: 1.7
        }}>
          {t(
            "لتجدد العضوية اذهب إلى البروفايل وتواصل مع خدمة العملاء",
            "To renew your membership, go to your profile and contact customer service"
          )}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link to="/profile" className="mem-btn" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "14px 20px", borderRadius: 16, textDecoration: "none",
            background: "linear-gradient(135deg, #6E3BF2, #B88BFF)",
            color: "#111", fontWeight: 800, fontSize: "1rem"
          }}>
            👤 {t("اذهب إلى البروفايل", "Go to Profile")}
          </Link>

          {csData?.customer_service_whatsapp && (
            <a href={formatWhatsAppLink(csData.customer_service_whatsapp)} target="_blank" rel="noopener noreferrer" className="mem-btn" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "14px 20px", borderRadius: 16, textDecoration: "none",
              background: "linear-gradient(135deg, #25d366, #128c7e)",
              color: "#fff", fontWeight: 800, fontSize: "1rem"
            }}>
              💬 {t("تواصل مع خدمة العملاء", "Contact Customer Service")}
            </a>
          )}
        </div>

        <p style={{
          margin: "20px 0 0", fontSize: ".75rem",
          color: theme === "dark" ? "#555" : "#999"
        }}>
          {csData?.customer_service_whatsapp && (
            <>📞 {csData.customer_service_whatsapp}</>
          )}
        </p>
      </div>
    </div>
  );
}
