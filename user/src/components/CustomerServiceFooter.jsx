import { useState, useEffect } from "react";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { api } from "../App";

export default function CustomerServiceFooter() {
  const { t } = useLang();
  const { colors: c } = useTheme();
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    api("/api/customer-service").then(d => {
      setWhatsapp(d.customer_service_whatsapp || "");
      setEmail(d.customer_service_email || "");
    }).catch(() => {});
  }, []);

  if (!whatsapp && !email) return null;

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"16px 0"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,fontSize:14,color:c.textMuted}}>
        <span style={{fontSize:18}}>💬</span>
        <span>{t("يمكنك التواصل مع خدمة العملاء في أي وقت —نحن هنا لمساعدتك!", "You can contact customer service anytime — we are here to help you!")}</span>
      </div>
      <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:14,flexWrap:"wrap"}}>
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:"inline-flex",alignItems:"center",gap:8,
            padding:"10px 22px",borderRadius:999,
            background:"linear-gradient(135deg,#25d366,#128c7e)",
            color:"#fff",textDecoration:"none",
            fontWeight:700,fontSize:14,
            boxShadow:"0 4px 18px rgba(37,211,102,.35)",
            transition:"transform .2s,box-shadow .2s"
          }}
          onMouseEnter={e => { e.currentTarget.style.transform="scale(1.05)"; e.currentTarget.style.boxShadow="0 6px 24px rgba(37,211,102,.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow="0 4px 18px rgba(37,211,102,.35)"; }}
        >
          📱 <span>{t("واتساب", "WhatsApp")}</span>
          <span style={{opacity:.85,fontWeight:400}}>{whatsapp}</span>
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          style={{
            display:"inline-flex",alignItems:"center",gap:8,
            padding:"10px 22px",borderRadius:999,
            background:c.bgCard,
            border:`1px solid ${c.borderLight}`,
            color:c.text,textDecoration:"none",
            fontWeight:700,fontSize:14,
            boxShadow:`0 4px 18px ${c.shadow}`,
            transition:"transform .2s,box-shadow .2s"
          }}
          onMouseEnter={e => { e.currentTarget.style.transform="scale(1.05)"; e.currentTarget.style.boxShadow=`0 6px 24px ${c.shadow}`; }}
          onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow=`0 4px 18px ${c.shadow}`; }}
        >
          📧 <span>{email}</span>
        </a>
      )}
      </div>
    </div>
  );
}
