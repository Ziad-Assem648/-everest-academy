import React, { useState, useEffect } from "react";
import { useLang } from "../LangContext";
import { api } from "../api.js";

export default function UsersPage() {
  const { t } = useLang();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [teamTab, setTeamTab] = useState(1);
  const [amount, setAmount] = useState("");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sendAmtModal, setSendAmtModal] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadUsers = () => api("/api/users").then(setUsers);
  useEffect(() => { loadUsers(); }, []);

  const openProfile = (user) => {
    api(`/api/users/${user.id}`).then((data) => {
      setSelectedUser(data);
      setEditForm({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        role: data.role || "",
        account_type: data.account_type || "student",
        bio: data.bio || "",
      });
      setEditing(false);
      setTeamTab(1);
      setAmount("");
    });
  };

  const saveProfile = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      // Also update account_type via dedicated endpoint if changed
      if (editForm.account_type && editForm.account_type !== (selectedUser.account_type || "student")) {
        await api(`/api/users/${selectedUser.id}/account-type`, {
          method: "PUT", body: JSON.stringify({ account_type: editForm.account_type }),
        });
      }
      const updated = await api(`/api/users/${selectedUser.id}`);
      setSelectedUser(updated);
      setEditing(false);
      loadUsers();
    } catch (e) { alert(t("خطأ:", "Error:") + " " + e.message); }
    setSaving(false);
  };

  const processEMoneyOnProfile = async () => {
    if (!amount || !selectedUser) return;
    try {
      await api(`/api/users/${selectedUser.id}/e-money`, {
        method: "PUT", body: JSON.stringify({ amount: parseFloat(amount), allow_negative: true }),
      });
      const updated = await api(`/api/users/${selectedUser.id}`);
      setSelectedUser(updated);
      setAmount("");
      loadUsers();
    } catch (e) { alert(t("خطأ:", "Error:") + " " + e.message); }
  };

  const handleSendEMoney = async (userId, name) => {
    if (!sendAmtModal || !sendAmtModal.amount) return;
    const amt = parseFloat(sendAmtModal.amount);
    try {
      await api(`/api/users/${userId}/e-money`, {
        method: "PUT", body: JSON.stringify({ amount: amt, allow_negative: false }),
      });
      loadUsers();
      alert(`${t("تم إضافة", "Added")} ${amt} E-Money ${t("إلى:", "To:")} ${name}`);
      setSendAmtModal(null);
    } catch (e) { alert(t("خطأ:", "Error:") + " " + e.message); }
  };

  const toggleBlock = async (user) => {
    if (user.blocked) {
      await api(`/api/users/${user.id}/unblock`, { method: "PUT" });
    } else {
      await api(`/api/users/${user.id}/block`, { method: "PUT" });
    }
    loadUsers();
    if (selectedUser?.id === user.id) {
      const updated = await api(`/api/users/${user.id}`);
      setSelectedUser(updated);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await api(`/api/users/${userId}`, { method: "DELETE" });
      setConfirmDelete(null);
      if (selectedUser?.id === userId) setSelectedUser(null);
      loadUsers();
    } catch (e) {
      alert(t("خطأ في حذف المستخدم:", "Error deleting user:") + " " + (e.message || t("حدث خطأ", "An error occurred")));
    }
  };

  const filtered = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t("👤 إدارة المستخدمين", "👤 User Management")}</h2>
        <span className="text-sm text-gray-400 bg-white px-3 py-1.5 rounded-lg border">{users.length} {t("مستخدم", "users")}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-4">
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("بحث عن اسم أو إيميل أو ID...", "Search by name, email or ID...")}
            className="w-full max-w-md px-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <table className="w-full table-data">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
              <th>{t("الاسم", "Name")}</th>
              <th>{t("البريد", "Email")}</th>
              <th>{t("الدور", "Role")}</th>
              <th>{t("نوع الحساب", "Account Type")}</th>
              <th>{t("الرتبة", "Rank")}</th>
              <th>{t("الرصيد", "Balance")}</th>
              <th>{t("الحالة", "Status")}</th>
              <th>{t("التفعيل", "Activation")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="font-medium">{u.full_name}</td>
                <td className="text-gray-500 text-xs">{u.email}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.role === "admin" ? "bg-purple-100 text-purple-700" :
                    u.role === "student" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{u.role}</span>
                </td>
                <td>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.account_type === "student" ? "bg-green-100 text-green-700" :
                    u.account_type === "registration_sponsor" ? "bg-teal-100 text-teal-700" :
                    u.account_type === "registration" ? "bg-emerald-100 text-emerald-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{u.account_type || "student"}</span>
                </td>
                <td>{u.rank}</td>
                <td className="text-everest-600 font-bold">{u.e_money}</td>
                <td>
                  {u.blocked ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{t("محظور", "Blocked")}</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{t("نشط", "Active")}</span>
                  )}
                </td>
                <td>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.status === "active" ? "bg-green-100 text-green-700" :
                    u.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    u.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {u.status === "active" ? t("مفعل", "Active") : u.status === "pending" ? t("قيد المراجعة", "Pending") : u.status === "rejected" ? t("مرفوض", "Rejected") : "—"}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => openProfile(u)} className="text-blue-600 hover:underline text-sm">{t("عرض", "View")}</button>
                    {u.role !== "admin" && (
                      <button onClick={() => setSendAmtModal({user: u, amount: ''})} className="text-emerald-600 hover:underline text-sm">{t("💰 إرسال E-Money", "💰 Send E-Money")}</button>
                    )}
                    <button onClick={() => toggleBlock(u)} className={`text-sm hover:underline ${u.blocked ? "text-green-600" : "text-orange-600"}`}>
                      {u.blocked ? t("فك الحظر", "Unblock") : t("حظر", "Block")}
                    </button>
                    {u.role !== "admin" && (
                      <button onClick={() => setConfirmDelete(u)} className="text-red-600 hover:underline text-sm">{t("حذف", "Delete")}</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Send E-Money modal */}
      {sendAmtModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSendAmtModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-1">{t("💰 إرسال E-Money", "💰 Send E-Money")}</h3>
            <p className="text-sm text-gray-500 mb-4">{t("إلى:", "To:")} <strong>{sendAmtModal.user.full_name}</strong></p>
            <input type="number" value={sendAmtModal.amount} onChange={e => setSendAmtModal({...sendAmtModal, amount: e.target.value})} placeholder={t("المبلغ (مثال: 100)", "Amount (e.g. 100)")} autoFocus
              className="w-full px-4 py-2 border rounded-lg text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setSendAmtModal(null)} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm">{t("إلغاء", "Cancel")}</button>
              <button onClick={() => handleSendEMoney(sendAmtModal.user.id, sendAmtModal.user.full_name)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">{t("إرسال", "Send")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl mb-4">⚠️</p>
            <h3 className="text-lg font-bold mb-2">{t("حذف المستخدم", "Delete User")}</h3>
            <p className="text-gray-500 text-sm mb-6">{t("هل أنت متأكد من حذف", "Are you sure you want to delete")} <strong>{confirmDelete.full_name}</strong>{t("؟ لا يمكن التراجع عن هذا الإجراء.", " This action cannot be undone.")}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDelete(null)} className="px-6 py-2 bg-gray-100 rounded-lg font-medium text-sm">{t("إلغاء", "Cancel")}</button>
              <button onClick={() => handleDelete(confirmDelete.id)} className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700">{t("حذف نهائياً", "Delete permanently")}</button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{t("ملف المستخدم", "User Profile")}</h3>
                <div className="flex items-center gap-3">
                  {selectedUser.blocked && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">{t("محظور", "Blocked")}</span>}
                  {!editing && (
                    <button onClick={() => setEditing(true)} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">✏️ {t("تعديل", "Edit")}</button>
                  )}
                  <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>
              </div>

              {editing ? (
                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t("الاسم", "Name")}</label>
                      <input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t("البريد", "Email")}</label>
                      <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t("الهاتف", "Phone")}</label>
                      <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t("العنوان", "Address")}</label>
                      <input value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t("الدور", "Role")}</label>
                      <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="registration">registration</option>
                        <option value="student">student</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t("نوع الحساب", "Account Type")}</label>
                      <select value={editForm.account_type} onChange={e => setEditForm({...editForm, account_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="student">🎓 Student</option>
                        <option value="registration">👤 Registration</option>
                        <option value="registration_sponsor">🤝 Registration (Sponsor)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t("البايو", "Bio")}</label>
                    <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">{t("إلغاء", "Cancel")}</button>
                    <button onClick={saveProfile} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">{saving ? t("جاري الحفظ...", "Saving...") : t("💾 حفظ التعديلات", "💾 Save Changes")}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: t("البريد الإلكتروني", "Email"), value: selectedUser.email },
                      { label: t("رقم الهاتف", "Phone"), value: selectedUser.phone || "—" },
                      { label: t("العنوان", "Address"), value: selectedUser.address || "—" },
                    ].map((item, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="text-sm font-medium mt-1">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-gray-400">{t("كود الإحالة", "Referral Code")}</p>
                      <p className="text-sm font-bold text-purple-600 mt-1">{selectedUser.referral_code}</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-gray-400">{t("الرتبة الحالية", "Current Rank")}</p>
                      <p className="text-sm font-bold mt-1">⭐ {selectedUser.rank}</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-gray-400">{t("مبيعات الفريق", "Team Sales")}</p>
                      <p className="text-sm font-bold mt-1">{selectedUser.total_team_sales || 0}</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-gray-400">{t("رصيد E-Money", "E-Money Balance")}</p>
                      <p className="text-sm font-bold text-green-600 mt-1">{selectedUser.e_money}</p>
                    </div>
                  </div>

                  {/* Account Type Quick Change */}
                  {selectedUser.role !== "admin" && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <h4 className="font-bold mb-3">{t("🔄 نوع الحساب", "🔄 Account Type")}</h4>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          selectedUser.account_type === "student" ? "bg-green-100 text-green-700" :
                          selectedUser.account_type === "registration_sponsor" ? "bg-teal-100 text-teal-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>{selectedUser.account_type || "student"}</span>
                        {["student", "registration", "registration_sponsor"].filter(t => t !== (selectedUser.account_type || "student")).map(newType => (
                          <button key={newType} onClick={async () => {
                            try {
                              await api(`/api/users/${selectedUser.id}/account-type`, { method: "PUT", body: JSON.stringify({ account_type: newType }) });
                              const updated = await api(`/api/users/${selectedUser.id}`);
                              setSelectedUser(updated);
                              loadUsers();
                            } catch (e) { alert(e.message); }
                          }} className="px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                            → {newType === "student" ? "🎓 Student" : newType === "registration_sponsor" ? "🤝 Reg. (Sponsor)" : "👤 Registration"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!editing && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-bold mb-3">{t("💰 إضافة / خصم رصيد", "💰 Add / Deduct Balance")}</h4>
                  <div className="flex gap-3">
                    <input
                      type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                      placeholder={t("مثال: 50 أو -50", "e.g. 50 or -50")}
                      className="flex-1 px-4 py-2 border rounded-lg text-sm"
                    />
                    <button onClick={processEMoneyOnProfile} className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700">{t("تنفيذ", "Apply")}</button>
                  </div>
                </div>
              )}

              {!editing && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <button onClick={() => toggleBlock(selectedUser)} className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedUser.blocked ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {selectedUser.blocked ? t("🔓 فك الحظر", "🔓 Unblock User") : t("🔒 حظر المستخدم", "🔒 Block User")}
                  </button>
                  <button onClick={async () => {
                    await api(`/api/users/${selectedUser.id}/negative-toggle`, { method: "PUT" });
                    const updated = await api(`/api/users/${selectedUser.id}`);
                    setSelectedUser(updated);
                  }} className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedUser.negative_allowed ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"}`}>
                    {selectedUser.negative_allowed ? "✅ " + t("السماح بالسالب مفعل", "Negative Allowed") : "⛔ " + t("السماح بالسالب", "Allow Negative")}
                  </button>
                  {selectedUser.role !== "admin" && (
                    <button onClick={() => { setConfirmDelete(selectedUser); }} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                      🗑️ {t("حذف المستخدم", "Delete User")}
                    </button>
                  )}
                </div>
              )}

              {!editing && (
                <>
                  {/* Rank Achievements */}
                  {selectedUser.rankBonuses && selectedUser.rankBonuses.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-bold mb-3">{t("🏆 الرتب المحققة", "🏆 Achieved Ranks")}</h4>
                      <div className="flex flex-wrap gap-2">
                        {[...new Set(selectedUser.rankBonuses.map(rb => rb.rank_name))].map((rankName, i) => {
                          const bonus = selectedUser.rankBonuses.find(rb => rb.rank_name === rankName);
                          return (
                            <div key={i} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                              <span className="text-lg">⭐</span>
                              <div>
                                <p className="text-sm font-bold text-yellow-700">{rankName}</p>
                                {bonus?.amount > 0 && <p className="text-xs text-yellow-600">+{bonus.amount} bonus</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Marketing Team */}
                  <div>
                    <h4 className="font-bold mb-3">{t("👥 فريق التسويق", "👥 Marketing Team")}</h4>
                    {(() => {
                      const levels = selectedUser.teamLevels || [];
                      const maxLevel = levels.length > 0 ? Math.max(...levels.map(m => m.depth)) : 0;
                      const tabs = Array.from({ length: maxLevel }, (_, i) => i + 1);
                      const filtered = levels.filter(m => m.depth === teamTab);
                      const totalByLevel = {};
                      levels.forEach(m => { totalByLevel[m.depth] = (totalByLevel[m.depth] || 0) + 1; });
                      return (
                        <>
                          {tabs.length > 0 && (
                            <div className="flex gap-2 mb-3 flex-wrap">
                              {tabs.map(lvl => (
                                <button key={lvl} onClick={() => setTeamTab(lvl)} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${teamTab === lvl ? "bg-everest-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                                  {t("مستوى", "Level")} {lvl} <span className="text-xs opacity-70">({totalByLevel[lvl] || 0})</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {tabs.length === 0 ? (
                            <p className="text-center text-gray-400 py-4">{t("لا يوجد فريق تسويق", "No marketing team")}</p>
                          ) : (
                            <table className="w-full table-data border rounded-lg">
                              <thead>
                                <tr className="bg-gray-50"><th>{t("الاسم", "Name")}</th><th>{t("البريد", "Email")}</th><th>ID</th><th>{t("الرتبة", "Rank")}</th><th>{t("الدور", "Role")}</th></tr>
                              </thead>
                              <tbody>
                                {filtered.length > 0 ? filtered.map(m => (
                                  <tr key={m.id} className="border-t">
                                    <td className="font-medium">{m.full_name}</td>
                                    <td className="text-xs text-gray-500">{m.email}</td>
                                    <td className="text-xs text-gray-400 font-mono">{m.id}</td>
                                    <td className="text-xs">⭐ {m.rank}</td>
                                    <td><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{m.role}</span></td>
                                  </tr>
                                )) : (
                                  <tr><td colSpan="5" className="text-center text-gray-400 py-4">{t("لا يوجد أعضاء في هذا المستوى", "No members at this level")}</td></tr>
                                )}
                              </tbody>
                            </table>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
