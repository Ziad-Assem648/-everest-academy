import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useLang } from "../LangContext.jsx";

export default function CustomerServicePage() {
  const { t, lang } = useLang();
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");

  useEffect(() => {
    api("/api/settings")
      .then((data) => {
        setWhatsapp(data.customer_service_whatsapp || "");
        setEmail(data.customer_service_email || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const s = JSON.parse(localStorage.getItem("admin_session") || "{}");
      await api("/api/settings/customer_service_whatsapp", {
        method: "PUT",
        body: JSON.stringify({ value: whatsapp, admin_id: s.userId }),
      });
      await api("/api/settings/customer_service_email", {
        method: "PUT",
        body: JSON.stringify({ value: email, admin_id: s.userId }),
      });
      setMsgType("success");
      setMsg(lang === "ar" ? "تم الحفظ بنجاح" : "Saved successfully");
    } catch (e) {
      setMsgType("error");
      setMsg(e.message);
    }
    setSaving(false);
  };

  if (loading) return <p className="text-gray-400 animate-pulse">{t("جاري التحميل...", "Loading...")}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        📞 {t("خدمة العملاء", "Customer Service")}
      </h2>
      <p className="text-sm text-gray-500">{t("أضف رقم الواتساب والبريد الإلكتروني لخدمة العملاء. سيظهر هذه المعلومات للمستخدمين في ملفهم الشخصي وفي صفحة انتظار التفعيل.", "Add customer service WhatsApp number and email. This info will be shown to users in their profile and pending activation page.")}</p>

      <div className="bg-white rounded-2xl shadow-sm border p-6 max-w-lg space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">📱 {t("رقم الواتساب", "WhatsApp Number")}</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+20 1XX XXX XXXX"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">📧 {t("البريد الإلكتروني", "Email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="support@everest.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>

        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msgType === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msgType === "success" ? "✅ " : "❌ "}{msg}
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #d4af37, #b38728)" }}
        >
          {saving ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : (lang === "ar" ? "💾 حفظ" : "💾 Save")}
        </button>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-2xl border p-6 max-w-lg">
        <h3 className="text-sm font-bold text-gray-400 mb-3">{t("معاينة", "Preview")}</h3>
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <p className="text-sm font-bold text-gray-700">{t("تواصل مع خدمة العملاء", "Contact Customer Service")}</p>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100 transition"
            >
              📱 WhatsApp: {whatsapp}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
            >
              📧 {email}
            </a>
          )}
          {!whatsapp && !email && <p className="text-xs text-gray-400">{t("لم يتم إضافة بيانات بعد", "No data added yet")}</p>}
        </div>
      </div>
    </div>
  );
}
