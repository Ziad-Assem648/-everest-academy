import React, { useState, useEffect } from "react";
import { useLang } from "../LangContext";
import { api } from "../api.js";

export default function RegistrationApprovalsPage() {
  const { lang, t: tFn } = useLang();
  const t = (ar, en) => tFn(ar, en);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } catch (e) { alert(e.message); }
  };

  const handleReject = async (userId) => {
    try {
      await api(`/api/users/${userId}/reject-registration`, { method: "PUT" });
      load();
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
                <th>{t("تاريخ التسجيل", "Registration Date")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="font-medium">{u.full_name}</td>
                  <td className="text-gray-500 text-xs">{u.email}</td>
                  <td className="text-gray-500 text-xs">{u.phone || "—"}</td>
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
                        <button onClick={() => handleApprove(u.id, "registration_sponsor")}
                          className="px-4 py-1.5 text-xs font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition whitespace-nowrap">
                          🤝 {t("تسجيل (راعي)", "Reg. (Sponsor)")}
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
    </div>
  );
}
