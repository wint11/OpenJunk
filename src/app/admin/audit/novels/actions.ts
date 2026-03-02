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

export async function publishNovel(formData: FormData) {
  const session = await auth()
  const user = session?.user
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(user?.role ?? "")) return

  const novelId = formData.get('novelId') as string
  const title = formData.get('title') as string
  const author = formData.get('author') as string
  const description = formData.get('description') as string
  const targetJournalIdInput = formData.get('targetJournalId') as string
  const feedback = formData.get('feedback') as string
  const pdfFile = formData.get('pdfFile') as File | null
  const fundApplicationIds = formData.getAll('fundApplicationIds') as string[]
  
  if (!novelId) return

  // 1. Permission Check for Journal
  const currentUser = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { 
          managedJournal: true,
          reviewerJournals: true
      }
  })

  let targetJournalId: string | null = null

  if (targetJournalIdInput) {
      const isManaged = currentUser?.managedJournalId === targetJournalIdInput
      const isReviewer = currentUser?.reviewerJournals.some(j => j.id === targetJournalIdInput)
      
      if (isManaged || isReviewer || user?.role === 'SUPER_ADMIN') {
          targetJournalId = targetJournalIdInput
      } else {
          throw new Error("You do not have permission to publish to this journal")
      }
  } else {
      if (user?.role === 'ADMIN' && currentUser?.managedJournalId) {
          targetJournalId = currentUser.managedJournalId
      }
  }

  // 2. Handle File Upload (Mandatory now, but let's keep robust check)
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
    // 1. Update Novel Status & Assign Journal
    // This "locks" the novel to this journal.
    await tx.novel.update({
      where: { id: novelId },
      data: { 
        title,
        author,
        description,
        status: 'PUBLISHED',
        lastApprovedAt: new Date(),
        journalId: targetJournalId, 
        // submissionTargets: { set: [] }, // DO NOT CLEAR TARGETS YET! We might need to know where it came from for history?
        // Actually, if it's published to one, it shouldn't be pending for others.
        // But for audit history visibility, we rely on `journalId` being set on the novel.
        // Which we are setting above.
        
        submissionTargets: { set: [] }, 
        
        fundApplications: {
            set: [], 
            connect: fundApplicationIds.map(id => ({ id })) 
        },
        // Update PDF only if new one provided
        ...(pdfUrl ? { pdfUrl, pdfHash } : {})
      }
    })

    // 2. Log Review
    await tx.reviewLog.create({
      data: {
        novelId,
        reviewerId: session!.user!.id!, // Ensure session.user.id is string
        action: 'APPROVE',
        feedback: feedback || "录用并发布"
      }
    })
  })

  revalidatePath('/admin/audit/novels')
  revalidatePath(`/admin/audit/novels/${novelId}`)
  redirect('/admin/audit/novels')
}

export async function approveNovel(formData: FormData) {
  const session = await auth()
  const user = session?.user
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(user?.role ?? "")) return

  const novelId = formData.get('novelId') as string
  const feedback = formData.get('feedback') as string
  const targetJournalIdInput = formData.get('targetJournalId') as string

  if (!novelId) return

  // Determine which journal this admin manages
  const currentUser = await prisma.user.findUnique({
      where: { id: user?.id },
      include: { 
          managedJournal: true,
          reviewerJournals: true
      }
  })

  let targetJournalId: string | null = null

  // Validate targetJournalIdInput against user permissions
  if (targetJournalIdInput) {
      const isManaged = currentUser?.managedJournalId === targetJournalIdInput
      const isReviewer = currentUser?.reviewerJournals.some(j => j.id === targetJournalIdInput)
      
      if (isManaged || isReviewer || user?.role === 'SUPER_ADMIN') {
          targetJournalId = targetJournalIdInput
      } else {
          // Invalid target journal for this user
          throw new Error("You do not have permission to publish to this journal")
      }
  } else {
      // Fallback logic if no target specified (e.g. single journal case or legacy)
      if (user?.role === 'ADMIN' && currentUser?.managedJournalId) {
          targetJournalId = currentUser.managedJournalId
      }
  }
  
  if (!targetJournalId && user?.role !== 'SUPER_ADMIN') {
      // If we still don't have a target journal and not super admin, we can't publish "to nowhere" for a specific journal flow
      // But maybe global publish is allowed? Let's assume strict journal assignment if possible.
      // If logic fails, we might just publish globally (null journalId).
  }
  
  await prisma.$transaction(async (tx) => {
    // 1. Update Novel Status & Assign Journal
    // This "locks" the novel to this journal.
    await tx.novel.update({
      where: { id: novelId },
      data: { 
        status: 'PUBLISHED',
        lastApprovedAt: new Date(),
        journalId: targetJournalId, // <--- Assign to this journal!
        submissionTargets: { set: [] } // Clear targets to be clean
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

export async function reviewNovel(formData: FormData) {
  const session = await auth()
  const user = session?.user
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(user?.role ?? "")) return

  const novelId = formData.get('novelId') as string
  const action = formData.get('action') as string
  const feedback = formData.get('feedback') as string

  if (!novelId || !action) return

  // Log to reviewLog table
  await prisma.reviewLog.create({
    data: {
      novelId,
      reviewerId: session!.user!.id!,
      action: action as any, // REJECT, MINOR_REVISION, MAJOR_REVISION, COMMENT
      feedback: feedback || "评审操作"
    }
  })

  // Also post to the public comment thread for visibility in "Public Review" page
  // Localize action label
  const actionLabel = {
      'REJECT': '拒稿',
      'MINOR_REVISION': '要求小修',
      'MAJOR_REVISION': '要求大修',
      'COMMENT': '评审意见',
      'APPROVE': '录用'
  }[action] || action

  if (feedback) {
      await prisma.novelReviewComment.create({
          data: {
              content: feedback, // Clean feedback without prefix
              novelId,
              userId: session!.user!.id!,
              action: action as string
          }
      })
  }

  // Handle specific status changes
  if (action === 'REJECT') {
      // Logic for rejection (same as rejectNovel logic)
      const currentUser = await prisma.user.findUnique({
          where: { id: user?.id },
          include: { managedJournal: true }
      })
      const currentJournalId = currentUser?.managedJournalId

      if (currentJournalId) {
          // Remove this journal from targets
          await prisma.novel.update({
              where: { id: novelId },
              data: {
                  submissionTargets: { disconnect: { id: currentJournalId } }
              }
          })
          
          // Check if any targets left
          const novel = await prisma.novel.findUnique({
              where: { id: novelId },
              include: { submissionTargets: true }
          })
          
          if (novel && novel.submissionTargets.length === 0) {
              await prisma.novel.update({
                  where: { id: novelId },
                  data: { status: 'REJECTED' }
              })
          }
      } else {
          // Hard reject
          await prisma.novel.update({
              where: { id: novelId },
              data: { status: 'REJECTED' }
          })
      }
  } 
  // For Revisions or Comments, status might not change, or could change to "REVISION_REQUESTED"?
  // Schema currently supports: DRAFT, PENDING, PUBLISHED, REJECTED, TAKEDOWN.
  // Maybe keep as DRAFT/PENDING but notify user.
  // For now, no status change for revision requests, just feedback.

  revalidatePath('/admin/audit/novels')
  revalidatePath(`/public-review/journals/${novelId}`)
}
