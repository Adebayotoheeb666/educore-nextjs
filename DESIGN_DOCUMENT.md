# Educore AI - Software Design Document

## Executive Summary

Educore AI is a comprehensive, cloud-based school management system designed specifically for Nigerian educational institutions. It combines traditional administration features with AI-powered insights and supports offline functionality through progressive web app (PWA) technology and mobile packaging via Capacitor.

**Platform Purpose:** Digitize and streamline school operations including academics, finance, communication, and student/parent engagement while providing AI-assisted content generation and analytics.

**Target Users:** School administrators, teachers, students, parents, and support staff in Nigerian schools.

**Tech Stack:** Next.js 16+, React 19+, TypeScript, Turso/LibSQL, JWT authentication, with integrations to OpenAI, Anthropic, Cloudinary, and Nodemailer.

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser / Mobile Client                 │
│            (Next.js App Router + React + Redux)              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP/HTTPS, WebSocket, SSE
                 │
┌────────────────▼────────────────────────────────────────────┐
│              Next.js Server (App Router)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Route Handlers (API)         │  Server Components   │   │
│  │  - Authentication             │  - Page Rendering    │   │
│  │  - CRUD Operations            │  - Streaming         │   │
│  │  - File Uploads               │                      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
     ┌───────────┼───────────┬──────────────┐
     │           │           │              │
     ▼           ▼           ▼              ▼
  ┌──────┐  ┌────────┐  ┌──────────┐  ┌─────────┐
  │Turso │  │Email   │  │Cloudinary│  │OpenAI / │
  │LibSQL│  │Service │  │(uploads) │  │Anthropic│
  │(DB)  │  │        │  │          │  │(AI)     │
  └──────┘  └────────┘  └──────────┘  └─────────┘
