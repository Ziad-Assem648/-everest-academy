import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import { api } from "../App";
import AppNavbar from "../components/AppNavbar";

const getStyles = (c) => ({
  wrapper: { minHeight: "100vh", background: "linear-gradient(135deg, #141024 0%, #1a1630 100%)" },
  container: { maxWidth: 600, margin: "auto", padding: "40px 20px 80px" },
  card: {
    background: c.bgCard, backdropFilter: "blur(20px)",
    border: `1px solid ${c.border}`, borderRadius: 24,
    padding: "36px 32px"
  },
  formSpan: { fontSize: "0.75rem", letterSpacing: "3px", color: "rgba(226,194,117,0.8)", fontWeight: 600 },
  formH3: { margin: "12px 0 28px", color: c.text, fontSize: "1.8rem", fontWeight: 800 },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  label: { fontWeight: 600, fontSize: 13, color: c.textSoft, letterSpacing: "0.5px" },
  input: {
    border: `1px solid ${c.border}`, borderRadius: 14, padding: "14px 16px",
    fontSize: 14, outline: "none", background: c.bgCard,
    color: c.text, fontFamily: "inherit", width: "100%", boxSizing: "border-box"
  },
  textarea: {
    border: `1px solid ${c.border}`, borderRadius: 14, padding: "14px 16px",
    fontSize: 14, outline: "none", minHeight: 140, resize: "vertical",
    background: c.bgCard, color: c.text, fontFamily: "inherit",
    width: "100%", boxSizing: "border-box"
  },
  starBtn: (isActive) => ({
    background: "none", border: "none", fontSize: 28,
    cursor: "pointer", color: isActive ? "#f4b400" : c.textMuted,
    transition: "0.15s", padding: "2px"
  }),
  submitBtn: {
    border: "none", background: "linear-gradient(135deg, #b38728, #e2c275)", color: "#05030a",
    padding: "16px 24px", borderRadius: 14, fontWeight: 800, cursor: "pointer",
    fontSize: 15, transition: "0.3s"
  },
  errMsg: { color: "#ff5b5b", fontSize: 13, margin: 0 },
  successMsg: {
    textAlign: "center", padding: "60px 20px",
    background: "rgba(34,197,94,0.08)", borderRadius: 24,
    border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e"
  }
});

const starValues = [1,2,3,4,5];

export default function AddFeedbackPage() {
  const { t, dir } = useLang();
  const { user } = useAuth();
  const { colors: c } = useTheme();
  const styles = getStyles(c);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [name, setName] = useState(user?.full_name || "");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { setErr(t("سجل دخول أولاً", "Login first")); return; }
    if (!message.trim()) { setErr(t("اكتب رأيك", "Write your feedback")); return; }
    setSending(true); setErr("");
    try {
      await api("/api/feedbacks", {
        method: "POST", body: JSON.stringify({ userId: user.id, message, rating })
      });
      setSuccess(true);
    } catch (e) { setErr(e.message); }
    setSending(false);
  };

  return (
    <div style={{...styles.wrapper, background: c.bg}}>
      <AppNavbar />
      <div style={styles.container}>
      
        <div className="feedback-add-page-card" style={styles.card}>
          {success ? (
            <div style={styles.successMsg}>
              <p style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>✅</p>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{t("تم إرسال تقييمك!", "Your feedback has been submitted!")}</h3>
              <p style={{ color: c.textSoft, marginTop: 8, fontSize: 14 }}>{t("شكراً لمشاركتنا رأيك.", "Thank you for sharing your thoughts.")}</p>
            </div>
          ) : (
            <>
              <span style={styles.formSpan}>SHARE YOUR EXPERIENCE</span>
              <h3 style={styles.formH3}>{t("اترك تقييم", "Leave A Review")}</h3>
              <form onSubmit={submit} style={styles.form}>
                <div>
                  <label style={styles.label}>{t("اسمك", "Your Name")}</label>
                  <input style={styles.input} disabled value={name} />
                </div>
                <div>
                  <label style={styles.label}>{t("رأيك", "Your Feedback")}</label>
                  <textarea style={styles.textarea} value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t("اكتب رأيك...", "Write your feedback...")} />
                </div>
                <div>
                  <label style={styles.label}>{t("التقييم:", "Rating:")}</label>
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    {starValues.map(s => (
                      <button key={s} type="button" onClick={() => setRating(s)} style={styles.starBtn(s <= rating)}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                {err && <p style={styles.errMsg}>{err}</p>}
                <button type="submit" disabled={sending}
                  style={{...styles.submitBtn, opacity: sending ? 0.6 : 1}}>
                  {sending ? t("جاري الإرسال...", "Sending...") : t("إرسال التقييم", "Submit Review")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
