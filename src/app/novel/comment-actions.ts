'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const commentSchema = z.object({
  content: z.string().min(1, "评论内容不能为空").max(1000, "评论过长"),
  novelId: z.string().min(1),
  parentId: z.string().optional()
})

export type CommentState = {
  error?: string | null
  success?: boolean
}

import { incrementPopularity } from "@/lib/popularity"

export async function createComment(prevState: CommentState, formData: FormData): Promise<CommentState> {
  const session = await auth()
  
  // Get IP address
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1'

  const rawData = {
    content: formData.get("content"),
    novelId: formData.get("novelId"),
    parentId: formData.get("parentId") || undefined
  }

  const validatedFields = commentSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors.content?.[0] || "Invalid input" }
  }

  const { content, novelId, parentId } = validatedFields.data

  try {
    let commentData: any = {
      content,
      novelId,
      parentId
    }

    if (session?.user?.id) {
       commentData.userId = session.user.id
    } else {
       // Handle anonymous user
       const { createHash } = await import('crypto')
       const ipHash = createHash('sha256').update(ip).digest('hex').substring(0, 4)
       commentData.guestName = `匿名用户${ipHash}`
       commentData.guestIp = ip
    }

    await prisma.comment.create({
      data: commentData
    })

    // Increment popularity
    await incrementPopularity(novelId, 'COMMENT')

    revalidatePath(`/novel/${novelId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to create comment:", error)
    return { error: "评论发表失败，请重试" }
  }
}

export async function toggleLike(commentId: string, path: string) {
  const session = await auth()
  
  // Get IP
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1'
  
  const userId = session?.user?.id

  let existingLike;
  
  if (userId) {
     existingLike = await prisma.commentLike.findUnique({
       where: {
         userId_commentId: {
           userId,
           commentId
         }
       }
     })
  } else {
     existingLike = await prisma.commentLike.findUnique({
       where: {
         guestIp_commentId: {
           guestIp: ip,
           commentId
         }
       }
     })
  }

  if (existingLike) {
    await prisma.commentLike.delete({
      where: { id: existingLike.id }
    })
  } else {
    await prisma.commentLike.create({
      data: {
        userId: userId || undefined,
        guestIp: userId ? undefined : ip,
        commentId
      }
    })
  }

  revalidatePath(path)
}

export async function deleteComment(commentId: string, path: string) {
  const session = await auth()
  
  // Get IP for anonymous deletion check
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1'

  const comment = await prisma.comment.findUnique({
    where: { id: commentId }
  })

  if (!comment) return

  // Permission check
  let isOwner = false
  if (session?.user?.id) {
    // Logged in user: check userId
    isOwner = comment.userId === session.user.id
  } else {
    // Anonymous user: check IP
    isOwner = comment.guestIp === ip
  }
  
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'
  
  if (!isOwner && !isAdmin) {
    throw new Error("Forbidden")
  }

  await prisma.comment.delete({
    where: { id: commentId }
  })

  revalidatePath(path)
}
