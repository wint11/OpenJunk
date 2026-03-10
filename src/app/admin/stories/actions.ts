"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

interface Story {
  id: string
  title: string
  content: string
  category: string
  authorName: string
  authorEmail: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  likes: number
  views: number
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
  reviewedAt: Date | null
  reviewedBy: string | null
  reviewNote: string | null
  featuredAt: Date | null
}

export async function getStories(status?: string) {
  try {
    const where: any = {}
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status
    }

    const stories = await prisma.story.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    // 转换 status 为正确类型
    const typedStories: Story[] = stories.map(story => ({
      ...story,
      status: story.status as "PENDING" | "APPROVED" | "REJECTED",
    }))

    return { success: true, data: typedStories }
  } catch (error) {
    return { success: false, error: "获取故事列表失败" }
  }
}

export async function reviewStory(id: string, action: "APPROVE" | "REJECT", reviewNote?: string) {
  try {
    const story = await prisma.story.update({
      where: { id },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      },
    })
    revalidatePath("/admin/stories")
    revalidatePath("/discovery/stories")
    return { success: true, data: story }
  } catch (error) {
    return { success: false, error: "审阅失败" }
  }
}

export async function featureStory(id: string, feature: boolean) {
  try {
    const story = await prisma.story.update({
      where: { id },
      data: {
        isFeatured: feature,
        featuredAt: feature ? new Date() : null,
      },
    })
    revalidatePath("/admin/stories")
    revalidatePath("/discovery/stories")
    return { success: true, data: story }
  } catch (error) {
    return { success: false, error: "操作失败" }
  }
}
