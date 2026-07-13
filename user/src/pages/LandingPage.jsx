import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import PublicNavbar from "../components/PublicNavbar";
import CustomerServiceFooter from "../components/CustomerServiceFooter";


export default function LandingPage() {
  const { t, lang } = useLang();
  const { theme, toggle, colors: c } = useTheme();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [stats, setStats] = useState({ totalMembers: 0, satisfactionRate: 95, totalFeedbacks: 0 });

  useEffect(() => {
    fetch("/api/dashboard/public-stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const reveals = document.querySelectorAll(".landing-page .reveal");
    const revealElements = () => {
      reveals.forEach((item) => {
        const top = item.getBoundingClientRect().top;
        const trigger = window.innerHeight - 100;
        if (top < trigger) item.classList.add("active");
      });
    };
    window.addEventListener("scroll", revealElements);
    revealElements();

    return () => {
      window.removeEventListener("scroll", revealElements);
    };
  }, []);

  return (
    <div className="landing-page">
      <PublicNavbar />

      {/* Hero */}
      <section className="hero-section">
        <video className="video-bg" autoPlay muted loop playsInline>
          <source src="video/IMG_1327.mp4" type="video/mp4" />
        </video>
        <div className="overlay"></div>
        <div className="video-content-layer">
          <img src="image/logopanner.png" className="logo-fxpro-left" alt="" />
          <div className="center-content">
            <h1>
              {t(".اتقن المهارات", ".Master Skills")}
              <br /> {t(".ابنِ مستقبلك", ".Build Your Future")} <br />
            </h1>
            <Link to="/register" className="btn-trading">{t("ابدأ الآن", "Get Started")}</Link>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="tracks-section">
        <div className="tracks-card">
          <div className="tracks-header">
            <span className="tag">{t("برامجنا", "OUR PROGRAMS")}</span>
            <h2>{t("اختر مستقبلك المهني", "Choose Your Future Career")}</h2>
            <p>{t("سواء كنت تبدأ من الصفر أو تبحث عن تطوير مهارات جديدة، فإن برامجنا مصممة لمساعدتك على التعلم والنمو والتقدم بثقة.", "Whether you're starting from scratch or looking to develop new skills, our programs are designed to help you learn, grow, and move forward with confidence.")}</p>
          </div>
          <div className="tracks-grid">
            <div className="track-box">
              <div className="track-icon"><i className="fa-solid fa-bullhorn"></i></div>
              <h3>{t("Media Buying", "Media Buying")}</h3>
              <p>{t("تعلم كيفية إنشاء وإدارة وتحسين الحملات الإعلانية عالية الأداء.", "Learn how to create, manage, and optimize high-performing advertising campaigns.")}</p>
            </div>
            <div className="track-box">
              <div className="track-icon"><i className="fa-solid fa-hashtag"></i></div>
              <h3>{t("Social Media", "Social Media")}</h3>
              <p>{t("أنشئ محتوى جذاب وابنِ حضوراً رقمياً قوياً.", "Create engaging content and build a strong digital presence.")}</p>
            </div>
            <div className="track-box">
              <div className="track-icon"><i className="fa-solid fa-chart-line"></i></div>
              <h3>{t("Trading", "Trading")}</h3>
              <p>{t("تعلم تحليل السوق وإدارة المخاطر واستراتيجيات التداول.", "Learn market analysis, risk management, and trading strategies.")}</p>
            </div>
            <div className="track-box">
              <div className="track-icon"><i className="fa-solid fa-cart-shopping"></i></div>
              <h3>{t("Dropshipping", "Dropshipping")}</h3>
              <p>{t("أطلق وأدر متجرك الإلكتروني الخاص.", "Launch and manage your own online business.")}</p>
            </div>
          </div>
        </div>
      </section>



      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>{t("أطلق العنان لإمكانياتك من خلال التعلم والنمو والمجتمع.", "Unlock your potential through learning, growth, and community.")}</h2>
          <Link to="/register" className="cta-btn">{t("ابدأ الآن", "Start Now")}</Link>
        </div>
      </section>

      {/* Platforms Intro */}
      <section className="platforms-intro">
        <div className="platforms-title">
          <h2>
            {t("استكشف محتوانا التعليمي", "Explore Our Learning Content")}
            <span></span>
          </h2>
        </div>
        <div className="platforms-text">
          <div className="line"></div>
          <p>{t("اكتشف مجموعة واسعة من الجلسات التعليمية العملية المصممة لمساعدتك على تطوير مهارات جديدة وتحقيق أهدافك والنمو بثقة.", "Discover a wide range of practical learning sessions designed to help you develop new skills, achieve your goals, and grow with confidence.")}</p>
        </div>
      </section>

      {/* Platform Showcase */}
      <section className="platform-showcase">
        <div className="showcase-image reveal">
          <img src="image/Screenshot_2026-06-26_043217-removebg-preview.png" alt="" />
        </div>
        <div className="features-slider"></div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-wrapper">
          <div className="stat-card">
            <i className="fa-solid fa-building-shield"></i>
            <h2 className="stat-number">5</h2>
            <h3 className="stat-title">{t("التراخيص", "Regulations")}</h3>
            <p className="stat-desc">{t("مرخصة في عدة جهات قضائية مع حماية قوية للمستثمرين.", "Regulated across multiple jurisdictions with strong investor protection.")}</p>
          </div>
          <div className="stat-card">
            <i className="fa-solid fa-star"></i>
            <h2 className="stat-number">{stats.totalFeedbacks >= 5 ? `${(stats.satisfactionRate / 20).toFixed(1)} ★` : "5-star"}</h2>
            <h3 className="stat-title">{stats.totalFeedbacks >= 5 ? t("تقييم المنصة", "Platform Rating") : t("خدمة العملاء", "Customer Service")}</h3>
            <p className="stat-desc">{stats.totalFeedbacks >= 5 ? t(`متوسط ${stats.totalFeedbacks} تقييم من الطلاب`, `Average of ${stats.totalFeedbacks} student reviews`) : t("فريق دعم متعدد اللغات متاح 24/5 بجودة خدمة استثنائية.", "Multilingual support team available 24/5 with exceptional service quality.")}</p>
          </div>
          <div className="stat-card">
            <i className="fa-solid fa-award"></i>
            <h2 className="stat-number">142+</h2>
            <h3 className="stat-title">{t("الجوائز", "Awards")}</h3>
            <p className="stat-desc">{t("معترف بها عالمياً مع أكثر من 142 جائزة دولية.", "Recognized globally with more than 142 international awards.")}</p>
          </div>
          <div className="stat-card">
            <i className="fa-solid fa-user"></i>
            <h2 className="stat-number">{stats.totalMembers >= 100 ? stats.totalMembers.toLocaleString() : "1,000"}</h2>
            <h3 className="stat-title">{t("حسابات العملاء", "Client Accounts")}</h3>
            <p className="stat-desc">{t("تقديم خدمات التداول عبر الإنترنت منذ 1999 في أكثر من 170 دولة.", "Providing online trading services since 1999 across 170+ countries.")}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
       
        <div className="footer-middle">
          <div className="brand">
            <h3>E</h3>
            <span>{t("© 1999 - 2026 Everest Academy", "© 1999 - 2026 Everest Academy")}</span>
          </div>
          <div className="social" style={{display:"flex",gap:16,justifyContent:"center",alignItems:"center"}}>
            <a href="#" style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#0088cc,#005f8f)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",textDecoration:"none",fontSize:20,transition:"transform .2s,box-shadow .2s",boxShadow:"0 4px 15px rgba(0,136,204,.4)"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px) scale(1.1)";e.currentTarget.style.boxShadow="0 8px 25px rgba(0,136,204,.6)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 15px rgba(0,136,204,.4)";}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
            <a href="#" style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#E1306C,#F77737,#FCAF45)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",textDecoration:"none",fontSize:20,transition:"transform .2s,box-shadow .2s",boxShadow:"0 4px 15px rgba(225,48,108,.4)"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px) scale(1.1)";e.currentTarget.style.boxShadow="0 8px 25px rgba(225,48,108,.6)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 15px rgba(225,48,108,.4)";}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="#fff" stroke="none"/></svg>
            </a>
            <a href="#" style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#010101,#333)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",textDecoration:"none",fontSize:20,transition:"transform .2s,box-shadow .2s",boxShadow:"0 4px 15px rgba(0,0,0,.4)"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px) scale(1.1)";e.currentTarget.style.boxShadow="0 8px 25px rgba(0,0,0,.6)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 15px rgba(0,0,0,.4)";}}>
              <svg width="20" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.89c.3 0 .59.04.86.12V9.01a6.28 6.28 0 00-.86-.06 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.86a8.21 8.21 0 004.86 1.56V6.97a4.84 4.84 0 01-1.1-.28z"/></svg>
            </a>
          </div>
        </div>
        <div className="footer-bottom" style={{textAlign:"center",display:"block",padding:"20px"}}>
          <CustomerServiceFooter />
        </div>
      </footer>

      {/* Disclaimer */}
      <section className="disclaimer">
        <div className="disclaimer-grid">
          <p><strong>{t("تداول بمسؤولية:", "Trade Responsibly:")}</strong> {t("تداول الأدوات المالية يحمل درجة عالية من المخاطرة...", "Trading financial instruments carry a high level...")}</p>
          <p>{t("Everest Academy هي علامة تجارية مسجلة تستخدم بموجب...", "Everest Academy is a registered trademark utilised under...")}</p>
          <p>{t("Everest Academy لا تقدم خدمات للمقيمين في...", "Everest Academy doesn't offer services to residents...")}</p>
        </div>
      </section>

     
        </div>
    
  );
}
