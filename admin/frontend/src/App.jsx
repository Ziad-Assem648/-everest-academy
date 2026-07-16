import React, { useState, useEffect, useRef } from "react";
import { LangProvider, useLang } from "./LangContext";
import { api } from "./api.js";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import RoleManagementPage from "./pages/RoleManagementPage.jsx";
import TopUpsPage from "./pages/TopUpsPage.jsx";
import CourseBuilderPage from "./pages/CourseBuilderPage.jsx";
import CoursesListPage from "./pages/CoursesListPage.jsx";
import QuizAttemptsPage from "./pages/QuizAttemptsPage.jsx";
import StudentListPage from "./pages/StudentListPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import PurchaseRequestsPage from "./pages/PurchaseRequestsPage.jsx";
import UpgradeRequestsPage from "./pages/UpgradeRequestsPage.jsx";
import LeadersPage from "./pages/LeadersPage.jsx";
import PaymentGatewayPage from "./pages/PaymentGatewayPage.jsx";
import RanksManagementPage from "./pages/RanksManagementPage.jsx";
import RegistrationApprovalsPage from "./pages/RegistrationApprovalsPage.jsx";
import FeedbacksPage from "./pages/FeedbacksPage.jsx";
import AdminLogsPage from "./pages/AdminLogsPage.jsx";
import MembershipSettingsPage from "./pages/MembershipSettingsPage.jsx";
import AdminsListPage from "./pages/AdminsListPage.jsx";
import CustomerServicePage from "./pages/CustomerServicePage.jsx";


