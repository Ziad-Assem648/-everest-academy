import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { api } from "../App";

export default function PublicNavbar({ active }) {
  const { t, lang, toggle: toggleLang } = useLang();
  const { theme, toggle: toggleTheme, colors: c } = useTheme();
  const navRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [csWhatsapp, setCsWhatsapp] = useState("");
  const [csEmail, setCsEmail] = useState("");

  useEffect(() => {
    const onScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle("scrolled", window.scrollY > 40);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    api("/api/settings").then(d => {
      setCsWhatsapp(d.customer_service_whatsapp || "");
      setCsEmail(d.customer_service_email || "");
    }).catch(() => {});
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
          <div className="auth-buttons">
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

      <div className={`pdm-overlay${menuOpen ? " active" : ""}`} onClick={() => setMenuOpen(false)} aria-hidden="true"></div>
      <div className={`pdm-drawer${menuOpen ? " active" : ""}`} role="dialog" aria-label="Navigation menu">
        {/* Decorative background */}
        <div className="pdm-bg">
          <div className="pdm-blob pdm-blob-1"></div>
          <div className="pdm-blob pdm-blob-2"></div>
          <div className="pdm-blob pdm-blob-3"></div>
        </div>

        {/* Header */}
        <div className="pdm-header">
          <div className="pdm-brand">
            <img className="pdm-logo-img" src="/image/logo3.png" alt="Everest" />
           
          </div>
          <button className="pdm-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="pdm-nav" role="navigation">
          <Link to="/" className="pdm-nav-item" onClick={() => setMenuOpen(false)}>
            <span className="pdm-nav-icon"><i className="fa-solid fa-house"></i></span>
            <span className="pdm-nav-label">{t("الرئيسية", "Home")}</span>
            <svg className="pdm-nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </Link>
          {links.map((l) => {
            const isActive = active === l.key;
            const icons = { courses: "fa-solid fa-book-open", about: "fa-solid fa-circle-info", feedback: "fa-solid fa-comment-dots" };
            return (
              <Link key={l.key} to={l.to} className={`pdm-nav-item${isActive ? " active" : ""}`} onClick={() => setMenuOpen(false)}>
                <span className="pdm-nav-icon"><i className={icons[l.key]}></i></span>
                <span className="pdm-nav-label">{l.label}</span>
                <svg className="pdm-nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="pdm-divider"></div>

        {/* Settings */}
        <div className="pdm-settings">
          <button className="pdm-setting-btn" onClick={toggleLang} aria-label="Toggle language">
            <i className="fa-solid fa-globe"></i>
            <span>{lang === "ar" ? "English" : "العربية"}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <button className="pdm-setting-btn" onClick={toggleTheme} aria-label="Toggle theme">
            <i className={theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon"}></i>
            <span>{theme === "dark" ? t("الوضع الفاتح", "Light Mode") : t("الوضع الداكن", "Dark Mode")}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>

        {/* Auth */}
        <div className="pdm-auth">
          <Link to="/register" className="pdm-btn-primary" onClick={() => setMenuOpen(false)}>
            {t("إنشاء حساب", "Create Account")}
          </Link>
          <Link to="/login" className="pdm-btn-secondary" onClick={() => setMenuOpen(false)}>
            <span>{t("تسجيل الدخول", "Login")}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* Footer */}
      
      </div>
    </>
  );
}
