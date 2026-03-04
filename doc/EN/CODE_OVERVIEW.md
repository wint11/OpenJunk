# SmartRead (OpenJunk) Project Code Overview

This document provides an overview of the SmartRead (OpenJunk) codebase structure, key modules, and engineering conventions. The project is built on Next.js App Router and covers journals, public review, conferences/awards, fund workflows, typesetting tooling, and a universe/quiz engagement module.

## 1. Technology Stack Overview

- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19, TailwindCSS, Shadcn UI (Radix UI)
- **Database ORM**: Prisma 5 (SQLite for local dev / PostgreSQL for production, switched via multi-schema)
- **Authentication**: NextAuth.js v5 (Beta)
- **Storage**: Vercel Blob (prod) + local files (dev), abstracted in `src/lib/storage.ts`
- **Utilities**: `date-fns` (Date handling), `zod` (Validation), `xlsx` (Excel processing), `@react-pdf/renderer` (PDF generation), `openai` (optional)

## 2. Core Directory Structure (src/)

### 2.1 Routes & Pages (src/app)

The `src/app` directory follows Next.js file-system routing.

#### Core Layouts
- **layout.tsx**: Global root layout, includes `ThemeProvider` (Dark Mode), `SessionProvider` (Auth State), `Toaster` (Global Notifications).
- **page.tsx**: Home page, displaying carousels, recommended content, and app download prompts.

#### Admin Dashboard (src/app/admin)
Distinguishes management interfaces for different roles (System Admin, Fund Admin, Journal Admin).
- **layout.tsx**: Admin dashboard layout, including sidebar navigation. Dynamically displays menus based on user permissions.
- **page.tsx**: Admin dashboard overview, displaying statistical data (Funds/Journals).
- **fund/**: Fund Business Management
  - **projects/**: Fund project list, supports Excel import (`import-dialog.tsx`) and editing.
  - **applications/**: Application management, view application lists and details (`[id]/page.tsx`), perform reviews (`review-dialog.tsx`).
  - **reviews/**: Review record list.
  - **admins/**: Fund admin account management (Super Admin only).
- **journals/**: Journal management.
- **conferences/**: Conference management.
- **awards/**: Award management.
- **users/**: User management.
- **audit/**: Manuscript audit (Novels/Papers).
- **preprints/**: Public review related admin entry (some paths keep legacy naming).

#### Public Fund Pages (src/app/fund)
Pages facing the public and applicants.
- **page.tsx**: Fund Hall (Application Entry).
- **[id]/page.tsx**: Fund Detail Page (Guidelines/Announcements).
- **apply/[id]/page.tsx**: Fund Application Form Page (No login required).
- **check/page.tsx**: Application Status Check Page (By application number).
- **projects/page.tsx**: Approved Project List.

#### Author/Submission Center (src/app/author, src/app/submission)
- **author/**: Author workbench, manage published works.
- **submission/**: Submission process (Create work, upload chapters).

#### Reading & Browsing
- **novel/[id]**, **paper/[id]**: Work reading pages.
- **browse/**, **search/**: Browsing and search pages.
- **public-review/**: Public review platform and metadata update flow.
- **discovery/typesetting/**: Typesetting assistant and editor tooling.
- **universe/**: 3D universe and quiz system.
- **maintenance/**: Maintenance notice page.

#### API Routes (src/app/api)
- **auth/[...nextauth]**: NextAuth authentication handling.
- **uploads/**: File upload handling.
- **cron/**: Scheduled tasks (e.g., popularity decay).
- **proxy/**: Proxy/integration routes.

### 2.2 Component Library (src/components)

- **ui/**: General UI components (Button, Input, Dialog, Table, etc.), based on Shadcn UI.
- **navbar.tsx**: Top navigation bar, including Logo, navigation links, user menu.
- **main-nav.tsx**: Navigation link logic, distinguishing different modules.
- **footer.tsx**: Footer component.
- **auth/**: Authentication-related components (e.g., `session-guard.tsx`).

### 2.3 Core Logic Library (src/lib)

- **prisma.ts**: Prisma Client singleton instance to prevent excessive connections in development.
- **utils.ts**: General utility functions (e.g., `cn` class name merging).
- **auth.ts**: (Located in src root) NextAuth configuration file, defining Providers (Credentials), Callbacks (JWT, Session), User Role logic.
- **ai-pre-review.ts**: Simulated AI pre-review logic.
- **audit.ts**: Audit log recording functions.
- **storage.ts**: Storage abstraction (Local / Vercel Blob).
- **logger.ts**: Request log writer (to `logs/`).

## 3. Database Models (prisma/schema.prisma)

Mainly includes model definitions for the following modules:

- **User System**: `User` (including role), `Account`, `Session`.
- **Content System**: `Novel` (Novel/Paper), `Chapter`, `Comment`.
- **Journal System**: `Journal` (Journal entity).
- **Fund System** (New):
  - `FundCategory`: Fund Category (e.g., "Natural Science Fund").
  - `FundDepartment`: Departments/Divisions within a category.
  - `Fund`: Specific Annual Project (e.g., "2026 General Program").
  - `FundApplication`: Application Record (Includes applicant info, status).
  - `FundExpertProfile`: Expert Profile.
  - `FundReview`: Review Record.
- **Conference/Award**:
  - `Conference`, `Award`, `AwardApplication`, etc.
- **Public Review**:
  - `Preprint`, etc.
- **Universe**:
  - `UniverseSeason`, `Quiz`, `UserQuizAttempt`, etc.

## 4. Key Configuration Files

- **package.json**: Defines project dependencies and `dev`, `build`, `start` scripts.
- **next.config.ts**: Next.js configuration file.
- **vercel.json**: Vercel deployment/redirect configuration.
- **tsconfig.json**: TypeScript compilation options.
- **.env**: Environment variables (Database connection string, Auth Secret, etc.).
- **.gitignore**: Git ignore rules to prevent committing sensitive files and build artifacts.

## 5. Mobile App (mobile-app/)

Contains source code for the mobile app developed with UniApp.
- **pages/**: Mobile app pages (Home, Journal, Paper Detail).
- **static/**: Static icon resources.

## 6. Documentation (doc/)

- **CN/**: Chinese documentation (Architecture, Database, UI/UX).
- **EN/**: English documentation.

---
*Document Updated: 2026-03-04*
