# System Architecture Design

## Overview
SmartRead is a full-stack Web application built on the **Next.js 16 (App Router)** framework. It focuses on online reading, creation, and review management for academic papers, journals, and novels. The system integrates AI-assisted review, Role-Based Access Control (RBAC), and a modern reading experience.

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Component Library**: shadcn/ui (based on Radix UI)
- **State Management**: React Server Components (RSC) & React Hooks
- **Icons**: Lucide React
- **Animation**: Framer Motion, tw-animate-css

### Backend
- **Runtime**: Node.js (via Next.js Server Actions & API Routes)
- **ORM**: Prisma
- **Database**: SQLite (Development) / PostgreSQL (Production Ready)
- **Authentication**: Auth.js (NextAuth v5) - Credentials Provider
- **Validation**: Zod & React Hook Form

## Core Implementation Mechanisms

### 1. Authentication & RBAC Flow
We use **Auth.js v5 (beta)** with a custom Credentials provider.
*   **Login**:
    1.  User submits email/password.
    2.  `authorize` callback validates input format via **Zod**.
    3.  Verifies password hash using `bcrypt.compare`.
*   **Session Management**:
    *   Strategy: **JWT** (Stateless).
    *   **Role Sync**: To ensure permission changes (like bans) take effect immediately, the `jwt` callback queries the database (`prisma.user.findUnique`) on *every* session check to refresh `token.role`.
*   **Audit**: Asynchronously logs "LOGIN" events to the `AuditLog` table via the `signIn` event callback.

### 2. Middleware & Logging
The application uses a custom proxy/middleware pattern (`src/proxy.ts`).
*   **Request Logging**: Every request is logged to `/api/log` via `event.waitUntil` and non-blocking `fetch`. This prevents logging from slowing down user responses.

### 3. AI Pre-review System
Located in `src/lib/ai-pre-review.ts`.
*   **Dual Mode**:
    1.  **API Mode**: If `AI_REVIEW_ENDPOINT` is configured, sends a POST request and enforces JSON response format.
    2.  **Heuristic Mode** (Fallback): If no API Key, uses a length-based algorithm (e.g., >5000 words = quality score 9) to simulate AI judgment.
*   **Normalization**: The system handles various boolean formats (e.g., "true", "passed") to ensure robust parsing of AI responses.

## System Modules

### 1. Core Application (`src/app`)
The application uses Next.js App Router for file-system based routing.
- `(public)`: Home, Browse, Reader, Search.
- `admin`: Protected routes for system management, including journals, papers, users, and audits.
- `author`: Protected routes for content creators, supporting submission and management.
- `profile`: User center and settings.
- `journals`: Journal browsing and detail pages.
- `paper`: Paper reading and detail pages.
- `novel`: Novel reading and detail pages.

### 2. Server Actions (`src/app/*/actions.ts`)
We prioritize **Server Actions** over traditional REST APIs for data mutations.
- **Advantages**: Type safety, reduced client bundle size, progressive enhancement.
- **Scenarios**: Login, Registration, Chapter Publishing, Profile Updates, Journal Management, Paper Submission.

### 3. API Routes (`src/app/api`)
Mainly used for:
- External integrations.
- NextAuth authentication endpoints (`/api/auth`).
- Logging (`/api/log`).

## Directory Structure

```text
src/
├── app/                 # Next.js App Router
│   ├── admin/           # Admin Dashboard (Journal/Paper/User Management)
│   ├── author/          # Author Workbench
│   ├── journals/        # Public Journal Pages
│   ├── paper/           # Paper Reading Pages
│   ├── novel/           # Novel Reading Pages
│   ├── api/             # API Routes
│   └── ...              # Public Pages (About, Browse, etc.)
├── components/          # React Components
│   ├── ui/              # shadcn/ui Base Components
│   └── ...              # Business Components (ReaderView, NovelCard, etc.)
├── lib/                 # Shared Logic
│   ├── ai-pre-review.ts # AI Review Logic
│   ├── prisma.ts        # Database Client
│   └── utils.ts         # Utility Functions
└── prisma/              # Database Schema & Migrations
```
