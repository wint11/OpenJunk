import { list } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

// Manual env load if needed, though usually run with `node --env-file=.env` or similar in modern Node
// Or just rely on user setting it
const token = process.env.BLOB_READ_WRITE_TOKEN;

async function syncBlobs() {
  if (!token) {
    console.error('Error: BLOB_READ_WRITE_TOKEN is not set.');
    console.error('Usage: BLOB_READ_WRITE_TOKEN=... node scripts/sync-blob.js');
    process.exit(1);
  }

  console.log('Fetching file list from Vercel Blob...');
  
  try {
    const result = await list({ token });
    const blobs = result.blobs;
    
    if (blobs.length === 0) {
      console.log('No files found in Vercel Blob storage.');
      return;
    }

    console.log(`Found ${blobs.length} files. Starting download...`);

    const publicDir = join(process.cwd(), 'public');

    for (const blob of blobs) {
      // Blob pathname usually includes the folder structure, e.g., "uploads/pdfs/file.pdf"
      const blobPath = blob.pathname;
      const downloadUrl = blob.url;
      
      const localPath = join(publicDir, blobPath);
      
      // Ensure directory exists
      const dir = dirname(localPath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      
      // Check if file already exists
      if (existsSync(localPath)) {
        console.log(`[Skipped] ${blobPath} (already exists)`);
        continue;
      }

      console.log(`[Downloading] ${blobPath}...`);
      
      try {
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        
        const buffer = Buffer.from(await response.arrayBuffer());
        await writeFile(localPath, buffer);
      } catch (err) {
        console.error(`[Error] Failed to download ${blobPath}:`, err);
      }
    }

    console.log('Sync completed!');
    
  } catch (error) {
    console.error('Failed to list blobs:', error);
  }
}

syncBlobs();
