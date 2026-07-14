import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";

export default function PublicNavbar({ active }) {
  const { t, lang, toggle: toggleLang } = useLang();
  const { theme, toggle: toggleTheme, colors: c } = useTheme();
  const navRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle("scrolled", window.scrollY > 40);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/free-courses", label: t("الكورسات", "Courses"), key: "courses" },
    { to: "/about", label: t("عن إيفرست", "About"), key: "about" },
    { to: "/feedback", label: t("التقييم", "Feedback"), key: "feedback" },
  ];

  return (
    <>
      <nav className="navbar" ref={navRef}>
        <div className="nav-left" style={{marginLeft:8}}>
          <Link to="/" className="logo"><img src="/image/logo-navbar.png" alt="Everest" style={{width:90,height:90,objectFit:"contain",mixBlendMode:"multiply"}} /></Link>
        </div>
        <div className="nav-links">
          {links.map((l) => (
            <Link key={l.key} to={l.to} className={active === l.key ? "active" : ""}>{l.label}</Link>
          ))}
        </div>
        <div className="nav-right" style={{marginRight:8}}>
          <div className="auth-buttons" style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={toggleLang} style={{height:38,padding:"0 14px",borderRadius:10,fontSize:13,fontWeight:700,background:c.bgCard,color:c.text,border:`1px solid ${c.borderLight || c.border}`,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
              {lang === "ar" ? "EN" : "عربي"}
            </button>
            <button onClick={toggleTheme} style={{width:38,height:38,borderRadius:10,fontSize:18,background:c.bgCard,color:c.text,border:`1px solid ${c.borderLight || c.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
            </button>
            <Link to="/login" className="login-btn">{t("تسجيل الدخول", "Login")}</Link>
            <Link to="/register" className="signup-btn">{t("إنشاء حساب", "Sign Up")}</Link>
          </div>
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="menu" style={{display:"flex",flexDirection:"column",gap:5,padding:8,background:"transparent",border:"none"}}>
            <span style={{width:20,height:2,background:"#000",borderRadius:2,display:"block"}} />
            <span style={{width:20,height:2,background:"#000",borderRadius:2,display:"block"}} />
            <span style={{width:20,height:2,background:"#000",borderRadius:2,display:"block"}} />
          </button>
        </div>
      </nav>

      <div className={`menu-overlay${menuOpen ? " active" : ""}`} onClick={() => setMenuOpen(false)}></div>
      <div className={`mobile-menu${menuOpen ? " active" : ""}`}>
        <div className="mobile-header">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src="/image/logo-navbar.png" alt="Everest" style={{height:70,width:70,objectFit:"contain"}} />
            <h2>Everest</h2>
          </div>
          <button onClick={() => setMenuOpen(false)}>&times;</button>
        </div>
        <div className="mobile-links" style={{marginTop:16}}>
          {links.map((l) => (
            <Link key={l.key} to={l.to} onClick={() => setMenuOpen(false)}
              style={{
                display:"flex",alignItems:"center",gap:10,height:48,padding:"0 16px",
                borderRadius:12,textDecoration:"none",fontSize:15,fontWeight:600,
                color: active === l.key ? "#d4af37" : c.text,
                background: active === l.key ? c.goldLight : "transparent",
              }}>
              {l.key === "courses" && "📚"}
              {l.key === "about" && "ℹ️"}
              {l.key === "feedback" && "💬"}
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:c.bgInput,borderRadius:14,border:`1px solid ${c.border}`}}>
            <span style={{fontSize:12,fontWeight:600,color:c.textMuted}}>{t("الإعدادات","Settings")}</span>
            <button onClick={toggleLang} style={{flex:1,height:40,borderRadius:10,fontSize:14,fontWeight:600,background:c.bgCard,color:c.text,border:`1px solid ${c.borderLight || c.border}`,cursor:"pointer",fontFamily:"inherit"}}>
              {lang === "ar" ? "English" : "العربية"}
            </button>
            <button onClick={toggleTheme} style={{width:40,height:40,borderRadius:10,fontSize:16,background:c.bgCard,color:c.text,border:`1px solid ${c.borderLight || c.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
            </button>
          </div>
          <Link to="/login" onClick={() => setMenuOpen(false)} style={{
            display:"flex",alignItems:"center",justifyContent:"center",height:48,borderRadius:14,
            textDecoration:"none",fontSize:15,fontWeight:700,
            background:c.bgInput,color:c.text,border:`1px solid ${c.border}`,
          }}>
            {t("تسجيل الدخول", "Login")}
          </Link>
          <Link to="/register" onClick={() => setMenuOpen(false)} style={{
            display:"flex",alignItems:"center",justifyContent:"center",height:48,borderRadius:14,
            textDecoration:"none",fontSize:15,fontWeight:700,
            background:"linear-gradient(135deg,#d4af37,#b38728)",color:"#fff",
          }}>
            {t("إنشاء حساب", "Sign Up")}
          </Link>
        </div>
      </div>
    </>
  );
}
