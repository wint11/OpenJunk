
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

// Simple role check helper
const hasAdminAccess = (role: string) => {
  return ['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(role)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    
    // In a real app, we would verify the session/token here.
    // For this prototype, we rely on the client sending the userId,
    // and we check the user's role in the DB.
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || !user.role || !hasAdminAccess(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const limit = 50
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

    return NextResponse.json(messages.reverse())
  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

const postSchema = z.object({
  userId: z.string(),
  content: z.string().min(1)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = postSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const { userId, content } = result.data

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || !user.role || !hasAdminAccess(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const message = await prisma.adminChatMessage.create({
      data: {
        content: content.trim(),
        senderId: userId
      },
      include: {
        sender: {
          select: {
            name: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(message)

  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
