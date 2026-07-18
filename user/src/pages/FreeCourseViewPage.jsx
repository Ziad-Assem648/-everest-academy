import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { useAuth } from "../AuthContext";
import { api } from "../App";
import PublicNavbar from "../components/PublicNavbar";
import FooterSection from "../components/FooterSection";

export default function FreeCourseViewPage() {
  const { t, dir } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { id } = useParams();
  const loc = useLocation();
  const [course, setCourse] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [err, setErr] = useState("");
  const [m, setM] = useState(window.innerWidth <= 768);

  useEffect(() => { const h = () => setM(window.innerWidth <= 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);

  useEffect(() => {
    api(`/api/courses/${id}`).then((data) => {
      setCourse(data);
      const params = new URLSearchParams(loc.search);
      const lessonId = params.get("lesson");
      if (lessonId && data?.topics) {
        for (const topic of data.topics) {
          const found = (topic.lessons || []).find(l => l.id === lessonId && (l.is_free || user?.account_type === "student"));
          if (found) { setPlaying({ ...found, topicTitle: topic.title_ar || topic.title, topicId: topic.id }); break; }
        }
      }
    }).catch(() => setErr(t("الكورس غير موجود", "Course not found")));
  }, [id]);

  if (err) return <div style={{background:theme==="dark"?"#1a1a2e":"#fafafa",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:"#ff5b5b"}}>{err}</p></div>;
  if (!course) return <div style={{background:theme==="dark"?"#1a1a2e":"#fafafa",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:"#9a95b0"}}>{t("جاري التحميل...", "Loading...")}</p></div>;

  const freeLessons = (course.topics || []).flatMap(t => (t.lessons || []).filter(l => l.is_free || user?.account_type === "student").map(l => ({ ...l, topicTitle: t.title_ar || t.title, topicId: t.id })));
  const current = playing || freeLessons[0] || null;
  const isYoutube = (url) => url && (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("youtube.com/embed"));
  const isBunny = (url) => url && (url.includes("player.mediadelivery.net") || url.includes("bunnycdn.com") || url.includes(".b-cdn.net"));
  const getBunnyEmbed = (url) => { if (url.includes(".b-cdn.net")) { const m = url.match(/\.b-cdn\.net\/([a-f0-9-]+)\//); return m ? `https://video.bunnycdn.com/embed/707074/${m[1]}?autoplay=true` : url; } return url.replace("/play/", "/embed/").replace(/(\?.*)?$/, "?autoplay=true"); };
  const getYtEmbed = (url) => { const m2 = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/); return m2 ? `https://www.youtube.com/embed/${m2[1]}?autoplay=1&rel=0` : null; };
  const videoSrc = current?.video_url ? (isYoutube(current.video_url) ? getYtEmbed(current.video_url) : isBunny(current.video_url) ? getBunnyEmbed(current.video_url) : current.video_url) : null;

  const bg = theme === "dark" ? "#1a1a2e" : "#fafafa";
  const card = theme === "dark" ? "#1e1e2f" : "#fff";
  const border = theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const text = theme === "dark" ? "#f0f0f0" : "#111";
  const muted = theme === "dark" ? "#aaa" : "#777";
  const accent = "#d4af37";

  return (
    <div style={{background:bg,minHeight:"100vh",fontFamily:"'Cairo',sans-serif",direction:dir}}>
      <style>{`
        .fcv-topics{max-width:320px;flex-shrink:0;display:flex;flex-direction:column;gap:16px}
        .fcv-topic-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;display:flex;align-items:center;gap:8px}
        .fcv-topic-title i{font-size:11px;color:${accent}}
        .fcv-lesson{padding:12px 16px;border-radius:14px;cursor:pointer;transition:all .25s;display:flex;align-items:center;gap:12px;border:1px solid ${border}}
        .fcv-lesson:hover{transform:translateX(4px)}
        .fcv-lesson.active{border-color:${accent};background:${accent}15}
        .fcv-lesson-num{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}
        .fcv-lesson-info h4{margin:0;font-size:13px;font-weight:700;line-height:1.4}
        .fcv-lesson-info span{font-size:11px;color:${muted}}
        .fcv-player{flex:1;min-width:0}
        .fcv-player-box{width:100%;aspect-ratio:16/9;border-radius:20px;overflow:hidden;background:#000;position:relative}
        .fcv-player-box iframe,.fcv-player-box video{width:100%;height:100%;border:none}
        @media(max-width:900px){.fcv-layout{flex-direction:column!important}.fcv-topics{max-width:100%;flex-direction:row;overflow-x:auto;padding-bottom:8px}}
      `}</style>

      <PublicNavbar active="courses" />

      {/* Course Header */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:m?"16px 5% 0":"100px 5% 0"}}>
        <div style={{background:card,border:`1px solid ${border}`,borderRadius:20,padding:m?16:24,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <Link to="/free-courses" style={{color:accent,fontSize:13,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:6}}>
              <i className="fa-solid fa-arrow-right" style={{fontSize:11}}></i>
              {t("الكورسات المجانية", "Free Courses")}
            </Link>
          </div>
          <h1 style={{fontSize:m?"1.3rem":"1.8rem",fontWeight:800,color:text,margin:"0 0 8px",lineHeight:1.3}}>
            {course.title_ar || course.title}
          </h1>
          <p style={{color:muted,fontSize:m?12:14,lineHeight:1.7,margin:0}}>
            {course.description_ar || course.description}
          </p>
          <div style={{display:"flex",gap:m?8:16,marginTop:16,fontSize:m?11:13,color:muted,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{display:"flex",alignItems:"center",gap:6}}>
              <i className="fa-solid fa-signal" style={{color:accent,fontSize:11}}></i>
              {course.difficulty === "beginner" ? t("مبتدئ", "Beginner") : course.difficulty === "intermediate" ? t("متوسط", "Intermediate") : t("متقدم", "Advanced")}
            </span>
            <span style={{display:"flex",alignItems:"center",gap:6}}>
              <i className="fa-solid fa-play-circle" style={{color:accent,fontSize:11}}></i>
              {freeLessons.length} {t("درس مجاني", "Free Lessons")}
            </span>
            <span style={{display:"flex",alignItems:"center",gap:6}}>
              <i className="fa-solid fa-tag" style={{color:accent,fontSize:11}}></i>
              {t("مجاني", "Free")}
            </span>
          </div>
        </div>

        {/* Registration account block */}
        {user && user.account_type === "registration" && (
          <div style={{background:card,border:`1px solid ${border}`,borderRadius:20,padding:m?"32px 20px":"48px 40px",textAlign:"center",marginBottom:20}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:`${accent}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px"}}>
              <i className="fa-solid fa-lock" style={{fontSize:28,color:accent}}></i>
            </div>
            <h2 style={{fontSize:m?"1.2rem":"1.5rem",fontWeight:800,color:text,margin:"0 0 12px"}}>
              {t("الكورسات متاحة للطلاب فقط", "Courses Available for Students Only")}
            </h2>
            <p style={{color:muted,fontSize:m?13:15,lineHeight:1.8,maxWidth:500,margin:"0 auto 0"}}>
              {t("حسابك من نوع Registration. لمشاهدة الدروس، يرجى الترقية إلى حساب Student أولاً.", "Your account is Registration type. To watch lessons, please upgrade to a Student account first.")}
            </p>
          </div>
        )}

        {/* Layout */}
        <div className="fcv-layout" style={{display:"flex",gap:24,paddingBottom:60}}>
          {/* Player */}
          <div className="fcv-player">
            {current && videoSrc ? (
              <div className="fcv-player-box">
                {isYoutube(current.video_url) || isBunny(current.video_url) ? (
                  <iframe src={videoSrc} allow="autoplay; encrypted-media" allowFullScreen title={current.title_ar || current.title} />
                ) : (
                  <video key={current.id} src={videoSrc} controls autoPlay style={{background:"#000"}} />
                )}
              </div>
            ) : (
              <div className="fcv-player-box" style={{display:"flex",alignItems:"center",justifyContent:"center",color:"#666",fontSize:16}}>
                {t("اختر درساً للمشاهدة", "Select a lesson to watch")}
              </div>
            )}

            {/* Lesson Info */}
            {current && (
              <div style={{background:card,border:`1px solid ${border}`,borderRadius:16,padding:m?16:20,marginTop:16}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{background:`${accent}20`,color:accent,padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:700}}>
                    {current.topicTitle}
                  </span>
                  {current.duration && (
                    <span style={{color:muted,fontSize:12,display:"flex",alignItems:"center",gap:4}}>
                      <i className="fa-regular fa-clock" style={{fontSize:11}}></i>
                      {current.duration}
                    </span>
                  )}
                </div>
                <h2 style={{fontSize:m?"1.1rem":"1.3rem",fontWeight:800,color:text,margin:0}}>
                  {current.title_ar || current.title}
                </h2>
                {current.content_ar || current.content ? (
                  <p style={{color:muted,fontSize:m?12:14,lineHeight:1.8,marginTop:12,marginBottom:0,whiteSpace:"pre-line"}}>
                    {current.content_ar || current.content}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {/* Sidebar - Free Lessons */}
          <div className="fcv-topics">
            {course.topics?.filter(topic => (topic.lessons || []).some(l => l.is_free || user?.account_type === "student")).map((topic) => (
              <div key={topic.id}>
                <div className="fcv-topic-title" style={{color:text}}>
                  <i className="fa-solid fa-folder-open"></i>
                  {topic.title_ar || topic.title}
                </div>
                {(topic.lessons || []).filter(l => l.is_free || user?.account_type === "student").map((lesson, i) => {
                  const isActive = current?.id === lesson.id;
                  return (
                    <div
                      key={lesson.id}
                      className={`fcv-lesson${isActive ? " active" : ""}`}
                      style={{background:isActive ? `${accent}10` : card, marginBottom:8, color:text}}
                      onClick={() => setPlaying({ ...lesson, topicTitle: topic.title_ar || topic.title, topicId: topic.id })}
                    >
                      <div className="fcv-lesson-num" style={{background:isActive ? accent : theme==="dark"?"#2a2a3e":"#f0f0f0", color:isActive ? "#111" : muted}}>
                        <i className={`fa-solid ${isActive ? "fa-pause" : "fa-play"}`} style={{fontSize:10}}></i>
                      </div>
                      <div className="fcv-lesson-info">
                        <h4 style={{color:text}}>{lesson.title_ar || lesson.title}</h4>
                        {lesson.duration && <span><i className="fa-regular fa-clock" style={{fontSize:10,marginRight:4}}></i>{lesson.duration}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {freeLessons.length === 0 && (
              <div style={{textAlign:"center",padding:40,color:muted}}>
                <i className="fa-solid fa-lock" style={{fontSize:32,marginBottom:12,display:"block",opacity:.3}}></i>
                {t("لا توجد دروس مجانية في هذا الكورس", "No free lessons in this course")}
              </div>
            )}
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
