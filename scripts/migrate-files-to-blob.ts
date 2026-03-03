import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { glob } from 'glob';

// Initialize Prisma
// Force local SQLite connection even if DATABASE_URL is set to Postgres
const sqlitePath = join(process.cwd(), 'prisma', 'dev.db');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${sqlitePath}`
    }
  }
});

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('Error: BLOB_READ_WRITE_TOKEN is not set.');
    process.exit(1);
  }

  console.log('Starting file migration to Vercel Blob...');

  // 1. Migrate Novels (PDFs)
  console.log('\n--- Migrating Novels ---');
  const novels = await prisma.novel.findMany({
    where: {
      pdfUrl: {
        startsWith: '/' // Only migrate local paths
      }
    }
  });

  console.log(`Found ${novels.length} novels with local paths.`);

  for (const novel of novels) {
    if (!novel.pdfUrl) continue;
    
    // Remove leading slash to get relative path from public
    // e.g. /uploads/pdfs/abc.pdf -> uploads/pdfs/abc.pdf
    const relativePath = novel.pdfUrl.startsWith('/') ? novel.pdfUrl.slice(1) : novel.pdfUrl;
    const localPath = join(process.cwd(), 'public', relativePath);

    if (!existsSync(localPath)) {
      console.warn(`[Skip] File not found locally: ${localPath}`);
      continue;
    }

    try {
      console.log(`Uploading: ${relativePath}...`);
      const fileBuffer = await readFile(localPath);
      
      // Upload to Blob
      // We keep the same path structure in blob for tidiness, but it returns a unique URL
      const { url } = await put(relativePath, fileBuffer, { 
        access: 'public',
        token: token
      });

      // Update Database
      await prisma.novel.update({
        where: { id: novel.id },
        data: { pdfUrl: url }
      });

      console.log(`[Done] Updated Novel ${novel.id} -> ${url}`);
    } catch (error) {
      console.error(`[Error] Failed to migrate ${novel.id}:`, error);
    }
  }

  // 2. Migrate Journals (Covers)
  console.log('\n--- Migrating Journals (Covers) ---');
  const journals = await prisma.journal.findMany({
    where: {
      coverUrl: { startsWith: '/' }
    }
  });

  for (const journal of journals) {
    if (!journal.coverUrl) continue;
    const relativePath = journal.coverUrl.startsWith('/') ? journal.coverUrl.slice(1) : journal.coverUrl;
    const localPath = join(process.cwd(), 'public', relativePath);

    if (existsSync(localPath)) {
      try {
        console.log(`Uploading: ${relativePath}...`);
        const fileBuffer = await readFile(localPath);
        const { url } = await put(relativePath, fileBuffer, { access: 'public', token });
        
        await prisma.journal.update({
          where: { id: journal.id },
          data: { coverUrl: url }
        });
        console.log(`[Done] Updated Journal ${journal.id}`);
      } catch (e) {
        console.error(e);
      }
    }
  }

  // 3. Migrate Conferences (Covers)
  console.log('\n--- Migrating Conferences (Covers) ---');
  const conferences = await prisma.conference.findMany({
    where: { coverUrl: { startsWith: '/' } }
  });
  
  for (const conf of conferences) {
    if (!conf.coverUrl) continue;
    const relativePath = conf.coverUrl.startsWith('/') ? conf.coverUrl.slice(1) : conf.coverUrl;
    const localPath = join(process.cwd(), 'public', relativePath);

    if (existsSync(localPath)) {
      try {
        console.log(`Uploading: ${relativePath}...`);
        const fileBuffer = await readFile(localPath);
        const { url } = await put(relativePath, fileBuffer, { access: 'public', token });
        
        await prisma.conference.update({
          where: { id: conf.id },
          data: { coverUrl: url }
        });
        console.log(`[Done] Updated Conference ${conf.id}`);
      } catch (e) {
        console.error(e);
      }
    }
  }

  console.log('\nMigration completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
