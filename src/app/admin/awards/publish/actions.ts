'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

// 检查权限的辅助函数
async function checkPermission(awardId?: string) {
  const session = await auth()
  if (!session || !session.user) {
    return { allowed: false, error: "未授权操作", userId: null }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isAwardAdmin = user?.managedAwardId !== null

  if (!isSuperAdmin && !isAwardAdmin) {
    return { allowed: false, error: "无权操作", userId: null }
  }

  // 如果指定了奖项ID，检查是否有权限管理该奖项
  if (awardId && !isSuperAdmin && user?.managedAwardId !== awardId) {
    return { allowed: false, error: "无权管理该奖项", userId: null }
  }

  return { allowed: true, error: null, userId: session.user.id }
}

// 批量发布申请
export async function publishApplications(applicationIds: string[]) {
  const permission = await checkPermission()
  if (!permission.allowed) {
    return { error: permission.error }
  }

  try {
    await prisma.$transaction(
      applicationIds.map(id =>
        prisma.awardApplication.update({
          where: { id },
          data: {
            isPublished: true,
            publishedAt: new Date(),
            publishedBy: permission.userId
          }
        })
      )
    )

    revalidatePath('/admin/awards/publish')
    revalidatePath('/admin/awards/applications')
    return { success: true }
  } catch (error) {
    console.error("Publish applications error:", error)
    return { error: "发布失败" }
  }
}
