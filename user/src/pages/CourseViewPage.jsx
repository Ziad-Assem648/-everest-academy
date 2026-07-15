import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { api } from "../App";
import { useTheme } from "../ThemeContext";
import AppNavbar from "../components/AppNavbar";
import QuizModal from "../components/QuizModal";

export default function CourseViewPage() {
  const { t, dir } = useLang();
  const { id } = useParams();
  const { user, login, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const { colors: c } = useTheme();
  const [m, setM] = useState(window.innerWidth <= 768);
  useEffect(() => { const h = () => setM(window.innerWidth <= 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  const [course, setCourse] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [buying, setBuying] = useState(false);
  const [err, setErr] = useState("");
  const [gateways, setGateways] = useState([]);
  const [balanceError, setBalanceError] = useState("");
  const [quizProgress, setQuizProgress] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [reviewData, setReviewData] = useState({ reviews: [], avg_rating: 0, count: 0 });
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    api(`/api/courses/${id}`).then((data) => {
      setCourse(data);
      const params = new URLSearchParams(loc.search);
      const lessonId = params.get("lesson");
      if (lessonId && data?.topics) {
        for (const topic of data.topics) {
          const found = (topic.lessons || []).find(l => l.id === lessonId);
          if (found) { setPlaying({ ...found, topicTitle: topic.title_ar || topic.title, topicId: topic.id }); break; }
        }
      }
    }).catch(() => setErr(t("الكورس غير موجود", "Course not found")));
  }, [id]);

  useEffect(() => {
    api(`/api/courses/${id}/reviews`).then(setReviewData).catch(() => {});
  }, [id]);

  useEffect(() => {
    api("/api/payment-gateways/active").then((data) => {
      if (Array.isArray(data)) setGateways(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user && course) {
      api(`/api/courses/my?userId=${user.id}&courseId=${id}`).then((data) => {
        const active = data.filter(e => e.status === "approved" || e.status === "pending");
        if (active.length) setEnrollment(active[0]);
        else setEnrollment(null);
      }).catch(() => {});
    }
  }, [user, course, id]);

  useEffect(() => {
    if (user && course) {
      api(`/api/courses/${id}/quiz-progress?userId=${user.id}`).then(setQuizProgress).catch(() => {});
    }
  }, [user, course, id]);

  const isQuizPassed = useCallback((quizId) => {
    if (!quizId) return true;
    return quizProgress.some(q => q.id === quizId && q.passed);
  }, [quizProgress]);

  const refreshQuizProgress = () => {
    if (user && course) {
      api(`/api/courses/${id}/quiz-progress?userId=${user.id}`).then(setQuizProgress).catch(() => {});
    }
  };

  const buyCourse = async (method = "emoney") => {
    if (!user) { nav("/login"); return; }
    if (user.account_type === "registration_sponsor") {
      alert(t("حسابك من نوع Registration (Sponsor). يجب الترقية إلى Student أولاً من صفحة الملف الشخصي.", "Your account is Registration (Sponsor). You must upgrade to Student first from your profile page."));
      nav("/profile");
      return;
    }
    setBuying(true);
    try {
      const result = await api(`/api/courses/${id}/purchase`, {
        method: "POST", body: JSON.stringify({ userId: user.id, payment_method: method })
      });
      setEnrollment(result);
      if (method === "emoney" && (result.status === "pending" || result.status === "approved")) {
        user.e_money = (user.e_money || 0) - (course.price || 0);
        login(user);
      }
    } catch (e) {
      if (e.upgradeRequired) {
        alert(t("حسابك من نوع Registration (Sponsor). يجب الترقية إلى Student أولاً.", "Your account is Registration (Sponsor). You must upgrade to Student first."));
        nav("/profile");
      } else {
        alert(t("خطأ: ", "Error: ") + (e.message || t("فشل عملية الشراء", "Purchase failed")));
      }
    }
    setBuying(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "PrintScreen" || e.keyCode === 44) { e.preventDefault(); alert(t("لا يُسمح بالتقاط الشاشة", "Screenshots are not allowed")); return false; }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "s" || e.key === "S")) { e.preventDefault(); alert(t("لا يُسمح بتسجيل الشاشة", "Screen recording is not allowed")); return false; }
      if (e.ctrlKey && e.key === "p") { e.preventDefault(); return false; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const blockCtx = (e) => { e.preventDefault(); return false; };

  // Find the lesson quiz for the current lesson
  const getCurrentLessonQuiz = (lesson) => {
    if (!course?.topics) return null;
    for (const topic of course.topics) {
      for (const l of (topic.lessons || [])) {
        if (l.id === lesson.id && l.quiz) return l.quiz;
      }
    }
    return null;
  };

  // Find the topic quiz for a given topic
  const getTopicQuiz = (topic) => {
    if (!topic.quizzes) return null;
    return topic.quizzes.find(q => q.type === "topic" || (!q.type && !q.lesson_id)) || null;
  };

  // Check if all lessons in a topic are completed (for topic quiz gating)
  const isTopicFullyCompleted = (topic) => {
    return (topic.lessons || []).every(l => completedLessons.has(l.id));
  };

  // Navigate to next lesson, checking quiz requirements
  const goToNext = () => {
    const allLessons = (course.topics || []).flatMap((t) => (t.lessons || []).map((l) => ({ ...l, topicTitle: t.title_ar || t.title, topicId: t.id })));
    const currentIdx = allLessons.findIndex((l) => l.id === current?.id);
    if (currentIdx >= allLessons.length - 1) {
      // Check for final quiz
      if (course.final_quiz && !isQuizPassed(course.final_quiz.id)) {
        setActiveQuiz(course.final_quiz);
      }
      return;
    }

    // Mark current lesson as completed
    setCompletedLessons(prev => new Set([...prev, current.id]));

    // Check if current lesson has a quiz that hasn't been passed
    const lessonQuiz = getCurrentLessonQuiz(current);
    if (lessonQuiz && !isQuizPassed(lessonQuiz.id)) {
      setActiveQuiz(lessonQuiz);
      return;
    }

    const nextLesson = allLessons[currentIdx + 1];

    // Check if we're moving to a new topic - check topic quiz
    if (nextLesson.topicId !== current.topicId) {
      const nextTopic = course.topics.find(t => t.id === nextLesson.topicId);
      const prevTopic = course.topics.find(t => t.id === current.topicId);
      if (prevTopic) {
        const topicQuiz = getTopicQuiz(prevTopic);
        if (topicQuiz && !isQuizPassed(topicQuiz.id)) {
          setActiveQuiz(topicQuiz);
          return;
        }
      }
    }

    setPlaying(nextLesson);
  };

  const goToPrev = () => {
    const allLessons = (course.topics || []).flatMap((t) => (t.lessons || []).map((l) => ({ ...l, topicTitle: t.title_ar || t.title })));
    const currentIdx = allLessons.findIndex((l) => l.id === current?.id);
    if (currentIdx > 0) setPlaying(allLessons[currentIdx - 1]);
  };

  const onQuizPassed = () => {
    refreshQuizProgress();
    setCompletedLessons(prev => new Set([...prev, current?.id]));
  };

  if (err) return <div className="courses-body" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><p style={{color:"#ff5b5b"}}>{err}</p></div>;
  if (!course) return <div className="courses-body" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><p style={{color:"#9a95b0"}}>{t("جاري التحميل...", "Loading...")}</p></div>;

  const isFree = course.is_free || course.price === 0;
  const isApproved = enrollment?.status === "approved";
  const isPending = enrollment?.status === "pending";
  const isEnrolled = isApproved || (isFree && enrollment);
  const canWatchAll = isEnrolled || isFree;
  const isRegistration = user?.account_type === "registration" || user?.account_type === "registration_sponsor";

  const allLessons = (course.topics || []).flatMap((t) => (t.lessons || []).map((l) => ({ ...l, topicTitle: t.title_ar || t.title, topicId: t.id })));
  const current = playing || allLessons[0] || null;
  const idx = allLessons.findIndex((l) => l.id === current?.id);
  const isYoutube = (url) => url && (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("youtube.com/embed"));
  const getYtEmbed = (url) => { const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/); return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` : null; };
  const videoSrc = current?.video_url ? (isYoutube(current.video_url) ? getYtEmbed(current.video_url) : current.video_url) : null;

  // Check if the current lesson is blocked by a quiz
  const currentLessonQuiz = current ? getCurrentLessonQuiz(current) : null;
  const currentQuizBlocked = currentLessonQuiz && !isQuizPassed(currentLessonQuiz.id);

  // Check if next lesson is blocked by lesson/topic quiz
  const nextLesson = idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
  const isNextTopicNew = nextLesson && current && nextLesson.topicId !== current.topicId;

  return (
    <div className="courses-body" style={{background:c.bg}}>
      <AppNavbar />
      <main className="courses-main">
        <div style={{background:c.bgCard,border:`1px solid ${c.borderLight}`,borderRadius:20,padding:m?16:24,marginBottom:20}}>
          <h2 style={{fontSize:m?"1.3rem":"1.8rem",fontWeight:800,background:"linear-gradient(135deg,#fdfbfb,#e2c275,#b38728)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8}}>
            {course.title_ar || course.title}
          </h2>
          <p style={{color:c.textMuted,fontSize:m?12:14}}>{course.description_ar || course.description}</p>
          <div style={{display:"flex",gap:m?8:15,marginTop:15,fontSize:m?11:13,color:c.textMuted,flexWrap:"wrap",alignItems:"center"}}>
            <span><strong style={{color:"#e2c275"}}>{t("المستوى:", "Level:")}</strong> {course.difficulty === "beginner" ? t("مبتدئ", "Beginner") : course.difficulty === "intermediate" ? t("متوسط", "Intermediate") : t("متقدم", "Advanced")}</span>
            <span><strong style={{color:"#e2c275"}}>{t("السعر:", "Price:")}</strong> {!isFree && `${course.price} E-Money`}{!isFree && course.price_egp > 0 ? ` — ${course.price_egp} ${t("ج.م", "EGP")}` : ""}{isFree && t("مجاني", "Free")}</span>
            <span><strong style={{color:"#e2c275"}}>{t("الدروس:", "Lessons:")}</strong> {allLessons.length}</span>
            {reviewData.avg_rating > 0 && <span style={{color:"#f59e0b",fontWeight:600}}>⭐ {reviewData.avg_rating} <span style={{color:c.textMuted,fontWeight:400}}>({reviewData.count} {t("تقييم", "reviews")})</span></span>}
          </div>
        </div>

        {isRegistration && !isEnrolled && (
          <div style={{background:"rgba(179,135,40,.1)",border:"1px solid rgba(179,135,40,.2)",borderRadius:14,padding:16,marginBottom:20,color:"#e2c275",fontSize:14}}>
            ⚠️ {t("حسابك من نوع Registration. يمكنك مشاهدة الدروس المجانية فقط.", "Your account is Registration type. You can only watch free lessons.")}
            <Link to="/profile" style={{color:c.text,fontWeight:700,display:"block",marginTop:8}}>{t("طلب ترقية إلى Student", "Request Upgrade to Student")}</Link>
          </div>
        )}

        {isPending && (
          <div style={{background:"rgba(254,212,0,.08)",border:"1px solid rgba(254,212,0,.2)",borderRadius:14,padding:16,marginBottom:20,color:"#fed400",fontSize:14}}>
            ⏳ {t("تم تقديم طلب الشراء. في انتظار موافقة الادمن ...", "Purchase request submitted. Waiting for admin approval...")}
          </div>
        )}

        {isApproved && (
          <div style={{background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.2)",borderRadius:14,padding:16,marginBottom:20,color:"#22c55e",fontSize:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>✅ {t("تم تفعيل الكورس. يمكنك مشاهدة جميع الدروس.", "Course activated. You can watch all lessons.")}</span>
            <Link to="/feedback" style={{padding:"6px 16px",background:"linear-gradient(135deg,#b38728,#e2c275)",borderRadius:8,color:"#05030a",fontWeight:700,fontSize:12,textDecoration:"none"}}>
              💬 {t("قيّم الكورس", "Rate Course")}
            </Link>
          </div>
        )}

        {!isEnrolled && !isPending && !isFree && user?.role === "student" && (
          <div style={{textAlign:"center",padding:"16px 0",marginBottom:20}}>
            {(user?.e_money || 0) < course.price && (
              <div style={{background:"rgba(255,91,91,.1)",border:"1px solid rgba(255,91,91,.2)",borderRadius:14,padding:12,marginBottom:16,color:"#ff5b5b",fontSize:13}}>
                ⚠️ {t("رصيد E-Money الحالي", "Current E-Money balance")} ({user?.e_money || 0}) {t("لا يكفي لشراء هذا الكورس", "is not enough to purchase this course")} ({course.price}). {t("يرجى شحن رصيدك أو استخدام طريقة دفع أخرى.", "Please top up your balance or use another payment method.")}
              </div>
            )}
            {balanceError && <p style={{color:"#ff5b5b",fontSize:13,marginBottom:10}}>{balanceError}</p>}
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={async () => {
                if ((user?.e_money || 0) < course.price) { setBalanceError(t("رصيد E-Money غير كافٍ", "Insufficient E-Money balance")); return; }
                setBalanceError(""); await buyCourse("emoney");
              }} disabled={buying}
                style={{padding:"14px 26px",background:"linear-gradient(135deg,#b38728,#e2c275)",border:"none",borderRadius:14,color:"#05030a",fontWeight:800,fontSize:14,cursor:"pointer",opacity:buying?0.6:1}}>
                {buying ? t("جاري الشراء...", "Purchasing...") : `💳 ${t("اشتري بـ", "Buy for")} ${course.price} E-Money${course.price_egp > 0 ? ` / ${course.price_egp} ${t("ج.م", "EGP")}` : ""}`}
              </button>
              <button onClick={() => buyCourse("cash")} disabled={buying}
                style={{padding:"14px 26px",background:c.bgInput,border:`1px solid ${c.borderLight}`,borderRadius:14,color:c.text,fontWeight:700,fontSize:14,cursor:"pointer",opacity:buying?0.6:1}}>
                💵 {t("دفع كاش (للادمن)", "Cash Payment (for Admin)")}
              </button>
              {gateways.some(g => g.type === "vodafone") && (
                <Link to={`/courses/${id}/vodafone-cash`}
                  style={{padding:"14px 26px",background:c.bgInput,border:`1px solid ${c.borderLight}`,borderRadius:14,color:c.text,fontWeight:700,fontSize:14,cursor:"pointer",textDecoration:"none",display:"inline-flex",alignItems:"center"}}>
                  📱 {t("فودافون كاش", "Vodafone Cash")}
                </Link>
              )}
              {gateways.some(g => g.type === "instapay") && (
                <Link to={`/courses/${id}/instapay`}
                  style={{padding:"14px 26px",background:c.bgInput,border:`1px solid ${c.borderLight}`,borderRadius:14,color:c.text,fontWeight:700,fontSize:14,cursor:"pointer",textDecoration:"none",display:"inline-flex",alignItems:"center"}}>
                  🏦 {t("انستاباي", "InstaPay")}
                </Link>
              )}
            </div>
            <p style={{color:c.textMuted,fontSize:12,marginTop:8}}>{t("رصيدك الحالي:", "Your current balance:")} {user?.e_money || 0} E-Money</p>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 2fr",gap:20,alignItems:"start"}}>
          <div style={{background:c.bgCard,border:`1px solid ${c.borderLight}`,borderRadius:16,padding:16}}>
            <h3 style={{fontSize:14,fontWeight:700,color:"#e2c275",marginBottom:12,letterSpacing:1}}>{t("محتوى الكورس", "COURSE CONTENT")}</h3>
            {(course.topics || []).map((topic) => {
              const topicQuiz = getTopicQuiz(topic);
              const topicQuizPassed = topicQuiz ? isQuizPassed(topicQuiz.id) : true;
              return (
                <div key={topic.id} style={{marginBottom:12}}>
                  <p style={{fontSize:11,fontWeight:700,color:c.textMuted,marginBottom:6,padding:"0 8px"}}>
                    {topic.title_ar || topic.title}
                    {topicQuiz && <span style={{marginLeft:6,fontSize:10,color:topicQuizPassed ? "#22c55e" : "#e2c275"}}>{topicQuizPassed ? "✅" : "📝"}</span>}
                  </p>
                  {(topic.lessons || []).map((lesson) => {
                    const locked = !canWatchAll && !lesson.is_free;
                    const lessonQuiz = lesson.quiz;
                    const lessonQuizPassed = lessonQuiz ? isQuizPassed(lessonQuiz.id) : true;
                    const isPlaying = current?.id === lesson.id;
                    return (
                      <button key={lesson.id} onClick={() => !locked && setPlaying(lesson)} disabled={locked}
                        style={{width:"100%",textAlign:"right",padding:"8px 12px",borderRadius:8,border:"none",fontSize:13,cursor:locked?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:8,marginBottom:4,
                          background:isPlaying?"linear-gradient(135deg,#b38728,#e2c275)":c.bgInput,
                          color:isPlaying?"#05030a":locked?"#555":c.text,
                          fontWeight:isPlaying?700:400
                        }}>
                        <span>{locked ? "🔒" : isPlaying ? "▶" : "🎬"}</span>
                        <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right"}}>{lesson.title_ar || lesson.title}</span>
                        {locked && <span style={{fontSize:9,background:"rgba(255,91,91,.1)",color:"#ff5b5b",padding:"1px 6px",borderRadius:4,whiteSpace:"nowrap"}}>{t("اشترِ الكورس", "Buy Course")}</span>}
                        {lesson.is_free && <span style={{fontSize:10,background:"rgba(254,212,0,.15)",color:"#fed400",padding:"1px 6px",borderRadius:4}}>{t("مجاني", "FREE")}</span>}
                        {lessonQuiz && <span style={{fontSize:10,background:lessonQuizPassed ? "rgba(34,197,94,.15)" : "rgba(255,91,91,.15)",color:lessonQuizPassed ? "#22c55e" : "#ff5b5b",padding:"1px 6px",borderRadius:4}}>{lessonQuizPassed ? "✅" : "📝"}</span>}
                      </button>
                    );
                  })}
                  {topicQuiz && (
                    <button onClick={() => setActiveQuiz(topicQuiz)}
                      style={{width:"100%",textAlign:"right",padding:"6px 12px",borderRadius:8,border:"none",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginBottom:4,
                        background:topicQuizPassed ? "rgba(34,197,94,.08)" : "rgba(212,175,55,.08)",
                        color:topicQuizPassed ? "#22c55e" : "#d4af37",
                        fontWeight:600
                      }}>
                      <span>📝</span>
                      <span style={{flex:1,textAlign:"right"}}>{topicQuiz.title || t("اختبار الموضوع", "Topic Quiz")}</span>
                      <span style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:topicQuizPassed ? "rgba(34,197,94,.15)" : "rgba(255,91,91,.15)"}}>{topicQuizPassed ? "✅" : t("لم يُكمل", "Pending")}</span>
                    </button>
                  )}
                </div>
              );
            })}
            {course.final_quiz && (
              <button onClick={() => setActiveQuiz(course.final_quiz)}
                style={{width:"100%",textAlign:"right",padding:"8px 12px",borderRadius:8,border:"none",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginBottom:4,marginTop:8,
                  background:isQuizPassed(course.final_quiz.id) ? "rgba(34,197,94,.08)" : "rgba(212,175,55,.08)",
                  color:isQuizPassed(course.final_quiz.id) ? "#22c55e" : "#d4af37",
                  fontWeight:600
                }}>
                <span>🏆</span>
                <span style={{flex:1,textAlign:"right"}}>{course.final_quiz.title || t("الاختبار النهائي", "Final Quiz")}</span>
                <span style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:isQuizPassed(course.final_quiz.id) ? "rgba(34,197,94,.15)" : "rgba(255,91,91,.15)"}}>{isQuizPassed(course.final_quiz.id) ? "✅" : t("لم يُكمل", "Pending")}</span>
              </button>
            )}
          </div>

          <div style={{background:c.bgCard,border:`1px solid ${c.borderLight}`,borderRadius:16,overflow:"hidden",position:"relative"}}>
            <div onContextMenu={blockCtx} style={{aspectRatio:"16/9",background:"#000",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",userSelect:"none",WebkitUserSelect:"none"}}>
              {current && (isRegistration || (!canWatchAll && !current.is_free)) ? (
                <div style={{textAlign:"center",color:"#555",padding:m?20:30}}>
                  <p style={{fontSize:m?36:48,marginBottom:m?8:12}}>🔒</p>
                  {isRegistration ? (
                    <>
                      <p style={{fontWeight:700,color:c.text,marginBottom:4,fontSize:m?14:16}}>{t("الكورسات متاحة للطلاب فقط", "Courses Available for Students Only")}</p>
                      <p style={{fontSize:m?12:13,color:c.textMuted,marginBottom:m?12:16}}>{t("حسابك من نوع Registration. لمشاهدة الدروس، يرجى الترقية إلى حساب Student أولاً.", "Your account is Registration type. Please upgrade to a Student account first.")}</p>
                    </>
                  ) : (
                    <>
                      <p style={{fontWeight:700,color:c.text,marginBottom:4,fontSize:m?14:16}}>{t("هذا الدرس مقفل", "This lesson is locked")}</p>
                      <p style={{fontSize:m?12:13,color:c.textMuted,marginBottom:m?12:16}}>{t("اشترِ الكورس للمشاهدة الكاملة", "Buy the course for full access")}</p>
                      <Link to={`/courses/${id}`} style={{display:"inline-flex",alignItems:"center",gap:8,padding:m?"10px 18px":"10px 24px",background:"linear-gradient(135deg,#b38728,#e2c275)",borderRadius:10,color:"#05030a",fontWeight:800,fontSize:m?12:13,textDecoration:"none"}}>
                        💳 {t("اشترِ الكورس", "Buy Course")} — {course.price} E-Money{course.price_egp > 0 ? ` / ${course.price_egp} ${t("ج.م", "EGP")}` : ""}
                      </Link>
                    </>
                  )}
                </div>
              ) : videoSrc ? (
                isYoutube(current?.video_url) ? (
                  <iframe src={videoSrc} style={{width:"100%",height:"100%",aspectRatio:"16/9"}} allowFullScreen allow="autoplay; encrypted-media" title="video" />
                ) : (
                  <video src={videoSrc} controls playsInline controlsList="nodownload noremoteplayback" disablePictureInPicture style={{width:"100%",height:"100%",objectFit:"contain"}} onEnded={() => {
                    if (currentLessonQuiz && !isQuizPassed(currentLessonQuiz.id)) {
                      setActiveQuiz(currentLessonQuiz);
                    } else {
                      setCompletedLessons(prev => new Set([...prev, current?.id]));
                    }
                  }} />
                )
              ) : (
                <div style={{color:"#555",textAlign:"center",padding:30}}>
                  <p style={{fontSize:48,marginBottom:12}}>🎬</p>
                  <p style={{fontSize:14}}>{t("هذا الدرس لا يحتوي على فيديو", "This lesson has no video")}</p>
                </div>
              )}
              {videoSrc && canWatchAll && user && (
                <div style={{
                  position:"absolute",top:0,left:0,right:0,bottom:0,
                  pointerEvents:"none",zIndex:10,
                  display:"flex",flexWrap:"wrap",alignContent:"flex-start",justifyContent:"center",
                  overflow:"hidden",opacity:0.15,fontSize:14,fontWeight:700,color:"#fff",
                  padding:"10px 0"
                }}>
                  {Array.from({length:40}).map((_,i) => (
                    <span key={i} style={{margin:"8px 16px",whiteSpace:"nowrap",transform:"rotate(-15deg)"}}>{user.email || user.full_name} — {user.email || user.full_name} —</span>
                  ))}
                </div>
              )}
            </div>
            {current && (
              <div style={{padding:m?12:16,borderTop:`1px solid ${c.borderLight}`}}>
                {currentQuizBlocked && (
                  <div style={{background:"rgba(212,175,55,.1)",border:"1px solid rgba(212,175,55,.3)",borderRadius:12,padding:m?10:14,marginBottom:12,display:"flex",flexDirection:m?"column":"row",justifyContent:"space-between",alignItems:m?"stretch":"center",gap:m?8:0}}>
                    <div style={{color:"#d4af37",fontSize:m?12:14,fontWeight:700}}>
                      📝 {t("هذا الدرس له اختبار. أجب على الاختبار للمتابعة.", "This lesson has a quiz. Complete it to continue.")}
                    </div>
                    <button onClick={() => setActiveQuiz(currentLessonQuiz)}
                      style={{padding:"8px 20px",background:"linear-gradient(135deg,#b38728,#e2c275)",border:"none",borderRadius:10,color:"#05030a",fontWeight:800,fontSize:13,cursor:"pointer"}}>
                      {t("ابدأ الاختبار", "Take Quiz")}
                    </button>
                  </div>
                )}
                <div style={{display:"flex",flexDirection:m?"column":"row",justifyContent:"space-between",alignItems:m?"stretch":"center",gap:m?10:0}}>
                  <div>
                    <p style={{fontWeight:600,color:c.text,fontSize:m?13:14}}>{current.title_ar || current.title}</p>
                    <p style={{fontSize:m?11:12,color:c.textMuted}}>{current.topicTitle}</p>
                  </div>
                  <div style={{display:"flex",gap:8,justifyContent:m?"space-between":"flex-end"}}>
                    {idx > 0 && <button onClick={goToPrev} style={{padding:m?"10px 12px":"8px 16px",background:c.bgInput,border:`1px solid ${c.borderLight}`,borderRadius:8,color:c.text,cursor:"pointer",fontSize:m?12:13,flex:m?1:"none"}}>{t("السابق", "Previous")}</button>}
                    {idx < allLessons.length-1 && (
                      <button onClick={goToNext} disabled={currentQuizBlocked}
                        style={{padding:m?"10px 12px":"8px 16px",background:currentQuizBlocked ? c.border : "linear-gradient(135deg,#b38728,#e2c275)",border:"none",borderRadius:8,color:currentQuizBlocked ? c.textMuted : "#05030a",cursor:currentQuizBlocked ? "not-allowed" : "pointer",fontWeight:700,fontSize:m?12:13,opacity:currentQuizBlocked ? 0.5 : 1,flex:m?1:"none"}}>
                        {t("التالي", "Next")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Course Reviews Section */}
        {isEnrolled && (
          <div style={{background:c.bgCard,border:`1px solid ${c.borderLight}`,borderRadius:16,padding:24,marginBottom:20}}>
            <h3 style={{fontSize:16,fontWeight:700,color:"#e2c275",marginBottom:16}}>⭐ {t("قيّم هذا الكورس", "Rate This Course")}</h3>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setMyRating(s)} style={{fontSize:28,cursor:"pointer",background:"none",border:"none",color:s <= myRating ? "#f59e0b" : c.textMuted,transition:"transform 0.2s",transform:s<=myRating?"scale(1.2)":"scale(1)"}}>★</button>
              ))}
            </div>
            <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder={t("اكتب تعليقك (اختياري)...", "Write your comment (optional)...")} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${c.borderLight}`,background:c.bgInput,color:c.text,fontSize:13,minHeight:60,resize:"vertical",marginBottom:12}} />
            <button onClick={async () => {
              if (!myRating || !user) return;
              setSubmittingReview(true);
              try {
                await api(`/api/courses/${id}/reviews`, { method:"POST", body:JSON.stringify({userId:user.id, rating:myRating, comment:myComment}) });
                const fresh = await api(`/api/courses/${id}/reviews`);
                setReviewData(fresh);
                setMyRating(0); setMyComment("");
              } catch(e) {}
              setSubmittingReview(false);
            }} disabled={!myRating || submittingReview} style={{padding:"10px 24px",background:myRating && !submittingReview ? "linear-gradient(135deg,#b38728,#e2c275)" : c.border,border:"none",borderRadius:10,color:myRating && !submittingReview ? "#05030a" : c.textMuted,fontWeight:700,fontSize:13,cursor:myRating && !submittingReview ? "pointer" : "not-allowed"}}>
              {submittingReview ? t("جاري الإرسال...", "Submitting...") : t("إرسال التقييم", "Submit Review")}
            </button>
          </div>
        )}

        {reviewData.reviews.length > 0 && (
          <div style={{background:c.bgCard,border:`1px solid ${c.borderLight}`,borderRadius:16,padding:24,marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <h3 style={{fontSize:16,fontWeight:700,color:"#e2c275",margin:0}}>⭐ {t("تقييمات الطلاب", "Student Reviews")}</h3>
              <span style={{fontSize:14,color:"#f59e0b",fontWeight:700}}>{reviewData.avg_rating}</span>
              <span style={{fontSize:12,color:c.textMuted}}>({reviewData.count} {t("تقييم", "reviews")})</span>
            </div>
            {reviewData.reviews.map((r) => (
              <div key={r.id} style={{padding:"14px 0",borderBottom:`1px solid ${c.borderLight}`}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#b38728,#e2c275)",display:"flex",alignItems:"center",justifyContent:"center",color:"#05030a",fontWeight:700,fontSize:13,flexShrink:0}}>
                    {r.full_name?.charAt(0) || "?"}
                  </div>
                  <span style={{fontSize:13,fontWeight:600,color:c.text}}>{r.full_name}</span>
                  <span style={{fontSize:12,color:"#f59e0b"}}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <span style={{fontSize:11,color:c.textMuted,marginRight:"auto"}}>{r.created_at?.slice(0,10)}</span>
                </div>
                {r.comment && <p style={{fontSize:13,color:c.textMuted,margin:0,paddingRight:42}}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </main>

      {activeQuiz && (
        <QuizModal quiz={activeQuiz} onClose={() => setActiveQuiz(null)} onPassed={onQuizPassed} />
      )}
    </div>
  );
}
