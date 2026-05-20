"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUser, clearUser } from "@/redux/features/auth/authSlice";
import { RiNotificationLine, RiMoonLine, RiSunLine, RiQuestionLine } from "react-icons/ri";
import "./dashboard.css";

const ADMIN_ROLES = [
  "school_owner","principal","vp_academics","vp_admin","admin_staff","super_admin",
];
const TEACHER_ROLES = ["class_teacher", "subject_teacher"];
const STAFF_ROLES = [...ADMIN_ROLES, ...TEACHER_ROLES];

const navConfig = [
  { label: "Dashboard",    path: "/dashboard",           icon: "🏠", roles: [...STAFF_ROLES, "bursar", "librarian"] },
  { label: "Students",     path: "/students",            icon: "👨‍🎓", roles: ADMIN_ROLES },
  { label: "Parents",      path: "/parents",             icon: "👪", roles: ADMIN_ROLES },
  { label: "Teachers",     path: "/teachers",            icon: "👩‍🏫", roles: ADMIN_ROLES },
  { label: "Classes",      path: "/classes",             icon: "🏫", roles: ADMIN_ROLES },
  { label: "Subjects",     path: "/subjects",            icon: "📚", roles: ADMIN_ROLES },
  { label: "Attendance",   path: "/attendance",          icon: "✅", roles: [...ADMIN_ROLES, ...TEACHER_ROLES] },
  { label: "Lesson Plans", path: "/lesson-plans",        icon: "📝", roles: [...ADMIN_ROLES, ...TEACHER_ROLES] },
  { label: "Exams",        path: "/exams",               icon: "📋", roles: [...ADMIN_ROLES, ...TEACHER_ROLES] },
  { label: "Results",      path: "/results",             icon: "📊", roles: [...ADMIN_ROLES, ...TEACHER_ROLES] },
  { label: "Broadsheet",   path: "/broadsheet",          icon: "📄", roles: ADMIN_ROLES },
  { label: "Fee Schedules",path: "/fees/schedules",      icon: "💰", roles: [...ADMIN_ROLES, "bursar"] },
  { label: "Collections",  path: "/fees/collection",     icon: "🧾", roles: [...ADMIN_ROLES, "bursar"] },
  { label: "Defaulters",   path: "/fees/defaulters",     icon: "⚠️",  roles: [...ADMIN_ROLES, "bursar"] },
  { label: "Timetable",    path: "/timetable",           icon: "🗓️",  roles: [...STAFF_ROLES, "bursar", "librarian"] },
  { label: "Library",      path: "/library",             icon: "📖", roles: [...ADMIN_ROLES, "librarian"] },
  { label: "Announcements",path: "/announcements",       icon: "📢", roles: [...STAFF_ROLES, "bursar", "librarian"] },
  { label: "Analytics",    path: "/analytics",           icon: "📈", roles: ADMIN_ROLES },
  { label: "Feedback",     path: "/feedback",            icon: "💬", roles: [...STAFF_ROLES, "bursar", "librarian"] },
  { label: "School Settings", path: "/school/settings",  icon: "⚙️",  roles: ["school_owner", "principal"] },
  { label: "Services",     path: "/school/services",     icon: "🔧", roles: ["school_owner", "principal"] },
  { label: "Billing",      path: "/billing",             icon: "💳", roles: ["school_owner"] },
];

const parentNav = [
  { label: "Dashboard",    path: "/parent",              icon: "🏠" },
  { label: "Results",      path: "/parent/results",      icon: "📊" },
  { label: "Fees",         path: "/parent/fees",         icon: "💰" },
  { label: "Timetable",    path: "/timetable",           icon: "🗓️" },
  { label: "Announcements",path: "/announcements",       icon: "📢" },
];

const studentNav = [
  { label: "Dashboard",    path: "/student",             icon: "🏠" },
  { label: "My Results",   path: "/student/results",     icon: "📊" },
  { label: "Timetable",    path: "/timetable",           icon: "🗓️" },
  { label: "Announcements",path: "/announcements",       icon: "📢" },
];

const superAdminNav = [
  { label: "Overview",  path: "/admin",          icon: "📊" },
  { label: "Schools",   path: "/admin/schools",  icon: "🏫" },
  { label: "Users",     path: "/admin/users",    icon: "👥" },
  { label: "Blog",      path: "/admin/blog",     icon: "📰" },
  { label: "Payments",  path: "/admin/payments", icon: "💳" },
  { label: "Feedback",  path: "/feedback",       icon: "💬" },
];