```

### 1.2 Core Components

#### Frontend Layer
- **Next.js App Router:** Full-stack React framework with API route handlers
- **React 19:** UI library with hooks and server components
- **Redux Toolkit:** Client-side state management for auth, UI, and navigation
- **TypeScript:** Type-safe development across the entire stack
- **PWA Support:** Service worker caching for offline functionality
- **Capacitor:** Mobile app wrapper for iOS and Android

#### Backend Layer
- **Next.js Route Handlers:** Serverless API endpoints under `/app/api`
- **Middleware:** Authentication, service gating, rate limiting
- **Background Jobs:** Trigger.dev for scheduled tasks
- **Real-time:** WebSocket and SSE support via `/events` module

#### Data Layer
- **Turso/LibSQL:** SQLite-compatible database service
- **Custom Schema:** SQL migrations in `lib/db/schema.sql`
- **Auto-initialization:** Schema and migrations applied on startup

#### External Integrations
- **OpenAI & Anthropic:** AI content generation and insights
- **Cloudinary:** Image/file uploads and CDN
- **Nodemailer:** Email delivery (password reset, notifications)
- **AWS SDK:** Potential backup and storage services
- **Stripe/Payment Gateway:** Online transaction processing

---

## 2. Technology Stack Details

### 2.1 Frontend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | ^16.2.6 | Full-stack React framework |
| React | ^19.2.6 | UI library |
| TypeScript | Latest | Type safety |
| Redux Toolkit | Latest | State management |
| React Query/SWR | Via fetch hooks | Data fetching |
| Tailwind CSS (presumed) | Latest | Styling |
| Sonner | Latest | Toast notifications |
| React Icons | Latest | Icon components |
| next-pwa | @ducanh2912 | PWA support |
| @capacitor/core | Latest | Mobile bridge |

### 2.2 Backend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js API Routes | ^16.2.6 | Serverless endpoints |
| TypeScript | Latest | Type-safe backend |
| Turso/LibSQL | @libsql/client | Database client |
| JWT | jsonwebtoken | Session tokens |
| bcryptjs | Latest | Password hashing |
| Nodemailer | Latest | Email transport |
| Zod | Latest | Runtime validation |
| XLSX | Latest | Spreadsheet parsing |
| PDFKit | Latest | PDF generation |
| WebSocket (ws) | Latest | Real-time communication |
| Node Cron | Latest | Scheduled tasks |
| Bull | Latest | Job queues |
| Trigger.dev | Latest | Managed background jobs |

### 2.3 Database

**Turso/LibSQL** is used as the primary database. This is an SQLite-compatible, edge-friendly database with the following characteristics:
- **Schema Location:** `lib/db/schema.sql`
- **Migrations:** `migrations/*.sql` files applied in sequence
- **Initialization:** Automatic on first request via `lib/db/turso.ts`
- **Connection:** Via `@libsql/client` package

---

## 3. Database Design

### 3.1 Database Schema Overview

The database is organized into logical domains:

#### 3.1.1 Core & Identity Domain
```
schools
├─ id (PK)
├─ name
├─ email
├─ phone
├─ address
├─ established_year
├─ principal_email
├─ logo_url
└─ settings (JSON)

users
├─ id (PK)
├─ name
├─ email
├─ password (hashed)
├─ phone
├─ role (enum: principal, teacher, student, parent, admin, etc.)
├─ school_id (FK)
├─ profile_image
├─ status
└─ created_at

tokens
├─ id (PK)
├─ user_id (FK)
├─ token_hash
├─ type (password_reset, email_verification)
├─ expires_at
└─ created_at
```

#### 3.1.2 Academic Domain
```
classes
├─ id (PK)
├─ school_id (FK)
├─ name (JSS1, SS2, Primary 4, etc.)
├─ form_teacher_id (FK -> users)
└─ created_at

subjects
├─ id (PK)
├─ school_id (FK)
├─ name (Mathematics, English, etc.)
├─ code
└─ status

class_subjects
├─ class_id (FK)
└─ subject_id (FK)

subject_teachers
├─ subject_id (FK)
├─ teacher_id (FK -> users)
├─ class_id (FK)
└─ academic_year

students_classes
├─ student_id (FK -> users)
├─ class_id (FK)
└─ academic_year

attendance
├─ id (PK)
├─ student_id (FK -> users)
├─ class_id (FK)
├─ date
├─ status (present, absent, late)
└─ recorded_by (FK -> users)

lesson_plans
├─ id (PK)
├─ teacher_id (FK -> users)
├─ subject_id (FK)
├─ class_id (FK)
├─ topic
├─ objectives
├─ content
├─ date_created
└─ status

timetable
├─ id (PK)
├─ class_id (FK)
├─ subject_id (FK)
├─ teacher_id (FK -> users)
├─ day_of_week
├─ start_time
├─ end_time
└─ academic_year
```

#### 3.1.3 Assessment & Results Domain
```
exams
├─ id (PK)
├─ school_id (FK)
├─ class_id (FK)
├─ subject_id (FK)
├─ title
├─ term
├─ academic_year
├─ total_marks
├─ date_created
└─ status

questions
├─ id (PK)
├─ exam_id (FK)
├─ question_text
├─ question_type (multiple_choice, theory, etc.)
├─ marks_allocated
└─ order

results
├─ id (PK)
├─ student_id (FK -> users)
├─ exam_id (FK)
├─ marks_obtained
├─ grade
├─ comment
└─ recorded_by (FK -> users)
```

#### 3.1.4 Finance Domain
```
fees
├─ id (PK)
├─ school_id (FK)
├─ class_id (FK)
├─ academic_year
├─ term
├─ amount
├─ description
├─ due_date
└─ created_at

fee_payments
├─ id (PK)
├─ student_id (FK -> users)
├─ fee_id (FK)
├─ amount_paid
├─ payment_method
├─ transaction_reference
├─ payment_date
└─ verified_by (FK -> users)

payroll_transactions
├─ id (PK)
├─ staff_id (FK -> users)
├─ amount
├─ month
├─ year
├─ status (pending, paid, cancelled)
└─ paid_date

online_transactions
├─ id (PK)
├─ school_id (FK)
├─ user_id (FK -> users)
├─ amount
├─ purpose
├─ transaction_id
├─ status (pending, completed, failed)
└─ created_at
```

#### 3.1.5 Communication Domain
```
announcements
├─ id (PK)
├─ school_id (FK)
├─ title
├─ content
├─ author_id (FK -> users)
├─ target_roles (JSON array)
├─ created_at
└─ expires_at

feedback
├─ id (PK)
├─ school_id (FK)
├─ user_id (FK -> users)
├─ subject
├─ message
├─ category
├─ status (new, reviewed, resolved)
└─ created_at

blog_posts
├─ id (PK)
├─ school_id (FK)
├─ title
├─ slug
├─ content
├─ author_id (FK -> users)
├─ featured_image
├─ status (draft, published)
├─ created_at
└─ updated_at
```

#### 3.1.6 Library Domain
```
library_books
├─ id (PK)
├─ school_id (FK)
├─ title
├─ author
├─ isbn
├─ quantity
├─ available_count
├─ category
├─ location
└─ added_by (FK -> users)

book_borrows
├─ id (PK)
├─ book_id (FK)
├─ student_id (FK -> users)
├─ borrow_date
├─ due_date
├─ return_date
└─ status (borrowed, returned, overdue)
```

#### 3.1.7 Services & Billing Domain
```
services
├─ id (PK)
├─ name (Attendance, Exams, Library, etc.)
├─ slug (unique identifier)
├─ description
├─ icon
├─ features (JSON)
├─ status (active, inactive)
└─ created_at

school_services
├─ id (PK)
├─ school_id (FK)
├─ service_id (FK)
├─ status (active, inactive, expired)
├─ activated_at
└─ expires_at

service_tiers
├─ id (PK)
├─ service_id (FK)
├─ name (Starter, Professional, Enterprise)
├─ price_per_month
├─ features (JSON)
└─ user_limit

billing_history
├─ id (PK)
├─ school_id (FK)
├─ invoice_number
├─ total_amount
├─ status (pending, paid, failed)
├─ issued_at
└─ due_date
```

#### 3.1.8 Operations & Audit
```
activity_logs
├─ id (PK)
├─ user_id (FK -> users)
├─ school_id (FK)
├─ action
├─ entity_type
├─ entity_id
├─ timestamp
└─ details (JSON)

behavior_logs
├─ id (PK)
├─ student_id (FK -> users)
├─ teacher_id (FK -> users)
├─ incident_description
├─ incident_type
├─ date_logged
└─ actions_taken

academic_calendar
├─ id (PK)
├─ school_id (FK)
├─ term_name
├─ start_date
├─ end_date
├─ academic_year
└─ status

sync_logs
├─ id (PK)
├─ school_id (FK)
├─ sync_type
├─ status (success, failed)
├─ details (JSON)
└─ timestamp

rate_limits
├─ id (PK)
├─ user_id (FK -> users)
├─ endpoint
├─ attempt_count
├─ reset_at
└─ blocked_until
```

### 3.2 Key Database Constraints

- **Foreign Keys:** Enforced with cascading deletes where appropriate
- **Unique Constraints:** Email, phone, class names per school, subject codes per school
- **Check Constraints:** Role enum validation, status enums
- **Indexes:** Applied on frequently queried fields (user_id, school_id, date fields)

### 3.3 Data Relationships

```
schools
  ├── users (1:N)
  ├── classes (1:N)
  ├── subjects (1:N)
  ├── fees (1:N)
  ├── announcements (1:N)
  ├── school_services (1:N)
  ├── library_books (1:N)
  └── activity_logs (1:N)

users
  ├── tokens (1:N) [password reset, email verification]
  ├── lesson_plans (1:N) [if teacher]
  ├── feedback (1:N) [if author]
  ├── activity_logs (1:N)
  └── attendance (1:N) [if student]

classes
  ├── students_classes (1:N)
  ├── subject_teachers (1:N)
  ├── attendance (1:N)
  ├── timetable (1:N)
  └── exams (1:N)

subjects
  ├── class_subjects (1:N)
  ├── subject_teachers (1:N)
  ├── lesson_plans (1:N)
  ├── exams (1:N)
  └── timetable (1:N)
```

---

## 4. Authentication & Authorization

### 4.1 Authentication Flow

#### Login Process
1. User submits email, phone, or admission number + password via `/api/auth/login`
2. Server finds user by credential and verifies password (bcryptjs)
3. JWT token generated with `exp` claim (default 7 days)
4. Token set as `httpOnly` cookie (name: `token`)
5. Token also returned in response body for client-side storage
6. Client stores token in secure storage (localStorage or Capacitor secure storage)

#### Registration Process
1. User submits school details + owner account info via `/api/auth/register`
2. New school record created
3. Owner user record created with role `school_owner`
4. Compulsory services initialized for the school
5. JWT issued and cookies/response populated

#### Session Validation
1. Client-side calls `/api/auth/loggedin` on app startup (checks cookie validity)
2. If valid, calls `/api/auth/me` to hydrate user context
3. Client parses JWT `exp` to detect token expiration client-side
4. Token refresh flow: when near expiration, call `/api/auth/refresh` (not yet visible in codebase, presumed to exist)

#### Logout
1. Client clears secure storage
2. Server clears auth cookie
3. Client navigates to `/login`

### 4.2 Authorization Model

#### Role-Based Access Control (RBAC)

Roles and their typical permissions:

| Role | School Scope | Permissions |
|------|--------------|-------------|
| **super_admin** | Platform-wide | Manage all schools, users, platform settings, billing |
| **school_owner** | Single school | Full control of school, users, services, billing |
| **principal** | Single school | Approve teachers, exams, fees, announcements |
| **vp_admin** | Single school | Administrative approvals, staff records |
| **vp_academics** | Single school | Academic planning, timetable, exams |
| **admin_staff** | Single school | General admin (less than VP) |
| **class_teacher** | Assigned classes | Attendance, behavior logs, lesson plans |
| **subject_teacher** | Assigned subjects | Lesson plans, exams (within subjects), marks |
| **bursar** | Single school | Fees, payments, payroll, invoices |
| **librarian** | Single school | Book management, borrowing |
| **parent** | Own children | View child's attendance, results, announcements |
| **student** | Self + school | View own attendance, results, timetable, library |

#### API Route Protection

```typescript
// lib/middleware/auth.ts
export async function withAuth(
  request: Request,
  handler: (req: AuthRequest) => Promise<Response>,
  options?: { allowedRoles?: string[] }
): Promise<Response>
```

**Protection applied to:**
- All routes under `/app/api` except `/auth/login`, `/auth/register`, `/auth/forgot-password`
- Roles validated if `allowedRoles` is specified
- User context (id, email, role, school_id) injected into request

#### Service-Based Access Control

```typescript
// lib/middleware/requireService.ts
export async function requireService(
  request: AuthRequest,
  serviceSlug: string
): Promise<boolean | Response>
```

**Service gating enforces:**
- Attendance endpoint blocked unless school has "Attendance" service active
- Exams blocked unless "Exams" service active
- Library blocked unless "Library" service active
- Fees blocked unless "Fees" service active
- Lesson Plans blocked unless "Lesson Plans" service active
- Results blocked unless "Results" service active
- Timetable blocked unless "Timetable" service active

### 4.3 Security Considerations

- **Password Storage:** Bcryptjs (salt rounds: 10, presumed from bcryptjs default)
- **JWT Secret:** Environment variable `JWT_SECRET`
- **Cookie Flags:**
  - `httpOnly: true` (no JavaScript access, prevents XSS theft)
  - `secure: true` in production (HTTPS only)
  - `sameSite: strict` in production, `lax` in development
- **Password Reset:** Tokenized flow via `/api/auth/forgot-password` and `/api/auth/reset-password`
  - Token generated and emailed via Nodemailer
  - Token expires after 1 hour (presumed)
  - One-time use enforced
- **Rate Limiting:** Applied to auth and password reset endpoints
  - Prevents brute force attacks
  - Limits tracked per IP/user in `rate_limits` table

---

## 5. API Structure & Routes

### 5.1 API Organization

All API routes are under `app/api/` using Next.js route handlers (not pages).

#### Core API Families

```
/api/auth/                 → Authentication (login, register, password reset)
/api/admin/                → Super-admin operations
/api/analytics/            → Analytics and reporting
/api/ai/                   → AI features (content generation, insights)
/api/attendance/           → Attendance management
/api/announcements/        → School announcements
/api/blog/                 → Blog posts
/api/calendar/             → Academic calendar
/api/classes/              → Class management
/api/exams/                → Exam management
/api/fees/                 → Fee management
/api/lesson-plans/         → Lesson plan CRUD
/api/library/              → Library books and borrowing
/api/parents/              → Parent-specific operations
/api/payments/             → Payment processing
/api/results/              → Exam results
/api/school/               → School profile and settings
/api/services/             → Service catalog and subscription
/api/stats/                → Dashboard statistics
/api/students/             → Student management
/api/subjects/             → Subject management
/api/teachers/             → Teacher management
/api/timetable/            → Timetable management
/api/upload/               → File uploads (Cloudinary)
/api/realtime/             → WebSocket/SSE connections
/api/sync/                 → Offline sync operations
/api/notifications/        → Notification dispatch
/api/activity/             → Activity logging
```

### 5.2 Key API Endpoints

#### Authentication (`/api/auth`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/login` | User login (email/phone/admission_number + password) |
| POST | `/auth/register` | School + owner registration |
| GET | `/auth/me` | Get authenticated user context |
| GET | `/auth/loggedin` | Check if session valid |
| POST | `/auth/logout` | Clear session |
| POST | `/auth/forgot-password` | Request password reset email |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/refresh` | Refresh JWT token (presumed) |

#### School (`/api/school`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/school` | Get current school profile |
| PUT | `/school` | Update school settings |
| POST | `/school/backup` | Initiate backup |
| GET | `/school/backup-status` | Check backup status |
| DELETE | `/school/backup/:id` | Delete backup |

#### Academic Management

| Endpoint | Methods | CRUD |
|----------|---------|------|
| `/classes` | GET, POST | List, create classes |
| `/classes/:id` | GET, PUT, DELETE | View, update, delete class |
| `/subjects` | GET, POST | List, create subjects |
| `/subjects/:id` | PUT, DELETE | Update, delete subject |
| `/students` | GET, POST | List, bulk import students |
| `/students/:id` | GET, PUT, DELETE | View, update, delete student |
| `/teachers` | GET, POST | List, create teachers |
| `/teachers/:id` | GET, PUT, DELETE | View, update, delete teacher |

#### Attendance (`/api/attendance`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/attendance` | Get attendance records (filterable by class, date) |
| POST | `/attendance` | Mark attendance for a class |
| PUT | `/attendance/:id` | Update individual attendance |
| DELETE | `/attendance/:id` | Delete attendance record |

#### Exams & Results (`/api/exams`, `/api/results`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/exams` | List exams |
| POST | `/exams` | Create exam |
| POST | `/exams/:id/questions` | Add questions to exam |
| POST | `/results` | Record exam result |
| GET | `/results` | Get results (filterable by student, exam) |

#### Fees (`/api/fees`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/fees` | List fees |
| POST | `/fees` | Create fee |
| GET | `/fees/:id/payments` | Get payments for a fee |
| POST | `/fees/:id/pay` | Record fee payment |
| GET | `/fees/:id/report` | Generate fee report |

#### Library (`/api/library`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/library/books` | List books |
| POST | `/library/books` | Add book |
| PUT | `/library/books/:id` | Update book |
| DELETE | `/library/books/:id` | Delete book |
| POST | `/library/borrow` | Borrow book |
| POST | `/library/return` | Return book |

#### Lessons & Timetable (`/api/lesson-plans`, `/api/timetable`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/lesson-plans` | Get lesson plans |
| POST | `/lesson-plans` | Create lesson plan |
| GET | `/timetable` | Get timetable (filterable by class/week) |
| POST | `/timetable` | Create timetable entry |

#### File Upload (`/api/upload`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/upload/avatar` | Upload user avatar (Cloudinary) |
| POST | `/upload/document` | Upload document (Cloudinary) |
| POST | `/upload/students-bulk` | Parse CSV for student import |

#### Analytics & Stats (`/api/analytics`, `/api/stats`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/stats/overview` | Dashboard overview stats |
| GET | `/stats/attendance-trend` | Attendance over time |
| GET | `/stats/performance-report` | Student performance analytics |
| GET | `/analytics/export` | Export school data |

#### Services & Billing (`/api/services`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/services` | List available services |
| GET | `/services/active` | List active services for school |
| POST | `/services/:id/subscribe` | Subscribe to service |
| POST | `/services/:id/unsubscribe` | Unsubscribe from service |
| GET | `/services/billing-history` | Billing history |

#### AI Features (`/api/ai`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/ai/generate-lesson` | Generate lesson plan (OpenAI) |
| POST | `/ai/generate-question` | Generate exam question (Anthropic) |
| POST | `/ai/analyze-performance` | Analyze student performance (AI) |
| POST | `/ai/suggest-improvement` | Suggest improvements (AI) |

#### Announcements & Communication

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/announcements` | Get announcements |
| POST | `/announcements` | Create announcement |
| PUT | `/announcements/:id` | Update announcement |
| DELETE | `/announcements/:id` | Delete announcement |
| POST | `/feedback` | Submit feedback |

### 5.3 API Response Format

**Success Response (2xx):**
```json
{
  "success": true,
  "data": { /* response payload */ }
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "message": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": { /* optional additional info */ }
}
```

**Helper Functions (lib/utils/response.ts):**
- `ok(data)` → 200 with data
- `created(data)` → 201 with data
- `badRequest(message)` → 400
- `unauthorized(message)` → 401
- `forbidden(message)` → 403
- `notFound(message)` → 404
- `conflict(message)` → 409
- `serverError(message)` → 500

### 5.4 API Versioning

**Compatibility layer via `next.config.ts`:**
```
/api/v1/* → rewritten to /api/*
```
Allows legacy v1 clients to continue functioning.

---

## 6. Frontend Architecture

### 6.1 Page Structure (App Router)

```
app/
├── layout.tsx                          # Root layout (metadata, providers)
├── page.tsx                            # Home / marketing page
├── (auth)/                             # Authentication group
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── (app)/                              # Protected app area
│   ├── layout.tsx                      # Authenticated shell
│   ├── dashboard/page.tsx              # Main dashboard
│   ├── students/page.tsx               # Student list
│   ├── teachers/page.tsx               # Teacher list
│   ├── classes/page.tsx                # Class management
│   ├── subjects/page.tsx               # Subject management
│   ├── attendance/page.tsx
│   ├── behavior/page.tsx
│   ├── exams/page.tsx
│   ├── results/page.tsx
│   ├── lesson-plans/page.tsx
│   ├── timetable/page.tsx
│   ├── library/page.tsx
│   ├── fees/page.tsx
│   ├── payroll/page.tsx
│   ├── announcements/page.tsx
│   ├── feedback/page.tsx
│   ├── analytics/page.tsx
│   ├── admin/page.tsx                  # Admin console
│   ├── admin/users/page.tsx
│   ├── admin/schools/page.tsx
│   ├── admin/permissions/page.tsx
│   ├── admin/payments/page.tsx
│   ├── admin/blog/page.tsx
│   ├── teacher/dashboard/page.tsx
│   ├── student/dashboard/page.tsx
│   ├── parent/dashboard/page.tsx
│   ├── bursar/dashboard/page.tsx
│   ├── librarian/dashboard/page.tsx
│   ├── profile/page.tsx
│   ├── profile-setup/page.tsx
│   ├── services/page.tsx
│   ├── service-inactive/page.tsx
│   └── settings/page.tsx
├── about-us/page.tsx                   # Public pages
├── for-schools/page.tsx
├── resources/page.tsx
├── blog/page.tsx
├── blog/[slug]/page.tsx
├── contact-us/page.tsx
├── help-center/page.tsx
├── security/page.tsx
├── privacy/page.tsx
├── terms/page.tsx
├── careers/page.tsx
├── team/page.tsx
├── api-docs/page.tsx
└── offline/page.tsx                    # Offline fallback
```

### 6.2 Component Architecture

**Shared Components** (`components/`):
- **UI Components:** Buttons, forms, cards, modals, tables
- **Layout Components:** Header, sidebar, footer, navigation
- **Feature Components:** Class roster, attendance marker, exam creator, etc.
- **Admin Components:** User management, server lists, analytics dashboards

**Hooks** (`hooks/`):
- `useAuth` - Authentication context and utilities
- `useSchool` - Current school context
- `useToast` - Notifications (Sonner)
- `useFetch` - Wrapper around fetch with auth and error handling
- Custom hooks for each feature domain

### 6.3 State Management (Redux Toolkit)

**Redux Slices** (`redux/slices/`):
- `authSlice` - User login state, JWT token, role
- `schoolSlice` - Current school context
- `navigationSlice` - Sidebar open/close, current page
- `notificationSlice` - Toast/alert queue
- `uiSlice` - Loading states, modal states

**Store initialization:**
```typescript
const store = configureStore({
  reducer: {
    auth: authSlice,
    school: schoolSlice,
    navigation: navigationSlice,
    notifications: notificationSlice,
    ui: uiSlice,
  },
});
```

### 6.4 Client-Server Data Flow

1. **Initial Load:**
   - Root layout calls `/api/auth/loggedin`
   - Hydrates Redux auth state
   - Calls `/api/auth/me` to get user profile
   - Calls `/api/school` to get school details
   - Calls `/api/services/active` to get active services

2. **Authenticated Requests:**
   - All fetch calls include `Authorization: Bearer <token>` header
   - Token comes from secure storage or cookie
   - 401 responses trigger logout and redirect to login

3. **Optimistic Updates:**
   - UI updates immediately on user action
   - Server response validates or reverts
   - Conflict resolution: server truth wins

---

## 7. Security Architecture

### 7.1 Authentication Security

- **Password Hashing:** Bcryptjs with salt rounds = 10
- **JWT Secret:** Retrieved from `process.env.JWT_SECRET`
- **Token TTL:** 7 days (configurable)
- **Refresh Flow:** Not yet implemented in visible code, but architecture supports it
- **Secure Cookie:** `httpOnly`, `secure`, `sameSite` flags enforced
- **CORS:** Default Next.js CORS (same-origin only for cookies)

### 7.2 Authorization Security

- **Route Protection:** All `/api` routes require JWT validation
- **Role Validation:** Enforced per endpoint
- **Service Gating:** Enforced per endpoint
- **Scope Isolation:** Users can only access data within their school
- **Activity Logging:** All sensitive operations logged to `activity_logs`

### 7.3 Data Security

- **Encryption at Rest:** Turso handles with TLS
- **Encryption in Transit:** TLS/HTTPS enforced in production
- **Database Constraints:** Foreign keys, uniqueness, check constraints prevent invalid state
- **SQL Injection Prevention:** Parameterized queries via Turso client

### 7.4 API Security

- **Rate Limiting:** Applied to `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`
  - Limits stored in `rate_limits` table
  - Prevents brute force attacks
- **CSRF Protection:** None visible (presumed handled by SameSite cookies)
- **XSS Prevention:** React sanitizes HTML by default
- **Input Validation:** Zod schema validation on all POST/PUT/DELETE routes

### 7.5 File Upload Security

- **Cloudinary CDN:** Third-party file hosting, prevents direct server writes
- **File Type Validation:** Whitelist allowed MIME types
- **File Size Limits:** Enforced on upload endpoint
- **Access Control:** Files tagged with school_id, only accessible by school members

### 7.6 Email Security

- **Nodemailer SMTP:** Credentials from environment
- **Token-Based Reset:** Password reset via emailed, short-lived token
- **No Credentials in Email:** Passwords never sent via email

### 7.7 Mobile Security

- **Capacitor Secure Storage:** Uses device keychain/keystore for token storage
- **WebView Security:** Capacitor WebView configured with CSP headers
- **Certificate Pinning:** Can be configured in Capacitor native code (not visible in this codebase)

---

## 8. Integration Architecture

### 8.1 OpenAI Integration (`/api/ai`)

**Purpose:** AI-powered lesson plan and exam question generation

**Integration Points:**
- Environment: `OPENAI_API_KEY`
- Library: `openai` npm package
- Endpoints:
  - `POST /api/ai/generate-lesson`
  - `POST /api/ai/generate-question`

**Flow:**
1. Teacher/admin submits request with topic, class, etc.
2. Server calls OpenAI API (gpt-3.5-turbo or gpt-4)
3. Response stored in DB or returned to client
4. School charged based on token usage (if implemented)

### 8.2 Anthropic Integration (`/api/ai`)

**Purpose:** Alternative AI provider for content generation

**Integration Points:**
- Environment: `ANTHROPIC_API_KEY`
- Library: `@anthropic-ai/sdk`
- Endpoints:
  - `POST /api/ai/analyze-performance`
  - `POST /api/ai/suggest-improvement`

**Flow:**
Similar to OpenAI, but using Claude model family.

### 8.3 Cloudinary Integration (`/api/upload`)

**Purpose:** Image and document uploads without server storage

**Integration Points:**
- Environment: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Library: `cloudinary` npm package
- Endpoints:
  - `POST /api/upload/avatar`
  - `POST /api/upload/document`
  - `POST /api/upload/students-bulk`

**Flow:**
1. User selects file in browser
2. File uploaded to Cloudinary (client-side or server relay)
3. Cloudinary returns secure URL
4. URL stored in DB (users.profile_image, etc.)
5. Image served from Cloudinary CDN

**Security:**
- Uploads tagged with school_id
- Only school members can view/delete

### 8.4 Nodemailer Integration

**Purpose:** Transactional email (password reset, notifications, announcements)

**Integration Points:**
- Environment: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`
- Library: `nodemailer`
- Endpoints:
  - `/api/auth/forgot-password` (sends reset email)
  - `/api/auth/reset-password` (validates token)
  - `/api/announcements` (sends announcement emails)
  - `/api/notifications` (sends notification emails)

**Flow:**
1. Server constructs email (HTML template)
2. Nodemailer connects to SMTP server
3. Email sent to recipient
4. Delivery tracked (presumed)

### 8.5 Payment Gateway Integration (`/api/payments`)

**Purpose:** Process fee payments, subscription billing

**Integration Points:**
- Presumed providers: Stripe, Paystack, Flutterwave (common in Nigeria)
- Environment: `PAYMENT_API_KEY`, `PAYMENT_SECRET_KEY`
- Endpoints:
  - `POST /api/payments/initiate` (create payment session)
  - `POST /api/payments/webhook` (handle payment confirmation)
  - `POST /api/fees/:id/pay` (record payment)

**Flow:**
1. Student/parent initiates fee payment
2. Server creates payment session with provider
3. Client redirected to payment provider
4. Provider confirms payment via webhook
5. Server validates webhook signature
6. Payment recorded in `fee_payments` table

### 8.6 AWS Integration (presumed)

**Purpose:** Backup/restore, potentially S3 for file storage

**Integration Points:**
- Environment: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- Library: `aws-sdk`
- Endpoints:
  - `POST /api/school/backup` (initiate backup)
  - `POST /api/school/restore` (restore from backup)

**Flow:**
1. Admin initiates backup
2. Server exports school database
3. Server uploads to AWS S3
4. Restore: download from S3, reimport schema and data
5. Restore status tracked in `school_backup_settings`

### 8.7 Real-Time Integration (WebSocket / SSE)

**Purpose:** Live updates for announcements, attendance, notifications

**Integration Points:**
- Library: `ws` (WebSocket) or SSE via fetch
- Endpoints:
  - `/api/realtime/subscribe` (upgrade to WebSocket)
  - `/api/realtime/broadcast` (send message to subscribers)

**Flow:**
1. Client opens WebSocket connection
2. Server registers client in subscription list
3. When event occurs (announcement posted), server broadcasts to all subscribed clients
4. Clients receive update and re-render UI

---

## 9. Background Jobs & Scheduled Tasks

### 9.1 Trigger.dev Integration

**Purpose:** Managed background job orchestration

**Triggers Visible:**
- Scheduled jobs (cron)
- Event-driven jobs

**Example Jobs (presumed):**
- Attendance reminder emails (daily at 8 AM)
- Fee payment reminders (weekly)
- Payroll processing (monthly)
- Backup jobs (daily)
- Report generation (end of term)

### 9.2 Node Cron Integration

**Purpose:** Simple scheduled tasks (alternative to Trigger.dev)

**Library:** `node-cron`

**Usage (presumed):**
```typescript
cron.schedule('0 8 * * *', async () => {
  // Send daily attendance reminder
});

cron.schedule('0 0 1 * *', async () => {
  // Monthly payroll processing
});
```

### 9.3 Bull Job Queue

**Purpose:** Distributed job processing with retry logic

**Library:** `bull`

**Queue Configuration:**
- Redis connection required
- Jobs stored durably
- Failed jobs retried with exponential backoff

**Job Types (presumed):**
- Email sending
- File exports
- Backup/restore
- Data import

---

## 10. Offline Support & PWA

### 10.1 PWA Configuration

**Library:** `@ducanh2912/next-pwa`

**Configuration in `next.config.ts`:**
```typescript
withPWA({
  dest: "public",
  register: true,
  scope: "/",
  runtimeCaching: [
    {
      urlPattern: "/api/.*",
      handler: "CacheFirst",
      options: {
        cacheName: "api-cache",
        expiration: { maxEntries: 32, maxAgeSeconds: 86400 }, // 24h
      },
    },
    {
      urlPattern: "/.*",
      handler: "NetworkFirst",
      options: {
        cacheName: "static-cache",
      },
    },
  ],
})
```

### 10.2 Offline Fallback

**Location:** `app/offline/page.tsx`

**Content:** Message explaining offline mode + cached data available

### 10.3 Data Sync

**Endpoints:**
- `POST /api/sync/upload` - Upload locally created records when online
- `GET /api/sync/download` - Download updates from server

**Supported Entities (presumed):**
- Attendance records
- Feedback
- Announcements (read-only when offline)

### 10.4 Offline-First Strategy

1. **On Startup:**
   - Fetch critical data (announcements, timetable)
   - Cache in localStorage
   - Update in background

2. **While Offline:**
   - Read from cache
   - Queue writes to local storage
   - Show "working offline" indicator

3. **When Online:**
   - Sync queued writes to server
   - Validate and merge conflicts (server wins)
   - Update cache

---

## 11. Mobile App Architecture (Capacitor)

### 11.1 Capacitor Setup

**Location:** `mobile/capacitor/`

**Config File:** `capacitor.config.ts`

**Platforms:**
- Web (PWA)
- iOS
- Android

### 11.2 Plugins Used

| Plugin | Purpose |
|--------|---------|
| `@capacitor/core` | Bridge between web and native code |
| `@capacitor/app` | App lifecycle, deep links |
| `@capacitor/storage` | Secure key-value storage (keychain/keystore) |
| `@capacitor/camera` | Camera access for photo uploads |
| `@capacitor/geolocation` | GPS for attendance check-in (optional) |
| `@capacitor/local-notifications` | Push notifications |
| `@capacitor/keyboard` | Keyboard behavior |

### 11.3 Build & Deploy

**Build Commands:**
```bash
npm run build                    # Build web assets
npx cap sync [ios|android]      # Sync web assets to native
npx cap open [ios|android]      # Open native IDE
```

**iOS:**
- Xcode project generated
- Deployment via App Store

**Android:**
- Android Studio project generated
- Deployment via Google Play Store

### 11.4 Secure Storage

**Client-Side (web):**
```typescript
// lib/utils/secureStorage.ts
export async function getToken() {
  if (isPlatform('hybrid')) {
    return Capacitor.invoke('Storage', 'get', { key: 'token' });
  } else {
    return localStorage.getItem('token');
  }
}
```

---

## 12. Error Handling & Logging

### 12.1 Error Handling Strategy

**API Errors:**
- Validation: 400 Bad Request
- Authentication: 401 Unauthorized
- Authorization: 403 Forbidden
- Not Found: 404 Not Found
- Conflict: 409 Conflict (e.g., duplicate email)
- Server: 500 Internal Server Error

**Client-Side Errors:**
- Try-catch wrapping async operations
- Error boundary components for UI crashes
- Toast notifications for user-facing errors
- Console logging for debugging

### 12.2 Activity Logging

**Table:** `activity_logs`

**Logged Events:**
- User login/logout
- Account changes (password, email, phone)
- CRUD operations (students, classes, exams, etc.)
- Sensitive operations (delete, export, backup)
- Payment transactions
- Service subscription changes

**Log Contents:**
```json
{
  "user_id": "user-123",
  "school_id": "school-456",
  "action": "update_student",
  "entity_type": "students",
  "entity_id": "student-789",
  "timestamp": "2024-01-15T10:30:00Z",
  "details": {
    "changes": { "class_id": "from-old-to-new" }
  }
}
```

### 12.3 Sync Logs

**Table:** `sync_logs`

**Tracked:**
- Offline data syncs
- Backup/restore operations
- Batch imports
- Batch exports

---

## 13. Testing Strategy

### 13.1 Test Structure

**Locations:**
- Unit tests: `__tests__/**/*.test.ts`
- E2E tests: `e2e/**/*.spec.ts`

### 13.2 Testing Tools

| Tool | Purpose |
|------|---------|
| Jest | Unit testing framework |
| Playwright | End-to-end browser testing |
| MSW (presumed) | API mocking |

### 13.3 Test Suites (presumed)

**Unit Tests:**
- Auth utilities (JWT encode/decode, password hash)
- API middleware (auth, rate limit, service gate)
- Database queries (prepared statement execution)
- Redux slices and actions
- React hooks
- Utility functions

**E2E Tests:**
- Login flow
- Student registration
- Attendance marking
- Exam creation and result entry
- Fee payment flow
- Offline sync

---

## 14. Deployment & DevOps

### 14.1 Hosting

**Platform:** Vercel (presumed, standard for Next.js)

**Environment Tiers:**
- **Development:** localhost:3000
- **Staging:** staging-educore.vercel.app
- **Production:** educore.vercel.app

### 14.2 Environment Variables

**Required Variables:**

```env
# Database
TURSO_CONNECTION_URL=https://[slug].turso.io
TURSO_AUTH_TOKEN=eyJhbGc...

# Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRY_DAYS=7

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=no-reply@educore.com
EMAIL_PASSWORD=app-password

# File Upload
CLOUDINARY_CLOUD_NAME=educore
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=secret-key

# AI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# AWS (optional)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Redis (optional, for job queues)
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://educore.vercel.app
IS_PROD=true
```

### 14.3 CI/CD Pipeline

**Assumed GitHub Actions workflow:**

```yaml
name: CI/CD

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build
      
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 14.4 Database Migrations

**Migration Runner:** `migrations/run.ts`

**Execution:**
- Manual: `npm run migrate`
- Automatic: Runs on server startup if needed

**Migration Naming:**
```
migrations/001_initial_schema.sql
migrations/002_add_users_table.sql
migrations/003_add_payment_fields.sql
```

**Safety:**
- Migrations are idempotent (can run multiple times safely)
- Rollback capability (keep both up and down migrations)
- Tested on staging before production

---

## 15. Performance & Optimization

### 15.1 Frontend Performance

- **Code Splitting:** Next.js automatic route-based splitting
- **Image Optimization:** next/image component with lazy loading
- **CSS Optimization:** Tailwind CSS tree-shaking
- **Bundle Analysis:** `@next/bundle-analyzer` available in dev tools
- **Caching:**
  - Static pages: ISR (Incremental Static Regeneration)
  - API responses: Client-side SWR/React Query (implied)
  - Assets: Cloudinary CDN + long-lived cache headers

