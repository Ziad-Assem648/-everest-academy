import React, { useState, useEffect } from "react";
import { useLang } from "../LangContext";
import { api } from "../api.js";

export default function GeminiKeysPage() {
  const { lang, t: tFn } = useLang();
  const t = (ar, en) => tFn(ar, en);
  const [keys, setKeys] = useState([]);
  const [rawKeys, setRawKeys] = useState("");
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const data = await api("/api/settings/gemini-keys");
      setKeys(data.keys || []);
      setRawKeys(data.raw || "");
      setInput(data.raw || "");
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      await api("/api/settings/gemini-keys", {
        method: "PUT",
        body: JSON.stringify({ keys: input }),
      });
      setMsg(t("✅ تم الحفظ بنجاح!", "✅ Saved successfully!"));
      load();
    } catch (e) {
      setMsg(t("❌ فشل الحفظ", "❌ Save failed"));
    }
    setSaving(false);
  };

  const addKey = () => {
    const trimmed = input.trim();
    const parts = trimmed ? trimmed.split(",").map(k => k.trim()).filter(Boolean) : [];
    parts.push("");
    setInput(parts.join(", "));
  };

  const removeKey = (idx) => {
    const parts = input.split(",").map(k => k.trim()).filter((_, i) => i !== idx);
    setInput(parts.join(", "));
  };

  const keyList = input.split(",").map(k => k.trim()).filter(Boolean);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t("🤖 إدارة مفاتيح Gemini AI", "🤖 Gemini AI Keys Management")}</h2>
        <p className="text-gray-500 text-sm mt-1">{t(
          "أضف مفاتيح API متعددة — تتبدل تلقائياً عند الوصول للحد الأقصى",
          "Add multiple API keys — auto-rotate when rate limit is hit"
        )}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: t("إجمالي المفاتيح", "Total Keys"), value: keys.length, icon: "🔑", color: "#6366f1" },
          { label: t("نشطة", "Active"), value: keys.filter(k => !k.onCooldown).length, icon: "✅", color: "#10b981" },
          { label: t("متأخرة", "Rate-limited"), value: keys.filter(k => k.onCooldown).length, icon: "⏳", color: "#f59e0b" },
          { label: t("المدخلة حالياً", "Input Keys"), value: keyList.length, icon: "📝", color: "#3b82f6" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: s.color + "15" }}>{s.icon}</div>
            <div>
              <p className="text-gray-400 text-xs">{s.label}</p>
              <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Key Status */}
      {keys.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">{t("حالة المفاتيح الحية", "Live Key Status")}</h3>
          <div className="space-y-2">
            {keys.map((k, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔑</span>
                  <div>
                    <p className="font-mono text-sm text-gray-700">{k.masked}</p>
                    <p className="text-xs text-gray-400">Key #{k.index + 1}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {k.onCooldown ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      ⏳ {t("متأخرة", "Rate-limited")} ({k.cooldownRemaining}s)
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ✅ {t("نشطة", "Active")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Keys */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-3">{t("إدخال المفاتيح", "Enter API Keys")}</h3>
        <p className="text-sm text-gray-500 mb-3">{t(
          "افصل بين المفاتيح بفاصلة (,). المفاتيح تُخزّن في قاعدة البيانات وتُحمّل تلقائياً.",
          "Separate keys with commas (,). Keys are stored in the DB and auto-loaded."
        )}</p>

        {keyList.map((k, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-400 w-8">#{i + 1}</span>
            <input
              type="text"
              value={k}
              onChange={(e) => {
                const parts = input.split(",").map(x => x.trim());
                parts[i] = e.target.value;
                setInput(parts.join(", "));
              }}
              placeholder="AIza..."
              className="flex-1 px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
            />
            <button onClick={() => removeKey(i)} className="px-3 py-2 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 transition">
              ✕
            </button>
          </div>
        ))}

        <button onClick={addKey} className="mt-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-2">
          <span>+</span> {t("إضافة مفتاح", "Add Key")}
        </button>

        {msg && (
          <p className={`mt-3 text-sm font-medium ${msg.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{msg}</p>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={load} className="px-4 py-2.5 bg-gray-100 rounded-xl font-medium text-sm hover:bg-gray-200 transition">
            {t("إعادة تحميل", "Reload")}
          </button>
          <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? t("جاري الحفظ...", "Saving...") : t("💾 حفظ المفاتيح", "💾 Save Keys")}
          </button>
        </div>
      </div>
    </div>
  );
}
