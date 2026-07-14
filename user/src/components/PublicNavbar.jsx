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

      <div className={`menu-overlay${menuOpen ? " active" : ""}`} onClick={() => setMenuOpen(false)}></div>
      <div className={`mobile-menu${menuOpen ? " active" : ""}`}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#d4af37,#b8922a)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <img src="/image/logo-navbar.png" alt="" style={{width:28,height:28,objectFit:"contain",filter:"brightness(0) invert(1)"}} />
            </div>
            <div>
              <h2 style={{margin:0,fontSize:18,fontWeight:800,color:c.text,lineHeight:1.2}}>Everest</h2>
              <span style={{fontSize:11,color:c.textMuted,fontWeight:500}}>{t("أكاديمية إيفرست","Academy")}</span>
            </div>
          </div>
          <button onClick={() => setMenuOpen(false)} style={{width:38,height:38,borderRadius:12,background:c.bgInput,border:`1px solid ${c.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:c.text,transition:".2s"}}
            onMouseEnter={e => e.currentTarget.style.borderColor="#ef4444"}
            onMouseLeave={e => e.currentTarget.style.borderColor=c.border}>
            ✕
          </button>
        </div>

        {/* Navigation Links */}
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {links.map((l) => {
            const isActive = active === l.key;
            return (
              <Link key={l.key} to={l.to} onClick={() => setMenuOpen(false)}
                style={{
                  display:"flex",alignItems:"center",gap:14,height:52,padding:"0 16px",
                  borderRadius:14,textDecoration:"none",fontSize:15,fontWeight:isActive?700:600,
                  color:isActive?"#d4af37":c.text,
                  background:isActive?c.goldLight:"transparent",
                  transition:".2s",
                }}
                onMouseEnter={e => { if(!isActive){e.currentTarget.style.background=c.bgInput;} }}
                onMouseLeave={e => { if(!isActive){e.currentTarget.style.background="transparent";} }}>
                <span style={{width:38,height:38,borderRadius:10,background:isActive?"rgba(212,175,55,.15)":c.bgInput,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                  {l.key==="courses"&&"📚"}{l.key==="about"&&"ℹ️"}{l.key==="feedback"&&"💬"}
                </span>
                <span>{l.label}</span>
                <span style={{marginLeft:"auto",fontSize:12,color:c.textMuted,opacity:.5}}>←</span>
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{height:1,background:c.border,margin:"20px 0"}}></div>

        {/* Settings Row */}
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          <button onClick={toggleLang} style={{flex:1,height:44,borderRadius:12,fontSize:13,fontWeight:600,background:c.bgInput,color:c.text,border:`1px solid ${c.border}`,cursor:"pointer",fontFamily:"Cairo,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:".2s"}}
            onMouseEnter={e => e.currentTarget.style.borderColor="#d4af37"}
            onMouseLeave={e => e.currentTarget.style.borderColor=c.border}>
            {lang==="ar"?"🇺🇸 English":"🇸🇦 العربية"}
          </button>
          <button onClick={toggleTheme} style={{width:44,height:44,borderRadius:12,fontSize:18,background:c.bgInput,color:c.text,border:`1px solid ${c.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:".2s"}}
            onMouseEnter={e => e.currentTarget.style.borderColor="#d4af37"}
            onMouseLeave={e => e.currentTarget.style.borderColor=c.border}>
            {theme==="dark"?"☀️":"🌙"}
          </button>
        </div>

        {/* Auth Buttons */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Link to="/login" onClick={() => setMenuOpen(false)} style={{
            display:"flex",alignItems:"center",justifyContent:"center",height:50,borderRadius:14,
            textDecoration:"none",fontSize:15,fontWeight:700,
            background:c.bgInput,color:c.text,border:`1px solid ${c.border}`,
            transition:".2s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor="#d4af37"}
            onMouseLeave={e => e.currentTarget.style.borderColor=c.border}>
            {t("تسجيل الدخول", "Login")}
          </Link>
          <Link to="/register" onClick={() => setMenuOpen(false)} style={{
            display:"flex",alignItems:"center",justifyContent:"center",height:50,borderRadius:14,
            textDecoration:"none",fontSize:15,fontWeight:700,
            background:"linear-gradient(135deg,#d4af37,#b8922a)",color:"#0a0a1a",
            boxShadow:"0 4px 15px rgba(212,175,55,.25)",transition:".2s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform="none"}>
            {t("إنشاء حساب", "Sign Up")}
          </Link>
        </div>
      </div>
    </>
  );
}
