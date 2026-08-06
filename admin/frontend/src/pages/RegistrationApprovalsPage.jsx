import React, { useState, useEffect } from "react";
import { useLang } from "../LangContext";
import { api, BACKEND_URL } from "../api.js";

export default function RegistrationApprovalsPage() {
  const { lang, t: tFn } = useLang();
  const t = (ar, en) => tFn(ar, en);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewUser, setViewUser] = useState(null);
  const [viewCards, setViewCards] = useState(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [rejectUser, setRejectUser] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const load = () => {
    setLoading(true);
    api("/api/users/pending-registrations")
      .then(setPending)
      .catch((e) => alert(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (userId, account_type) => {
    try {
      await api(`/api/users/${userId}/approve-registration`, { method: "PUT", body: JSON.stringify({ account_type }) });
      load();
      setViewUser(null);
    } catch (e) { alert(e.message); }
  };

  const handleReject = async (userId) => {
    setRejectUser(userId);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!rejectUser) return;
    setRejecting(true);
    try {
      await api(`/api/users/${rejectUser}/reject-registration`, { method: "PUT", body: JSON.stringify({ reason: rejectReason.trim() }) });
      load();
      setRejectUser(null);
      setRejectReason("");
    } catch (e) { alert(e.message); }
    setRejecting(false);
  };

  const openViewUser = async (u) => {
    setViewUser(u);
    setViewCards(null);
    setLoadingCards(true);
    try {
      const cards = await api(`/api/users/${u.id}/id-cards`);
      setViewCards(cards);
    } catch (e) { console.error(e); }
    setLoadingCards(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t("🔐 تفعيل الحسابات الجديدة", "🔐 New Account Approvals")}</h2>
        <span className="text-sm text-gray-400 bg-white px-3 py-1.5 rounded-lg border">
          {pending.length} {pending.length === 1 ? t("مستخدم", "user") : t("مستخدمين", "users")} {t("بانتظار التفعيل", "pending approval")}
        </span>
      </div>

      {loading ? (
        <p className="text-gray-500">{t("جارٍ التحميل...", "Loading...")}</p>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500 text-lg">{t("لا يوجد مستخدمين بانتظار التفعيل", "No users pending approval")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border table-responsive-wrapper">
          <table className="w-full table-data mobile-card-table">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                <th>{t("الاسم", "Name")}</th>
                <th>{t("البريد", "Email")}</th>
                <th>{t("رقم الهاتف", "Phone")}</th>
                <th>{t("المحافظة", "Governorate")}</th>
                <th>{t("أنشأه", "Created By")}</th>
                <th>{t("البطاقة", "ID Card")}</th>
                <th>{t("تاريخ التسجيل", "Date")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td data-label={t("الاسم", "Name")} className="font-medium text-sm">{u.full_name}</td>
                  <td data-label={t("البريد", "Email")} className="text-gray-500 text-xs">{u.email}</td>
                  <td data-label={t("رقم الهاتف", "Phone")} className="text-gray-500 text-xs">{u.phone || "—"}</td>
                  <td data-label={t("المحافظة", "Governorate")} className="text-gray-500 text-xs">{u.governorate || "—"}</td>
                  <td data-label={t("أنشأه", "Created By")} className="text-xs">
                    {u.created_by_user ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium" title={u.creator_email}>
                        👤 {u.creator_name || u.creator_email || u.created_by_user}
                      </span>
                    ) : u.referred_by ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium" title={u.referrer_email}>
                        👥 {u.referrer_name || u.referrer_email || u.referred_by}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td data-label={t("البطاقة", "ID Card")} className="text-xs">
                    <button onClick={() => openViewUser(u)} className="text-blue-600 hover:text-blue-800 font-medium underline">
                      {t("عرض", "View")}
                    </button>
                  </td>
                  <td data-label={t("تاريخ التسجيل", "Date")} className="text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString("ar-EG")}</td>
                  <td data-label={t("إجراء", "Action")} className="text-left">
                    <div className="flex gap-2 justify-end items-start">
                      <div className="flex flex-col gap-1.5">
                        <button onClick={() => handleApprove(u.id, "student")}
                          className="px-4 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition whitespace-nowrap">
                          🎓 Student
                        </button>
                        <button onClick={() => handleApprove(u.id, "registration_free")}
                          className="px-4 py-1.5 text-xs font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition whitespace-nowrap">
                          🆓 Reg Free
                        </button>
                      </div>
                      <button onClick={() => handleReject(u.id)}
                        className="px-4 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                        {t("❌ رفض", "❌ Reject")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ID Card Modal */}
      {viewUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => { setViewUser(null); setViewCards(null); }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 700, width: "100%", maxHeight: "90vh", overflow: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{viewUser.full_name} — {t("البطاقة الشخصية", "ID Card")}</h3>
              <button onClick={() => { setViewUser(null); setViewCards(null); }} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#666" }}>✕</button>
            </div>

            {viewUser.governorate && (
              <p style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>📍 {t("المحافظة", "Governorate")}: <strong>{viewUser.governorate}</strong></p>
            )}
            {viewUser.country && (
              <p style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>🌍 {t("الدولة", "Country")}: <strong>{viewUser.country}</strong></p>
            )}

            {loadingCards ? (
              <p style={{ color: "#999", textAlign: "center", padding: 20 }}>{t("جارٍ تحميل الصور...", "Loading images...")}</p>
            ) : (
              <div>
                {viewCards?.id_card_front ? (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8 }}>📷 {t("البطاقة أو الباسبور", "ID Card or Passport")}</p>
                    <img src={viewCards.id_card_front.startsWith("data:") || viewCards.id_card_front.startsWith("http") ? viewCards.id_card_front : `${BACKEND_URL}${viewCards.id_card_front}`} alt="ID" style={{ width: "100%", maxWidth: 400, borderRadius: 12, border: "1px solid #ddd" }} />
                  </div>
                ) : (
                  <p style={{ color: "#999", textAlign: "center", padding: 20 }}>{t("لا توجد صور بطاقة", "No ID card images")}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => { setRejectUser(null); setRejectReason(""); }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 480, width: "100%" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {t("❌ رفض الحساب", "❌ Reject Account")}
            </h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              {t("اكتب سبب الرفض ليتم إرساله إلى المستخدم عبر البريد الإلكتروني.", "Write the rejection reason to be sent to the user via email.")}
            </p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              rows={4} placeholder={t("سبب الرفض...", "Rejection reason...")}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd", fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none" }}
              onFocus={e => e.target.style.borderColor = "#ef4444"}
              onBlur={e => e.target.style.borderColor = "#ddd"} />
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => { setRejectUser(null); setRejectReason(""); }}
                style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 14, color: "#666" }}>
                {t("إلغاء", "Cancel")}
              </button>
              <button onClick={confirmReject} disabled={rejecting || !rejectReason.trim()}
                style={{
                  padding: "10px 24px", borderRadius: 10, border: "none",
                  cursor: rejecting || !rejectReason.trim() ? "default" : "pointer",
                  background: rejecting || !rejectReason.trim() ? "#ccc" : "#ef4444",
                  color: "#fff", fontSize: 14, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                {rejecting ? (
                  <span>{t("جارٍ...", "Rejecting...")}</span>
                ) : (
                  <>{t("❌ تأكيد الرفض وإرسال", "❌ Confirm & Send")}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