function PageSpinner() {
  return (
    <div className="dashboard-loading">
      <span style={{ fontSize: "3rem" }}>⏳</span>
      <span>Loading…</span>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Bootstrap: verify auth on mount
  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated) {
        try {
          const res = await fetch("/api/auth/loggedin", { credentials: "include" });
          const data = await res.json();
          if (data?.data === true || data?.authenticated) {
            const meRes = await fetch("/api/auth/me", { credentials: "include" });
            const me = await meRes.json();
            if (meRes.ok) dispatch(setUser(me.data ?? me));
            else { dispatch(clearUser()); router.replace("/login"); return; }
          } else {
            router.replace("/login"); return;
          }
        } catch {
          router.replace("/login"); return;
        }
      }
      setReady(true);
    };
    init();
  }, []);

  // Sync dark mode preference
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (saved === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
      localStorage.setItem("theme", darkMode ? "dark" : "light");
    }
  }, [darkMode]);

  // Live notification count via SSE
  useEffect(() => {
    if (!ready) return;
    const es = new EventSource("/api/realtime");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "count") setUnreadCount(data.unread ?? 0);
      } catch { /* ignore malformed */ }
    };
    return () => es.close();
  }, [ready]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { credentials: "include" });
    dispatch(clearUser());
    router.push("/login");
  };

  const getNavItems = () => {
    if (!user) return [];
    if (user.role === "super_admin") return superAdminNav;
    if (user.role === "parent") return parentNav;
    if (user.role === "student") return studentNav;
    return navConfig.filter((n) => n.roles.includes(user.role));
  };

  const getPageTitle = () => {
    const all = [...navConfig, ...superAdminNav, ...parentNav, ...studentNav];
    const match = all.find(
      (n) => pathname === n.path || pathname.startsWith(n.path + "/")
    );
    return match ? match.label : "Overview";
  };

  const displayName =
    user?.name ||
    `${(user as any)?.firstName ?? ""} ${(user as any)?.lastName ?? ""}`.trim() ||
    "User";

  if (!ready) {
    return (
      <div className="dashboard-wrapper">
        <PageSpinner />
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar-premium ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo-area">
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: "1.2rem", textDecoration: "none" }}
          >
            <div className="sidebar-logo-icon">🎓</div>
            <div className="sidebar-logo-text">
              <h2>EduCore AI</h2>
              <p>{user?.role === "super_admin" ? "Platform Admin" : "Admin Portal"}</p>
            </div>
          </Link>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {getNavItems().map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-item ${
                pathname === item.path || pathname.startsWith(item.path + "/")
                  ? "active"
                  : ""
              }`}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user?.role !== "super_admin" && (
            <button type="button" className="btn-ai-insights">
              <span>✨</span> AI Insights
            </button>
          )}
          <button type="button" className="btn-signout" onClick={handleLogout}>
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main container */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }} className="dashboard-main-container">
        {/* Topbar */}
        <header className="topbar-premium">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </button>

          <div className="topbar-title">{getPageTitle()}</div>

          <div className="topbar-search">
            <span className="topbar-search-icon">🔍</span>
            <input type="text" placeholder="Search students, staff, records…" />
          </div>

          <div className="topbar-actions">
            <Link href="/notifications" className="topbar-icon-btn" title="Notifications" style={{ position: "relative" }}>
              <RiNotificationLine size={22} />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "#ef4444",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 700,
                  borderRadius: "50%",
                  minWidth: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                  lineHeight: 1,
                }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <button
              className="topbar-icon-btn"
              onClick={() => setDarkMode((d) => !d)}
              title={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode ? <RiSunLine size={22} /> : <RiMoonLine size={22} />}
            </button>
            <div className="topbar-icon-btn" title="Help">
              <RiQuestionLine size={22} />
            </div>
            <Link
              href={ADMIN_ROLES.includes(user?.role ?? "") ? "/profile-setup" : "/profile"}
              className="user-profile-btn"
            >
              <div className="user-info-text">
                <h4>{displayName}</h4>
                <p>{user?.role?.replace(/_/g, " ").toUpperCase() ?? "USER"}</p>
              </div>
              <div className="user-avatar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`}
                  alt="Avatar"
                />
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="dashboard-main">{children}</main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-wrapper > div { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
