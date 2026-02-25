'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { logAudit } from "@/lib/audit"

export async function updateArticleStatus(id: string, status: 'PUBLISHED' | 'REJECTED') {
  const session = await auth()
  const role = session?.user?.role

  if (!['ADMIN', 'SUPER_ADMIN'].includes(role ?? "")) {
    throw new Error("Unauthorized")
  }

  const article = await prisma.novel.update({
    where: { id },
    data: { status }
  })

  await logAudit(
    status === 'PUBLISHED' ? 'APPROVE_ARTICLE' : 'REJECT_ARTICLE',
    `Novel:${id}`,
    `Updated status to ${status}`,
    session?.user?.id
  )

  revalidatePath('/admin/articles')
}

export async function approveDeletion(id: string) {
  const session = await auth()
  const role = session?.user?.role

  if (!['ADMIN', 'SUPER_ADMIN'].includes(role ?? "")) {
    throw new Error("Unauthorized")
  }

  // Soft delete or hard delete? Let's do hard delete for now as per "delete work".
  // Or maybe just mark as REJECTED/DELETED.
  // The user asked for "delete work", usually implies removal.
  await prisma.novel.delete({
    where: { id }
  })

  await logAudit(
    'APPROVE_DELETE',
    `Novel:${id}`,
    `Approved deletion request`,
    session?.user?.id
  )

  revalidatePath('/admin/articles')
}

export async function rejectDeletion(id: string) {
  const session = await auth()
  const role = session?.user?.role

  if (!['ADMIN', 'SUPER_ADMIN'].includes(role ?? "")) {
    throw new Error("Unauthorized")
  }

  await prisma.novel.update({
    where: { id },
    data: { status: 'PUBLISHED' } // Revert to published (or previous status? Assuming published for now)
  })

  await logAudit(
    'REJECT_DELETE',
    `Novel:${id}`,
    `Rejected deletion request`,
    session?.user?.id
  )

  revalidatePath('/admin/articles')
}

export async function approveCoverUpdate(id: string) {
  const session = await auth()
  const role = session?.user?.role

  if (!['ADMIN', 'SUPER_ADMIN'].includes(role ?? "")) {
    throw new Error("Unauthorized")
  }

  const novel = await prisma.novel.findUnique({ where: { id } })
  if (!novel || !novel.pendingCoverUrl) return

  await prisma.novel.update({
    where: { id },
    data: { 
        coverUrl: novel.pendingCoverUrl,
        pendingCoverUrl: null
    }
  })

  await logAudit(
    'APPROVE_COVER',
    `Novel:${id}`,
    `Approved cover update to ${novel.pendingCoverUrl}`,
    session?.user?.id
  )

  revalidatePath('/admin/articles')
}

export async function rejectCoverUpdate(id: string) {
  const session = await auth()
  const role = session?.user?.role

  if (!['ADMIN', 'SUPER_ADMIN'].includes(role ?? "")) {
    throw new Error("Unauthorized")
  }

  await prisma.novel.update({
    where: { id },
    data: { pendingCoverUrl: null }
  })

  await logAudit(
    'REJECT_COVER',
    `Novel:${id}`,
    `Rejected cover update`,
    session?.user?.id
  )

  revalidatePath('/admin/articles')
}
