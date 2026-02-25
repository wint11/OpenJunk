'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'

export async function updateNovelInfo(formData: FormData) {
  const session = await auth()
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(session?.user?.role ?? "")) return

  const novelId = formData.get('novelId') as string
  const title = formData.get('title') as string
  const author = formData.get('author') as string
  const description = formData.get('description') as string
  const fundApplicationIds = formData.getAll('fundApplicationIds') as string[]

  if (!novelId) return

  await prisma.novel.update({
    where: { id: novelId },
    data: { 
        title, 
        author, 
        description,
        // Update many-to-many relationship
        fundApplications: {
            set: [], // Clear existing
            connect: fundApplicationIds.map(id => ({ id })) // Connect new
        }
    }
  })

  revalidatePath('/admin/audit/novels')
}

export async function uploadFinalPdf(formData: FormData) {
  const session = await auth()
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(session?.user?.role ?? "")) return

  const novelId = formData.get('novelId') as string
  const pdfFile = formData.get('pdfFile') as File

  if (!novelId || !pdfFile) return

  if (pdfFile.type !== 'application/pdf') {
      throw new Error("File must be a PDF")
  }

  const bytes = await pdfFile.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Calculate hash
  const { createHash } = await import('crypto')
  const pdfHash = createHash('sha256').update(buffer).digest('hex')

  // Save file
  const fileName = `${uuidv4()}.pdf`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'pdfs')
  
  try {
    await mkdir(uploadDir, { recursive: true })
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)
    
    const pdfUrl = `/uploads/pdfs/${fileName}`

    await prisma.novel.update({
        where: { id: novelId },
        data: { pdfUrl, pdfHash }
    })
    
  } catch (err) {
    console.error("File upload error:", err)
    throw new Error("Failed to save PDF file")
  }

  revalidatePath('/admin/audit/novels')
}

export async function approveNovel(formData: FormData) {
  const session = await auth()
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(session?.user?.role ?? "")) return

  const novelId = formData.get('novelId') as string
  const feedback = formData.get('feedback') as string

  if (!novelId) return

  await prisma.$transaction(async (tx) => {
    // 1. Update Novel Status
    await tx.novel.update({
      where: { id: novelId },
      data: { 
        status: 'PUBLISHED',
        lastApprovedAt: new Date()
      }
    })

    // 2. Log Review
    await tx.reviewLog.create({
      data: {
        novelId,
        reviewerId: session!.user!.id!,
        action: 'APPROVE',
        feedback: feedback || "录用并发布"
      }
    })
  })

  revalidatePath('/admin/audit/novels')
  revalidatePath(`/admin/audit/novels/${novelId}`)
  redirect('/admin/audit/novels')
}

export async function rejectNovel(formData: FormData) {
  const session = await auth()
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(session?.user?.role ?? "")) return

  const novelId = formData.get('novelId') as string
  const feedback = formData.get('feedback') as string

  if (!novelId) return

  await prisma.$transaction(async (tx) => {
    // 1. Update Novel Status
    await tx.novel.update({
      where: { id: novelId },
      data: { status: 'REJECTED' }
    })

    // 2. Log Review
    await tx.reviewLog.create({
      data: {
        novelId,
        reviewerId: session!.user!.id!,
        action: 'REJECT',
        feedback
      }
    })
  })

  revalidatePath('/admin/audit/novels')
  revalidatePath(`/admin/audit/novels/${novelId}`)
  redirect('/admin/audit/novels')
}
