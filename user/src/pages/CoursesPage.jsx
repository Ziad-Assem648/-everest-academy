import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { api } from "../App";
import AppNavbar from "../components/AppNavbar";
import FooterSection from "../components/FooterSection";

const useIsMobile = () => {
  const [m, setM] = useState(typeof window !== "undefined" && window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
};

const catIcons = {
  all: "fa-solid fa-layer-group",
  trading: "fa-solid fa-chart-line",
  marketing: "fa-solid fa-bullhorn",
  dev: "fa-solid fa-code",
  ai: "fa-solid fa-brain",
  freelance: "fa-solid fa-laptop-code",
};

export default function CoursesPage() {
  const { t, dir } = useLang();
  const { user } = useAuth();
  const { theme, colors: c } = useTheme();
  const m = useIsMobile();
  const nav = useNavigate();
  const loc = useLocation();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api("/api/courses?status=published").then(d => { setCourses(d); setLoaded(true); });
  }, []);

  const cats = [
    { id: "all", label: t("كل العلوم", "All Subjects") },
    { id: "trading", label: t("التداول والاستثمار", "Trading & Investment") },
    { id: "marketing", label: t("التسويق والمبيعات", "Marketing & Sales") },
    { id: "dev", label: t("تطوير البرمجيات", "Software Development") },
    { id: "ai", label: t("الذكاء الاصطناعي", "Artificial Intelligence") },
    { id: "freelance", label: t("العمل الحر الرقمي", "Digital Freelancing") },
  ];

  const sections = [
    { type: "trading", title: t("مسار التداول الفاخر", "Luxury Trading Path"), icon: "fa-solid fa-chart-line" },
    { type: "marketing", title: t("التسويق الرقمي الحديث", "Modern Digital Marketing"), icon: "fa-solid fa-bullhorn" },
    { type: "dev", title: t("علوم البرمجة والويب", "Programming & Web Sciences"), icon: "fa-solid fa-code" },
    { type: "ai", title: t("هندسة الذكاء الاصطناعي", "AI Engineering"), icon: "fa-solid fa-brain" },
    { type: "freelance", title: t("العمل الحر وإطلاق المشاريع", "Freelancing & Launching Projects"), icon: "fa-solid fa-laptop-code" },
  ];

  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (c.title || "").toLowerCase().includes(q) || (c.title_ar || "").includes(q) || (c.description || "").toLowerCase().includes(q) || (c.description_ar || "").toLowerCase().includes(q);
    const matchFilter = filter === "all" || (c.category || "") === filter;
    return matchSearch && matchFilter;
  });

  const isDark = theme === "dark";

  const styles = `
    @keyframes cpFadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes cpFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes cpShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes cpPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .cp-hero {
      position: relative;
      padding: ${m ? "60px 20px 40px" : "80px 40px 60px"};
      text-align: center;
      overflow: hidden;
      background: ${isDark
        ? "linear-gradient(160deg, #0a0a14 0%, #141428 40%, #1a1030 70%, #0d0d1a 100%)"
        : "linear-gradient(160deg, #fafbff 0%, #f0eef8 40%, #f5f0ff 70%, #fafbff 100%)"};
    }
    .cp-hero::before {
      content: '';
      position: absolute;
      top: -50%;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 800px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .cp-hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 18px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 20px;
      background: ${isDark ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.12)"};
      color: #d4af37;
      border: 1px solid ${isDark ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.25)"};
    }
    .cp-hero h1 {
      font-family: 'Cairo', sans-serif;
      font-size: ${m ? "28px" : "42px"};
      font-weight: 900;
      line-height: 1.3;
      margin: 0 0 12px;
      color: ${isDark ? "#fff" : "#111"};
    }
    .cp-hero h1 span {
      background: linear-gradient(135deg, #d4af37, #f0d060, #d4af37);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .cp-hero p {
      font-size: ${m ? "14px" : "16px"};
      color: ${isDark ? "rgba(255,255,255,0.5)" : "#666"};
      max-width: 500px;
      margin: 0 auto 30px;
      line-height: 1.7;
    }
    .cp-search-wrap {
      max-width: 600px;
      margin: 0 auto;
      position: relative;
    }
    .cp-search-wrap input {
      width: 100%;
      padding: ${m ? "14px 16px 14px 48px" : "16px 20px 16px 54px"};
      border-radius: 16px;
      border: 2px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"};
      background: ${isDark ? "rgba(255,255,255,0.04)" : "#fff"};
      color: ${isDark ? "#fff" : "#111"};
      font-size: ${m ? "14px" : "15px"};
      font-family: 'Cairo', sans-serif;
      outline: none;
      transition: all 0.3s ease;
      box-shadow: ${isDark ? "none" : "0 4px 20px rgba(0,0,0,0.04)"};
    }
    .cp-search-wrap input:focus {
      border-color: #d4af37;
      box-shadow: 0 0 0 4px rgba(212,175,55,0.1);
    }
    .cp-search-wrap input::placeholder { color: ${isDark ? "rgba(255,255,255,0.3)" : "#aaa"}; }
    .cp-search-icon {
      position: absolute;
      left: ${m ? "14px" : "18px"};
      top: 50%;
      transform: translateY(-50%);
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #d4af37, #b8942e);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .cp-search-wrap input:focus ~ .cp-search-icon { transform: translateY(-50%) scale(1.05); }
    .cp-stats-row {
      display: flex;
      justify-content: center;
      gap: ${m ? "16px" : "32px"};
      margin-top: 30px;
    }
    .cp-stat {
      text-align: center;
    }
    .cp-stat-num {
      font-size: ${m ? "20px" : "28px"};
      font-weight: 900;
      color: #d4af37;
    }
    .cp-stat-label {
      font-size: ${m ? "11px" : "12px"};
      color: ${isDark ? "rgba(255,255,255,0.4)" : "#888"};
      margin-top: 2px;
    }
    .cp-categories {
      max-width: 1200px;
      margin: ${m ? "20px auto 0" : "0 auto"};
      padding: 0 20px;
      display: flex;
      gap: 10px;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .cp-categories::-webkit-scrollbar { display: none; }
    .cp-cat-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: ${m ? "10px 16px" : "12px 22px"};
      border-radius: 14px;
      border: 2px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"};
      background: ${isDark ? "rgba(255,255,255,0.03)" : "#fff"};
      color: ${isDark ? "rgba(255,255,255,0.5)" : "#777"};
      font-size: ${m ? "12px" : "13px"};
      font-weight: 600;
      font-family: 'Cairo', sans-serif;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.3s cubic-bezier(.16,1,.3,1);
      flex-shrink: 0;
    }
    .cp-cat-btn:hover {
      border-color: rgba(212,175,55,0.3);
      color: #d4af37;
      transform: translateY(-2px);
    }
    .cp-cat-btn.active {
      background: linear-gradient(135deg, #d4af37, #b8942e);
      color: #fff;
      border-color: transparent;
      box-shadow: 0 4px 16px rgba(212,175,55,0.3);
      transform: translateY(-2px);
    }
    .cp-cat-btn i { font-size: ${m ? "12px" : "13px"}; }
    .cp-sections {
      max-width: 1200px;
      margin: 0 auto;
      padding: ${m ? "20px 16px" : "40px 20px"};
    }
    .cp-section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: ${m ? "16px" : "24px"};
    }
    .cp-section-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: ${isDark ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.1)"};
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d4af37;
      font-size: 16px;
      flex-shrink: 0;
    }
    .cp-section-header h2 {
      font-size: ${m ? "18px" : "22px"};
      font-weight: 800;
      color: ${isDark ? "#fff" : "#111"};
      margin: 0;
    }
    .cp-section-line {
      flex: 1;
      height: 1px;
      background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"};
    }
    .cp-courses-grid {
      display: grid;
      grid-template-columns: repeat(${m ? 1 : 3}, 1fr);
      gap: ${m ? "16px" : "24px"};
    }
    .cp-card {
      background: ${isDark ? "rgba(255,255,255,0.03)" : "#fff"};
      border: 1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"};
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(.16,1,.3,1);
      animation: cpFadeUp 0.6s ease both;
      box-shadow: ${isDark ? "none" : "0 2px 16px rgba(0,0,0,0.04)"};
    }
    .cp-card:hover {
      transform: translateY(-8px);
      box-shadow: ${isDark ? "0 20px 60px rgba(0,0,0,0.4)" : "0 20px 60px rgba(0,0,0,0.1)"};
      border-color: rgba(212,175,55,0.2);
    }
    .cp-card:nth-child(2) { animation-delay: 0.1s; }
    .cp-card:nth-child(3) { animation-delay: 0.2s; }
    .cp-card-img {
      position: relative;
      height: ${m ? "160px" : "190px"};
      overflow: hidden;
      background: ${isDark ? "#1a1a2e" : "#f0f0f5"};
    }
    .cp-card-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s cubic-bezier(.16,1,.3,1);
    }
    .cp-card:hover .cp-card-img img {
      transform: scale(1.08);
    }
    .cp-card-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      z-index: 2;
    }
    .cp-badge-free {
      background: rgba(16,185,129,0.9);
      color: #fff;
    }
    .cp-badge-premium {
      background: linear-gradient(135deg, #d4af37, #b8942e);
      color: #fff;
    }
    .cp-card-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: linear-gradient(transparent, rgba(0,0,0,0.5));
      pointer-events: none;
    }
    .cp-card-body {
      padding: ${m ? "16px" : "20px"};
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .cp-card-title {
      font-size: ${m ? "15px" : "16px"};
      font-weight: 700;
      color: ${isDark ? "#fff" : "#111"};
      line-height: 1.4;
      margin: 0;
      height: 44px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      cursor: pointer;
      transition: color 0.2s;
    }
    .cp-card-title:hover { color: #d4af37; }
    .cp-card-desc {
      font-size: ${m ? "12px" : "13px"};
      color: ${isDark ? "rgba(255,255,255,0.4)" : "#888"};
      line-height: 1.6;
      height: 38px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      margin: 0;
    }
    .cp-card-meta {
      display: flex;
      align-items: center;
      gap: ${m ? "12px" : "16px"};
      padding-top: 12px;
      border-top: 1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"};
    }
    .cp-card-meta span {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: ${m ? "11px" : "12px"};
      color: ${isDark ? "rgba(255,255,255,0.4)" : "#888"};
    }
    .cp-card-meta i { color: #d4af37; font-size: ${m ? "11px" : "12px"}; }
    .cp-card-price {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
    }
    .cp-price-main {
      font-size: ${m ? "16px" : "18px"};
      font-weight: 900;
      color: #d4af37;
    }
    .cp-price-sub {
      font-size: ${m ? "11px" : "12px"};
      font-weight: 600;
      color: ${isDark ? "rgba(255,255,255,0.3)" : "#aaa"};
    }
    .cp-card-rating {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #f59e0b;
      font-weight: 600;
    }
    .cp-card-rating span { color: ${isDark ? "rgba(255,255,255,0.3)" : "#aaa"}; font-weight: 400; }
    .cp-card-actions {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 10px;
      margin-top: 6px;
    }
    .cp-btn {
      padding: ${m ? "10px 8px" : "12px 8px"};
      border-radius: 12px;
      font-size: ${m ? "12px" : "13px"};
      font-weight: 700;
      font-family: 'Cairo', sans-serif;
      cursor: pointer;
      border: none;
      transition: all 0.3s cubic-bezier(.16,1,.3,1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-decoration: none;
    }
    .cp-btn-preview {
      background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"};
      color: ${isDark ? "#fff" : "#333"};
      border: 1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"};
    }
    .cp-btn-preview:hover { background: ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}; }
    .cp-btn-buy {
      background: linear-gradient(135deg, #d4af37, #b8942e);
      color: #fff;
      box-shadow: 0 4px 16px rgba(212,175,55,0.25);
    }
    .cp-btn-buy:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(212,175,55,0.35);
    }
    .cp-empty {
      text-align: center;
      padding: ${m ? "60px 20px" : "100px 20px"};
      color: ${isDark ? "rgba(255,255,255,0.3)" : "#aaa"};
    }
    .cp-empty-icon { font-size: 48px; margin-bottom: 16px; }
    .cp-empty h3 { font-size: 18px; margin: 0 0 8px; color: ${isDark ? "rgba(255,255,255,0.5)" : "#666"}; }
    .cp-empty p { font-size: 14px; margin: 0; }
    .cp-grid-all {
      display: grid;
      grid-template-columns: repeat(${m ? 1 : 3}, 1fr);
      gap: ${m ? "16px" : "24px"};
    }

    /* Modal */
    .cp-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 3000;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .cp-modal-overlay.open { opacity: 1; pointer-events: auto; }
    .cp-modal {
      background: ${isDark ? "#141428" : "#fff"};
      border: 1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"};
      border-radius: 24px;
      width: 100%;
      max-width: 560px;
      max-height: 85vh;
      overflow-y: auto;
      transform: translateY(20px) scale(0.97);
      transition: transform 0.3s cubic-bezier(.16,1,.3,1);
    }
    .cp-modal-overlay.open .cp-modal { transform: translateY(0) scale(1); }
    .cp-modal-img {
      position: relative;
      height: ${m ? "180px" : "240px"};
    }
    .cp-modal-img img { width: 100%; height: 100%; object-fit: cover; }
    .cp-modal-close {
      position: absolute;
      top: 14px;
      left: 14px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      border: none;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .cp-modal-close:hover { background: rgba(0,0,0,0.7); }
    .cp-modal-body { padding: ${m ? "20px" : "28px"}; }
    .cp-modal-body h2 {
      font-size: ${m ? "20px" : "24px"};
      font-weight: 800;
      color: ${isDark ? "#fff" : "#111"};
      margin: 0 0 10px;
    }
    .cp-modal-body p {
      font-size: ${m ? "13px" : "14px"};
      color: ${isDark ? "rgba(255,255,255,0.5)" : "#666"};
      line-height: 1.7;
      margin: 0 0 20px;
    }
    .cp-modal-perks {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
    }
    .cp-modal-perk {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 14px;
      background: ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"};
      font-size: ${m ? "12px" : "13px"};
      color: ${isDark ? "rgba(255,255,255,0.7)" : "#444"};
    }
    .cp-modal-perk i { color: #d4af37; font-size: 14px; }
    .cp-modal-start {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      border-radius: 14px;
      background: linear-gradient(135deg, #d4af37, #b8942e);
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      font-family: 'Cairo', sans-serif;
      text-decoration: none;
      transition: all 0.3s;
      box-shadow: 0 4px 16px rgba(212,175,55,0.3);
    }
    .cp-modal-start:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,175,55,0.4); }

    @media (max-width: 768px) {
      .cp-courses-grid, .cp-grid-all { grid-template-columns: 1fr !important; }
    }
    @media (min-width: 769px) and (max-width: 1024px) {
      .cp-courses-grid, .cp-grid-all { grid-template-columns: repeat(2, 1fr) !important; }
    }
  `;

  const renderCard = (c, idx) => (
    <div key={c.id} className="cp-card" style={{ animationDelay: `${idx * 0.08}s` }}>
      <div className="cp-card-img">
        {c.featured_image ? (
          <img src={c.featured_image} alt={c.title_ar || c.title} loading="lazy" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: isDark ? "rgba(255,255,255,0.1)" : "#ddd", fontSize: 40 }}>
            <i className="fa-solid fa-book-open"></i>
          </div>
        )}
        <div className="cp-card-overlay" />
        {c.price === 0 || c.price === "0" ? (
          <div className="cp-card-badge cp-badge-free">{t("مجاني", "Free")}</div>
        ) : (
          <div className="cp-card-badge cp-badge-premium">{t("بريميوم", "Premium")}</div>
        )}
      </div>
      <div className="cp-card-body">
        <h3 className="cp-card-title" onClick={() => setModal(c)}>{c.title_ar || c.title}</h3>
        <p className="cp-card-desc">{c.description_ar || c.description || ""}</p>
        <div className="cp-card-meta">
          <span><i className="fa-solid fa-film"></i> {c.lesson_count || 0} {t("دروس", "Lessons")}</span>
          {c.free_lessons > 0 && (
            <span><i className="fa-solid fa-gift"></i> {c.free_lessons} {t("مجانية", "Free")}</span>
          )}
        </div>
        <div className="cp-card-price">
          <div>
            <div className="cp-price-main">{Number(c.price).toLocaleString()} <span style={{fontSize: "12px", fontWeight: 600}}>E-Money</span></div>
            {c.price_egp > 0 && (
              <div className="cp-price-sub">{Number(c.price_egp).toLocaleString()} {t("ج.م", "EGP")}</div>
            )}
          </div>
          {c.avg_rating > 0 && (
            <div className="cp-card-rating">
              <i className="fa-solid fa-star"></i>
              {c.avg_rating}
              <span>({c.review_count})</span>
            </div>
          )}
        </div>
        <div className="cp-card-actions">
          <button className="cp-btn cp-btn-preview" onClick={() => setModal(c)}>
            <i className="fa-solid fa-play"></i>
            {t("معاينة", "Preview")}
          </button>
          <Link to={`/courses/${c.id}`} className="cp-btn cp-btn-buy">
            <i className="fa-solid fa-shopping-cart"></i>
            {t("امتلك", "Own It")}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: isDark ? "#08080f" : "#f8f8fc", minHeight: "100vh", direction: dir }}>
      <style>{styles}</style>
      <AppNavbar />

      {/* Hero */}
      <div className="cp-hero">
        <div className="cp-hero-badge">
          <i className="fa-solid fa-graduation-cap"></i>
          {t("أكاديمية إيفرست", "Everest Academy")}
        </div>
        <h1>
          {t("اكتشف مسارك", "Discover Your ")}
          <span>{t("التعليمي", "Learning Path")}</span>
        </h1>
        <p>{t("اختر من بين مسارات تعليمية متخصصة صُممت لتحويل مهاراتك إلى مصدر دخل حقيقي", "Choose from specialized learning paths designed to transform your skills into real income")}</p>
        <div className="cp-search-wrap">
          <input
            type="text"
            placeholder={t("ابحث عن مسارك التعليمي الفاخر هنا..", "Search your luxury learning path here..")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="cp-search-icon">
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>
        </div>
        <div className="cp-stats-row">
          <div className="cp-stat">
            <div className="cp-stat-num">{courses.length}+</div>
            <div className="cp-stat-label">{t("مسار تعليمي", "Learning Path")}</div>
          </div>
          <div className="cp-stat">
            <div className="cp-stat-num">{courses.reduce((a, c) => a + (c.lesson_count || 0), 0)}+</div>
            <div className="cp-stat-label">{t("درس", "Lesson")}</div>
          </div>
          <div className="cp-stat">
            <div className="cp-stat-num">5</div>
            <div className="cp-stat-label">{t("تخصصات", "Specializations")}</div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="cp-categories">
        {cats.map((cat) => (
          <button
            key={cat.id}
            className={`cp-cat-btn ${filter === cat.id ? "active" : ""}`}
            onClick={() => setFilter(cat.id)}
          >
            <i className={catIcons[cat.id]}></i>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Courses */}
      <div className="cp-sections">
        {filter === "all" ? (
          <>
            {search ? (
              filteredCourses.length > 0 ? (
                <div className="cp-section-header">
                  <div className="cp-section-icon"><i className="fa-solid fa-magnifying-glass"></i></div>
                  <h2>{t("نتائج البحث", "Search Results")}</h2>
                  <div className="cp-section-line" />
                </div>
              ) : null
            ) : null}
            {filteredCourses.length > 0 ? (
              <div className="cp-grid-all">
                {filteredCourses.map((c, i) => renderCard(c, i))}
              </div>
            ) : (
              <div className="cp-empty">
                <div className="cp-empty-icon"><i className="fa-solid fa-magnifying-glass"></i></div>
                <h3>{t("لا توجد نتائج", "No Results Found")}</h3>
                <p>{t("جرب كلمات بحث مختلفة", "Try different search terms")}</p>
              </div>
            )}
          </>
        ) : (
          sections.filter(sec => sec.type === filter).map((sec) => {
            const secCourses = filteredCourses.filter(c => (c.category || "") === sec.type);
            if (secCourses.length === 0) return null;
            return (
              <div key={sec.type} style={{ marginBottom: 40 }}>
                <div className="cp-section-header">
                  <div className="cp-section-icon"><i className={sec.icon}></i></div>
                  <h2>{sec.title}</h2>
                  <div className="cp-section-line" />
                </div>
                <div className="cp-courses-grid">
                  {secCourses.map((c, i) => renderCard(c, i))}
                </div>
              </div>
            );
          })
        )}
        {filter !== "all" && filteredCourses.length === 0 && (
          <div className="cp-empty">
            <div className="cp-empty-icon"><i className="fa-solid fa-book-open"></i></div>
            <h3>{t("لا توجد كورسات في هذا التخصص", "No courses in this specialization")}</h3>
            <p>{t("جرّب تخصص آخر", "Try another specialization")}</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <div className={`cp-modal-overlay ${modal ? "open" : ""}`} onClick={(e) => { if (e.target.classList.contains("cp-modal-overlay")) setModal(null); }}>
        {modal && (
          <div className="cp-modal">
            <div className="cp-modal-img">
              <button className="cp-modal-close" onClick={() => setModal(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
              {modal.featured_image ? (
                <img src={modal.featured_image} alt="" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: isDark ? "rgba(255,255,255,0.1)" : "#ddd", fontSize: 50 }}>
                  <i className="fa-solid fa-book-open"></i>
                </div>
              )}
            </div>
            <div className="cp-modal-body">
              <h2>{modal.title_ar || modal.title}</h2>
              <p>{modal.description_ar || modal.description}</p>
              <div className="cp-modal-perks">
                <div className="cp-modal-perk">
                  <i className="fa-solid fa-shield-halved"></i>
                  {t("الجلستين الأولى مجانية تماماً بالمنصة", "First 2 sessions completely free on the platform")}
                </div>
                <div className="cp-modal-perk">
                  <i className="fa-solid fa-trophy"></i>
                  {t("شهادة مهنية معتمدة فور إتمام المسار", "Professional certificate upon path completion")}
                </div>
              </div>
              <Link to={`/courses/${modal.id}`} className="cp-modal-start" onClick={() => setModal(null)}>
                {t("ابدأ المسار الآن", "Start the Path Now")}
                <i className="fa-solid fa-arrow-left"></i>
              </Link>
            </div>
          </div>
        )}
      </div>

      <FooterSection />
    </div>
  );
}
