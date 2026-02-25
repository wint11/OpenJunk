'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function approveChapters(formData: FormData) {
  const session = await auth()
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(session?.user?.role ?? "")) return

  const novelId = formData.get('novelId') as string
  const feedback = formData.get('feedback') as string

  if (!novelId) return

  await prisma.$transaction(async (tx) => {
    // 1. Update Chapters Status
    await tx.chapter.updateMany({
      where: { 
        novelId, 
        status: 'PENDING' 
      },
      data: { status: 'PUBLISHED' }
    })

    // 2. Log Review
    await tx.reviewLog.create({
      data: {
        novelId,
        reviewerId: session!.user!.id!,
        action: 'APPROVE',
        feedback: `[章节审核] ${feedback || '通过'}`
      }
    })
    
    // Note: We do NOT automatically update Novel status to PUBLISHED here.
    // The "New Work Audit" (Metadata Audit) is responsible for setting Novel status.
    // If this is a new book, both audits are required.
    // If this is an update, the Novel status was set to PENDING, so Metadata Audit is also required to "re-publish" the book.
  })

  revalidatePath('/admin/audit/chapters')
  revalidatePath(`/admin/audit/chapters/${novelId}`)
  redirect('/admin/audit/chapters')
}

export async function rejectChapters(formData: FormData) {
  const session = await auth()
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(session?.user?.role ?? "")) return

  const novelId = formData.get('novelId') as string
  const feedback = formData.get('feedback') as string

  if (!novelId) return

  await prisma.$transaction(async (tx) => {
    // 1. Update Chapters Status
    await tx.chapter.updateMany({
      where: { 
        novelId, 
        status: 'PENDING' 
      },
      data: { status: 'REJECTED' }
    })

    // 2. Log Review
    await tx.reviewLog.create({
      data: {
        novelId,
        reviewerId: session!.user!.id!,
        action: 'REJECT',
        feedback: `[章节审核] ${feedback}`
      }
    })
    
    // If we reject chapters, we might want to keep Novel status as is, or set to REJECTED if it was PENDING?
    // If Novel was already PUBLISHED, keep it PUBLISHED.
    // If Novel was PENDING (new book), and we reject chapters, maybe reject Novel too?
    // Let's keep it simple: Only affect chapters.
  })

  revalidatePath('/admin/audit/chapters')
  revalidatePath(`/admin/audit/chapters/${novelId}`)
  redirect('/admin/audit/chapters')
}
