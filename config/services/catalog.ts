// Service catalog — defines all available services for the modular architecture.
// Compulsory services are automatically activated for every school.
// Optional services can be activated based on school subscription.

export interface ServiceDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_compulsory: boolean;
  base_price: number;           // monthly price in NGN (0 = included in base plan)
  billing_period: "monthly" | "yearly" | "one_time";
  dependencies: string[];       // slugs of services this requires
  category: ServiceCategory;
  version: string;
  super_admin_only?: boolean;   // if true, only visible/accessible to super admins
}

export type ServiceCategory =
  | "core"
  | "academic"
  | "finance"
  | "communication"
  | "library"
  | "ai"
  | "analytics"
  | "mobile";

export const SERVICE_CATALOG: ServiceDefinition[] = [
  // ── COMPULSORY (always on) ──────────────────────────────────
  {
    id: "svc_auth",
    name: "Authentication & User Management",
    slug: "auth",
    description: "Core authentication, user accounts, and role-based access control",
    is_compulsory: true,
    base_price: 0,
    billing_period: "monthly",
    dependencies: [],
    category: "core",
    version: "1.0.0",
  },
  {
    id: "svc_school",
    name: "School Management",
    slug: "school",
    description: "School profile, settings, and basic administrative functions",
    is_compulsory: true,
    base_price: 0,
    billing_period: "monthly",
    dependencies: ["auth"],
    category: "core",
    version: "1.0.0",
  },
  {
    id: "svc_students",
    name: "Student Management",
    slug: "students",
    description: "Student enrollment, profiles, and record management",
    is_compulsory: true,
    base_price: 0,
    billing_period: "monthly",
    dependencies: ["auth", "school"],
    category: "core",
    version: "1.0.0",
  },
  {
    id: "svc_teachers",
    name: "Teacher Management",
    slug: "teachers",
    description: "Teacher profiles, assignments, and staff records",
    is_compulsory: true,
    base_price: 0,
    billing_period: "monthly",
    dependencies: ["auth", "school"],
    category: "core",
    version: "1.0.0",
  },
  {
    id: "svc_parents",
    name: "Parent Management",
    slug: "parents",
    description: "Parent profiles and student-parent linking",
    is_compulsory: true,
    base_price: 0,
    billing_period: "monthly",
    dependencies: ["auth", "students"],
    category: "core",
    version: "1.0.0",
  },
  {
    id: "svc_classes",
    name: "Class Management",
    slug: "classes",
    description: "Class creation, enrollment, and management",
    is_compulsory: true,
    base_price: 0,
    billing_period: "monthly",
    dependencies: ["school"],
    category: "core",
    version: "1.0.0",
  },

  // ── OPTIONAL — Academic ──────────────────────────────────────
  {
    id: "svc_subjects",
    name: "Subject Management",
    slug: "subjects",
    description: "Subject creation, teacher assignment, and curriculum management",
    is_compulsory: false,
    base_price: 0,
    billing_period: "monthly",
    dependencies: ["classes"],
    category: "academic",
    version: "1.0.0",
  },
  {
    id: "svc_attendance",
    name: "Attendance Tracking",
    slug: "attendance",
    description: "Daily attendance recording, reports, and analytics",
    is_compulsory: false,
    base_price: 2000,
    billing_period: "monthly",
    dependencies: ["students", "classes"],
    category: "academic",
    version: "1.0.0",
  },
  {
    id: "svc_exams",
    name: "Exam Management",
    slug: "exams",
    description: "Exam scheduling, question banks, and administration",
    is_compulsory: false,
    base_price: 2000,
    billing_period: "monthly",
    dependencies: ["subjects", "classes"],
    category: "academic",
    version: "1.0.0",
  },
  {
    id: "svc_results",
    name: "Result Management",
    slug: "results",
    description: "Grade recording, report cards, and transcript generation",
    is_compulsory: false,
    base_price: 2000,
    billing_period: "monthly",
    dependencies: ["exams"],
    category: "academic",
    version: "1.0.0",
  },
  {
    id: "svc_lesson_plans",
    name: "Lesson Planning",
    slug: "lesson-plans",
    description: "Lesson plan creation, review, and approval workflow",
    is_compulsory: false,
    base_price: 1500,
    billing_period: "monthly",
    dependencies: ["subjects"],
    category: "academic",
    version: "1.0.0",
  },
  {
    id: "svc_timetable",
    name: "Timetable Management",
    slug: "timetable",
    description: "Automated and manual timetable generation and management",
    is_compulsory: false,
    base_price: 1500,
    billing_period: "monthly",
    dependencies: ["classes", "subjects"],
    category: "academic",
    version: "1.0.0",
  },

  // ── OPTIONAL — Finance ───────────────────────────────────────
  {
    id: "svc_fees",
    name: "Fee Management",
    slug: "fees",
    description: "Fee structures, invoicing, and payment tracking",
    is_compulsory: false,
    base_price: 3000,
    billing_period: "monthly",
    dependencies: ["students"],
    category: "finance",
    version: "1.0.0",
  },
  {
    id: "svc_payments",
    name: "Online Payments",
    slug: "payments",
    description: "Flutterwave-powered online fee collection and payment processing",
    is_compulsory: false,
    base_price: 3000,
    billing_period: "monthly",
    dependencies: ["fees"],
    category: "finance",
    version: "1.0.0",
  },

  // ── OPTIONAL — Communication ─────────────────────────────────
  {
    id: "svc_announcements",
    name: "Announcements",
    slug: "announcements",
    description: "School-wide and targeted announcements",
    is_compulsory: false,
    base_price: 1000,
    billing_period: "monthly",
    dependencies: ["school"],
    category: "communication",
    version: "1.0.0",
  },
  {
    id: "svc_feedback",
    name: "Feedback System",
    slug: "feedback",
    description: "Collect and manage feedback from students, parents, and staff",
    is_compulsory: false,
    base_price: 1000,
    billing_period: "monthly",
    dependencies: ["school"],
    category: "communication",
    version: "1.0.0",
  },
  {
    id: "svc_blog",
    name: "School Blog",
    slug: "blog",
    description: "Publish news, articles, and updates for the school community",
    is_compulsory: false,
    base_price: 1000,
    billing_period: "monthly",
    dependencies: ["school"],
    category: "communication",
    version: "1.0.0",
  },
  {
    id: "svc_calendar",
    name: "Academic Calendar",
    slug: "calendar",
    description: "School events, holidays, and term calendar management",
    is_compulsory: false,
    base_price: 1000,
    billing_period: "monthly",
    dependencies: ["school"],
    category: "communication",
    version: "1.0.0",
  },

  // ── OPTIONAL — Library ───────────────────────────────────────
  {
    id: "svc_library",
    name: "Library Management",
    slug: "library",
    description: "Book catalog, borrowing, and return tracking",
    is_compulsory: false,
    base_price: 2500,
    billing_period: "monthly",
    dependencies: ["school"],
    category: "library",
    version: "1.0.0",
  },

  // ── OPTIONAL — Behavioral & Analytics ───────────────────────
  {
    id: "svc_behavior",
    name: "Behavior Tracking",
    slug: "behavior",
    description: "Student behavior incident logging and tracking",
    is_compulsory: false,
    base_price: 1500,
    billing_period: "monthly",
    dependencies: ["students"],
    category: "academic",
    version: "1.0.0",
  },
  {
    id: "svc_analytics",
    name: "Analytics & Reports",
    slug: "analytics",
    description: "Advanced reporting, dashboards, and data insights",
    is_compulsory: false,
    base_price: 3000,
    billing_period: "monthly",
    dependencies: ["school"],
    category: "analytics",
    version: "1.0.0",
  },

  // ── OPTIONAL — AI ────────────────────────────────────────────
  {
    id: "svc_ai",
    name: "AI Features",
    slug: "ai",
    description: "AI-powered lesson planning, result analysis, and smart recommendations",
    is_compulsory: false,
    base_price: 5000,
    billing_period: "monthly",
    dependencies: ["school"],
    category: "ai",
    version: "1.0.0",
  },

  // ── OPTIONAL — Sync ──────────────────────────────────────────
  {
    id: "svc_sync",
    name: "Offline Sync",
    slug: "sync",
    description: "Offline data synchronization for mobile and desktop clients",
    is_compulsory: false,
    base_price: 2000,
    billing_period: "monthly",
    dependencies: ["school"],
    category: "mobile",
    version: "1.0.0",
  },

  // ── OPTIONAL — Admin ─────────────────────────────────────────
  {
    id: "svc_admin",
    name: "Admin Panel",
    slug: "admin",
    description: "Super admin panel for platform-wide management",
    is_compulsory: false,
    base_price: 0,
    billing_period: "monthly",
    dependencies: ["school"],
    category: "core",
    version: "1.0.0",
    super_admin_only: true,
  },
];

export const COMPULSORY_SERVICES = SERVICE_CATALOG.filter((s) => s.is_compulsory);
export const OPTIONAL_SERVICES = SERVICE_CATALOG.filter((s) => !s.is_compulsory);

export function getServiceBySlug(slug: string): ServiceDefinition | undefined {
  return SERVICE_CATALOG.find((s) => s.slug === slug);
}

export function validateDependencies(slugs: string[]): string[] {
  const missing: string[] = [];
  for (const slug of slugs) {
    const svc = getServiceBySlug(slug);
    if (!svc) continue;
    for (const dep of svc.dependencies) {
      if (!slugs.includes(dep)) missing.push(dep);
    }
  }
  return missing;
}
