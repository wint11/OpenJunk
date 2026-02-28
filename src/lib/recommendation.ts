import { prisma } from "@/lib/prisma"
import { Novel } from "@prisma/client"

/**
 * 获取首页推荐论文
 * 
 * 算法逻辑：
 * 1. 基础权重：所有已发表(PUBLISHED)论文基础权重为 1
 * 2. 新发布加权：7天内发布的论文，权重 +5
 * 3. 30天内发布的论文，权重 +2
 * 4. 精选加权：isRecommended=true 的论文，权重 +10
 * 5. 热度加权：每 100 次浏览，权重 +1 (上限 +5)
 * 
 * 最终使用加权随机采样 (Weighted Random Sampling) 选出 12 篇
 */
export async function getRecommendedPapers(count = 12) {
  const now = new Date().getTime()
  const ONE_DAY = 24 * 60 * 60 * 1000

  // 1. 获取所有符合条件的论文 ID 和关键指标 (避免一次性拉取所有大字段)
  // 为了性能，这里我们限制获取最近 1000 篇或者热门的论文作为候选池
  // 如果数据量巨大，应该使用更复杂的推荐系统或预计算
  const candidates = await prisma.novel.findMany({
    where: {
      status: 'PUBLISHED',
      journal: { status: 'ACTIVE' }
    },
    select: {
      id: true,
      createdAt: true,
      isRecommended: true,
      views: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100 // 候选池大小
  })

  if (candidates.length === 0) return []

  // 2. 计算权重
  const weightedCandidates = candidates.map(paper => {
    let weight = 1 // 基础权重

    // 时间加权
    const diffDays = (now - paper.createdAt.getTime()) / ONE_DAY
    if (diffDays <= 7) {
      weight += 5
    } else if (diffDays <= 30) {
      weight += 2
    }

    // 精选加权
    if (paper.isRecommended) {
      weight += 10
    }

    // 热度加权 (简单对数或者分段)
    const viewBonus = Math.min(Math.floor(paper.views / 100), 5)
    weight += viewBonus

    return { id: paper.id, weight }
  })

  // 3. 加权随机采样 (Weighted Random Sampling without replacement)
  const selectedIds: string[] = []
  
  // 如果候选数量少于需求，直接全部返回
  if (weightedCandidates.length <= count) {
    return fetchFullPapers(weightedCandidates.map(c => c.id))
  }

  // 归一化并在循环中采样
  // 简单实现：每次采样后从池中移除，避免重复
  // 由于 count 较小 (12)，这种方法效率尚可
  const pool = [...weightedCandidates]
  
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) break

    // 计算当前池的总权重
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight
    
    // 寻找命中项
    let selectedIndex = -1
    let currentWeightSum = 0
    for (let j = 0; j < pool.length; j++) {
      currentWeightSum += pool[j].weight
      if (random <= currentWeightSum) {
        selectedIndex = j
        break
      }
    }
    
    // 防御性处理，理论上 random <= 0 一定会命中，但浮点数可能导致边界问题
    if (selectedIndex === -1) selectedIndex = pool.length - 1

    selectedIds.push(pool[selectedIndex].id)
    pool.splice(selectedIndex, 1) // 移除已选项
  }

  // 4. 获取完整数据
  return fetchFullPapers(selectedIds)
}

async function fetchFullPapers(ids: string[]) {
  const papers = await prisma.novel.findMany({
    where: { id: { in: ids } },
    include: {
      journal: {
        select: { id: true, name: true }
      }
    }
  })

  // 保持随机采样出来的顺序 (prisma findMany in 不保证顺序)
  // 或者随机打乱一下也行，这里我们按 IDs 的顺序重排
  return ids
    .map(id => papers.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
}
