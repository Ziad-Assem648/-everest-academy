import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useLang } from "../LangContext.jsx";

export default function FreeCoursesSettingsPage() {
  const { t, lang } = useLang();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    api("/api/courses")
      .then((d) => setCourses(d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggle = async (courseId, current) => {
    setSaving(courseId);
    try {
      await api(`/api/courses/${courseId}/show-free`, {
        method: "PUT",
        body: JSON.stringify({ is_show_free: current ? 0 : 1 }),
      });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, is_show_free: current ? 0 : 1 } : c
        )
      );
    } catch (e) {}
    setSaving(null);
  };

  const published = courses.filter((c) => c.status === "published");
  const filtered = published.filter(
    (c) =>
      !search ||
      (c.title_ar || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const showCount = filtered.filter((c) => c.is_show_free).length;

  if (loading)
    return <p className="text-gray-400 animate-pulse">{t("جاري التحميل...", "Loading...")}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          🆓 {t("الكورسات المجانية", "Free Courses Page")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t(
            "اختر الكورسات اللي تظهر في صفحة الكورسات المجانية. فعّل الكورسات اللي عايزها تظهر للمستخدمين.",
            "Choose which courses appear on the free courses page. Toggle on the courses you want shown to users."
          )}
        </p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="bg-white rounded-xl border px-4 py-2 text-sm">
          <span className="text-green-600 font-bold">{showCount}</span>{" "}
          {t("كورس تظهر في الصفحة المجانية", "courses showing on free page")}
          <span className="text-gray-300 mx-2">|</span>
          <span className="text-gray-500">{filtered.length}</span>{" "}
          {t("كورس منشور إجمالي", "total published")}
        </div>
        <input
          type="text"
          placeholder={t("🔍 بحث في الكورسات...", "Search courses...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition w-72"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((course) => (
          <div
            key={course.id}
            className={`bg-white rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all duration-200 hover:shadow-md ${
              course.is_show_free
                ? "border-green-200 bg-green-50/30"
                : "border-gray-100"
            }`}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {course.featured_image ? (
                <img
                  src={course.featured_image}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                  📚
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-800 text-sm truncate">
                  {course.title_ar || course.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{course.category_ar || course.category || "—"}</span>
                  <span>•</span>
                  <span>
                    {course.is_free
                      ? t("مجاني", "Free")
                      : `${course.price_egp || course.price} EGP`}
                  </span>
                  <span>•</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      course.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {course.status}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggle(course.id, course.is_show_free)}
              disabled={saving === course.id}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-50 ${
                course.is_show_free ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  course.is_show_free ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>

            <span
              className={`text-xs font-bold min-w-[60px] text-center ${
                course.is_show_free ? "text-green-600" : "text-gray-400"
              }`}
            >
              {course.is_show_free
                ? t("يظهر", "Visible")
                : t("مخفي", "Hidden")}
            </span>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <p className="font-bold text-gray-500">
              {t("لا توجد كورسات منشرة", "No published courses found")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
