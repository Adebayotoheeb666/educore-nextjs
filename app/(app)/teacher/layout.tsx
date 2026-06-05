"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="teacher-portal-shell">
      <button
        className="teacher-nav-toggle"
        aria-controls="teacher-nav-list"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ☰ Menu
      </button>

      <div id="teacher-nav-list" className={`teacher-nav-wrapper ${open ? "open" : ""}`}>
        <nav className="teacher-nav" aria-label="Teacher navigation">
        {TEACHER_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`teacher-nav-link ${pathname?.startsWith(item.href) ? "active" : ""}`}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        </nav>
      </div>
      <div className="teacher-main-content">{children}</div>
    </div>
  );
}
