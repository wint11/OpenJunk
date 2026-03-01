'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

export async function publishConferencePaper(formData: FormData) {
  const session = await auth()
  const user = session?.user
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(user?.role ?? "")) return

  const novelId = formData.get('novelId') as string
  const title = formData.get('title') as string
  const author = formData.get('author') as string
  const description = formData.get('description') as string
  const feedback = formData.get('feedback') as string
  const pdfFile = formData.get('pdfFile') as File | null
  const fundApplicationIds = formData.getAll('fundApplicationIds') as string[]
  
  // Conference logic
  const targetConferenceId = formData.get('targetConferenceId') as string
  
  if (!novelId) return

  // 1. Permission Check for Conference
  const currentUser = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { 
          managedConference: true,
          reviewerConferences: true
      }
  })

  // Verify permission
  const isManaged = currentUser?.managedConferenceId === targetConferenceId
  const isReviewer = currentUser?.reviewerConferences.some(c => c.id === targetConferenceId)
  
  if (!isManaged && !isReviewer && user?.role !== 'SUPER_ADMIN') {
      throw new Error("You do not have permission to publish to this conference")
  }

  // 2. Handle File Upload (Optional update)
  let pdfUrl = undefined
  let pdfHash = undefined

  if (pdfFile && pdfFile.size > 0 && pdfFile.name !== 'undefined') {
      if (pdfFile.type !== 'application/pdf') {
          throw new Error("File must be a PDF")
      }

      const bytes = await pdfFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const { createHash } = await import('crypto')
      pdfHash = createHash('sha256').update(buffer).digest('hex')

      const fileName = `${uuidv4()}.pdf`
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'pdfs')
      
      try {
        await mkdir(uploadDir, { recursive: true })
        const filePath = join(uploadDir, fileName)
        await writeFile(filePath, buffer)
        pdfUrl = `/uploads/pdfs/${fileName}`
      } catch (err) {
        console.error("File upload error:", err)
        throw new Error("Failed to save PDF file")
      }
  }

  // 3. Database Transaction
  await prisma.$transaction(async (tx) => {
    await tx.novel.update({
      where: { id: novelId },
      data: { 
        title,
        author,
        description,
        status: 'PUBLISHED',
        lastApprovedAt: new Date(),
        conferenceId: targetConferenceId, 
        // Clear journal fields just in case? Or allow dual submission? usually exclusive.
        // For now, let's assume exclusive.
        journalId: null,
        submissionTargets: { set: [] }, 
        fundApplications: {
            set: [], 
            connect: fundApplicationIds.map(id => ({ id })) 
        },
        ...(pdfUrl ? { pdfUrl, pdfHash } : {})
      }
    })

    await tx.reviewLog.create({
      data: {
        novelId,
        reviewerId: session!.user!.id!,
        action: 'APPROVE',
        feedback: feedback || "会议录用并发布"
      }
    })
  })

  revalidatePath('/admin/audit/conferences')
  redirect('/admin/audit/conferences')
}

export async function rejectConferencePaper(formData: FormData) {
  const session = await auth()
  const user = session?.user
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(user?.role ?? "")) return

  const novelId = formData.get('novelId') as string
  const feedback = formData.get('feedback') as string

  if (!novelId) return

  // Simply reject
  await prisma.$transaction(async (tx) => {
    await tx.novel.update({
      where: { id: novelId },
      data: { status: 'REJECTED' }
    })

    await tx.reviewLog.create({
      data: {
        novelId,
        reviewerId: session!.user!.id!,
        action: 'REJECT',
        feedback
      }
    })
  })

  revalidatePath('/admin/audit/conferences')
  redirect('/admin/audit/conferences')
}
