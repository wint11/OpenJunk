"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getAllNews() {
  try {
    const news = await prisma.news.findMany({
      orderBy: { priority: 'asc' }
    })
    return { success: true, data: news }
  } catch (error) {
    return { success: false, error: "获取通知列表失败" }
  }
}

export async function createNews(data: {
  content: string
  link?: string
  priority: number
  active: boolean
}) {
  try {
    const news = await prisma.news.create({
      data: {
        content: data.content,
        link: data.link || null,
        priority: data.priority,
        active: data.active
      }
    })
    revalidatePath("/")
    revalidatePath("/admin/news")
    return { success: true, data: news }
  } catch (error) {
    return { success: false, error: "创建通知失败" }
  }
}

export async function updateNews(id: string, data: {
  content: string
  link?: string
  priority: number
  active: boolean
}) {
  try {
    const news = await prisma.news.update({
      where: { id },
      data: {
        content: data.content,
        link: data.link || null,
        priority: data.priority,
        active: data.active
      }
    })
    revalidatePath("/")
    revalidatePath("/admin/news")
    return { success: true, data: news }
  } catch (error) {
    return { success: false, error: "更新通知失败" }
  }
}

export async function deleteNews(id: string) {
  try {
    await prisma.news.delete({
      where: { id }
    })
    revalidatePath("/")
    revalidatePath("/admin/news")
    return { success: true }
  } catch (error) {
    return { success: false, error: "删除通知失败" }
  }
}

export async function toggleNewsStatus(id: string, active: boolean) {
  try {
    const news = await prisma.news.update({
      where: { id },
      data: { active }
    })
    revalidatePath("/")
    revalidatePath("/admin/news")
    return { success: true, data: news }
  } catch (error) {
    return { success: false, error: "更新状态失败" }
  }
}

export async function updateNewsOrder(items: { id: string; priority: number }[]) {
  try {
    await prisma.$transaction(
      items.map(item =>
        prisma.news.update({
          where: { id: item.id },
          data: { priority: item.priority }
        })
      )
    )
    revalidatePath("/")
    revalidatePath("/admin/news")
    return { success: true }
  } catch (error) {
    return { success: false, error: "更新排序失败" }
  }
}
