import React from "react";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";

export default function LanguageToggle({ minimal }) {
  const { lang, toggle } = useLang();
  const { colors: c } = useTheme();
  if (minimal) {
    return (
      <button onClick={toggle} style={{background:"transparent",border:`1px solid ${c.border}`,borderRadius:10,padding:"5px 14px",cursor:"pointer",color:c.text,fontSize:12,fontWeight:700,letterSpacing:"0.5px",transition:"0.3s",display:"flex",alignItems:"center",gap:4}}
        onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(212,175,55,0.5)"}
        onMouseLeave={e=>e.currentTarget.style.borderColor=c.border}
      >
        <span style={{fontSize:11}}>{lang === "ar" ? "🇺🇸" : "🇸🇦"}</span> {lang === "ar" ? "EN" : "عربي"}
      </button>
    );
  }
  return (
    <div onClick={toggle} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",padding:"5px 10px",borderRadius:10,background:c.bgCard,border:`1px solid ${c.border}`,fontSize:12,fontWeight:600,color:c.text,transition:"0.3s",userSelect:"none"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(212,175,55,0.5)"; e.currentTarget.style.background="rgba(212,175,55,0.1)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=c.border; e.currentTarget.style.background=c.bgCard;}}>
      <span style={{opacity:lang==="ar"?1:0.4,transition:"0.2s"}}>العربية</span>
      <span style={{fontSize:10,opacity:0.3}}>|</span>
      <span style={{opacity:lang==="en"?1:0.4,transition:"0.2s"}}>English</span>
    </div>
  );
}
