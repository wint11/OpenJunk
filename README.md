# SmartRead (OpenJunk) - Intelligent Journal Platform

**OpenJunk** is a modern, full-stack academic journal platform built with **Next.js 16 (App Router)**. It aims to "turn waste into treasure" by providing an open platform for displaying, reviewing, and communicating about academic "junk" papers.

## ✨ Key Features

### 📚 Academic Ecology
- **Journal Matrix**: Browse all journals under the platform, view statistics and editorial teams.
- **Trends**: Real-time tracking of popular papers based on views, downloads, comments, and bookshelf additions.
- **Paper Library**: Advanced filtering by journal, category, and sorting options.

### 📖 Immersive Reading
- **PDF Reader**: Built-in full-screen PDF viewer with direct file support.
- **Chapter View**: Focus mode for long-form content with customizable typography.
- **Interaction**: Comment system with nested replies and anonymous interaction support.

### ✍️ Creator Center
- **Submission Workflow**: 
  - **Quick Channel**: Fast-track submission for internal editors (Admin/Reviewer).
  - **Standard Channel**: Regular review process for public users.
- **File Support**: PDF upload with SHA-256 deduplication.
- **Metadata**: Rich metadata management including authors, corresponding authors, and abstracts.

### 🛡️ Administration & Security
- **RBAC System**: Granular roles: Reader (USER), Author (AUTHOR), Reviewer (REVIEWER), Admin (ADMIN), Super Admin (SUPER_ADMIN).
- **Session Guard**: Automatic session validation to prevent stale cookies.
- **Audit & Logging**: Comprehensive audit trails for security and compliance.

### 🤖 AI Integration
- **Content Pre-review**: Automated AI quality checks and compliance scanning.
- **Smart Scoring**: Dynamic popularity algorithm with automatic time-based decay.

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [Prisma](https://www.prisma.io/) (ORM), SQLite (Dev) / PostgreSQL (Prod)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/) (Credentials Provider)
- **Validation**: [Zod](https://zod.dev/)
- **Scheduling**: Cron Jobs (for popularity decay)

## 📂 Project Structure

```text
.
├── prisma/                 # Database Schema & Migrations
├── public/                 # Static Assets (PDFs, Images)
├── src/
│   ├── app/                # App Router Definitions
│   │   ├── admin/          # Admin Dashboard
│   │   ├── browse/         # Paper Library
│   │   ├── trends/         # Trends Page
│   │   ├── submission/     # Submission Workflow
│   │   ├── api/            # Backend API Routes
│   │   └── ...             # Public pages
│   ├── components/         # React Components
│   ├── lib/                # Utilities (Popularity, Prisma, AI)
│   └── types/              # TypeScript Definitions
└── logs/                   # Request Logs
```

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js installed (v18+ recommended).

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
The project uses SQLite by default.
```bash
# Generate Prisma Client
npx prisma generate

# Run Database Migrations
npx prisma migrate dev
```

### 4. Initialize Data (Seed)
Use the seed script to create default admin, author, reviewer, and user accounts, along with sample data.
```bash
npx tsx prisma/seed.ts
```
**Default Accounts:**
- Super Admin: `admin@example.com` / `123456`
- Author: `author@example.com` / `123456`
- Reviewer: `reviewer@example.com` / `123456`
- Reader: `user@example.com` / `123456`

### 5. Start Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to start.

### 6. Export Database Data
This project provides a script to export all database tables to CSV format.
```bash
# Export to CSV
npx tsx prisma/export_to_csv.ts
```
- The exported files will be saved in `public/csv/`.
- File names follow the format: `[TableName].csv`.

## 📝 Latest Updates (2026-02-15)

### New Features
- **Journal Platform Transformation**: Rebranded and restructured for academic publishing.
- **Reviewer Role**: Added dedicated role for manuscript review.
- **AI Pre-review**: Chapter submissions now undergo preliminary quality assessment via `ai-pre-review`.
- **Advanced User Management**: Super Admins can now manage roles, passwords, and account status directly from the dashboard.
- **Enhanced Logging**: Implemented file-based daily request logging for better observability.

### Improvements & Fixes
- Upgraded to **Next.js 16** and **React 19**.
- Removed CTF module and related dependencies.
- Fixed issues with login redirects, author permissions, and footer layout.
- Optimized database models with full support for AI review status.
