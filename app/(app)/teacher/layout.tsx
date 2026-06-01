import Link from "next/link";
import { ReactNode } from "react";
import "../shared.css";

const TEACHER_NAV = [
  { href: "/teacher/dashboard", label: "Dashboard" },
  { href: "/teacher/classes", label: "Classes" },
  { href: "/teacher/timetable", label: "Timetable" },
  { href: "/teacher/lesson-plans", label: "Lesson Plans" },
  { href: "/teacher/profile", label: "Profile" },
  { href: "/teacher/attendance", label: "Attendance" },
  { href: "/teacher/announcements", label: "Announcements" },
];

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="teacher-portal-shell">
      <div className="page-header-row" style={{ marginBottom: "1.5rem" }}>
        <div className="page-header-text">
          <h1>Teacher Portal</h1>
          <p>Manage your classes, schedules, lesson plans, and teacher tools from one central place.</p>
        </div>
      </div>

      <nav className="teacher-nav">
        {TEACHER_NAV.map((item) => (
          <Link key={item.href} href={item.href} className="teacher-nav-link">
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="teacher-main-content">{children}</div>
    </div>
  );
}
