import React, { useState, useEffect } from "react";
import { useLang } from "../LangContext";
import { api } from "../api.js";

export default function PurchaseRequestsPage() {
  const { lang, t: tFn } = useLang();
  const t = (ar, en) => tFn(ar, en);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");

  const load = (s) => { const st = s || filter; api(`/api/courses/enrollments/list?status=${st}`).then(setRequests).catch(() => {}); };
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    try { await api(`/api/courses/enrollments/${id}/approve`, { method: "PUT" }); load(); }
    catch (e) { alert(e.message); }
  };

  const reject = async (id) => {
    if (!confirm(t("متأكد من رفض هذا الطلب؟", "Are you sure you want to reject this request?"))) return;
    try { await api(`/api/courses/enrollments/${id}/reject`, { method: "PUT" }); load(); }
    catch (e) { alert(e.message); }
  };

  const filtered = requests.filter(
    (r) => !search || r.student_name?.includes(search) || r.student_email?.includes(search)
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("🛒 طلبات الشراء", "🛒 Purchase Requests")}</h2>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-3 flex-wrap">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("بحث عن طالب...", "Search student...")} className="px-4 py-2 border rounded-lg text-sm flex-1 min-w-[200px]" />
          <select value={filter} onChange={(e) => { setFilter(e.target.value); load(e.target.value); }}
            className="px-4 py-2 border rounded-lg text-sm bg-white">
            <option value="pending">{t("قيد الانتظار", "Pending")}</option>
            <option value="approved">{t("تم الموافقة", "Approved")}</option>
            <option value="rejected">{t("مرفوض", "Rejected")}</option>
          </select>
          <button onClick={() => load()} className="px-4 py-2 bg-everest-600 text-white rounded-lg text-sm">{t("بحث", "Search")}</button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
              <th className="p-3 text-right">{t("الطالب", "Student")}</th>
              <th className="p-3 text-right">{t("الكورس", "Course")}</th>
              <th className="p-3 text-right">{t("السعر", "Price")}</th>
              <th className="p-3 text-right">{t("طريقة الدفع", "Payment Method")}</th>
              <th className="p-3 text-right">{t("إثبات الدفع", "Payment Proof")}</th>
              <th className="p-3 text-right">{t("التاريخ", "Date")}</th>
              <th className="p-3 text-right">{t("الحالة", "Status")}</th>
              <th className="p-3 text-right">{t("إجراء", "Action")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <p className="font-medium">{r.student_name}</p>
                  <p className="text-xs text-gray-400">{r.student_email}</p>
                </td>
                <td className="p-3 font-medium">{r.course_name_ar || r.course_name}</td>
                <td className="p-3 font-bold text-everest-700">{r.amount ? `${r.amount} EGP` : "—"}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    r.payment_method === "emoney" ? "bg-green-100 text-green-700"
                    : r.payment_method === "vodafone" ? "bg-blue-100 text-blue-700"
                    : r.payment_method === "cash" ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                  }`}>{r.payment_method}</span>
                </td>
                <td className="p-3">
                  {r.payment_proof ? (
                    <a href={r.payment_proof} target="_blank" rel="noreferrer">
                      <img src={r.payment_proof} alt="proof" className="w-12 h-12 object-cover rounded border cursor-pointer" />
                    </a>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </td>
                <td className="p-3 text-xs text-gray-500">{r.enrolled_at?.slice(0, 10)}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    r.status === "approved" ? "bg-green-100 text-green-700"
                    : r.status === "pending" ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                  }`}>
                    {r.status === "pending" ? t("قيد الانتظار", "Pending") : r.status === "approved" ? t("تم الموافقة", "Approved") : t("مرفوض", "Rejected")}
                  </span>
                </td>
                <td className="p-3">
                  {r.status === "pending" && (
                    <div className="flex gap-1">
                      <button onClick={() => approve(r.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700">
                        {t("موافقة", "Approve")}
                      </button>
                      <button onClick={() => reject(r.id)} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600">
                        {t("رفض", "Reject")}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="8" className="text-center text-gray-400 py-8">{t("لا توجد طلبات", "No requests")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
