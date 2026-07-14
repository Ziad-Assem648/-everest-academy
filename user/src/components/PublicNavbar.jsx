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
        <div className="nav-left">
          <Link to="/" className="logo"><img src="/image/logo-navbar.png" alt="Everest" /></Link>
        </div>
        <div className="nav-links">
          {links.map((l) => (
            <Link key={l.key} to={l.to} className={active === l.key ? "active" : ""}>{l.label}</Link>
          ))}
        </div>
        <div className="nav-right">
          <button onClick={toggleLang} style={{width:42,height:42,borderRadius:999,border:"none",background:c.bgInput,cursor:"pointer",fontSize:14,fontWeight:700,color:c.text,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}} title={lang === "ar" ? "English" : "العربية"}>
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <button onClick={toggleTheme} style={{width:42,height:42,borderRadius:999,border:"none",background:c.bgInput,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}} title={theme === "dark" ? "Light Mode" : "Dark Mode"}>
            {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
          </button>
          <div className="auth-buttons">
            <Link to="/login" className="login-btn">{t("تسجيل الدخول", "Login")}</Link>
            <Link to="/register" className="signup-btn">{t("إنشاء حساب", "Sign Up")}</Link>
          </div>
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="menu" style={{display:"flex",flexDirection:"column",gap:5,padding:0}}>
            <span style={{width:20,height:2,background:c.textSoft,borderRadius:2,display:"block"}} />
            <span style={{width:20,height:2,background:c.textSoft,borderRadius:2,display:"block"}} />
            <span style={{width:20,height:2,background:c.textSoft,borderRadius:2,display:"block"}} />
          </button>
        </div>
      </nav>

      <div className={`menu-overlay${menuOpen ? " active" : ""}`} onClick={() => setMenuOpen(false)}></div>
      <div className={`mobile-menu${menuOpen ? " active" : ""}`}>
        <div className="mobile-header">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src="/image/logo-navbar.png" alt="Everest" style={{height:55,width:55,objectFit:"contain"}} />
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
          <button onClick={toggleLang} style={{
            display:"flex",alignItems:"center",justifyContent:"center",height:48,borderRadius:14,
            fontSize:15,fontWeight:600,background:c.bgInput,color:c.text,border:`1px solid ${c.border}`,cursor:"pointer",fontFamily:"inherit",
          }}>
            {lang === "ar" ? "🇬🇧 English" : "🇸🇦 العربية"}
          </button>
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
