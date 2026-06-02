"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUser, clearUser } from "@/redux/features/auth/authSlice";
import { authenticatedFetch } from "@/lib/utils/fetch";
import { getStoredUser } from "@/lib/utils/authStorage";
import { IS_MOBILE_WEBVIEW, resolveApiUrl } from "@/lib/utils/runtimeConfig";
import { getThemePreference, setThemePreference } from "@/lib/utils/themeStorage";
import { RiNotificationLine, RiMoonLine, RiSunLine, RiQuestionLine } from "react-icons/ri";
import "./dashboard.css";
import MobileBottomNav from "./MobileBottomNav";

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
  { label: "Subjects",     path: "/subjects",            icon: "📚", roles: ADMIN_ROLES, serviceSlug: "subjects" },
  { label: "Attendance",   path: "/attendance",          icon: "✅", roles: [...ADMIN_ROLES, ...TEACHER_ROLES], serviceSlug: "attendance" },
  { label: "Lesson Plans", path: "/lesson-plans",        icon: "📝", roles: [...ADMIN_ROLES, ...TEACHER_ROLES], serviceSlug: "lesson-plans" },
  { label: "Exams",        path: "/exams",               icon: "📋", roles: [...ADMIN_ROLES, ...TEACHER_ROLES], serviceSlug: "exams" },
  { label: "Results",      path: "/results",             icon: "📊", roles: [...ADMIN_ROLES, ...TEACHER_ROLES], serviceSlug: "results" },
  { label: "Broadsheet",   path: "/broadsheet",          icon: "📄", roles: ADMIN_ROLES, serviceSlug: "results" },
  { label: "Fee Schedules",path: "/fees/schedules",      icon: "💰", roles: [...ADMIN_ROLES, "bursar"], serviceSlug: "fees" },
  { label: "Collections",  path: "/fees/collection",     icon: "🧾", roles: [...ADMIN_ROLES, "bursar"], serviceSlug: "fees" },
  { label: "Defaulters",   path: "/fees/defaulters",     icon: "⚠️",  roles: [...ADMIN_ROLES, "bursar"], serviceSlug: "fees" },
  { label: "Timetable",    path: "/timetable",           icon: "🗓️",  roles: [...STAFF_ROLES, "bursar", "librarian"], serviceSlug: "timetable" },
  { label: "Library",      path: "/library",             icon: "📖", roles: [...ADMIN_ROLES, "librarian"], serviceSlug: "library" },
  { label: "Announcements",path: "/announcements",       icon: "📢", roles: [...STAFF_ROLES, "bursar", "librarian"], serviceSlug: "announcements" },
  { label: "Analytics",    path: "/analytics",           icon: "📈", roles: ADMIN_ROLES, serviceSlug: "analytics" },
  { label: "Feedback",     path: "/feedback",            icon: "💬", roles: [...STAFF_ROLES, "bursar", "librarian"], serviceSlug: "feedback" },
  { label: "School Settings", path: "/school/settings",  icon: "⚙️",  roles: ["school_owner", "principal"] },
  { label: "Services",     path: "/school/services",     icon: "🔧", roles: ["school_owner", "principal"] },
  { label: "Billing",      path: "/billing",             icon: "💳", roles: ["school_owner"] },
];

const parentNav = [
  { label: "Dashboard",    path: "/parent/dashboard",    icon: "🏠" },
  { label: "Results",      path: "/parent/results",      icon: "📊", serviceSlug: "results" },
  { label: "Fees",         path: "/parent/fees",         icon: "💰", serviceSlug: "fees" },
  { label: "Timetable",    path: "/timetable",           icon: "🗓️", serviceSlug: "timetable" },
  { label: "Announcements",path: "/announcements",       icon: "📢", serviceSlug: "announcements" },
];