### 15.2 Backend Performance

- **Database Indexes:** Applied on frequently queried columns
- **Query Optimization:** Efficient SQL, minimal N+1 queries
- **Connection Pooling:** Turso manages connection pools
- **Caching:** Redis for session/job storage (optional)
- **Rate Limiting:** Prevents abuse of CPU-intensive endpoints

### 15.3 Monitoring & Analytics

**Presumed Monitoring:**
- Vercel Analytics (built-in)
- Sentry (error tracking) - config unknown
- PostHog (product analytics) - config unknown

---

## 16. Compliance & Regulations

### 16.1 Data Privacy

- **GDPR:** If serving EU users, GDPR compliance required (not tailored for Nigeria but general practices applied)
- **Nigeria Data Protection Regulation (NDPR):** Compliance for Nigerian schools
  - Data consent forms
  - Data subject rights (access, deletion, portability)
  - Breach notification

### 16.2 Data Retention

**Policy (presumed):**
- Active school data: Retained indefinitely
- Deleted school data: Soft deleted (retention period TBD, presume 30-90 days)
- Backup data: Retained for recovery purposes
- Activity logs: Retained for 2 years for audit

### 16.3 Access Control Policies

- Users can only access their own school's data
- Admins can access school data but not other schools (unless super-admin)
- Parents can access only their child's data
- Students can access only their own data

