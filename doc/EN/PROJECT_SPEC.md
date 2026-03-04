# SmartRead (OpenJunk) Project Specification

This document defines engineering conventions for SmartRead (OpenJunk) to keep development consistent and maintainable. For architecture/database/UI background, see the other documents in this folder.

## 1. Scope

- Web app: Next.js App Router (`src/`)
- Database: Prisma (`prisma/`)
- Mobile app: UniApp (`mobile-app/`)
- Static assets: `public/` (pdfjs, templates, generated files, installers)

## 2. Tech Stack

- Node.js: v18+ recommended
- Package manager: npm (`package-lock.json`)
- Framework: Next.js 16.1.1 + React 19
- TypeScript: `strict: true` (`tsconfig.json`)
- Styling: Tailwind CSS v4
- UI: shadcn/ui (Radix UI), components under `src/components/ui/`
- ORM: Prisma 5
- Storage: Local files (dev) / Vercel Blob (prod) via `src/lib/storage.ts`

## 3. Local Development

```bash
npm install
# configure DATABASE_URL (see Environment Variables)
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

### Common Scripts (package.json)

- `npm run dev` / `build` / `start` / `lint`
- `npm run db:switch:local`: switch Prisma schema to SQLite
- `npm run db:switch:prod`: switch Prisma schema to PostgreSQL
- `npm run migrate:db`: migrate data from local SQLite to PostgreSQL
- `npm run migrate:files`: migrate local files to Vercel Blob and update DB URLs
- `npm run sync:blob`: download blobs into local `public/` for local debugging
- `npm run vercel-build`: `prisma db push && next build`

## 4. Environment Variables

Use `.env`/`.env.local`. Do not commit env files (see `.gitignore`).

### Required

- `DATABASE_URL`: database URL (SQLite for local or PostgreSQL for production, depending on the active schema)

### Auth

- `AUTH_SECRET`: Auth.js/NextAuth secret for JWT/session encryption

### AI (Optional)

- `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `OPENAI_API_KEY`
- `AI_REVIEW_ENDPOINT` or `AI_REVIEW_BASE_URL`, `AI_REVIEW_API_KEY`

### Storage (Optional)

- `STORAGE_PROVIDER`: set to `vercel-blob` to force Vercel Blob in production
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token for migration/sync scripts
- `VERCEL`: injected by Vercel runtime (used for auto-detection)

## 5. Directory Conventions

### Web (`src/`)

- `src/app/`: App Router routes
  - `page.tsx`, `layout.tsx`, `route.ts`
  - Prefer colocated `actions.ts` for mutations (Server Actions)
- `src/components/`: shared components
  - `src/components/ui/`: base UI components (no business logic)
- `src/lib/`: shared logic (Prisma, storage, AI, logging, templates)
- `src/types/`: global type augmentation

### Database (`prisma/`)

- `prisma/schema.prisma`: generated active schema, do not edit directly
- `prisma/schema.sqlite.prisma`: source schema for SQLite (local)
- `prisma/schema.postgres.prisma`: source schema for PostgreSQL (prod)
- Switch schema via `scripts/switch-db.js` or `npm run db:switch:*`

## 6. Logging & Auditing

- Request logs: `logs/YYYY-MM-DD.log` (gitignored)
- Audit logs: persisted in DB (`AuditLog`) for critical actions
- Never log secrets/tokens/passwords or full sensitive personal data

## 7. Generated Content & Large Files

- Runtime/generated directories are gitignored: `public/uploads/`, `public/csv/`, `logs/`
- Binary/large assets (apk/docx/pdf) should live in clear subfolders with traceable names

## 8. Quality Gates (Recommended)

- Before merging: `npm run lint` and at least one `npm run build`
- Prisma changes: migrations or `db push` should work on a clean DB; keep seed in sync when needed

## 9. Related Docs

- Architecture: `doc/EN/ARCHITECTURE.md`
- Database: `doc/EN/DATABASE.md`
- UI/UX: `doc/EN/UI_UX.md`
- Code overview: `doc/EN/CODE_OVERVIEW.md`

