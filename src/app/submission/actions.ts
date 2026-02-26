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
  journalIds: z.array(z.string()).min(1, "请至少选择一个期刊"),
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
    journalIds?: string[]
    fundApplicationIds?: string[]
  } | null
}

export async function createWork(prevState: FormState, formData: FormData): Promise<FormState> {
  // Check authentication status
  const session = await auth()
  // Ensure we check for session AND user existence properly
  const user = session?.user && session.user.id ? session.user : null
  
  // DEBUG LOG
  console.log("Submission Request:", {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      role: user?.role
  })

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
  const journalIds = formData.getAll('journalIds') as string[]

  // Validate journal count based on user role
  if (user) {
      if (journalIds.length > 1) {
          return { error: { journalIds: ["快速通道仅支持选择一个期刊"] } }
      }
  } else {
      if (journalIds.length > 3) {
          return { error: { journalIds: ["最多同时投稿3个期刊"] } }
      }
  }

  const rawData = {
    title: formData.get('title'),
    // author: formData.get('author'), // Removed
    // correspondingAuthor: formData.get('correspondingAuthor'), // Removed
    type: formData.get('type'),
    category: formData.get('category'),
    description: formData.get('description'),
    journalIds: journalIds,
    fundApplicationIds: fundApplicationIds.length > 0 ? fundApplicationIds : undefined,
  }

  // Parse authors data
  const authorsDataStr = formData.get('authorsData') as string
  let authors: { name: string, unit: string, roles: string[], contact?: string }[] = []
  try {
      authors = JSON.parse(authorsDataStr)
  } catch (e) {
      return { error: { author: ["作者信息格式错误"] } }
  }

  // Validate authors
  if (!authors || authors.length === 0) {
      return { error: { author: ["请至少添加一位作者"] } }
  }
  
  let hasCorresponding = false
  for (const a of authors) {
      if (!a.name || !a.name.trim()) return { error: { author: ["作者姓名不能为空"] } }
      if (a.roles.includes('通讯作者')) {
          hasCorresponding = true
          if (!a.contact || !a.contact.trim()) {
              return { error: { correspondingAuthor: ["通讯作者必须填写联系方式(小红书ID或邮箱)"] } }
          }
      }
  }

  if (!hasCorresponding) {
      return { error: { correspondingAuthor: ["请至少指定一位通讯作者"] } }
  }

  const validatedFields = workSchema.omit({ author: true, correspondingAuthor: true }).safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { title, type, category, description } = validatedFields.data

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

      if (existingNovel) {
        // If file exists, check if user is same or different
        // For simplicity, we just reuse the URL if it's the same content
        // But we create a new Novel entry
        if (existingNovel.pdfUrl) {
            pdfUrl = existingNovel.pdfUrl
        }
      }

      if (!pdfUrl) {
          // New file
          const uploadDir = join(process.cwd(), 'public', 'uploads', 'pdfs')
          if (!existsSync(uploadDir)) {
              await mkdir(uploadDir, { recursive: true })
          }
          
          const uniqueId = uuidv4()
          // Preserve extension
          const originalName = pdfFile.name
          const ext = originalName.substring(originalName.lastIndexOf('.'))
          const filename = `${uniqueId}${ext}`
          const filepath = join(uploadDir, filename)
          
          await writeFile(filepath, new Uint8Array(buffer))
          pdfUrl = `/uploads/pdfs/${filename}`
      }
  } catch (error) {
      console.error("Upload error:", error)
      return { error: "文件上传失败" }
  }

  try {
      // Determine initial status
      // If user is logged in, use PENDING
      // If guest, use DRAFT
      // Use !!user to ensure boolean
      // FORCE CHECK: If user object exists, status MUST be PENDING.
      
      const status = (user && user.id) ? "PENDING" : "DRAFT"

      console.log(`Creating novel with status: ${status} for user: ${user?.id || 'guest'}`)

      // If user is logged in and submitted a single journal, we might want to set journalId directly?
      // No, let's keep it consistent with submissionTargets for multi-submission support.
      // But if it's single submission (which is enforced for logged-in users now), we can also set journalId for easier querying.
      
      const primaryJournalId = journalIds.length === 1 ? journalIds[0] : undefined

      const novel = await prisma.novel.create({
          data: {
              title,
              author: authorNames,
              correspondingAuthor: correspondingAuthors,
              extraAuthors: extraAuthors, // Store full author info including contact
              description,
              category,
              type,
              status, 
              pdfUrl,
              pdfHash,
              uploaderId: user?.id,
              uploaderIp: ip,
              journalId: primaryJournalId, // Set journalId if single submission
              
              // Connect multiple journals
              submissionTargets: {
                  connect: journalIds.map(id => ({ id }))
              },

              // Connect funds if any
              fundApplications: validatedFields.data.fundApplicationIds 
                  ? { connect: validatedFields.data.fundApplicationIds.map(id => ({ id })) }
                  : undefined
          }
      })

      // Log audit
      await logAudit(
          "CREATE_NOVEL",
          "Novel",
          `Created novel: ${novel.title} (${novel.id}), status: ${status}, submitted to journals: ${journalIds.join(', ')}`,
          user?.id || null // Pass null if user is undefined
      )

  } catch (error) {
      console.error("Database error:", error)
      return { error: "提交失败，请稍后重试" }
  }

  redirect('/')
}
