'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

import { extname } from 'path'

export async function uploadRevisedNovel(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, message: "请先登录" }
  }

  const novelId = formData.get('novelId') as string
  const file = formData.get('pdfFile') as File
  const changeLog = formData.get('changeLog') as string

  if (!novelId || !file) return { success: false, message: "参数缺失" }

  const novel = await prisma.novel.findUnique({ where: { id: novelId } })
  // Skip author check as per user request
  if (!novel) {
      return { success: false, message: "论文不存在" }
  }

  // Restrict file type to match original extension
  // Get extension from original pdfUrl or default to .pdf if not available
  const originalUrl = novel.pdfUrl || ".pdf"
  const originalExt = extname(originalUrl).toLowerCase()
  const newExt = extname(file.name).toLowerCase()

  if (originalExt && newExt !== originalExt) {
      return { success: false, message: `必须上传 ${originalExt} 格式的文件` }
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { createHash } = await import('crypto')
  const pdfHash = createHash('sha256').update(buffer).digest('hex')

  const fileName = `${uuidv4()}${newExt}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'pdfs')
  
  try {
    await mkdir(uploadDir, { recursive: true })
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)
    const pdfUrl = `/uploads/pdfs/${fileName}`

    await prisma.novel.update({
        where: { id: novelId },
        data: { 
            pdfUrl, 
            pdfHash,
            changeLog, // Store revision notes
            // Optionally update status or notify admin?
            // "如果用户提交了新论文，后台要能看见某种标识"
            // We can use `isModified` flag or update `lastSubmittedAt`
            lastSubmittedAt: new Date()
        }
    })
    
    // Auto-post comment about revision
    await prisma.novelReviewComment.create({
        data: {
            content: `[作者提交修改稿] ${changeLog || "已上传新版本文件"}`,
            novelId,
            userId: session.user.id,
            action: 'REVISION_SUBMITTED'
        }
    })

    revalidatePath(`/public-review/journals/${novelId}`)
    return { success: true }
  } catch (err) {
    console.error("Upload error:", err)
    return { success: false, message: "上传失败" }
  }
}

import { headers } from "next/headers"

export async function postReviewComment(novelId: string, content: string) {
  const session = await auth()
  
  let userId = session?.user?.id
  let guestIp: string | undefined = undefined
  let guestName: string | undefined = undefined

  if (!userId) {
     const headersList = await headers()
     guestIp = headersList.get("x-forwarded-for")?.split(',')[0] || "127.0.0.1"
     
     // Generate anonymous name like "匿名用户A1B2"
     // Use MD5 of IP to get a consistent hash
     const { createHash } = await import('crypto')
     const hash = createHash('md5').update(guestIp).digest('hex').substring(0, 6).toUpperCase()
     guestName = `匿名用户${hash}`
  }

  try {
    await prisma.novelReviewComment.create({
      data: {
        content,
        novelId,
        userId: userId, // Optional now
        guestIp: guestIp,
        guestName: guestName,
        action: 'COMMENT' // Default action
      }
    })
    
    revalidatePath(`/public-review/journals/${novelId}`)
    return { success: true }
  } catch (error) {
    return { success: false, message: "发表失败" }
  }
}

export async function getReviewData(novelId: string) {
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      uploader: { select: { name: true, image: true, email: true } },
      journal: { select: { name: true } },
      novelReviewComments: {
        where: { parentId: null },
        include: {
          user: { select: { name: true, image: true, role: true } },
          replies: {
             include: { user: { select: { name: true, image: true } } }
          }
        },
        orderBy: { createdAt: 'asc' } // Oldest first like GitHub issues
      }
    }
  })
  
  return novel
}
