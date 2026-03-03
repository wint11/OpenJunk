// import sqlite3 from 'sqlite3';
// import { open } from 'sqlite';
// Failed to install sqlite3/better-sqlite3 due to node-gyp build errors on Windows.
// We will fallback to using the 'prisma' client which is already generated and working for SQLite!
// But we need to use 'pg' for the destination.

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import path from 'path';

async function migrateData() {
  const pgUrl = process.env.DATABASE_URL; // Target Postgres URL
  if (!pgUrl || !pgUrl.startsWith('postgres')) {
    console.error('Error: DATABASE_URL is not set to a Postgres URL.');
    console.log('Please set DATABASE_URL=postgres://... in your .env or command line.');
    process.exit(1);
  }

  console.log(`Reading from SQLite via Prisma Client...`);
  
  // This Prisma Client is generated for SQLite (based on current dev environment)
  // IMPORTANT: We need to override the datasource url to point to the local SQLite file explicitly,
  // because the environment variable DATABASE_URL might be set to Postgres for the destination!
  // BUT: Prisma Client constructor doesn't easily allow overriding protocol if the schema hardcodes "sqlite" but env var is "postgres://".
  // Actually, the schema says: provider = "sqlite", url = env("DATABASE_URL").
  // If we pass a postgres URL to it, it complains "URL must start with file:".
  
  // Solution: Instantiate Prisma with a direct datasource override to the local file.
  const sqlitePath = path.join(process.cwd(), 'prisma', 'dev.db');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${sqlitePath}`
      }
    }
  });

  const pool = new Pool({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false }, // Vercel/Neon usually requires SSL
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 30000,
    keepAlive: true,
    max: 1 // Limit to 1 connection to avoid overwhelming Vercel/Neon
  });

  // Use pool.connect() for each query or use a single client but handle errors carefully?
  // Using single client is faster for transaction-like batch, but if it drops, we die.
  // Let's use pool.query directly? No, we need transaction for disable triggers.
  
  const client = await pool.connect();
  
  // Add error handler to client to prevent crash
  client.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't throw
  });

  try {
    // We define explicit order for dependency resolution
    const tableOrder = [
      'User',
      'Journal', 
      'Conference', 
      'Award',
      'FundCategory',
      'FundDepartment',
      'FundExpertProfile',
      'Fund',
      'FundApplication',
      'Novel',
      'Preprint',
      'Chapter',
      'ReadingHistory',
      'ReviewLog',
      'Comment',
      'CommentLike',
      'NovelReviewComment',
      'Notification',
      'AwardApplication',
      'AuditLog',
      'AppSetting',
      'GhostMessage',
      'UniverseSeason',
      'UniverseSeasonStat',
      'Quiz',
      'UserQuizAttempt',
      'JournalTemplate',
      'AoiVote'
    ];

    console.log('Cleaning target tables (TRUNCATE CASCADE)...');
    // Disable constraints temporarily for truncate
    await client.query("SET session_replication_role = 'replica';");
    
    for (const tableName of [...tableOrder].reverse()) {
      try {
        await client.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
      } catch (e) {
        // Ignore if table doesn't exist in PG yet (though schema should be synced)
      }
    }

    console.log('Starting data migration...');

    for (const tableName of tableOrder) {
      // Use Prisma dynamic model access
      // Prisma model names are usually camelCase (e.g. 'user', 'fundCategory')
      // Map TableName (PascalCase) to modelName (camelCase)
      const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
      
      // Check if model exists in prisma client
      if (!(modelName in prisma)) {
          console.warn(`[Skip] Model ${modelName} not found in Prisma Client.`);
          continue;
      }

      // Fetch all rows using Prisma
      // @ts-ignore
      const rows = await prisma[modelName].findMany();
      
      if (rows.length === 0) continue;

      console.log(`Migrating ${tableName}: ${rows.length} rows...`);
      
      const keys = Object.keys(rows[0]);
      // Prepare statement
      const colNames = keys.map(k => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders})`;

      for (const row of rows) {
        // Convert values
        const values = keys.map(key => {
          let val = (row as any)[key];
          // Prisma returns correct types (Date objects, boolean, etc.)
          // PG driver handles Date objects and Booleans correctly.
          return val;
        });

        try {
          await client.query(query, values);
        } catch (err: any) {
             console.error(`  Failed to insert row in ${tableName}:`, err.message);
        }
      }
    }

    // Re-enable constraints
    await client.query("SET session_replication_role = 'origin';");
    
    console.log('Migration completed successfully!');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
    await prisma.$disconnect();
  }
}

migrateData();
