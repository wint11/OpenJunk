
'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { writeFile, mkdir, rename } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { extractTextFromDocx } from '@/lib/docx-extractor'
import { analyzeTextWithAI, ExtractedMetadata } from '@/lib/ai-analysis'
import { SmartSubmissionSchema, SmartSubmissionData } from './schema'

// --- Types ---
export type AnalyzeResult = {
  success: boolean
  message?: string
  metadata?: ExtractedMetadata
  tempFileId?: string // To track the uploaded file
  tempFilePath?: string
}

export type JournalRecommendation = {
  id: string
  name: string
  reason: 'HISTORY' | 'AI_MATCH' | 'POPULAR'
}

// --- Actions ---

/**
 * Step 1: Upload and Analyze
 * Uploads the file to a temp location, extracts text, and runs AI analysis.
 */
export async function uploadAndAnalyze(formData: FormData): Promise<AnalyzeResult> {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, message: "No file uploaded" }
    }

    // 1. Validate File Type
    const isDocx = file.name.toLowerCase().endsWith('.docx')
    const isPdf = file.name.toLowerCase().endsWith('.pdf')
    
    if (!isDocx && !isPdf) {
       return { success: false, message: "Unsupported file type. Please upload DOCX or PDF." }
    }
    
    // 2. Save File Temporarily
    const buffer = Buffer.from(await file.arrayBuffer())
    const tempDir = join(process.cwd(), 'public', 'uploads', 'temp')
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }
    const tempFileId = uuidv4()
    const tempFileName = `${tempFileId}-${file.name}`
    const tempFilePath = join(tempDir, tempFileName)
    
    await writeFile(tempFilePath, buffer)

    // 3. Extract Text & Analyze (Only for DOCX)
    let metadata: ExtractedMetadata = {}
    
    if (isDocx) {
      try {
        const text = await extractTextFromDocx(buffer)
        // Limit to 1000 chars as requested
        const shortText = text.slice(0, 1000)
        metadata = await analyzeTextWithAI(shortText)
      } catch (e) {
        console.error("Extraction/AI failed:", e)
        // Non-blocking failure: return success but with empty metadata
        // or partial metadata if available
      }
    } else if (isPdf) {
        // PDF analysis logic could go here (e.g., pdf-parse), 
        // but for now we skip AI extraction for PDF uploads as per requirements for logged-in users.
        // We just return success with empty metadata.
    }

    return {
      success: true,
      metadata,
      tempFileId,
      tempFilePath: `/uploads/temp/${tempFileName}` // Public URL path
    }

  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, message: "Server error during upload" }
  }
}

/**
 * Step 2: Get Recommended Journals
 * Based on User IP history and AI extracted journal name.
 */
export async function getRecommendedJournals(aiJournalName?: string): Promise<JournalRecommendation[]> {
  const recommendations: JournalRecommendation[] = []
  
  // 1. AI Match
  if (aiJournalName) {
    // Fuzzy search for journal by name
    const match = await prisma.journal.findFirst({
      where: {
        name: { contains: aiJournalName } // Simple contains search
      },
      select: { id: true, name: true }
    })
    
    if (match) {
      recommendations.push({
        id: match.id,
        name: match.name,
        reason: 'AI_MATCH'
      })
    }
  }

  // 2. IP History Match
  // Get IP (In a real scenario, we'd parse headers. Here we mock or need to pass it)
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1'

  // Find journals this IP has submitted to recently
  const recentWorks = await prisma.novel.findMany({
    where: { uploaderIp: ip },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { journalId: true }
  })
  
  // Extract unique Journal IDs
  const historyJournalIds = Array.from(new Set(recentWorks.map(w => w.journalId)))
  
  if (historyJournalIds.length > 0) {
    const historyJournals = await prisma.journal.findMany({
      where: { 
        id: { in: historyJournalIds },
        status: 'ACTIVE'
      },
      select: { id: true, name: true }
    })
    
    historyJournals.forEach(j => {
      // Avoid duplicates if AI already found it
      if (!recommendations.some(r => r.id === j.id)) {
        recommendations.push({
          id: j.id,
          name: j.name,
          reason: 'HISTORY'
        })
      }
    })
  }

  return recommendations
}

/**
 * Helper to fetch all active journals for the fallback list
 */
export async function getAllJournals() {
  return await prisma.journal.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })
}

export type SmartSubmissionState = {
  success?: boolean
  error?: string
}

export async function submitSmartWork(data: SmartSubmissionData): Promise<SmartSubmissionState> {
  try {
    const session = await auth()
    const user = session?.user

    // 1. Validate File Existence
    const tempFilePath = join(process.cwd(), 'public', data.tempFilePath)
    if (!existsSync(tempFilePath)) {
      return { success: false, error: "临时文件已过期或不存在，请重新上传" }
    }

    // 2. Move File to Final Location
    // We store files in 'uploads/pdfs' for historical reasons, but now it supports docx too.
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'pdfs')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Preserve original extension
    const fileExt = extname(tempFilePath) 
    const newFileName = `${uuidv4()}${fileExt}`
    const newFilePath = join(uploadDir, newFileName)
    const finalUrl = `/uploads/pdfs/${newFileName}`

    await rename(tempFilePath, newFilePath)

    // 3. Get IP
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1'

    // 4. Create Work in DB
    const authorNames = data.authors.map(a => a.name).join(', ')
    const correspondingAuthorName = data.authors.find(a => a.isCorresponding)?.name || ""
    
    // Determine status based on user login
    const status = user ? 'PUBLISHED' : 'DRAFT'

    await prisma.novel.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        category: data.category,
        pdfUrl: finalUrl,
        status: status, // DRAFT for guests, PUBLISHED for logged-in users
        uploaderId: user?.id, // Link to user if logged in
        journalId: data.journalId,
        uploaderIp: ip,
        author: authorNames, // Required display name
        correspondingAuthor: correspondingAuthorName,
        extraAuthors: JSON.stringify(data.authors),
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Submission error:", error)
    return { success: false, error: "提交失败，请稍后重试" }
  }
}