const studentNav = [
  { label: "Dashboard",    path: "/student/dashboard",   icon: "🏠" },
  { label: "My Subjects",  path: "/student/subjects",    icon: "📚", serviceSlug: "subjects" },
  { label: "My Results",   path: "/student/results",     icon: "📊", serviceSlug: "results" },
  { label: "Attendance",   path: "/student/attendance",  icon: "✅", serviceSlug: "attendance" },
  { label: "My Fees",      path: "/student/fees",        icon: "💰", serviceSlug: "fees" },
  { label: "Timetable",    path: "/timetable",           icon: "🗓️", serviceSlug: "timetable" },
  { label: "Library",      path: "/library",             icon: "📖", serviceSlug: "library" },
  { label: "Announcements",path: "/announcements",       icon: "📢", serviceSlug: "announcements" },
  { label: "Behavior",     path: "/student/behavior",    icon: "⭐", serviceSlug: "behavior" },
  { label: "Feedback",     path: "/feedback",            icon: "💬", serviceSlug: "feedback" },
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
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeServices, setActiveServices] = useState<string[]>([
    "auth", "school", "students", "teachers", "parents", "classes"
  ]);

  // Bootstrap: hydrate auth state from secure storage, then verify session
  useEffect(() => {
    const hydrate = async () => {
      if (!isAuthenticated) {
        try {
          const stored = await getStoredUser();
          if (stored?.token) {
            dispatch(setUser(stored));
          }
        } catch {
          // secure storage may not be available yet
        }
      }
      setHydrated(true);
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const init = async () => {
      try {
        const res = await authenticatedFetch("/api/auth/loggedin");
        const data = await res.json();
        if (data?.data === true || data?.authenticated) {
          const meRes = await authenticatedFetch("/api/auth/me");
          const me = await meRes.json();
          if (meRes.ok) dispatch(setUser(me.data ?? me));
          else { dispatch(clearUser()); router.replace("/login"); return; }
        } else {
          router.replace("/login"); return;
        }
      } catch {
        router.replace("/login"); return;
      }

      setReady(true);
    };

    init();
  }, [hydrated]);

  // Fetch active services once user is authenticated and ready
  useEffect(() => {
    if (!ready || !user) return;
    if (user.role === "super_admin") return;

    authenticatedFetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.data)) {
          const active = data.data
            .filter((s: any) => s.is_compulsory === 1 || s.subscription_status === "active")
            .map((s: any) => s.slug);
          setActiveServices(active);
        }
      })
      .catch(() => {});
  }, [ready, user]);

  // Sync dark mode preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await getThemePreference();
        if (saved === "dark") setDarkMode(true);
      } catch {
        // Ignore storage access errors in restrictive WebViews
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    const updateTheme = async () => {
      try {
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
          await setThemePreference(darkMode ? "dark" : "light");
        }
      } catch {
        // Ignore storage/setAttribute errors
      }
    };

    updateTheme();
  }, [darkMode]);

  // Live notification count via SSE in browsers, or polling fallback in mobile WebView.
  useEffect(() => {
    if (!ready) return;

    if (typeof window !== "undefined" && !IS_MOBILE_WEBVIEW && 'EventSource' in window) {
      try {
        const es = new EventSource(resolveApiUrl("/api/realtime"), { withCredentials: true });
        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === "count") setUnreadCount(data.unread ?? 0);
          } catch { /* ignore malformed */ }
        };
        return () => es.close();
      } catch (err) {
        // SSE may not work in this browser; fallback to polling below
      }
    }

    let interval: number | undefined;
    const pollCount = async () => {
      try {
        const res = await authenticatedFetch(resolveApiUrl("/api/realtime/count"));
        if (!res.ok) return;
        const data = await res.json();
        setUnreadCount(data.unread ?? 0);
      } catch {
        // ignore polling failure
      }
    };

    pollCount();
    interval = window.setInterval(pollCount, 30_000);
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [ready]);

  const handleLogout = async () => {
    await authenticatedFetch("/api/auth/logout");
    dispatch(clearUser());
    router.push("/login");
  };

  const getNavItems = () => {
    if (!user) return [];
    
    let rawItems: any[] = [];
    if (user.role === "super_admin") rawItems = superAdminNav;
    else if (user.role === "parent") rawItems = parentNav;
    else if (user.role === "student") rawItems = studentNav;
    else rawItems = navConfig.filter((n) => n.roles.includes(user.role));

    if (user.role === "super_admin") return rawItems;

    return rawItems.filter((item) => {
      if (!item.serviceSlug) return true;
      return activeServices.includes(item.serviceSlug);
    });
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
              <p>
                {user?.role === "super_admin"
                  ? "Platform Admin"
                  : ["class_teacher", "subject_teacher"].includes(user?.role || "")
                  ? "Teacher Portal"
                  : user?.role === "student"
                  ? "Student Portal"
                  : user?.role === "parent"
                  ? "Parent Portal"
                  : "Admin Portal"}
              </p>
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
                  src={(user?.avatar as string) || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6A5ACD&color=fff`}
                  alt="Avatar"
                />
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="dashboard-main">{children}</main>

        {/* Mobile bottom navigation (tablet/phone) */}
        <MobileBottomNav user={user} activeServices={activeServices} />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-wrapper > div { margin-left: 0 !important; }
          .user-info-text { display: none !important; }
        }
      `}</style>
    </div>
  );
}
