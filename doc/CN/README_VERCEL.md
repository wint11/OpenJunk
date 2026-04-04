# Vercel Deployment Guide

This project has been adapted for Vercel deployment. The database provider has been switched from **SQLite** to **PostgreSQL**.

## Database Setup

Since Vercel's serverless environment does not support persistent file-based databases like SQLite, you need to use a PostgreSQL database.

### Option 1: Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard.
2. Click on the **Storage** tab.
3. Click **Connect Database** and select **Postgres**.
4. Follow the instructions to create a database.
5. Once created, Vercel will automatically add the necessary environment variables (like `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`) to your project.
6. Pull the environment variables to your local machine:
   ```bash
   verel env pull .env.development.local
   ```
   (Or manually update your `.env` file with the connection string).

### Option 2: Neon / Supabase / Other Postgres

1. Create a PostgreSQL database on your preferred provider.
2. Get the connection string (e.g., `postgres://user:password@host:port/database`).
3. Update your `.env` file:
   ```env
   DATABASE_URL="your_connection_string_here"
   ```

## Database Synchronization (Important)

**If you cannot connect to the database from your local machine (e.g. network issues with `db.prisma.io`), you can use `prisma db push` instead of migrations.**

### Method A: Using Migrations (Recommended for Production)

If you can connect to the database locally:
1. Initialize migrations:
   ```bash
   npx prisma migrate dev --name init_postgres
   ```
2. This will create the tables and a migration history.

### Method B: Using DB Push (If local connection fails or for rapid prototyping)

If you encounter connection errors locally, you can skip creating migration files locally and let Vercel handle the schema synchronization, or run this command in an environment that can access the database:

```bash
npx prisma db push
```

**Note:** `db push` will synchronize your schema with the database without creating migration files. This is useful for prototyping but less safe for production data than migrations.

## Build Command on Vercel

**CRITICAL STEP**: To ensure the database schema is created on Vercel (especially if local migration failed), you must update the Build Command.

1. Go to your Vercel Project Dashboard.
2. Navigate to **Settings** > **Build & Development**.
3. Under **Build Command**, toggle "Override" and enter:
   ```bash
   npm run vercel-build
   ```
   *(This runs `prisma db push && next build`)*

**Why?**
- `prisma db push`: Connects to your remote database and creates the necessary tables (which solves the "Table not found" error).
- `next build`: Builds your Next.js application.

### Initial Data Seeding (Optional but Recommended for first run)

If your database is empty, the application might look broken. To populate it with initial data:

1. Temporarily set the **Build Command** to:
   ```bash
   npx prisma db push && npx prisma db seed && next build
   ```
2. Redeploy the project.
3. **IMPORTANT**: After the deployment succeeds, change the Build Command back to `npm run vercel-build`.
   *(The seed script deletes existing data, so you don't want it running on every deployment!)*

## Notes

- **Data Migration**: Existing data in `dev.db` (SQLite) is **NOT** automatically transferred to PostgreSQL. You will need to export/import data manually if needed.
- **Prisma Client**: The `postinstall` script in `package.json` ensures `prisma generate` runs after installation, preventing "Prisma Client not found" errors on Vercel.
