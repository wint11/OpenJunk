'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { storage } from "@/lib/storage"

export async function uploadNovelCover(novelId: string, formData: FormData) {
  const session = await auth()
  const role = session?.user?.role ?? ""
  
  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return { success: false, message: "Unauthorized" }
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { managedJournalId: true }
  })

  const novel = await prisma.novel.findUnique({ where: { id: novelId } })
  if (!novel) return { success: false, message: "Novel not found" }

  // Permission check: Admin can only update novels from their journal
  if (role === 'ADMIN') {
    if (novel.journalId !== currentUser?.managedJournalId) {
      return { success: false, message: "You can only update novels from your managed journal" }
    }
  }

  const coverFile = formData.get('cover') as File | null
  if (!coverFile || coverFile.size === 0) {
    return { success: false, message: "No file uploaded" }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(coverFile.type)) {
    return { success: false, message: "Invalid file type. Only JPG, PNG, WebP, GIF are allowed." }
  }

  try {
    const bytes = await coverFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const fileName = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    const coverUrl = await storage.upload(buffer, fileName, 'uploads/cover')

    await prisma.novel.update({
      where: { id: novelId },
      data: { coverUrl }
    })

    revalidatePath('/admin/novels')
    return { success: true, coverUrl }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, message: "Upload failed" }
  }
}

export async function toggleNovelStatus(novelId: string, currentStatus: string) {
  const session = await auth()
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role ?? "")) return

  const newStatus = currentStatus === 'PUBLISHED' ? 'TAKEDOWN' : 'PUBLISHED'

  await prisma.novel.update({
    where: { id: novelId },
    data: { status: newStatus }
  })

  revalidatePath('/admin/novels')
}

export async function deleteNovel(novelId: string) {
  const session = await auth()
  const role = session?.user?.role ?? ""
  
  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    throw new Error("Unauthorized")
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { managedJournalId: true }
  })

  const novel = await prisma.novel.findUnique({ where: { id: novelId } })
  if (!novel) throw new Error("Novel not found")

  // Permission check: Admin can only delete novels from their journal
  if (role === 'ADMIN') {
    if (novel.journalId !== currentUser?.managedJournalId) {
        throw new Error("You can only delete novels from your managed journal")
    }
  }

  await prisma.novel.delete({
    where: { id: novelId }
  })

  revalidatePath('/admin/novels')
}

export async function toggleRecommended(novelId: string, currentRecommended: boolean) {
  const session = await auth()
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role ?? "")) return

  await prisma.novel.update({
    where: { id: novelId },
    data: { isRecommended: !currentRecommended }
  })

  revalidatePath('/admin/novels')
}
