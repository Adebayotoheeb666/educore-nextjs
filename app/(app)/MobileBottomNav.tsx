"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav({ user, activeServices = [] }: { user?: any; activeServices?: string[] }) {
  const pathname = usePathname();

  const ADMIN_ROLES = [
    "school_owner",
    "principal",
    "vp_academics",
    "vp_admin",
    "admin_staff",
    "super_admin",
  ];
  const TEACHER_ROLES = ["class_teacher", "subject_teacher"];
  const STAFF_ROLES = [...ADMIN_ROLES, ...TEACHER_ROLES];

  const rawItems: Array<{
    label: string;
    path: string;
    icon: string;
    serviceSlug?: string;
    roles?: string[];
  }> = [
    { label: "Dashboard", path: "/dashboard", icon: "🏠" },
    { label: "Classes", path: "/classes", icon: "🏫", roles: [...STAFF_ROLES] },
    { label: "Timetable", path: "/timetable", icon: "🗓️", serviceSlug: "timetable", roles: [...STAFF_ROLES, "student", "parent"] },
    { label: "Lesson Plans", path: "/lesson-plans", icon: "📝", serviceSlug: "lesson-plans", roles: [...STAFF_ROLES] },
    { label: "Attendance", path: "/attendance", icon: "✅", serviceSlug: "attendance", roles: [...STAFF_ROLES, "student"] },
    { label: "Announcements", path: "/announcements", icon: "📢" },
    { label: "Profile", path: user?.role === "super_admin" ? "/profile-setup" : "/profile", icon: "👤" },
  ];

  const items = rawItems.filter((it) => {
    // service availability
    if (it.serviceSlug && !activeServices.includes(it.serviceSlug)) return false;
    // role-based visibility
    if (it.roles && (!user || !it.roles.includes(user.role))) return false;
    return true;
  });

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Bottom navigation">
      {items.map((it) => {
        const isActive = pathname === it.path || pathname?.startsWith(it.path + "/");
        return (
          <Link key={it.path} href={it.path} className={isActive ? "active" : ""} aria-current={isActive ? "page" : undefined}>
            <span className="mbn-icon">{it.icon}</span>
            <span className="mbn-label">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
