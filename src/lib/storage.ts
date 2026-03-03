
import { put, del } from '@vercel/blob';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export interface IStorage {
  /**
   * Upload a file to storage.
   * @param file The file content (Buffer) or File object.
   * @param fileName The desired file name (e.g. "my-file.pdf"). The implementation may add a UUID or path prefix.
   * @param folder The folder to store in (e.g. "uploads/pdfs").
   * @returns The public URL of the uploaded file.
   */
  upload(file: File | Buffer, fileName: string, folder: string): Promise<string>;

  /**
   * Read a file from storage.
   * @param url The public URL of the file.
   * @returns The file content as a Buffer.
   */
  read(url: string): Promise<Buffer>;

  /**
   * Delete a file from storage.
   * @param url The public URL of the file.
   */
  delete(url: string): Promise<void>;
}

class LocalStorage implements IStorage {
  async upload(file: File | Buffer, fileName: string, folder: string): Promise<string> {
    let buffer: Buffer;
    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else if (file instanceof Blob) {
      // Handle File/Blob (File extends Blob)
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      // Fallback or error if type is unexpected, though TS signature limits it
      throw new Error("Invalid file type: expected Buffer or File");
    }
    
    // Ensure directory exists
    // folder should be relative to public, e.g. "uploads/pdfs"
    const publicDir = join(process.cwd(), 'public');
    const targetDir = join(publicDir, folder);
    
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }
    
    const filePath = join(targetDir, fileName);
    await writeFile(filePath, buffer);
    
    // Return relative URL starting with /
    // Ensure folder starts with / or not, handle consistency
    const cleanFolder = folder.startsWith('/') ? folder.slice(1) : folder;
    return `/${cleanFolder}/${fileName}`;
  }

  async read(url: string): Promise<Buffer> {
    // If it's a remote URL (e.g. Vercel Blob from production DB), fetch it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch remote file: ${response.statusText}`);
      }
      return Buffer.from(await response.arrayBuffer());
    }

    // Otherwise, treat as local relative path
    // url is like "/uploads/pdfs/file.pdf"
    // map to process.cwd() + /public + url
    const relativePath = url.startsWith('/') ? url.slice(1) : url;
    const filePath = join(process.cwd(), 'public', relativePath);
    
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    return await readFile(filePath);
  }

  async delete(url: string): Promise<void> {
    const relativePath = url.startsWith('/') ? url.slice(1) : url;
    const filePath = join(process.cwd(), 'public', relativePath);
    
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  }
}

class VercelBlobStorage implements IStorage {
  async upload(file: File | Buffer, fileName: string, folder: string): Promise<string> {
    // Vercel Blob "put" automatically handles unique filenames if configured, 
    // but we can also specify path.
    // folder: "uploads/pdfs"
    // fileName: "file.pdf"
    // path: "uploads/pdfs/file.pdf"
    
    const path = `${folder}/${fileName}`;
    const { url } = await put(path, file, { access: 'public' });
    return url;
  }

  async read(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  async delete(url: string): Promise<void> {
    await del(url);
  }
}

// Determine provider
// Default to Local if not specified, or if NODE_ENV is development
// Use Vercel Blob if STORAGE_PROVIDER=vercel-blob or if running on Vercel (VERCEL=1)
const useBlob = process.env.STORAGE_PROVIDER === 'vercel-blob' || (process.env.VERCEL === '1' && process.env.NODE_ENV === 'production');

export const storage: IStorage = useBlob ? new VercelBlobStorage() : new LocalStorage();