### 16.4 Terms & Privacy

- **Terms of Service:** `/terms`
- **Privacy Policy:** `/privacy`
- **Security Policy:** `/security`

---

## 17. Future Enhancements & Roadmap

### 17.1 Planned Features

- **Advanced Analytics:** Predictive performance modeling
- **Mobile App:** Dedicated native apps (vs. WebView)
- **Video Classes:** Integration with Zoom, Google Meet
- **Learning Management System (LMS):** Course creation, assignment submission
- **Parent Portal Enhancement:** Real-time notifications, online PTA meetings
- **API Public Access:** Third-party integrations via OAuth2
- **Multi-Tenant Support:** Multiple schools in single deployment
- **Blockchain Integration:** Credential verification, diploma issuance
- **SMS Notifications:** WhatsApp, SMS alerts via Twilio
- **Regional Deployment:** Multiple data centers (Africa-focused)

### 17.2 Technical Debt & Improvements

- **ORM Migration:** Consider Drizzle or Prisma for type-safe queries
- **Monorepo Conversion:** Separate web, mobile, and backend packages
- **GraphQL:** Supplement REST API with GraphQL for flexible queries
- **Micro-frontends:** Component library extraction for team scaling
- **Infrastructure as Code:** Terraform for reproducible deployments
- **Observability:** Distributed tracing (OpenTelemetry) for performance debugging

