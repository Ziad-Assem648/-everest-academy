import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import PublicNavbar from "../components/PublicNavbar";
import FooterSection from "../components/FooterSection";


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
          <img src="image/home-image.jpeg" alt="" />
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
      <FooterSection />

      
        </div>
    
  );
}
