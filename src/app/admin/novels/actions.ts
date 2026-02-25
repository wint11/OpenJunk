'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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
