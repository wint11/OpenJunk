'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleConferencePaperStatus(novelId: string, currentStatus: string) {
  const session = await auth()
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role ?? "")) return

  const newStatus = currentStatus === 'PUBLISHED' ? 'TAKEDOWN' : 'PUBLISHED'

  await prisma.novel.update({
    where: { id: novelId },
    data: { status: newStatus }
  })

  revalidatePath('/admin/conferences/papers')
}

export async function deleteConferencePaper(novelId: string) {
  const session = await auth()
  const role = session?.user?.role ?? ""
  
  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    throw new Error("Unauthorized")
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { managedConferenceId: true }
  })

  const novel = await prisma.novel.findUnique({ where: { id: novelId } })
  if (!novel) throw new Error("Novel not found")

  // Permission check
  if (role === 'ADMIN') {
    if (novel.conferenceId !== currentUser?.managedConferenceId) {
        throw new Error("You can only delete papers from your managed conference")
    }
  }

  await prisma.novel.delete({
    where: { id: novelId }
  })

  revalidatePath('/admin/conferences/papers')
}

export async function toggleConferencePaperRecommended(novelId: string, currentRecommended: boolean) {
  const session = await auth()
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role ?? "")) return

  await prisma.novel.update({
    where: { id: novelId },
    data: { isRecommended: !currentRecommended }
  })

  revalidatePath('/admin/conferences/papers')
}
