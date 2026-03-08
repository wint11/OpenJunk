'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

// 权限检查辅助函数
async function checkAwardAdminPermission(awardId: string) {
  const session = await auth()
  if (!session?.user) {
    return { allowed: false, error: "未登录" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, managedAwardId: true }
  })

  const isSuperAdmin = user?.role === "SUPER_ADMIN"
  const isAwardAdmin = user?.managedAwardId === awardId

  if (!isSuperAdmin && !isAwardAdmin) {
    return { allowed: false, error: "无权执行此操作" }
  }

  return { allowed: true, userId: session.user.id }
}

// 更新奖项基本信息
export async function updateAward(awardId: string, formData: FormData) {
  const permission = await checkAwardAdminPermission(awardId)
  if (!permission.allowed) {
    return { error: permission.error }
  }

  const description = formData.get("description") as string
  const criteria = formData.get("criteria") as string
  const status = formData.get("status") as string

  try {
    await prisma.award.update({
      where: { id: awardId },
      data: {
        description,
        criteria,
        status
      }
    })
    
    revalidatePath(`/admin/awards/${awardId}`)
    revalidatePath(`/admin/awards`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "更新失败" }
  }
}

// ========== 奖项等级管理 ==========

export async function createPrizeLevel(awardId: string, data: {
  name: string
  description?: string
  color: string
  order: number
}) {
  const permission = await checkAwardAdminPermission(awardId)
  if (!permission.allowed) {
    return { error: permission.error }
  }

  try {
    await prisma.awardPrizeLevel.create({
      data: {
        awardId,
        name: data.name,
        description: data.description,
        color: data.color,
        order: data.order
      }
    })
    
    revalidatePath(`/admin/awards/${awardId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "创建失败" }
  }
}

export async function deletePrizeLevel(levelId: string) {
  // 先获取等级信息以确定奖项ID
  const level = await prisma.awardPrizeLevel.findUnique({
    where: { id: levelId },
    select: { awardId: true }
  })

  if (!level) {
    return { error: "等级不存在" }
  }

  const permission = await checkAwardAdminPermission(level.awardId)
  if (!permission.allowed) {
    return { error: permission.error }
  }

  try {
    await prisma.awardPrizeLevel.delete({
      where: { id: levelId }
    })
    
    revalidatePath(`/admin/awards`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "删除失败" }
  }
}

export async function updatePrizeLevelOrder(awardId: string, levels: { id: string; order: number }[]) {
  const permission = await checkAwardAdminPermission(awardId)
  if (!permission.allowed) {
    return { error: permission.error }
  }

  try {
    await Promise.all(
      levels.map(level =>
        prisma.awardPrizeLevel.update({
          where: { id: level.id },
          data: { order: level.order }
        })
      )
    )
    
    revalidatePath(`/admin/awards`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "更新失败" }
  }
}

// ========== 赛道管理 ==========

export async function createTrack(awardId: string, data: {
  name: string
  description?: string
  order: number
}) {
  const permission = await checkAwardAdminPermission(awardId)
  if (!permission.allowed) {
    return { error: permission.error }
  }

  try {
    await prisma.awardTrack.create({
      data: {
        awardId,
        name: data.name,
        description: data.description,
        order: data.order
      }
    })
    
    revalidatePath(`/admin/awards/${awardId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "创建失败" }
  }
}

export async function deleteTrack(trackId: string) {
  // 先获取赛道信息以确定奖项ID
  const track = await prisma.awardTrack.findUnique({
    where: { id: trackId },
    select: { awardId: true }
  })

  if (!track) {
    return { error: "赛道不存在" }
  }

  const permission = await checkAwardAdminPermission(track.awardId)
  if (!permission.allowed) {
    return { error: permission.error }
  }

  try {
    await prisma.awardTrack.delete({
      where: { id: trackId }
    })
    
    revalidatePath(`/admin/awards`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "删除失败" }
  }
}

export async function updateTrackJournals(trackId: string, journalIds: string[]) {
  // 先获取赛道信息以确定奖项ID
  const track = await prisma.awardTrack.findUnique({
    where: { id: trackId },
    select: { awardId: true }
  })

  if (!track) {
    return { error: "赛道不存在" }
  }

  const permission = await checkAwardAdminPermission(track.awardId)
  if (!permission.allowed) {
    return { error: permission.error }
  }

  try {
    await prisma.awardTrack.update({
      where: { id: trackId },
      data: {
        journals: {
          set: journalIds.map(id => ({ id }))
        }
      }
    })
    
    revalidatePath(`/admin/awards`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "更新失败" }
  }
}

// ========== 周期管理 ==========

export async function createCycle(awardId: string, data: {
  name: string
  startDate: Date
  endDate: Date
  announceDate?: Date | null
}) {
  const permission = await checkAwardAdminPermission(awardId)
  if (!permission.allowed) {
    return { error: permission.error }
  }

  try {
    // 自动确定状态
    const now = new Date()
    let status = 'UPCOMING'
    if (now >= data.startDate && now < data.endDate) {
      status = 'OPEN'
    } else if (now >= data.endDate) {
      status = 'CLOSED'
    }

    await prisma.awardCycle.create({
      data: {
        awardId,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        announceDate: data.announceDate,
        status
      }
    })
    
    revalidatePath(`/admin/awards/${awardId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "创建失败" }
  }
}

export async function deleteCycle(cycleId: string) {
  // 先获取周期信息以确定奖项ID
  const cycle = await prisma.awardCycle.findUnique({
    where: { id: cycleId },
    select: { awardId: true }
  })

  if (!cycle) {
    return { error: "周期不存在" }
  }

  const permission = await checkAwardAdminPermission(cycle.awardId)
  if (!permission.allowed) {
    return { error: permission.error }
  }

  try {
    await prisma.awardCycle.delete({
      where: { id: cycleId }
    })
    
    revalidatePath(`/admin/awards`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "删除失败" }
  }
}

// ========== 清空奖项数据 ==========

export async function clearAwardData(awardId: string) {
  const permission = await checkAwardAdminPermission(awardId)
  if (!permission.allowed) {
    return { success: false, message: permission.error }
  }

  try {
    // 使用事务删除所有相关数据
    await prisma.$transaction(async (tx) => {
      // 1. 删除所有申请的关联数据（papers）
      const applications = await tx.awardApplication.findMany({
        where: { awardId },
        select: { id: true }
      })

      for (const app of applications) {
        // 断开论文关联
        await tx.awardApplication.update({
          where: { id: app.id },
          data: {
            nominationPapers: {
              set: []
            }
          }
        })
      }

      // 2. 删除所有申请
      await tx.awardApplication.deleteMany({
        where: { awardId }
      })

      // 3. 删除所有周期
      await tx.awardCycle.deleteMany({
        where: { awardId }
      })

      // 4. 删除所有赛道与期刊的关联
      const tracks = await tx.awardTrack.findMany({
        where: { awardId },
        select: { id: true }
      })

      for (const track of tracks) {
        await tx.awardTrack.update({
          where: { id: track.id },
          data: {
            journals: {
              set: []
            }
          }
        })
      }

      // 5. 删除所有赛道
      await tx.awardTrack.deleteMany({
        where: { awardId }
      })

      // 6. 删除所有奖项等级
      await tx.awardPrizeLevel.deleteMany({
        where: { awardId }
      })
    })

    revalidatePath(`/admin/awards/${awardId}`)
    revalidatePath(`/admin/awards`)
    revalidatePath(`/awards/${awardId}`)

    return { success: true, message: "奖项数据已清空" }
  } catch (error) {
    console.error("Clear award data error:", error)
    return { success: false, message: "清空失败: " + (error as Error).message }
  }
}
