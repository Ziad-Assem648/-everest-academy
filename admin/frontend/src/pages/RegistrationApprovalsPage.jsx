import React, { useState, useEffect } from "react";
import { useLang } from "../LangContext";
import { api, BACKEND_URL } from "../api.js";

export default function RegistrationApprovalsPage() {
  const { lang, t: tFn } = useLang();
  const t = (ar, en) => tFn(ar, en);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewUser, setViewUser] = useState(null);

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
    try {
      await api(`/api/users/${userId}/reject-registration`, { method: "PUT" });
      load();
      setViewUser(null);
    } catch (e) { alert(e.message); }
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
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full table-data">
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
                  <td className="font-medium text-sm">{u.full_name}</td>
                  <td className="text-gray-500 text-xs">{u.email}</td>
                  <td className="text-gray-500 text-xs">{u.phone || "—"}</td>
                  <td className="text-gray-500 text-xs">{u.governorate || "—"}</td>
                  <td className="text-xs">
                    {u.created_by_user ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium" title={u.creator_email}>
                        👤 {u.creator_name || u.creator_email || u.created_by_user}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="text-xs">
                    {u.id_card_front || u.id_card_back ? (
                      <button onClick={() => setViewUser(u)} className="text-blue-600 hover:text-blue-800 font-medium underline">
                        {t("عرض", "View")}
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString("ar-EG")}</td>
                  <td className="text-left">
                    <div className="flex gap-2 justify-end items-start">
                      <div className="flex flex-col gap-1.5">
                        <button onClick={() => handleApprove(u.id, "student")}
                          className="px-4 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition whitespace-nowrap">
                          🎓 Student
                        </button>
                        <button onClick={() => handleApprove(u.id, "registration")}
                          className="px-4 py-1.5 text-xs font-medium bg-emerald-400 text-white rounded-lg hover:bg-emerald-500 transition whitespace-nowrap">
                          👤 {t("تسجيل", "Registration")}
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
          onClick={() => setViewUser(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 700, width: "100%", maxHeight: "90vh", overflow: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{viewUser.full_name} — {t("البطاقة الشخصية", "ID Card")}</h3>
              <button onClick={() => setViewUser(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#666" }}>✕</button>
            </div>

            {viewUser.governorate && (
              <p style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>📍 {t("المحافظة", "Governorate")}: <strong>{viewUser.governorate}</strong></p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {viewUser.id_card_front && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8 }}>📷 {t("أمامي", "Front")}</p>
                  <img src={viewUser.id_card_front.startsWith("data:") ? viewUser.id_card_front : `${BACKEND_URL}${viewUser.id_card_front}`} alt="ID Front" style={{ width: "100%", borderRadius: 12, border: "1px solid #ddd" }} />
                </div>
              )}
              {viewUser.id_card_back && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8 }}>📷 {t("خلفي", "Back")}</p>
                  <img src={viewUser.id_card_back.startsWith("data:") ? viewUser.id_card_back : `${BACKEND_URL}${viewUser.id_card_back}`} alt="ID Back" style={{ width: "100%", borderRadius: 12, border: "1px solid #ddd" }} />
                </div>
              )}
            </div>

            {!viewUser.id_card_front && !viewUser.id_card_back && (
              <p style={{ color: "#999", textAlign: "center", padding: 20 }}>{t("لا توجد صور بطاقة", "No ID card images")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
