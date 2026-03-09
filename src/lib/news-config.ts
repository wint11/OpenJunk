import { prisma } from "@/lib/prisma"

export interface NewsItem {
  id: string
  content: string
  priority: number
  active: boolean
  createdAt: Date
  link: string | null
}

// 获取活跃的新闻消息（按优先级排序）
export async function getActiveNews(): Promise<NewsItem[]> {
  const news = await prisma.news.findMany({
    where: { active: true },
    orderBy: { priority: 'asc' }
  })
  return news
}

// 获取所有新闻消息
export async function getAllNews(): Promise<NewsItem[]> {
  const news = await prisma.news.findMany({
    orderBy: { priority: 'asc' }
  })
  return news
}

// 添加新的新闻消息
export async function addNewsItem(content: string, link?: string, priority: number = 1): Promise<NewsItem> {
  const newItem = await prisma.news.create({
    data: {
      content,
      link: link || null,
      priority,
      active: true
    }
  })
  return newItem
}

// 更新新闻消息
export async function updateNewsItem(id: string, data: Partial<NewsItem>): Promise<NewsItem | null> {
  try {
    const updated = await prisma.news.update({
      where: { id },
      data: {
        content: data.content,
        link: data.link,
        priority: data.priority,
        active: data.active
      }
    })
    return updated
  } catch {
    return null
  }
}

// 删除新闻消息
export async function deleteNewsItem(id: string): Promise<boolean> {
  try {
    await prisma.news.delete({
      where: { id }
    })
    return true
  } catch {
    return false
  }
}

// 禁用/启用新闻消息
export async function toggleNewsItem(id: string, active: boolean): Promise<boolean> {
  try {
    await prisma.news.update({
      where: { id },
      data: { active }
    })
    return true
  } catch {
    return false
  }
}

// 更新优先级排序
export async function updateNewsOrder(items: { id: string; priority: number }[]): Promise<boolean> {
  try {
    await prisma.$transaction(
      items.map(item =>
        prisma.news.update({
          where: { id: item.id },
          data: { priority: item.priority }
        })
      )
    )
    return true
  } catch {
    return false
  }
}
