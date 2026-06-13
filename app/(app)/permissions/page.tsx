"use client";
import "../shared.css";

const roleCards = [
  { label: "School Owner", emoji: "👑", description: "Full school-level control including settings, billing, admins, and service management." },
  { label: "Principal", emoji: "🎓", description: "Manages staff, students, academic programs, and school operations." },
  { label: "VP Academics", emoji: "📘", description: "Owns curriculum, exams, results, and academic performance workflows." },
  { label: "VP Admin", emoji: "🗂️", description: "Oversees administrative records, user management, and school workflows." },
  { label: "Admin Staff", emoji: "🧾", description: "Supports day-to-day administrative tasks, reports, and operations." },
  { label: "Bursar", emoji: "💰", description: "Handles fees, payments, payroll, and finance-related school operations." },
  { label: "Class Teacher", emoji: "👩‍🏫", description: "Manages class attendance, performance, and student progress." },
  { label: "Subject Teacher", emoji: "🧑‍🏫", description: "Creates exams, scores assignments, and manages subject delivery." },
  { label: "Librarian", emoji: "📚", description: "Manages library resources, loans, returns, and book inventory." },
  { label: "Parent", emoji: "👪", description: "Views linked child performance, attendance, and school updates." },
  { label: "Student", emoji: "🎒", description: "Views personal records, attendance, timetable, and exam results." },
];

const permissionRows = [
  { resource: "Students", values: ["CRUD", "CRUD", "CRU", "R", "CRU", "R", "R", "R", "R", "R"] },
  { resource: "Teachers", values: ["CRUD", "CRUD", "CRU", "R", "R", "R", "Self", "—", "—", "—"] },
  { resource: "Parents", values: ["CRUD", "CRUD", "CRU", "R", "CRU", "R", "—", "—", "Self", "—"] },
  { resource: "Classes", values: ["CRUD", "CRUD", "CRUD", "R", "R", "R", "R", "—", "R", "R"] },
  { resource: "Subjects", values: ["CRUD", "CRUD", "CRUD", "R", "R", "R", "R", "—", "—", "R"] },
  { resource: "Exams", values: ["CRUD", "CRUD", "CRUD", "CRU", "CRU", "R", "CRU", "—", "—", "R"] },
  { resource: "Results", values: ["CRUD", "CRUD", "RU", "CRU", "R", "R", "R", "—", "Child", "Self"] },
  { resource: "Attendance", values: ["CRUD", "CRUD", "CRUD", "R", "R", "R", "CRU", "—", "Child", "Self"] },
  { resource: "Behavior", values: ["CRUD", "CRUD", "CRUD", "R", "R", "R", "CRU", "—", "Child", "Self"] },
  { resource: "Fees", values: ["CRUD", "CRU", "R", "R", "R", "CRU", "—", "—", "Child", "Self"] },
];

const roleNames = [
  "School Owner",
  "Principal",
  "VP Admin",
  "VP Academics",
  "Admin Staff",
  "Bursar",
  "Teacher",
  "Librarian",
  "Parent",
  "Student",
];

const normalizeBadge = (value: string) => {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || "none";
};

const roleHighlights = [
  { title: "School Owner", description: "Has the broadest school access, including billing, services, and admin delegation." },
  { title: "Principal", description: "Leads school operations and manages staff, students, and academic workflows." },
  { title: "VP Academics", description: "Owns exam, curriculum, and results workflows across the school." },
  { title: "Bursar", description: "Handles fee schedules, payments, payroll, and financial reports." },
];

export default function PermissionsPage() {
  return (
    <div className="permissions-page">
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>School Permissions</h1>
          <p>Understand who can do what across your school operations.</p>
        </div>
      </div>

      <div className="permissions-hero">
        <div className="hero-card">
          <h3>Designed for school owners</h3>
          <p>These permissions reflect the roles and actions available to your school team today. Each role is scoped to your school data and administrative boundaries.</p>
        </div>
        <div className="hero-card hero-card-highlight">
          <h3>Built for clarity</h3>
          <p>Review role responsibilities, resource access, and who can create, read, update, or delete school data.</p>
        </div>
      </div>

      <section className="permissions-section">
        <div className="section-heading">
          <h2>Role overview</h2>
          <p>Core school roles and the actions they can perform in EduCore.</p>
        </div>

        <div className="role-grid">
          {roleCards.map((role) => (
            <article key={role.label} className="role-card">
              <div className="role-icon">{role.emoji}</div>
              <div>
                <h3>{role.label}</h3>
                <p>{role.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="permissions-section">
        <div className="section-heading">
          <h2>Permission matrix</h2>
          <p>Core resources and the effective role access for each school role.</p>
        </div>

        <div className="premium-table-card permissions-table-card">
          <div className="table-scroll-wrap">
            <table className="premium-table permissions-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  {roleNames.map((name) => (
                    <th key={name}>{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionRows.map((row) => (
                  <tr key={row.resource}>
                    <td>{row.resource}</td>
                    {row.values.map((value, index) => (
                      <td key={`${row.resource}-${index}`}>
                        <span className={`permission-badge badge-${normalizeBadge(value)}`}>{value}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="permission-legend">
            <span className="legend-title">Legend:</span>
            <div className="legend-items">
              <span className="legend-chip legend-chip-crud">CRUD = Create, Read, Update, Delete</span>
              <span className="legend-chip legend-chip-cru">CRU = Create, Read, Update</span>
              <span className="legend-chip legend-chip-ru">RU = Read, Update</span>
              <span className="legend-chip legend-chip-r">R = Read only</span>
              <span className="legend-chip legend-chip-self">Self = Own record only</span>
              <span className="legend-chip legend-chip-child">Child = Linked child record</span>
              <span className="legend-chip legend-chip-none">— = No access</span>
            </div>
          </div>
        </div>
      </section>

      <section className="permissions-section">
        <div className="section-heading">
          <h2>Quick role highlights</h2>
          <p>Use these role summaries when assigning access or reviewing admin responsibilities.</p>
        </div>

        <div className="reference-grid">
          {roleHighlights.map((item) => (
            <div key={item.title} className="reference-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
