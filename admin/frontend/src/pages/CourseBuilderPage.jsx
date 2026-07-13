import React, { useState } from "react";
import { useLang } from "../LangContext";
import { api, uploadApi } from "../api.js";

export default function CourseBuilderPage() {
  const { lang } = useLang();
  const t = (ar, en) => lang === "ar" ? ar : en;
  const [saving, setSaving] = useState(false);
  const [inputLang, setInputLang] = useState("ar");
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  const [course, setCourse] = useState({
    title: "", description: "", title_ar: "", description_ar: "",
    difficulty: "beginner", price: 0, price_egp: 0, is_free: false,
    category: "", category_ar: "", tags: "", featured_image: "",
    author_id: "admin-001", status: "published",
  });

  const handleChange = (field, value) => setCourse((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e = {};
    if (!course.title_ar.trim() && !course.title.trim()) e.title = true;
    if (!course.description_ar.trim() && !course.description.trim()) e.description = true;
    if (!course.featured_image) e.image = true;
    if (!course.price && !course.price_egp) e.price = true;
    if (!course.category_ar.trim()) e.category = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveCourse = async () => {
    if (!validate()) {
      alert(t("الرجاء ملء جميع الحقول المطلوبة (*)", "Please fill all required fields (*)"));
      return;
    }
    setSaving(true);
    try {
      await api("/api/courses", { method: "POST", body: JSON.stringify(course) });
      setSaved(true);
      setCourse({ title: "", description: "", title_ar: "", description_ar: "", difficulty: "beginner", price: 0, price_egp: 0, is_free: false, category: "", category_ar: "", tags: "", featured_image: "", author_id: "admin-001", status: "published" });
      setErrors({});
    } catch (err) {
      alert(t("خطأ في حفظ الكورس: ", "Error saving course: ") + err.message);
    }
    setSaving(false);
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-green-600">{t("تم إنشاء الكورس بنجاح!", "Course created successfully!")}</h2>
        <p className="text-gray-500 text-sm">{t("اذهب إلى قائمة الكورسات لإضافة المواضيع والدروس والاختبارات", "Go to Courses List to add topics, lessons and quizzes")}</p>
        <div className="flex gap-3">
          <button onClick={() => setSaved(false)} className="px-6 py-2 bg-everest-600 text-white rounded-lg text-sm font-medium">
            {t("إنشاء كورس آخر", "Create Another Course")}
          </button>
        </div>
      </div>
    );
  }

  const req = <span className="text-red-500">*</span>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("بناء الكورس", "Course Builder")}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex gap-1 mb-4">
              <button onClick={() => setInputLang("ar")} className={`px-3 py-1 text-xs rounded font-medium ${inputLang === "ar" ? "bg-everest-600 text-white" : "bg-gray-100 text-gray-500"}`}>العربية</button>
              <button onClick={() => setInputLang("en")} className={`px-3 py-1 text-xs rounded font-medium ${inputLang === "en" ? "bg-everest-600 text-white" : "bg-gray-100 text-gray-500"}`}>English</button>
            </div>

            {inputLang === "ar" ? (
              <>
                <label className="block text-sm font-medium mb-1">{t("عنوان الكورس", "Course Title")} {req}</label>
                <input type="text" value={course.title_ar} onChange={e => handleChange("title_ar", e.target.value)} placeholder={t("أدخل عنوان الكورس بالعربية", "Enter course title in Arabic")} className={`w-full px-4 py-2 border rounded-lg mb-4 ${errors.title ? "border-red-500" : ""}`} />
                <label className="block text-sm font-medium mb-1">{t("وصف الكورس", "Course Description")} {req}</label>
                <textarea value={course.description_ar} onChange={e => handleChange("description_ar", e.target.value)} className={`w-full p-4 min-h-[150px] border rounded-lg resize-y mb-4 ${errors.description ? "border-red-500" : ""}`} placeholder={t("اكتب وصف الكورس بالعربية...", "Write course description in Arabic...")} />
              </>
            ) : (
              <>
                <label className="block text-sm font-medium mb-1">{t("عنوان الكورس (إنجليزي)", "Course Title (English)")} {req}</label>
                <input type="text" value={course.title} onChange={e => handleChange("title", e.target.value)} placeholder="Enter course title in English" className={`w-full px-4 py-2 border rounded-lg mb-4 ${errors.title ? "border-red-500" : ""}`} />
                <label className="block text-sm font-medium mb-1">{t("وصف الكورس (إنجليزي)", "Course Description (English)")} {req}</label>
                <textarea value={course.description} onChange={e => handleChange("description", e.target.value)} className={`w-full p-4 min-h-[150px] border rounded-lg resize-y mb-4 ${errors.description ? "border-red-500" : ""}`} placeholder="Write course description in English..." />
              </>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">{t("مستوى الصعوبة", "Difficulty")}</label>
              <select value={course.difficulty} onChange={e => handleChange("difficulty", e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                <option value="beginner">{t("مبتدئ", "Beginner")}</option>
                <option value="intermediate">{t("متوسط", "Intermediate")}</option>
                <option value="advanced">{t("متقدم", "Advanced")}</option>
              </select>
            </div>
          </div>

          <button onClick={saveCourse} disabled={saving}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50">
            {saving ? t("جاري الحفظ...", "Saving...") : t("إنشاء الكورس", "Create Course")}
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h4 className="font-bold mb-3">{t("صورة الغلاف", "Cover Image")} {req}</h4>
            {course.featured_image && (
              <div className="relative mb-2">
                <img src={course.featured_image} alt="cover" className="w-full h-32 object-cover rounded-lg" />
                <button onClick={() => handleChange("featured_image", "")} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</button>
              </div>
            )}
            <label className={`border-2 border-dashed rounded-lg p-4 text-center text-sm cursor-pointer block ${errors.image ? "border-red-500 text-red-400" : "border-gray-300 text-gray-400 hover:border-everest-400"}`}>
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const fd = new FormData(); fd.append("file", file);
                const d = await uploadApi(fd);
                if (d.url) { handleChange("featured_image", d.url); setErrors(prev => ({...prev, image: false})); }
              }} />
              {course.featured_image ? t("غيّر الصورة", "Change Image") : t("اضغط لرفع الصورة", "Click to upload image")}
            </label>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h4 className="font-bold mb-3">{t("التسعير", "Pricing")} {req}</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">E-Money {req}</label>
                <input type="number" value={course.price} onChange={e => { handleChange("price", e.target.value); setErrors(prev => ({...prev, price: false})); }} placeholder={t("السعر بالـ E-Money", "Price in E-Money")} className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.price ? "border-red-500" : ""}`} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t("الجنيه المصري", "Egyptian Pound (EGP)")}</label>
                <input type="number" value={course.price_egp} onChange={e => handleChange("price_egp", e.target.value)} placeholder={t("السعر بالجنيه المصري", "Price in EGP")} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <p className="text-xs text-gray-400">{t("جميع الكورسات مدفوعة — الدروس المجانية كـ Preview", "All courses are paid — free lessons are Preview only")}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h4 className="font-bold mb-3">{t("التصنيفات", "Categories")} {req}</h4>
            <input type="text" value={course.category_ar} onChange={e => { handleChange("category_ar", e.target.value); setErrors(prev => ({...prev, category: false})); }} placeholder={t("أدخل التصنيف...", "Enter category...")} className={`w-full px-3 py-2 border rounded-lg text-sm mb-2 ${errors.category ? "border-red-500" : ""}`} />
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {["تداول", "تسويق", "برمجة", "ذكاء اصطناعي", "فريلانس", "تصميم"].map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                  <input type="radio" name="category" checked={course.category_ar === cat} onChange={() => { handleChange("category_ar", cat); setErrors(prev => ({...prev, category: false})); }} />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h4 className="font-bold mb-3">{t("الوسوم", "Tags")} <span className="text-xs font-normal text-gray-400">({t("اختياري", "Optional")})</span></h4>
            <input type="text" value={course.tags} onChange={e => handleChange("tags", e.target.value)} placeholder={t("أدخل وسماً... (مفصولة بفاصلة)", "Enter a tag... (comma separated)")} className="w-full px-3 py-2 border rounded-lg text-sm" />
            {course.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {course.tags.split(",").filter(Boolean).map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-everest-50 text-everest-700 text-xs rounded-full">{tag.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