function AppInner() {
  const [page, setPage] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const { lang, toggle, t } = useLang();

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem("admin_session") || "{}");
    if (!s.userId || !s.token) { setChecking(false); return; }
    fetch("/api/admin-auth/me", { headers: { "Content-Type": "application/json", "x-user-id": s.userId, "x-session-token": s.token } })
      .then(r => r.json())
      .then(d => { if (d.error) { localStorage.removeItem("admin_session"); } else { setCurrentUser(d); } })
      .catch(() => localStorage.removeItem("admin_session"))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (currentUser) api("/api/dashboard/stats").then(setStats);
  }, [currentUser]);

  const handleLogin = (user) => { setCurrentUser(user); setPage("dashboard"); };
  const handleLogout = () => { localStorage.removeItem("admin_session"); setCurrentUser(null); };

  if (checking) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-lg animate-pulse">{t("جاري التحقق...", "Checking...")}</p></div>;
  if (!currentUser) return <LangProvider><AdminLoginPage onLogin={handleLogin} /></LangProvider>;

  const isManager = currentUser.role === "manager";

  const navItems = [
    { id: "dashboard", label: lang === "ar" ? "الإحصائيات" : "Dashboard", icon: "📊" },
    { id: "approvals", label: lang === "ar" ? "تفعيل الحسابات" : "Account Approvals", icon: "🔐" },
    { id: "users", label: lang === "ar" ? "إدارة المستخدمين" : "User Management", icon: "👤" },
    { id: "payment-gateway", label: lang === "ar" ? "بوابات الدفع" : "Payment Gateway", icon: "💳" },
    { id: "role-mgmt", label: lang === "ar" ? "إدارة الصلاحيات" : "Role Management", icon: "🔐" },
    { id: "purchases", label: lang === "ar" ? "طلبات الشراء" : "Purchases", icon: "🛒" },
    { id: "upgrades", label: lang === "ar" ? "طلبات الترقية" : "Upgrades", icon: "⬆️" },
    { id: "topups", label: lang === "ar" ? "طلبات الشحن" : "Top-ups", icon: "💰" },
    { id: "course-builder", label: lang === "ar" ? "بناء الكورس" : "Course Builder", icon: "📝" },
    { id: "courses", label: lang === "ar" ? "قائمة الكورسات" : "Courses", icon: "📚" },
    { id: "quiz-attempts", label: lang === "ar" ? "نتائج الاختبارات" : "Quiz Results", icon: "📋" },
    { id: "ranks-mgmt", label: lang === "ar" ? "إدارة الرتب" : "Ranks", icon: "🏅" },
    { id: "leaders", label: lang === "ar" ? "القادة" : "Leaders", icon: "🏆" },
    { id: "admin-logs", label: lang === "ar" ? "سجل الإجراءات" : "Admin Logs", icon: "📋" },
    { id: "membership-settings", label: lang === "ar" ? "إعدادات العضوية" : "Membership", icon: "⏱️" },
    { id: "feedbacks", label: lang === "ar" ? "التقييمات" : "Feedbacks", icon: "💬" },
    { id: "cs", label: lang === "ar" ? "خدمة العملاء" : "Customer Service", icon: "📞" },

    ...(isManager ? [{ id: "admins-mgmt", label: lang === "ar" ? "👥 إدارة الأدمنز" : "👥 Admin Management", icon: "👥" }] : []),
    { id: "profile-settings", label: lang === "ar" ? "الإعدادات الشخصية" : "Settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-gray-50" dir={lang === "ar" ? "rtl" : "ltr"}>
      <Sidebar navItems={navItems} current={page} onChange={setPage} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isManager ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                {isManager ? '👑 Manager' : '🔧 Admin'}
              </span>
              <span>{currentUser.full_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggle} className="px-4 py-2 text-sm font-medium bg-white border rounded-lg shadow-sm hover:bg-gray-50">
                {lang === "ar" ? "English" : "العربية"}
              </button>
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg shadow-sm hover:bg-red-100 transition">
                🚪 {t("خروج", "Logout")}
              </button>
            </div>
          </div>
          {page === "dashboard" && <DashboardPage stats={stats} />}
          {page === "approvals" && <RegistrationApprovalsPage />}
          {page === "users" && <UsersPage />}
          {page === "role-mgmt" && <RoleManagementPage />}
          {page === "purchases" && <PurchaseRequestsPage />}
          {page === "upgrades" && <UpgradeRequestsPage />}
          {page === "topups" && <TopUpsPage />}
          {page === "course-builder" && <CourseBuilderPage />}
          {page === "courses" && <CoursesListPage />}
          {page === "quiz-attempts" && <QuizAttemptsPage />}
          {page === "ranks-mgmt" && <RanksManagementPage />}
          {page === "leaders" && <LeadersPage />}
          {page === "payment-gateway" && <PaymentGatewayPage />}
          {page === "feedbacks" && <FeedbacksPage />}
          {page === "cs" && <CustomerServicePage />}

          {page === "admin-logs" && <AdminLogsPage />}
          {page === "membership-settings" && <MembershipSettingsPage />}
          {page === "admins-mgmt" && isManager && <AdminsListPage />}
          {page === "profile-settings" && <ProfilePage />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return <LangProvider><AppInner /></LangProvider>;
}

function Sidebar({ navItems, current, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="lg:hidden fixed top-4 right-4 z-50 bg-everest-950 text-white p-2 rounded-lg">☰</button>
      <aside className={`${open ? "block" : "hidden"} lg:block w-64 bg-everest-950 text-white flex flex-col fixed lg:static inset-y-0 right-0 z-40`}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h1 className="text-lg font-bold"><span className="text-everest-400">Everest</span> Admin</h1>
          <button onClick={() => setOpen(false)} className="lg:hidden text-white/60">✕</button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" style={{maxHeight:"calc(100vh - 80px)"}}>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { onChange(item.id); setOpen(false); }}
              className={`w-full text-right px-4 py-3 rounded-lg text-sm font-medium transition flex items-center gap-3 ${current === item.id ? "bg-everest-600 text-white" : "text-gray-300 hover:bg-white/5"}`}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0; const duration = 1200; const step = Math.ceil(Math.max(1, value / 30));
    const timer = setInterval(() => { start += step; if (start >= value) { setDisplay(value); clearInterval(timer); } else setDisplay(start); }, duration / 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}{suffix}</>;
}

function RingChart({ value, max, color, size = 90 }) {
  const r = 36; const circ = 2 * Math.PI * r; const pct = Math.min(value / (max || 1), 1);
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" style={{transform:"rotate(-90deg)"}}>
      <circle cx="45" cy="45" r={r} fill="none" stroke="#f0f0f0" strokeWidth="7" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="7" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" style={{transition:"stroke-dashoffset 1.5s ease"}} />
    </svg>
  );
}

function DashboardPage({ stats }) {
  const [userFilter, setUserFilter] = useState(null);
  const [userList, setUserList] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { lang, t } = useLang();

  const mainCards = [
    { label: t("إجمالي المستخدمين", "Total Users"), sub: t("(باستثناء المشرفين)", "(excl. admins)"), value: stats.totalUsers, icon: "👥", color: "#6366f1", bg: "from-indigo-500" },
    { label: t("الطلاب", "Students"), sub: t("(حسابات طلاب فقط)", "(student accounts only)"), value: stats.totalStudents, icon: "🎓", color: "#10b981", bg: "from-emerald-500" },
    { label: t("الكورسات", "Courses"), sub: `${stats.publishedCourses || 0} ${t("منشور", "published")}`, value: stats.totalCourses, icon: "📚", color: "#8b5cf6", bg: "from-violet-500" },
    { label: t("الاشتراكات النشطة", "Active Enrollments"), sub: `${stats.approvedEnrollments || 0} / ${stats.totalEnrollments || 0}`, value: stats.approvedEnrollments, icon: "✅", color: "#10b981", bg: "from-emerald-500" },
  ];

  const ringData = [
    { label: t("معدل الموافقة على الاشتراكات", "Enrollment Approval Rate"), value: stats.approvedEnrollments || 0, max: stats.totalEnrollments || 1, color: "#10b981", detail: `${stats.approvedEnrollments || 0} / ${stats.totalEnrollments || 0}` },
    { label: t("معدل نجاح الاختبارات", "Quiz Pass Rate"), value: stats.passedQuizzes || 0, max: stats.totalQuizAttempts || 1, color: "#8b5cf6", detail: `${stats.passedQuizzes || 0} / ${stats.totalQuizAttempts || 0}` },
    { label: t("الكورسات المنشرة", "Published Courses"), value: stats.publishedCourses || 0, max: stats.totalCourses || 1, color: "#6366f1", detail: `${stats.publishedCourses || 0} / ${stats.totalCourses || 0}` },
  ];

  const pendingCards = [
    { label: t("بانتظار التفعيل", "Pending Activation"), value: stats.pendingApprovals, icon: "⏳", color: "#f59e0b", desc: t("مستخدمين جدد يحتاجون تفعيل", "New users awaiting approval") },
    { label: t("اشتراكات بانتظار المراجعة", "Pending Enrollments"), value: stats.pendingEnrollments, icon: "🛒", color: "#ec4899", desc: t("طلبات شراء كورسات", "Course purchase requests") },
    { label: t("شحن معلق", "Pending Top-up"), value: stats.topUpPending, icon: "💳", color: "#ef4444", desc: t("طلباتشحن المحافظ", "Wallet top-up requests") },
    { label: t("طلبات ترقية", "Upgrade Requests"), value: stats.upgradeRequests, icon: "⬆️", color: "#8b5cf6", desc: t("ترقية نوع الحساب", "Account type upgrade") },
  ];

  const breakdownCards = [
    { label: t("الحسابات المحظورة", "Blocked Accounts"), value: stats.totalBlocked, icon: "🚫", color: "#ef4444", desc: t("محظورين من المنصة", "Blocked from platform") },
    { label: t("حسابات التسجيل", "Registration Accounts"), value: stats.totalRegistration, icon: "📝", color: "#f59e0b", desc: t("حسابات غير مفعلة كطلاب", "Not activated as students") },
    { label: t("العمولات المدفوعة", "Commissions Paid"), value: stats.totalCommissions, icon: "💎", color: "#10b981", desc: "EM " + t("إجمالي", "total") },
    { label: t("الرصيد الإجمالي", "Total E-Money Balance"), value: stats.totalEMoney, icon: "💳", color: "#8b5cf6", desc: t("EM في المنصة", "EM in platform") },
  ];

  useEffect(() => {
    if (!userFilter) { setUserList([]); return; }
    setUserListLoading(true);
    let path = userFilter === "blocked" ? "/api/users" : `/api/users/filter/${userFilter}`;
    api(path).then(data => {
      if (userFilter === "blocked") setUserList(data.filter(u => u.blocked));
      else setUserList(data);
    }).catch(e => alert(e.message))
    .finally(() => setUserListLoading(false));
  }, [userFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{t("📊 لوحة الإحصائيات", "📊 Dashboard")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("نظرة عامة على أداء المنصة — بيانات حقيقية من قاعدة البيانات", "Platform performance overview — real data from database")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400 bg-white px-3 py-1.5 rounded-lg border">{new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</div>
          <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm bg-white border rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-2">
            <span className="text-base">🔄</span> {t("تحديث", "Refresh")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mainCards.map((c, i) => (
          <div key={i} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" style={{animation: `slideUp 0.4s ease ${i * 0.08}s both`}}>
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-gradient-to-br ${c.bg} to-white/5 opacity-10`} />
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{c.icon}</span>
              <p className="text-gray-500 text-xs font-medium">{c.label}</p>
            </div>
            <p className="text-3xl font-extrabold text-gray-900"><AnimatedNumber value={c.value || 0} suffix={c.suf || ""} /></p>
            <p className="text-[10px] text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {ringData.map((r, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-5" style={{animation: `slideUp 0.4s ease ${0.4 + i * 0.1}s both`}}>
            <RingChart value={r.value} max={r.max} color={r.color} />
            <div>
              <p className="text-gray-700 font-bold text-sm">{r.label}</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">
                {r.detail}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{Math.round((r.value / (r.max || 1)) * 100)}%</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {pendingCards.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300" style={{animation: `slideUp 0.4s ease ${0.7 + i * 0.08}s both`}}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg" style={{background: c.color + "15"}}>{c.icon}</div>
            <div>
              <p className="text-gray-400 text-xs">{c.label}</p>
              <p className="text-xl font-extrabold text-gray-900"><AnimatedNumber value={c.value || 0} /></p>
              <p className="text-[10px] text-gray-400 mt-0.5">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {breakdownCards.map((c, i) => (
          <button key={i} onClick={() => {
            if (c.filter) setUserFilter(userFilter === c.filter ? null : c.filter);
          }}
            className={`relative overflow-hidden bg-white rounded-2xl shadow-sm border p-5 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${userFilter === c.filter ? 'ring-2 ring-everest-500' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span>{c.icon}</span>
              <p className="text-gray-500 text-xs font-medium">{c.label}</p>
            </div>
            <p className="text-2xl font-extrabold">{(c.value || 0).toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{c.desc}</p>
          </button>
        ))}
      </div>

      {userFilter && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-700">
              {userFilter === "registration" ? t("قائمة حسابات التسجيل", "Registration Account List") : userFilter === "student" ? t("قائمة الطلاب", "Student List") : t("قائمة المحظورين", "Blocked List")}
            </h3>
            <button onClick={() => { setUserFilter(null); setSelectedUser(null); }} className="text-sm text-gray-400 hover:text-gray-600">{t("إلغاء التصفية ✕", "Clear Filter ✕")}</button>
          </div>
          {userListLoading ? (
            <p className="text-gray-400 text-center py-4">{t("جاري التحميل...", "Loading...")}</p>
          ) : userList.length === 0 ? (
            <p className="text-gray-400 text-center py-4">{t("لا يوجد مستخدمين في هذه الفئة", "No users in this category")}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {userList.map(u => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-600">{(u.full_name || "?")[0]}</div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{u.full_name}</p>
                      <p className="text-xs text-gray-400">{u.email} · {u.role}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(u)} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition">{t("عرض التفاصيل", "View Details")}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-everest-100 flex items-center justify-center font-bold text-everest-700 text-lg">{(selectedUser.full_name || "?")[0]}</div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{selectedUser.full_name}</h3>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4 mb-4">
              <div><p className="text-gray-400">{t("الدور", "Role")}</p><p className="font-semibold text-gray-800">{selectedUser.role}</p></div>
              <div><p className="text-gray-400">{t("الرتبة", "Rank")}</p><p className="font-semibold text-gray-800">{selectedUser.rank || "–"}</p></div>
              <div><p className="text-gray-400">{t("الحالة", "Status")}</p><p className={`font-semibold ${selectedUser.blocked ? 'text-red-600' : 'text-green-600'}`}>{selectedUser.blocked ? t('محظور', 'Blocked') : t('نشط', 'Active')}</p></div>
              <div><p className="text-gray-400">E-Money</p><p className="font-semibold text-gray-800">{selectedUser.e_money || 0}</p></div>
              <div><p className="text-gray-400">{t("تم الإنشاء", "Created")}</p><p className="font-semibold text-gray-800">{selectedUser.created_at ? selectedUser.created_at.slice(0,10) : ""}</p></div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setSelectedUser(null); setUserFilter(null); }} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">{t("إغلاق", "Close")}</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6" style={{animation: "slideUp 0.4s ease 1s both"}}>
        <div className="flex items-center gap-2 mb-3"><span className="text-sm">📋</span><span className="text-sm font-bold text-gray-700">{t("ملخص المنصة", "Platform Summary")}</span></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            [t("إجمالي الاشتراكات", "Total Enrollments"), stats.totalEnrollments, "📋"],
            [t("اشتراكات بانتظار المراجعة", "Pending Enrollments"), stats.pendingEnrollments, "⏳"],
            [t("التقييمات", "Feedbacks"), stats.totalFeedbacks, "⭐"],
            [t("متوسط التقييم", "Avg Rating"), stats.avgFeedback, "📊"],
          ].map(([label, val, icon], i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
              <span>{icon}</span>
              <div><p className="text-gray-500 text-xs">{label}</p><p className="font-bold text-gray-800">{(val || 0).toLocaleString()}</p></div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes progressFill { from { width: 0%; } }
      `}</style>
    </div>
  );
}
