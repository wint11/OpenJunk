'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

// 检查权限的辅助函数
async function checkPermission(applicationId: string) {
  const session = await auth()
  if (!session || !session.user) {
    return { allowed: false, error: "未授权操作", userId: null }
  }

  const application = await prisma.awardApplication.findUnique({
    where: { id: applicationId },
    include: { award: true }
  })

  if (!application) return { allowed: false, error: "申请不存在", userId: null }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isAwardAdmin = user?.managedAwardId === application.awardId

  if (!isSuperAdmin && !isAwardAdmin) {
    return { allowed: false, error: "无权操作此申请", userId: null }
  }

  return { allowed: true, error: null, userId: session.user.id, application }
}

// 新的评审功能 - 支持动态奖项等级
export async function reviewApplication(
  applicationId: string,
  result: string, // 奖项等级ID 或 'REJECTED'
  comment?: string
) {
  const permission = await checkPermission(applicationId)
  if (!permission.allowed) {
    return { error: permission.error }
  }

  const { application, userId } = permission

  if (!application) {
    return { error: "申请不存在" }
  }

  try {
    // 检查是否已经发布
    if (application.isPublished) {
      return { error: "评审结果已发布，无法修改" }
    }

    // 如果结果是奖项等级，验证等级是否属于该奖项
    if (result !== 'REJECTED') {
      const prizeLevel = await prisma.awardPrizeLevel.findUnique({
        where: { id: result }
      })
      if (!prizeLevel || prizeLevel.awardId !== application.awardId) {
        return { error: "无效的奖项等级" }
      }
    }

    await prisma.awardApplication.update({
      where: { id: applicationId },
      data: {
        status: result === 'REJECTED' ? 'REJECTED' : result,
        prizeLevelId: result === 'REJECTED' ? null : result,
        reviewComment: comment,
        reviewedBy: userId,
        reviewedAt: new Date(),
      }
    })

    revalidatePath('/admin/awards/applications')
    return { success: true }
  } catch (error) {
    console.error("Review application error:", error)
    return { error: "操作失败" }
  }
}

// 发布评审结果
export async function publishReview(applicationId: string) {
  const permission = await checkPermission(applicationId)
  if (!permission.allowed) {
    return { error: permission.error }
  }

  const { userId } = permission

  try {
    await prisma.awardApplication.update({
      where: { id: applicationId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: userId,
      }
    })

    revalidatePath('/admin/awards/applications')
    return { success: true }
  } catch (error) {
    console.error("Publish review error:", error)
    return { error: "发布失败" }
  }
}

// 兼容旧接口
export async function approveApplication(applicationId: string) {
  return reviewApplication(applicationId, 'APPROVED')
}

export async function rejectApplication(applicationId: string) {
  return reviewApplication(applicationId, 'REJECTED')
}
