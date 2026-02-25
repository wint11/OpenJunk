'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { logAudit } from '@/lib/audit'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const workSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(500, "标题过长"),
  author: z.string().max(100, "作者名过长").optional(),
  correspondingAuthor: z.string().max(100, "通讯作者名过长").optional(),
  type: z.enum(["NOVEL", "PAPER", "AUTOBIOGRAPHY", "ARTICLE"]),
  category: z.string().min(1, "分类不能为空").max(50),
  description: z.string().min(1, "摘要至少1个字").max(2000),
  journalId: z.string().min(1, "请选择期刊"),
  fundApplicationIds: z.array(z.string()).optional(),
})

export type FormState = {
  error?: string | {
    title?: string[]
    author?: string[]
    correspondingAuthor?: string[]
    type?: string[]
    category?: string[]
    description?: string[]
    pdfUrl?: string[]
    journalId?: string[]
    fundApplicationIds?: string[]
  } | null
}

export async function createWork(prevState: FormState, formData: FormData): Promise<FormState> {
  // Check authentication status
  const session = await auth()
  const user = session?.user
  
  // Get client IP
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1'

  const pdfFile = formData.get('pdfFile') as File
  if (!pdfFile || pdfFile.size === 0) {
      return { error: { pdfUrl: ["请上传文件"] } }
  }
  
  // Validate file type based on user role
  if (user) {
    // Logged in user: MUST be PDF
    if (pdfFile.type !== 'application/pdf') {
       return { error: { pdfUrl: ["已登录用户仅支持PDF文件投稿"] } }
    }
  } else {
    // Guest user: MUST be Word or Archive
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/msword', // doc
      'application/zip', // zip
      'application/x-zip-compressed', // zip
      'application/x-rar-compressed', // rar
      'application/x-rar', // rar
      'application/octet-stream' // generic binary, sometimes used for rar/zip
    ]
    
    // Also check extension as fallback for octet-stream
    const name = pdfFile.name.toLowerCase()
    const isZipOrRar = name.endsWith('.zip') || name.endsWith('.rar')

    if (!validTypes.includes(pdfFile.type) && !isZipOrRar) {
       return { error: { pdfUrl: ["未登录用户仅支持Word文档(docx/doc)或压缩包(zip/rar)投稿"] } }
    }
  }
  
  // 10MB limit
  if (pdfFile.size > 10 * 1024 * 1024) {
      return { error: { pdfUrl: ["文件大小不能超过10MB"] } } 
  }

  const fundApplicationIds = formData.getAll('fundApplicationIds') as string[]

  const rawData = {
    title: formData.get('title'),
    // author: formData.get('author'), // Removed
    // correspondingAuthor: formData.get('correspondingAuthor'), // Removed
    type: formData.get('type'),
    category: formData.get('category'),
    description: formData.get('description'),
    journalId: formData.get('journalId'),
    fundApplicationIds: fundApplicationIds.length > 0 ? fundApplicationIds : undefined,
  }

  // Parse authors data
  const authorsDataStr = formData.get('authorsData') as string
  let authors: { name: string, unit: string, roles: string[] }[] = []
  try {
      authors = JSON.parse(authorsDataStr)
  } catch (e) {
      return { error: { author: ["作者信息格式错误"] } }
  }

  // Validate authors
  if (!authors || authors.length === 0) {
      return { error: { author: ["请至少添加一位作者"] } }
  }
  for (const a of authors) {
      if (!a.name || !a.name.trim()) return { error: { author: ["作者姓名不能为空"] } }
      // unit is optional
  }

  const validatedFields = workSchema.omit({ author: true, correspondingAuthor: true }).safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { title, type, category, description, journalId } = validatedFields.data

  // Construct author string (names only)
  const authorNames = authors.map(a => a.name).join(', ')
  
  // Construct corresponding author string
  const correspondingAuthors = authors
    .filter(a => a.roles.includes('通讯作者'))
    .map(a => a.name)
    .join(', ')

  // Serialize full author data to extraAuthors
  const extraAuthors = JSON.stringify(authors)

  // Handle file upload and deduplication
  let pdfUrl = ""
  let pdfHash = ""
  try {
      const bytes = await pdfFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Calculate SHA-256 hash
      const { createHash } = await import('crypto')
      pdfHash = createHash('sha256').update(buffer).digest('hex')
      
      // Check for duplicates
      const existingNovel = await prisma.novel.findFirst({
        where: { pdfHash: pdfHash }
      })

      if (existingNovel && existingNovel.pdfUrl) {
         // Verify if file actually exists on disk
         const existingPath = join(process.cwd(), 'public', existingNovel.pdfUrl)
         if (existsSync(existingPath)) {
            pdfUrl = existingNovel.pdfUrl
            // If duplicate found AND file exists, we reuse the existing file URL
         }
      }
      
      if (!pdfUrl) {
          // Determine extension
          let extension = '.pdf'
          const name = pdfFile.name.toLowerCase()
          
          if (name.endsWith('.docx')) {
             extension = '.docx'
          } else if (name.endsWith('.doc')) {
             extension = '.doc'
          } else if (name.endsWith('.zip')) {
             extension = '.zip'
          } else if (name.endsWith('.rar')) {
             extension = '.rar'
          }

          const fileName = `${uuidv4()}${extension}`
          const uploadDir = join(process.cwd(), 'public', 'uploads', 'pdfs')
          
          try {
            await mkdir(uploadDir, { recursive: true })
            const filePath = join(uploadDir, fileName)
            await writeFile(filePath, buffer)
            
            // Double check if file was written
            if (!existsSync(filePath)) {
                throw new Error(`File write verification failed at ${filePath}`)
            }
            
            pdfUrl = `/uploads/pdfs/${fileName}`
          } catch (err) {
            console.error("File write error:", err)
            throw err
          }
      }

  } catch (e) {
      console.error("File upload failed", e)
      return { error: "文件上传或处理失败" }
  }

  // Session and user are already retrieved at the top
  
  // Use constructed author names
  const finalAuthorName = authorNames

  try {
    // Check if journal exists
    const journal = await prisma.journal.findUnique({
      where: { id: journalId },
      include: {
        admins: { select: { id: true } },
        reviewers: { select: { id: true } }
      }
    })

    if (!journal) {
      return { error: { journalId: ["所选期刊不存在"] } }
    }

    // If user is logged in, verify they have permission to post to this journal (Managed or Reviewer)
    // 1. SUPER_ADMIN: Can submit to ALL active journals
    // 2. ADMIN (Editor-in-Chief): Only managed journal
    // 3. REVIEWER (Editor): Only reviewer journals
    if (user) {
        if (user.role === 'SUPER_ADMIN') {
           // Allow
        } else if (user.role === 'ADMIN') {
           const isJournalAdmin = journal.admins.some(admin => admin.id === user.id)
           if (!isJournalAdmin) {
               return { error: { journalId: ["您没有权限向该期刊投稿（快速通道仅限所属期刊内部人员）"] } }
           }
        } else {
           const isJournalReviewer = journal.reviewers.some(reviewer => reviewer.id === user.id)
           if (!isJournalReviewer) {
               return { error: { journalId: ["您没有权限向该期刊投稿（快速通道仅限所属期刊内部人员）"] } }
           }
        }
    }

    // Determine status and review fields based on user login status
    // If user is logged in (e.g. editor/admin), skip review process
    const isDirectPublish = !!user
    const status = isDirectPublish ? "PUBLISHED" : "PENDING"
    const aiReviewPassed = isDirectPublish ? true : null
    const lastApprovedAt = isDirectPublish ? new Date() : null
    const uploaderId = user?.id || null

    const novel = await prisma.novel.create({
      data: {
        title,
        type,
        category,
        description,
        author: finalAuthorName,
        correspondingAuthor: correspondingAuthors,
        extraAuthors, // Now contains the full JSON array of author objects
        uploaderId: uploaderId, 
        uploaderIp: ip,
        status: status,
        aiReviewPassed: aiReviewPassed,
        lastApprovedAt: lastApprovedAt,
        pdfUrl: pdfUrl,
        pdfHash: pdfHash,
        journalId: journalId,
        // Connect multiple funds
        fundApplications: (fundApplicationIds && fundApplicationIds.length > 0) ? {
            connect: fundApplicationIds.map(id => ({ id }))
        } : undefined,
        // No chapters created for PDF papers
      }
    })

    // Notify journal editors only if it requires review (PENDING)
    if (!isDirectPublish) {
      const editors = await prisma.user.findMany({
        where: {
          reviewerJournals: {
            some: { id: journalId }
          }
        },
        select: { id: true }
      })

      // Also notify journal admin
      const journalAdmin = await prisma.journal.findUnique({
        where: { id: journalId },
        include: {
            admins: { select: { id: true } }
        }
      })

      const recipientIds = new Set(editors.map(e => e.id))
      if (journalAdmin?.admins) {
          journalAdmin.admins.forEach(admin => recipientIds.add(admin.id))
      }

      if (recipientIds.size > 0) {
        await prisma.notification.createMany({
            data: Array.from(recipientIds).map(userId => ({
                userId,
                type: 'REVIEW',
                title: `New Manuscript: ${title}`,
                content: `A new manuscript "${title}" has been submitted to your journal from ${ip}.`,
                status: 'UNREAD',
                data: JSON.stringify({ novelId: novel.id, journalId })
            }))
        })
      }
    }

    await logAudit(
      "CREATE_WORK", 
      `Novel:${novel.id}`, 
      `Created work: ${title} (${type}) by ${finalAuthorName} (IP: ${ip}, Status: ${status})`, 
      user?.id || null
    )
  } catch (error: any) {
    console.error("Failed to create work:", error)
    // Add more detailed error logging
    if (error.code === 'P2003') {
        console.error("Foreign key constraint failed on field: " + error.meta?.field_name)
        return { error: "关联数据错误：所选期刊或用户无效，请刷新页面重试" }
    }
    return { error: "数据库错误: " + (error.message || "Unknown error") }
  }

  // Redirect to browse or success page after submission
  redirect('/browse')
}
