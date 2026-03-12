'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface AdminMessage {
  id: string
  content: string
  createdAt: Date
  sender: {
    name: string | null
    role: string
    managedJournal: { name: string } | null
    managedConference: { name: string } | null
  }
}

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  const role = session.user.role || ""
  // Check if user has any admin-like role
  // According to requirement: "all administrators, all people with ADMIN identity"
  // This includes SUPER_ADMIN, ADMIN, FUND_ADMIN, AWARD_ADMIN, JOURNAL_ADMIN, CONFERENCE_ADMIN, REVIEWER (maybe?)
  // Let's stick to the core admin check logic used in layout
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(role)) {
    throw new Error("Forbidden")
  }
  return session
}

export async function sendAdminMessage(content: string) {
  const session = await checkAdmin()
  
  if (!content.trim()) return

  await prisma.adminChatMessage.create({
    data: {
      content: content.trim(),
      senderId: session.user.id!
    }
  })

  revalidatePath('/admin/chat')
}

export async function getAdminMessages(limit = 50): Promise<AdminMessage[]> {
  await checkAdmin()

  const messages = await prisma.adminChatMessage.findMany({
    take: limit,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      sender: {
        select: {
          name: true,
          role: true,
          managedJournal: { select: { name: true } },
          managedConference: { select: { name: true } }
        }
      }
    }
  })

  return messages.reverse() // Return oldest first for chat UI
}
