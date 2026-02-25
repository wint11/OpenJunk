'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logAudit } from "@/lib/audit"

export async function getNotifications() {
  const session = await auth()
  if (!session?.user?.id) return []

  return await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: { name: true, email: true }
      }
    }
  })
}

export async function markAsRead(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.notification.update({
    where: { 
      id: notificationId,
      userId: session.user.id
    },
    data: { status: 'READ' }
  })
  
  revalidatePath('/admin/messages')
  revalidatePath('/author/messages')
}

export async function markAllAsRead() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.notification.updateMany({
    where: { 
      userId: session.user.id,
      status: 'UNREAD'
    },
    data: { status: 'READ' }
  })
  
  revalidatePath('/admin/messages')
  revalidatePath('/author/messages')
}

export async function handleInvitation(notificationId: string, accept: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const notification = await prisma.notification.findUnique({
    where: { 
      id: notificationId,
      userId: session.user.id,
      type: 'INVITATION'
    }
  })

  if (!notification) throw new Error("Invitation not found")
  if (notification.status !== 'UNREAD' && notification.status !== 'READ') {
    throw new Error("Invitation already processed")
  }

  const data = JSON.parse(notification.data || '{}')
  const { journalId } = data

  if (!journalId) throw new Error("Invalid invitation data")

  if (accept) {
    // Add user to journal reviewers
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        reviewerJournals: {
          connect: { id: journalId }
        }
      }
    })

    // Update notification status
    await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'ACCEPTED' }
    })
    
    // Notify sender (Admin)
    if (notification.senderId) {
      await prisma.notification.create({
        data: {
          userId: notification.senderId,
          type: 'SYSTEM',
          title: 'Invitation Accepted',
          content: `${session.user.name || session.user.email} accepted your invitation to join the journal.`,
          status: 'UNREAD'
        }
      })
    }

    await logAudit("ACCEPT_INVITE", `User:${session.user.id}`, `Accepted invitation for Journal:${journalId}`, session.user.id)
  } else {
    // Update notification status
    await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'REJECTED' }
    })

    // Notify sender (Admin)
    if (notification.senderId) {
      await prisma.notification.create({
        data: {
          userId: notification.senderId,
          type: 'SYSTEM',
          title: 'Invitation Rejected',
          content: `${session.user.name || session.user.email} rejected your invitation to join the journal.`,
          status: 'UNREAD'
        }
      })
    }
    
    await logAudit("REJECT_INVITE", `User:${session.user.id}`, `Rejected invitation for Journal:${journalId}`, session.user.id)
  }

  // Update notification status
  await prisma.notification.update({
    where: { id: notificationId },
    data: { status: accept ? 'ACCEPTED' : 'REJECTED' }
  })

  revalidatePath('/admin/messages')
}

export async function createNotification(userId: string, title: string, content: string, type: string = 'SYSTEM', data: any = null, senderId?: string) {
    await prisma.notification.create({
        data: {
            userId,
            title,
            content,
            type,
            data: data ? JSON.stringify(data) : null,
            senderId,
            status: 'UNREAD'
        }
    })
}