---

## 18. Support & Documentation

### 18.1 Developer Documentation

- **API Documentation:** `/api-docs` page (OpenAPI/Swagger)
- **Code Comments:** Minimal but strategic comments in complex logic
- **GitHub Wiki:** Presumed for architectural decisions and runbooks
- **README Files:** Scattered through repository (build, deployment, testing)

### 18.2 User Documentation

- **Help Center:** `/help-center` public page
- **Blog:** `/blog` with tutorials and FAQs
- **Video Tutorials:** Presumed on YouTube or Vimeo (not in codebase)

### 18.3 Support Channels

- **Email:** support@educore.com (implied)
- **Contact Form:** `/contact-us`
- **Feedback Form:** In-app feedback submission
- **Issue Tracker:** GitHub Issues (private repository)

---

## 19. Glossary of Key Terms

| Term | Definition |
|------|-----------|
| **JWT** | JSON Web Token; self-contained authentication token |
| **RBAC** | Role-Based Access Control; access determined by user role |
| **Service Gating** | Feature access based on school's active service subscriptions |
| **PWA** | Progressive Web App; offline-capable web app |
| **Turso/LibSQL** | SQLite-compatible edge database |
| **Capacitor** | Framework for building cross-platform mobile apps from web code |
| **ISR** | Incremental Static Regeneration; cached pages updated on demand |
| **SSE** | Server-Sent Events; one-way server-to-client streaming |
| **N+1 Queries** | Inefficient database pattern causing excessive queries |

---

## 20. Conclusion

Educore AI is a sophisticated, feature-rich school management platform built on modern web technologies. Its architecture emphasizes security, scalability, and user experience with role-based access control, service-based billing, offline support, and AI-assisted features. The system is designed to scale from single-school deployments to multi-school platform operations while maintaining data isolation and compliance.

**Key Strengths:**
- Comprehensive feature set covering all school operations
- Flexible authentication and authorization framework
- Offline-first design with PWA and mobile support
- Modular service architecture enabling selective feature activation
- Integration with leading AI providers for content generation
- Audit logging and activity tracking for compliance

**Design Principles Applied:**
- Separation of concerns (frontend, backend, database)
- Type safety (TypeScript throughout)
- Security by default (JWT, bcrypt, CORS, rate limiting)
- Scalability (serverless, edge database, CDN for assets)
- User experience (fast, offline-capable, responsive)

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Author:** Fusion AI Assistant  
**Status:** Complete
