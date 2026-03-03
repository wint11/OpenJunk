# SmartRead (OpenJunk) Design Summary

## 1. Project Overview

**SmartRead (OpenJunk)** is a full-stack academic journal platform built with **Next.js 16 (App Router)**. The project aims to "turn waste into treasure" by providing an open platform for displaying, reviewing, and communicating about academic "junk" papers. The system integrates a modern reading experience, popularity algorithms, multi-role permission management (RBAC), AI-assisted review functions, and a fund management system.

Additionally, the project includes a mobile application (UniApp) that provides a cross-platform access experience.

## 2. System Architecture

### 2.1 Tech Stack

*   **Frontend Framework**: Next.js 16 (React 19)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS v4
*   **UI Component Library**: shadcn/ui (based on Radix UI), Lucide React (Icons)
*   **Backend Runtime**: Node.js (Next.js Server Actions & API Routes)
*   **Database ORM**: Prisma
*   **Database**: SQLite (Development) / PostgreSQL (Production)
*   **Authentication**: NextAuth.js v5 (Credentials Provider)
*   **Data Validation**: Zod
*   **Mobile App**: UniApp (Vue.js)
*   **Other**: Three.js (3D Universe), PDF.js (PDF Reading)

### 2.2 Directory Structure

*   `src/app`: Next.js App Router route definitions, including page logic and Server Actions.
    *   `admin`: Management dashboard (Journals, Papers, Users, Funds, etc.).
    *   `api`: Backend API routes (Auth, Cron, Uploads).
    *   `browse`, `trends`, `journals`: Public browsing pages.
    *   `submission`: Submission workflow.
    *   `novel`, `paper`: Content detail pages.
*   `src/components`: React component library.
    *   `ui`: shadcn/ui base components.
    *   `universe`: 3D universe view components.
*   `src/lib`: Utility functions (Prisma instance, Auth, Popularity algorithm, AI Pre-review logic).
*   `prisma`: Database Schema definition (`schema.prisma`) and migration files.
*   `mobile-app`: UniApp mobile project source code.
*   `public`: Static assets (PDFs, Images).

## 3. Core Modules & Features

### 3.1 User & Permission System (RBAC)

The system implements authentication based on NextAuth.js and defines the following roles:
*   **USER (Reader)**: Browse, read, comment, bookmark.
*   **AUTHOR (Author)**: Submit papers, manage own manuscripts.
*   **REVIEWER (Reviewer)**: Review assigned manuscripts.
*   **ADMIN (Administrator)**: Manage journals, conferences, awards, review manuscripts.
*   **SUPER_ADMIN (Super Administrator)**: System-level configuration, user management, full site permissions.

**Key Features**:
*   **Session Guard**: Security mechanism to prevent stale cookies from accessing protected resources.
*   **Audit Log**: Records critical actions like logins and operations (`AuditLog`).

### 3.2 Content Management (CMS)

Supports management of various content types:
*   **Journal**: Includes statistics, editorial team, submission channels.
*   **Paper/Novel**:
    *   Supports PDF upload (SHA-256 deduplication).
    *   Supports chapter-based reading (Markdown/Text).
    *   Supports metadata management (Author, Abstract, Category).
*   **Conference**: Conference information and related paper submissions.
*   **Preprint**: Rapid publication of academic results.

### 3.3 Review System

*   **AI Pre-review**: Automated quality check and compliance scanning upon submission (based on OpenAI/LLM).
*   **Manual Review**:
    *   **Quick Channel**: Internal editors/admins can publish directly.
    *   **Standard Channel**: Requires review by reviewers/admins (Approve/Reject), supports feedback.

### 3.4 Fund Management System (Fund System)

*   **Project Application**: Users can apply for fund projects.
*   **Approval Process**: Admins review and approve fund applications.
*   **Fund Management**: Tracks project fund usage.
*   **Associated Outcomes**: Fund projects can be linked to resulting papers/outcomes.

### 3.5 Interaction & Community

*   **Popularity System**: Multi-dimensional popularity calculation based on views, downloads, comments, and bookmarks, supporting time decay (Cron Job).
*   **Comment System**: Supports nested replies and likes.
*   **3D Universe**: Visual interface (Three.js) for displaying academic achievements or user interactions.
*   **Notifications**: System notifications, review result notifications.

### 3.6 Mobile Application (Mobile App)

Located in the `mobile-app` directory, developed based on UniApp, providing a mobile browsing and reading experience.
*   **Features**: Home recommendations, journal browsing, paper reading, personal center.
*   **Tech**: Vue.js, uView UI (speculated), Cross-platform compilation (iOS/Android/H5).

## 4. Database Design (Prisma)

Core Data Models (`schema.prisma`):

*   **User**: User accounts, including roles and associated management permissions for journals/conferences/awards.
*   **Journal/Conference/Award**: Organizational entities, containing associated papers and administrators.
*   **Novel (Paper)**: Core content entity, storing title, author, PDF link, popularity, review status, etc.
*   **Chapter**: Chapter content (for non-PDF content).
*   **Comment**: Comment data.
*   **ReviewLog**: Review records.
*   **FundApplication/FundProject**: Fund-related entities.
*   **ReadingHistory**: User reading history.
*   **AuditLog**: System operation audit logs.

## 5. Deployment & Operations

*   **Environment Dependencies**: Node.js 18+, SQLite (Default) or PostgreSQL.
*   **Initialization**:
    1.  `npm install`: Install dependencies.
    2.  `npx prisma migrate dev`: Database migration.
    3.  `npx tsx prisma/seed.ts`: Seed data population (default admin accounts).
*   **Start**: `npm run dev` (Development) / `npm run build && npm start` (Production).
*   **Data Export**: Supports exporting database tables to CSV (`prisma/export_to_csv.ts`).
*   **Logging**: File-level request logging.
